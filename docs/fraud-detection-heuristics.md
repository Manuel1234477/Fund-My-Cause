# Fraud Detection Heuristics

Tuning guide for the anomaly detection pipeline (`backend/fraud_detection/pipeline.py`).

## Heuristics

### 1. Wash Contributions

**Pattern**: A wallet contributes then refunds the same campaign repeatedly in a short window — inflating contributor count without leaving real capital.

| Parameter | Default | Description |
|---|---|---|
| `WASH_WINDOW_SECONDS` | 3600 | Max seconds between contribution and refund to count as a wash cycle |
| `WASH_MIN_OCCURRENCES` | 3 | Minimum wash cycles before flagging |

**Severity**: HIGH

**Tuning**: Lower `WASH_MIN_OCCURRENCES` to catch occasional wash traders; raise `WASH_WINDOW_SECONDS` to catch delayed refund patterns.

---

### 2. Contribution Spike

**Pattern**: A campaign receives an abnormally large number of contributions in a short rolling window — indicative of Sybil attacks or bot farms boosting QF matching weight.

| Parameter | Default | Description |
|---|---|---|
| `SPIKE_WINDOW_SECONDS` | 600 | Rolling window size in seconds |
| `SPIKE_MAX_CONTRIBUTIONS` | 50 | Contribution count threshold within the window |

**Severity**: MEDIUM

**Tuning**: Adjust `SPIKE_MAX_CONTRIBUTIONS` based on observed organic peak traffic. A campaign going viral may legitimately spike; correlate with social media signals before actioning.

---

### 3. Duplicate Content

**Pattern**: A new campaign's title is nearly identical to an existing campaign — potentially a scam clone trying to siphon donations.

| Parameter | Default | Description |
|---|---|---|
| `DUPLICATE_JACCARD_THRESHOLD` | 0.80 | Minimum token-level Jaccard similarity to flag |

**Severity**: LOW

**Tuning**: 0.80 catches near-exact duplicates while ignoring campaigns that share common words (e.g., "Community Fund"). Lower to 0.65 for stricter detection; raise to 0.90 to reduce false positives.

---

## Moderation Queue

Flags appear at `GET /moderation-queue`. Moderators review and dismiss via `PATCH /moderation-queue/{id}/reviewed`.

Unreviewed HIGH severity flags should be actioned within 1 hour; MEDIUM within 24 hours; LOW within 7 days.

---

## Adding New Heuristics

1. Implement a `scan_*()` function returning `list[Flag]`.
2. Call it from `run_full_scan()`.
3. Add a threshold constant at the top of `pipeline.py`.
4. Document it in this file.
5. Add a test in `tests_pipeline.py`.
