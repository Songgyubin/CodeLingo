// =============================================================
// CODELINGO HANDOFF — ProfileCacheRepository.kt
// Generated: 2026-03-31 | Audience: 같은 팀 개발자
//
// 목적: TTL 기반 인메모리 캐시 + request deduplication을 결합한 프로필 조회 레포지토리
// 주요 결정: CompletableDeferred로 동시 요청 deduplication 구현 — synchronized 대신 코루틴에 맞는 방식
// 주의: evict() 후에도 진행 중인 요청이 완료되면 캐시가 다시 채워질 수 있음
//
// Full handoff: .codelingo/HANDOFF-ProfileCacheRepository.md
// =============================================================
package fixtures.kotlin

import kotlinx.coroutines.CompletableDeferred  // "나중에 완성될 값"을 담는 대기표
import kotlinx.coroutines.delay               // 코루틴을 잠깐 멈추는 함수 (Thread.sleep과 다르게 다른 코루틴은 계속 실행됨)
import kotlinx.coroutines.sync.Mutex          // 자물쇠 — 한 번에 하나의 코루틴만 특정 코드 블록에 진입하게 막음
import kotlinx.coroutines.sync.withLock       // 자물쇠를 걸고 블록 실행 후 자동으로 자물쇠를 해제하는 편의 함수

// 사용자 프로필 정보를 담는 데이터 묶음 — 이 앱에서 "프로필"이 무엇인지 정의
data class UserProfile(
    val userId: String,         // 사용자 고유 ID
    val nickname: String,       // 화면에 표시될 닉네임
    val updatedAtMillis: Long,  // 서버에서 마지막으로 업데이트된 시각 (밀리초)
)

// 서버에서 프로필을 가져오는 방법을 정의하는 계약서 — 실제 구현은 외부에서 주입받음
interface ProfileRemoteDataSource {
    suspend fun fetchProfile(userId: String): UserProfile  // suspend = 코루틴 안에서만 호출 가능
}

// 테스트용 가짜 서버 — 실제 네트워크 없이 동작을 흉내냄
class FakeProfileRemoteDataSource : ProfileRemoteDataSource {
    override suspend fun fetchProfile(userId: String): UserProfile {
        delay(120)  // 실제 네트워크 지연을 흉내내기 위해 120ms 대기
        return UserProfile(
            userId = userId,
            nickname = "user-$userId",               // 닉네임은 "user-" + userId로 자동 생성
            updatedAtMillis = System.currentTimeMillis(),  // 호출 시각을 업데이트 시각으로 설정
        )
    }
}

// 핵심 클래스 — 캐시 조회, 서버 호출, 중복 요청 방지를 모두 담당
class ProfileCacheRepository(
    private val remoteDataSource: ProfileRemoteDataSource,  // 실제 서버 통신 담당자 (외부 주입)
    private val ttlMillis: Long = 5_000L,                   // 캐시 유효 시간: 기본 5초 (5_000 = 5000ms)
) {
    // 캐시에 저장할 때 "언제 저장했는지"도 함께 기록하는 묶음
    private data class CacheEntry(
        val profile: UserProfile,    // 실제 프로필 데이터
        val cachedAtMillis: Long,    // 캐시에 저장된 시각 (만료 여부 계산에 사용)
    )

    private val mutex = Mutex()  // inFlightRequests 맵을 안전하게 수정하기 위한 자물쇠
    private val memoryCache = mutableMapOf<String, CacheEntry>()  // userId → 캐시 데이터 저장소
    private val inFlightRequests = mutableMapOf<String, CompletableDeferred<UserProfile>>()  // userId → 현재 진행 중인 서버 요청의 대기표

    // 프로필을 가져오는 유일한 창구 — 캐시 우선, 없으면 서버 호출
    suspend fun getProfile(
        userId: String,
        forceRefresh: Boolean = false,  // true면 캐시를 무시하고 무조건 서버에서 새로 가져옴
    ): UserProfile {
        val now = System.currentTimeMillis()  // 캐시 만료 여부를 판단할 현재 시각

        if (!forceRefresh) {  // 강제 새로고침이 아닐 때만 캐시 확인
            val cached = memoryCache[userId]  // 이 userId의 캐시 데이터 꺼내보기
            if (cached != null && !isExpired(cached, now)) {  // 캐시가 있고 아직 유효하면
                return cached.profile  // 서버 호출 없이 바로 반환 (빠른 경로)
            }
        }

        // 자물쇠를 걸고 "이미 진행 중인 요청이 있는지" 확인 — 동시 요청 중복 방지
        val deferred = mutex.withLock {
            val running = inFlightRequests[userId]  // 이 userId로 이미 서버에 가고 있는 요청이 있나?
            if (running != null) {
                return@withLock running  // 있으면 그 대기표를 그대로 받아옴 (서버를 새로 호출하지 않음)
            }

            // 처음 요청하는 경우 — 새 대기표를 만들고 진행 중 목록에 등록
            CompletableDeferred<UserProfile>().also { created ->
                inFlightRequests[userId] = created  // 다른 코루틴이 보고 합류할 수 있도록 등록
            }
        }

        if (deferred.isCompleted.not()) {  // 내가 방금 만든 대기표라면 (= 처음 요청한 사람이라면)
            try {
                val fetched = remoteDataSource.fetchProfile(userId)  // 실제로 서버에 가서 프로필 가져옴
                memoryCache[userId] = CacheEntry(  // 받아온 프로필을 캐시에 저장
                    profile = fetched,
                    cachedAtMillis = System.currentTimeMillis(),  // 저장 시각 기록 (TTL 계산용)
                )
                deferred.complete(fetched)  // 대기표 완성 — 기다리던 모든 코루틴에게 결과 전달
            } catch (t: Throwable) {  // 서버 호출 실패 시
                val fallback = memoryCache[userId]?.profile  // 혹시 만료된 캐시라도 있나 확인
                if (fallback != null) {
                    deferred.complete(fallback)  // 만료됐지만 데이터가 있으면 그걸로 대체 반환
                } else {
                    deferred.completeExceptionally(t)  // 캐시도 없으면 에러를 대기자들에게 전달
                }
            } finally {
                mutex.withLock {
                    inFlightRequests.remove(userId)  // 성공/실패 어느 경우든 진행 중 목록에서 제거
                }
            }
        }

        return deferred.await()  // 대기표가 완성될 때까지 기다렸다가 결과 반환
    }

    // 만료된 캐시 항목을 한꺼번에 지우는 청소 함수 (주의: mutex 없이 memoryCache 수정)
    suspend fun clearExpired() {
        val now = System.currentTimeMillis()
        val expiredKeys = memoryCache
            .filterValues { isExpired(it, now) }  // 만료된 항목만 필터링
            .keys                                  // 해당 userId 키 목록만 추출

        expiredKeys.forEach(memoryCache::remove)  // 만료된 키들을 캐시에서 하나씩 제거
    }

    // 특정 사용자의 캐시와 진행 중인 요청을 강제로 삭제
    suspend fun evict(userId: String) {
        memoryCache.remove(userId)  // 캐시에서 즉시 제거 (주의: 진행 중인 요청이 완료되면 다시 캐시에 쓰일 수 있음)
        mutex.withLock {
            inFlightRequests.remove(userId)  // 자물쇠를 걸고 진행 중인 요청도 제거
        }
    }

    // 캐시 항목이 TTL을 초과했는지 확인 — 초과하면 true 반환
    private fun isExpired(
        entry: CacheEntry,
        now: Long,
    ): Boolean {
        return now - entry.cachedAtMillis > ttlMillis  // (현재시각 - 저장시각)이 TTL보다 크면 만료
    }
}
