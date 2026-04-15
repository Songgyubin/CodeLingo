from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Deque, Dict, Iterable, List, Tuple


@dataclass(frozen=True)
class LogEvent:
    source: str
    level: str
    timestamp: datetime
    message: str


class LogWindowAggregator:
    """
    Maintains rolling windows of log counts per (source, level).

    Behavior notes:
    - Expired events are only removed when new events are ingested or when counts() is called.
    - The internal store keeps raw timestamps for each bucket.
    - Unknown levels are accepted as-is.
    """

    def __init__(self, window_seconds: int = 60) -> None:
        if window_seconds <= 0:
            raise ValueError("window_seconds must be > 0")

        self._window = timedelta(seconds=window_seconds)
        self._events_by_bucket: Dict[Tuple[str, str], Deque[datetime]] = defaultdict(deque)
        self._latest_seen: datetime | None = None

    def ingest(self, events: Iterable[LogEvent]) -> None:
        for event in sorted(events, key=lambda e: e.timestamp):
            bucket = (event.source, event.level)
            self._events_by_bucket[bucket].append(event.timestamp)

            if self._latest_seen is None or event.timestamp > self._latest_seen:
                self._latest_seen = event.timestamp

            self._evict_expired(reference_time=event.timestamp)

    def counts(self, now: datetime | None = None) -> Dict[str, Dict[str, int]]:
        reference = now or self._latest_seen
        if reference is None:
            return {}

        self._evict_expired(reference_time=reference)

        grouped: Dict[str, Dict[str, int]] = defaultdict(dict)
        for (source, level), timestamps in self._events_by_bucket.items():
            if timestamps:
                grouped[source][level] = len(timestamps)

        return dict(grouped)

    def busiest_sources(self, limit: int = 3) -> List[Tuple[str, int]]:
        if limit <= 0:
            return []

        collapsed: Dict[str, int] = defaultdict(int)
        for (source, _level), timestamps in self._events_by_bucket.items():
            collapsed[source] += len(timestamps)

        ranked = sorted(collapsed.items(), key=lambda item: (-item[1], item[0]))
        return ranked[:limit]

    def _evict_expired(self, reference_time: datetime) -> None:
        cutoff = reference_time - self._window

        empty_buckets = []
        for bucket, timestamps in self._events_by_bucket.items():
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            if not timestamps:
                empty_buckets.append(bucket)

        for bucket in empty_buckets:
            del self._events_by_bucket[bucket]


if __name__ == "__main__":
    base = datetime(2026, 3, 26, 12, 0, 0)
    aggregator = LogWindowAggregator(window_seconds=30)

    sample = [
        LogEvent("api", "INFO", base, "start"),
        LogEvent("api", "ERROR", base + timedelta(seconds=4), "timeout"),
        LogEvent("worker", "INFO", base + timedelta(seconds=10), "job begin"),
        LogEvent("api", "INFO", base + timedelta(seconds=20), "request done"),
        LogEvent("worker", "ERROR", base + timedelta(seconds=35), "job failed"),
    ]

    aggregator.ingest(sample)
    print(aggregator.counts(now=base + timedelta(seconds=35)))
    print(aggregator.busiest_sources())
