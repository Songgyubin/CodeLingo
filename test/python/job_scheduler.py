# =============================================================
# CODELINGO — job_scheduler.py
# Analyzed: 2026-03-29
#
# 목적: 시간표에 따라 작업(함수)을 실행하고, 실패하면 자동으로 재시도하는 스케줄러
# 진입점: JobScheduler.add_job() (Line 54), JobScheduler.tick(current_time) (Line 58)
# 주의: tick()을 직접 호출해야만 작업이 실행됨 — 스스로 시계처럼 돌아가지 않음
#
# Full explanation: .codelingo/job_scheduler.md
# =============================================================
from __future__ import annotations  # 타입 힌트를 문자열처럼 처리 — 순환 참조 방지용

import heapq  # 우선순위 큐(항상 가장 작은 값이 앞에 오는 특수 리스트) 구현 도구
from dataclasses import dataclass, field  # 클래스 필드를 자동으로 초기화해주는 데코레이터
from enum import Enum  # 정해진 값만 쓰도록 제한하는 열거형 도구
from typing import Callable, List, Optional  # 타입 힌트용 — 실행에는 영향 없음


# 작업이 현재 어떤 상태인지 나타내는 5가지 값 — 문자열 오타를 방지하기 위해 Enum 사용
class JobStatus(str, Enum):
    PENDING = "PENDING"      # 아직 실행 전 (대기 중)
    RUNNING = "RUNNING"      # 지금 실행 중
    SUCCESS = "SUCCESS"      # 성공적으로 완료됨
    FAILED = "FAILED"        # 재시도를 모두 소진하고 최종 실패
    RETRY_WAIT = "RETRY_WAIT"  # 실패했지만 재시도를 기다리는 중


# 작업 하나를 표현하는 데이터 묶음 — order=True 덕분에 next_run_at, priority 순으로 자동 크기 비교 가능
@dataclass(order=True)
class ScheduledJob:
    next_run_at: int   # 몇 번째 틱에 실행할지 (숫자가 작을수록 먼저 실행)
    priority: int      # 중요도 — 숫자가 작을수록 더 중요 (1이 2보다 먼저 실행됨)
    id: str = field(compare=False)              # 작업 이름/식별자 — 크기 비교에서 제외
    action: Callable[[], bool] = field(compare=False)  # 실제로 실행할 함수 — True 반환 시 성공
    max_retries: int = field(default=2, compare=False)   # 최대 재시도 횟수 (기본값 2번)
    retry_count: int = field(default=0, compare=False)   # 지금까지 재시도한 횟수
    status: JobStatus = field(default=JobStatus.PENDING, compare=False)  # 현재 상태
    last_error: Optional[str] = field(default=None, compare=False)  # 마지막 오류 메시지


# 작업들을 등록하고, 시간에 맞춰 실행하고, 실패 시 재시도하는 스케줄러 클래스
class JobScheduler:
    """
    A simple tick-based scheduler.

    Rules:
    - Lower priority number means higher priority.
    - Failed jobs are retried with linear backoff: +5, +10, +15...
    - tick(current_time) runs every job whose next_run_at <= current_time.
    - New jobs can be added at any time.
    """

    # 스케줄러 초기화 — 빈 대기 줄과 빈 기록장을 준비
    def __init__(self) -> None:
        self._queue: List[ScheduledJob] = []   # 실행 대기 중인 작업들의 우선순위 큐
        self._history: List[str] = []          # "언제 무슨 일이 있었는지" 기록하는 로그

    # 새 작업을 대기 줄에 추가 — 호출 즉시 우선순위 정렬됨
    def add_job(self, job: ScheduledJob) -> None:
        heapq.heappush(self._queue, job)  # 힙에 삽입 — next_run_at이 작은 것이 앞으로 감
        self._history.append(f"ADD:{job.id}@{job.next_run_at}")  # "ADD:email@0" 형태로 기록

    # 외부 시계 역할 — current_time을 넘겨서 "지금 실행할 작업들"을 모두 실행
    def tick(self, current_time: int) -> None:
        ready: List[ScheduledJob] = []  # 이번 틱에 실행할 작업을 임시로 담는 바구니

        # next_run_at이 현재 시각 이하인 작업을 모두 꺼냄 (힙은 자동으로 가장 빠른 것부터 꺼냄)
        while self._queue and self._queue[0].next_run_at <= current_time:
            ready.append(heapq.heappop(self._queue))  # 큐에서 꺼내 ready 바구니에 담음

        # 힙에서 꺼낸 순서(next_run_at 기준)가 아닌, priority 기준으로 다시 정렬
        # 주의: 이 줄이 없으면 중요도가 낮은 작업이 먼저 실행될 수 있음
        ready.sort(key=lambda job: (job.priority, job.next_run_at, job.id))

        for job in ready:
            self._run_job(job, current_time)  # 정렬된 순서대로 하나씩 실행

    # 현재 대기 중인 작업들의 id 목록 반환 (우선순위 순)
    def pending_jobs(self) -> List[str]:
        return [job.id for job in sorted(self._queue)]  # 매번 전체 정렬 — 큐가 크면 느려질 수 있음

    # 지금까지 일어난 모든 이벤트 기록을 복사해서 반환
    def history(self) -> List[str]:
        return list(self._history)  # 원본을 보호하기 위해 복사본 반환

    # 작업 하나를 실제로 실행하고, 성공/실패/재시도 처리 — 외부에서 직접 호출하지 말 것
    def _run_job(self, job: ScheduledJob, current_time: int) -> None:
        job.status = JobStatus.RUNNING  # 실행 시작을 상태에 반영
        self._history.append(f"RUN:{job.id}@{current_time}")  # 실행 시작 기록

        try:
            ok = job.action()  # 실제 작업 함수 호출 — True면 성공, False면 실패
        except Exception as exc:  # noqa: BLE001
            ok = False  # 예외가 나도 프로그램이 멈추지 않도록 실패로 처리
            job.last_error = str(exc)  # 오류 메시지를 저장 (나중에 확인용)

        if ok:
            job.status = JobStatus.SUCCESS
            self._history.append(f"SUCCESS:{job.id}")
            return  # 성공했으면 재시도 로직 없이 바로 종료

        # 실패했고, 아직 재시도 횟수가 남아있는 경우
        if job.retry_count < job.max_retries:
            job.retry_count += 1  # 재시도 횟수 1 증가
            job.status = JobStatus.RETRY_WAIT
            delay = job.retry_count * 5  # 1번째 실패: 5틱 후, 2번째: 10틱 후 (선형 증가)
            job.next_run_at = current_time + delay  # 다음 실행 시각을 미래로 설정
            self._history.append(f"RETRY:{job.id}@{job.next_run_at}")
            heapq.heappush(self._queue, job)  # 변경된 next_run_at으로 힙에 재삽입
        else:
            # 재시도 횟수를 모두 소진한 경우 — 최종 실패로 기록하고 끝
            job.status = JobStatus.FAILED
            self._history.append(f"FAILED:{job.id}")


# 이 파일을 직접 실행했을 때만 동작하는 예제 코드 (import 시에는 실행 안 됨)
if __name__ == "__main__":
    toggle = {"first": True}  # 첫 번째 호출인지 추적하는 플래그

    # 첫 번째 실행은 무조건 실패하고, 두 번째부터 성공하는 불안정한 작업
    def flaky_job() -> bool:
        if toggle["first"]:
            toggle["first"] = False  # 플래그를 False로 바꿔서 다음엔 성공하도록
            return False  # 첫 번째엔 실패
        return True  # 두 번째부터 성공

    scheduler = JobScheduler()
    # priority=2인 email 작업과 priority=1인 cleanup 작업을 동시에 등록
    # priority 숫자가 낮은 cleanup이 먼저 실행됨
    scheduler.add_job(ScheduledJob(id="email", next_run_at=0, priority=2, action=flaky_job))
    scheduler.add_job(ScheduledJob(id="cleanup", next_run_at=0, priority=1, action=lambda: True))

    scheduler.tick(0)  # 시각 0: cleanup 성공, email 실패 → email은 5틱 후 재시도 예약됨
    scheduler.tick(5)  # 시각 5: email 재시도 → 이번엔 성공

    print(scheduler.pending_jobs())  # [] — 모든 작업 완료
    print(scheduler.history())       # ADD/RUN/SUCCESS/RETRY/... 순서로 기록 출력
