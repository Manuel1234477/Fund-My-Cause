"""Tests for the fraud/anomaly detection pipeline (#636)."""

import time
import pytest
from fastapi.testclient import TestClient

from pipeline import (
    CampaignRecord,
    ContributionEvent,
    FlagReason,
    RefundEvent,
    _CAMPAIGN_RECORDS,
    _CONTRIBUTIONS,
    _QUEUE,
    _REFUNDS,
    app,
    scan_contribution_spikes,
    scan_duplicate_content,
    scan_wash_contributions,
    WASH_MIN_OCCURRENCES,
    WASH_WINDOW_SECONDS,
    SPIKE_MAX_CONTRIBUTIONS,
    SPIKE_WINDOW_SECONDS,
)

client = TestClient(app)


def _clear():
    _CONTRIBUTIONS.clear()
    _REFUNDS.clear()
    _CAMPAIGN_RECORDS.clear()
    _QUEUE.clear()


def test_health():
    r = client.get("/health")
    assert r.status_code == 200


# ── Wash contribution ─────────────────────────────────────────────────────────

def test_wash_contribution_flagged():
    _clear()
    now = time.time()
    for i in range(WASH_MIN_OCCURRENCES):
        _CONTRIBUTIONS.append(ContributionEvent("camp1", "GWASH", 1000, now + i * 10))
        _REFUNDS.append(RefundEvent("camp1", "GWASH", now + i * 10 + 60))

    flags = scan_wash_contributions()
    assert len(flags) == 1
    assert flags[0].reason == FlagReason.WASH_CONTRIBUTION
    assert flags[0].wallet == "GWASH"


def test_wash_below_threshold_not_flagged():
    _clear()
    now = time.time()
    for i in range(WASH_MIN_OCCURRENCES - 1):
        _CONTRIBUTIONS.append(ContributionEvent("camp2", "GCLEAN", 1000, now + i * 10))
        _REFUNDS.append(RefundEvent("camp2", "GCLEAN", now + i * 10 + 60))

    flags = scan_wash_contributions()
    assert flags == []


def test_wash_refund_outside_window_not_flagged():
    _clear()
    now = time.time()
    for i in range(WASH_MIN_OCCURRENCES):
        _CONTRIBUTIONS.append(ContributionEvent("camp3", "GSLOW", 1000, now + i * 10))
        # Refund after window expires
        _REFUNDS.append(RefundEvent("camp3", "GSLOW", now + WASH_WINDOW_SECONDS + 3600))

    flags = scan_wash_contributions()
    assert flags == []


# ── Contribution spike ────────────────────────────────────────────────────────

def test_spike_flagged():
    _clear()
    now = time.time()
    for i in range(SPIKE_MAX_CONTRIBUTIONS + 1):
        _CONTRIBUTIONS.append(ContributionEvent("campSpike", f"G{i}", 100, now + i))

    flags = scan_contribution_spikes()
    assert len(flags) == 1
    assert flags[0].reason == FlagReason.CONTRIBUTION_SPIKE


def test_spike_below_threshold_not_flagged():
    _clear()
    now = time.time()
    for i in range(SPIKE_MAX_CONTRIBUTIONS - 1):
        _CONTRIBUTIONS.append(ContributionEvent("campOk", f"G{i}", 100, now + i))

    flags = scan_contribution_spikes()
    assert flags == []


# ── Duplicate content ─────────────────────────────────────────────────────────

def test_duplicate_title_flagged():
    _clear()
    _CAMPAIGN_RECORDS.append(CampaignRecord("x1", "Fund a Solar Farm Project", "desc"))
    _CAMPAIGN_RECORDS.append(CampaignRecord("x2", "Fund a Solar Farm Project", "desc2"))

    flags = scan_duplicate_content()
    assert len(flags) == 1
    assert flags[0].reason == FlagReason.DUPLICATE_CONTENT


def test_different_titles_not_flagged():
    _clear()
    _CAMPAIGN_RECORDS.append(CampaignRecord("y1", "Community Garden Initiative", ""))
    _CAMPAIGN_RECORDS.append(CampaignRecord("y2", "Open Source Wallet Development", ""))

    flags = scan_duplicate_content()
    assert flags == []


# ── Moderation queue endpoint ─────────────────────────────────────────────────

def test_moderation_queue_returns_flags():
    _clear()
    now = time.time()
    for i in range(WASH_MIN_OCCURRENCES):
        _CONTRIBUTIONS.append(ContributionEvent("cq", "GQ", 1000, now + i * 5))
        _REFUNDS.append(RefundEvent("cq", "GQ", now + i * 5 + 30))

    from pipeline import run_full_scan
    run_full_scan()

    r = client.get("/moderation-queue")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert any(f["reason"] == FlagReason.WASH_CONTRIBUTION for f in body["flags"])
