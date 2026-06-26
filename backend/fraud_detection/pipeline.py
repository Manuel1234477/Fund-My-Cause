"""
Fraud / Anomaly Detection Pipeline (#636)

Detects suspicious patterns over indexed contribution and campaign data:

 - Wash contributions  : same wallet contributing and immediately requesting
                         a refund in a short window, repeatedly.
 - Sudden spike        : campaign receives an unusually large number of
                         contributions in a short window.
 - Duplicate content   : campaign title/description appears nearly identical
                         to an existing campaign (Jaccard similarity).

Each check produces a ``Flag`` that is appended to a moderation queue and
surfaced via the ``/moderation-queue`` endpoint.

Heuristics and their thresholds are documented in
``docs/fraud-detection-heuristics.md``.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse

# ---------------------------------------------------------------------------
# Tuneable thresholds (see docs/fraud-detection-heuristics.md for rationale)
# ---------------------------------------------------------------------------
WASH_WINDOW_SECONDS = 3600          # contributions that refund within 1 h
WASH_MIN_OCCURRENCES = 3            # flag after 3 wash cycles
SPIKE_WINDOW_SECONDS = 600          # 10-minute rolling window
SPIKE_MAX_CONTRIBUTIONS = 50        # > 50 contributions in 10 min → spike
DUPLICATE_JACCARD_THRESHOLD = 0.8   # titles ≥ 80 % token overlap → duplicate


# ---------------------------------------------------------------------------
# Domain types
# ---------------------------------------------------------------------------
class FlagReason(str, Enum):
    WASH_CONTRIBUTION = "wash_contribution"
    CONTRIBUTION_SPIKE = "contribution_spike"
    DUPLICATE_CONTENT = "duplicate_content"


class FlagSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class Flag:
    id: str
    reason: FlagReason
    severity: FlagSeverity
    campaign_id: str
    wallet: Optional[str]
    detail: str
    flagged_at: float = field(default_factory=time.time)
    reviewed: bool = False


# ---------------------------------------------------------------------------
# Moderation queue (in-memory; replace with DB in production)
# ---------------------------------------------------------------------------
_QUEUE: list[Flag] = []
_FLAG_COUNTER = 0


def _next_flag_id() -> str:
    global _FLAG_COUNTER
    _FLAG_COUNTER += 1
    return f"FLAG-{_FLAG_COUNTER:05d}"


def _enqueue(flag: Flag) -> None:
    _QUEUE.append(flag)


# ---------------------------------------------------------------------------
# Indexed event store (populated by indexer; stubbed here)
# ---------------------------------------------------------------------------
@dataclass
class ContributionEvent:
    campaign_id: str
    wallet: str
    amount: int
    timestamp: float


@dataclass
class RefundEvent:
    campaign_id: str
    wallet: str
    timestamp: float


@dataclass
class CampaignRecord:
    id: str
    title: str
    description: str


_CONTRIBUTIONS: list[ContributionEvent] = []
_REFUNDS: list[RefundEvent] = []
_CAMPAIGN_RECORDS: list[CampaignRecord] = []


# ---------------------------------------------------------------------------
# Heuristic implementations
# ---------------------------------------------------------------------------

def _jaccard(a: str, b: str) -> float:
    """Token-level Jaccard similarity between two strings."""
    sa = set(a.lower().split())
    sb = set(b.lower().split())
    if not sa and not sb:
        return 1.0
    return len(sa & sb) / len(sa | sb)


def scan_wash_contributions() -> list[Flag]:
    """
    Wash contribution heuristic.

    A wallet that contributes then refunds the *same campaign* within
    WASH_WINDOW_SECONDS, and does so WASH_MIN_OCCURRENCES or more times,
    is flagged as a potential wash contributor.
    """
    flags: list[Flag] = []
    # Group refunds by (campaign, wallet)
    refund_lookup: dict[tuple[str, str], list[float]] = {}
    for r in _REFUNDS:
        key = (r.campaign_id, r.wallet)
        refund_lookup.setdefault(key, []).append(r.timestamp)

    # For each contribution, check if a refund followed within the window
    wash_count: dict[tuple[str, str], int] = {}
    for c in _CONTRIBUTIONS:
        key = (c.campaign_id, c.wallet)
        for rt in refund_lookup.get(key, []):
            if 0 < rt - c.timestamp <= WASH_WINDOW_SECONDS:
                wash_count[key] = wash_count.get(key, 0) + 1

    for (campaign_id, wallet), count in wash_count.items():
        if count >= WASH_MIN_OCCURRENCES:
            flags.append(Flag(
                id=_next_flag_id(),
                reason=FlagReason.WASH_CONTRIBUTION,
                severity=FlagSeverity.HIGH,
                campaign_id=campaign_id,
                wallet=wallet,
                detail=f"Wallet performed {count} wash cycles within {WASH_WINDOW_SECONDS}s",
            ))
    return flags


def scan_contribution_spikes() -> list[Flag]:
    """
    Sudden-spike heuristic.

    If a campaign receives more than SPIKE_MAX_CONTRIBUTIONS in any
    SPIKE_WINDOW_SECONDS rolling window, flag it as a potential sybil attack.
    """
    flags: list[Flag] = []
    by_campaign: dict[str, list[float]] = {}
    for c in _CONTRIBUTIONS:
        by_campaign.setdefault(c.campaign_id, []).append(c.timestamp)

    for campaign_id, timestamps in by_campaign.items():
        ts = sorted(timestamps)
        for i, t_start in enumerate(ts):
            window = [t for t in ts[i:] if t - t_start <= SPIKE_WINDOW_SECONDS]
            if len(window) > SPIKE_MAX_CONTRIBUTIONS:
                flags.append(Flag(
                    id=_next_flag_id(),
                    reason=FlagReason.CONTRIBUTION_SPIKE,
                    severity=FlagSeverity.MEDIUM,
                    campaign_id=campaign_id,
                    wallet=None,
                    detail=(
                        f"{len(window)} contributions in "
                        f"{SPIKE_WINDOW_SECONDS}s window "
                        f"(threshold: {SPIKE_MAX_CONTRIBUTIONS})"
                    ),
                ))
                break  # one flag per campaign per scan
    return flags


def scan_duplicate_content() -> list[Flag]:
    """
    Duplicate-content heuristic.

    Compares every pair of campaigns by title Jaccard similarity.
    Pairs above DUPLICATE_JACCARD_THRESHOLD are flagged.
    """
    flags: list[Flag] = []
    records = _CAMPAIGN_RECORDS
    for i in range(len(records)):
        for j in range(i + 1, len(records)):
            a, b = records[i], records[j]
            sim = _jaccard(a.title, b.title)
            if sim >= DUPLICATE_JACCARD_THRESHOLD:
                flags.append(Flag(
                    id=_next_flag_id(),
                    reason=FlagReason.DUPLICATE_CONTENT,
                    severity=FlagSeverity.LOW,
                    campaign_id=b.id,
                    wallet=None,
                    detail=(
                        f"Title Jaccard similarity {sim:.2f} with campaign {a.id} "
                        f"(threshold: {DUPLICATE_JACCARD_THRESHOLD})"
                    ),
                ))
    return flags


def run_full_scan() -> list[Flag]:
    """Execute all heuristics and append new flags to the moderation queue."""
    new_flags: list[Flag] = []
    new_flags.extend(scan_wash_contributions())
    new_flags.extend(scan_contribution_spikes())
    new_flags.extend(scan_duplicate_content())
    for f in new_flags:
        _enqueue(f)
    return new_flags


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Fund-My-Cause Fraud Detection", version="1.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/scan")
def trigger_scan(background_tasks: BackgroundTasks) -> dict:
    """Trigger a full fraud scan asynchronously."""
    background_tasks.add_task(run_full_scan)
    return {"status": "scan_scheduled"}


@app.get("/moderation-queue")
def moderation_queue(
    reviewed: Optional[bool] = None,
    reason: Optional[FlagReason] = None,
    limit: int = 50,
) -> JSONResponse:
    """
    Return flags from the moderation queue.

    Query params:
    - `reviewed`: filter by reviewed status (omit for all)
    - `reason`: filter by flag reason
    - `limit`: max flags returned (default 50)
    """
    items = _QUEUE
    if reviewed is not None:
        items = [f for f in items if f.reviewed == reviewed]
    if reason is not None:
        items = [f for f in items if f.reason == reason]
    items = items[-limit:]

    return JSONResponse(content={
        "total": len(_QUEUE),
        "returned": len(items),
        "flags": [
            {
                "id": f.id,
                "reason": f.reason,
                "severity": f.severity,
                "campaign_id": f.campaign_id,
                "wallet": f.wallet,
                "detail": f.detail,
                "flagged_at": f.flagged_at,
                "reviewed": f.reviewed,
            }
            for f in items
        ],
    })


@app.patch("/moderation-queue/{flag_id}/reviewed")
def mark_reviewed(flag_id: str) -> dict:
    """Mark a flag as reviewed by a moderator."""
    for f in _QUEUE:
        if f.id == flag_id:
            f.reviewed = True
            return {"status": "updated", "id": flag_id}
    return JSONResponse(status_code=404, content={"error": "flag not found"})
