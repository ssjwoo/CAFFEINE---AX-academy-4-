/**
 * ============================================================
 * useRealtimeData Hook
 * ============================================================
 * 
 * 역할:
 * - 실시간으로 데이터 업데이트 감지
 * - Polling 방식으로 주기적으로 백엔드 확인
 * - 새 데이터 감지 시 자동 갱신 및 알림
 * 
 * 사용 시나리오:
 * 1. 여러 관리자가 동시에 작업할 때
 * 2. 새로운 이상 거래 발생 시 즉시 알림
 * 3. 다른 관리자가 승인/거부 시 화면 자동 업데이트
 * 
 * 기술 방식:
 * - Polling (주기적 HTTP 요청) - 구현 완료
 * - WebSocket (실시간 양방향 통신) - TODO
 * 
 * TODO: WebSocket으로 전환 시 더 효율적
 * - 서버 부하 감소
 * - 실시간성 향상
 * - 대역폭 절약
 * ============================================================
 */

'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * 실시간 업데이트 옵션
 */
interface RealtimeOptions {
    /** Polling 간격 (밀리초, 기본: 30초) */
    intervalMs?: number;

    /** 자동 활성화 여부 (기본: true) */
    enabled?: boolean;

    /** 새 데이터 감지 시 콜백 */
    onNewData?: (newCount: number) => void;

    /** 에러 발생 시 콜백 */
    onError?: (error: Error) => void;
}

/**
 * 실시간 데이터 훅 반환값
 */
interface RealtimeData<T> {
    /** 현재 데이터 */
    data: T | null;

    /** 로딩 상태 */
    isLoading: boolean;

    /** 에러 */
    error: Error | null;

    /** 새로운 데이터 개수 (알림 배지용) */
    newDataCount: number;

    /** 수동 새로고침 */
    refresh: () => Promise<void>;

    /** 실시간 업데이트 일시정지/재개 */
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
}

/**
 * 실시간 데이터 업데이트 Hook
 * 
 * @example
 * // 이상 거래 실시간 모니터링
 * const { 
 *   data: anomalies, 
 *   newDataCount, 
 *   refresh 
 * } = useRealtimeData(
 *   '/api/anomalies/pending',
 *   {
 *     intervalMs: 30000,  // 30초마다
 *     onNewData: (count) => {
 *       if (count > 0) {
 *         showToast(`새로운 이상 거래 ${count}건`);
 *       }
 *     },
 *   }
 * );
 * 
 * @param fetchUrl - 데이터를 가져올 API 엔드포인트
 * @param options - 실시간 업데이트 옵션
 * @returns 실시간 데이터 및 제어 함수
 */
export function useRealtimeData<T = any>(
    fetchUrl: string,
    options: RealtimeOptions = {}
): RealtimeData<T> {
    const {
        intervalMs = 30000,     // 기본 30초
        enabled = true,
        onNewData,
        onError,
    } = options;

    // ──────────────────────────────────────
    // State
    // ──────────────────────────────────────
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [newDataCount, setNewDataCount] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    // ──────────────────────────────────────
    // Refs
    // ──────────────────────────────────────
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousDataRef = useRef<T | null>(null);
    const isMountedRef = useRef<boolean>(true);

    /**
     * ──────────────────────────────────────
     * 데이터 Fetch 함수
     * ──────────────────────────────────────
     * 
     * TODO: 백엔드 API 엔드포인트 준비 필요
     * 
     * 백엔드 응답 형식:
     * {
     *   data: [...],        // 실제 데이터
     *   timestamp: string,  // 마지막 업데이트 시간
     *   count: number,      // 총 개수
     * }
     * 
     * @example 백엔드 구현 (FastAPI)
     * @app.get("/api/anomalies/pending")
     * async def get_pending_anomalies():
     *     anomalies = db.query(Anomaly).filter(
     *         Anomaly.status == "pending"
     *     ).all()
     *     
     *     return {
     *         "data": anomalies,
     *         "timestamp": datetime.now().isoformat(),
     *         "count": len(anomalies),
     *     }
     */
    const fetchData = async (showLoading: boolean = true) => {
        if (showLoading) {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await fetch(fetchUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // 컴포넌트가 언마운트됐으면 상태 업데이트 하지 않음
            if (!isMountedRef.current) return;

            // ──────────────────────────────────────
            // 새 데이터 감지 로직
            // ──────────────────────────────────────
            // 배열 길이나 특정 필드 비교
            if (previousDataRef.current && Array.isArray(result.data)) {
                const previousCount = Array.isArray(previousDataRef.current)
                    ? previousDataRef.current.length
                    : 0;
                const currentCount = result.data.length;

                if (currentCount > previousCount) {
                    const newCount = currentCount - previousCount;
                    setNewDataCount(prev => prev + newCount);
                    onNewData?.(newCount);
                }
            }

            // 데이터 업데이트
            previousDataRef.current = result.data;
            setData(result.data);

        } catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            console.error('❌ 실시간 데이터 fetch 실패:', error);

            if (isMountedRef.current) {
                setError(error);
                onError?.(error);
            }
        } finally {
            if (isMountedRef.current && showLoading) {
                setIsLoading(false);
            }
        }
    };

    /**
     * ──────────────────────────────────────
     * Polling 시작/중지
     * ──────────────────────────────────────
     */
    useEffect(() => {
        if (!enabled || isPaused) {
            // Polling 중지
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // 즉시 1회 실행
        fetchData(true);

        // Polling 시작
        intervalRef.current = setInterval(() => {
            fetchData(false); // 백그라운드 업데이트는 로딩 표시 안 함
        }, intervalMs);

        console.log(`✅ 실시간 업데이트 시작 (${intervalMs / 1000}초마다)`);

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, isPaused, fetchUrl, intervalMs]);

    /**
     * ──────────────────────────────────────
     * 컴포넌트 언마운트 감지
     * ──────────────────────────────────────
     */
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    /**
     * ──────────────────────────────────────
     * 수동 새로고침
     * ──────────────────────────────────────
     */
    const refresh = async () => {
        await fetchData(true);
        // 새로고침 시 알림 배지 초기화
        setNewDataCount(0);
    };

    /**
     * ──────────────────────────────────────
     * 일시정지/재개
     * ──────────────────────────────────────
     */
    const pause = () => setIsPaused(true);
    const resume = () => setIsPaused(false);

    return {
        data,
        isLoading,
        error,
        newDataCount,
        refresh,
        pause,
        resume,
        isPaused,
    };
}

/**
 * ============================================================
 * WebSocket 버전 (TODO - 더 효율적인 방식)
 * ============================================================
 * 
 * Polling 대신 WebSocket 사용 시 장점:
 * - 불필요한 HTTP 요청 감소 (서버 부하 ↓)
 * - 실시간성 향상 (즉시 업데이트)
 * - 양방향 통신 가능
 * 
 * @example WebSocket 구현
 * 
 * export function useRealtimeDataWS<T>(
 *   wsUrl: string,
 *   options: RealtimeOptions = {}
 * ): RealtimeData<T> {
 *   const [data, setData] = useState<T | null>(null);
 *   const wsRef = useRef<WebSocket | null>(null);
 * 
 *   useEffect(() => {
 *     // WebSocket 연결
 *     const ws = new WebSocket(wsUrl);
 * 
 *     ws.onopen = () => {
 *       console.log('✅ WebSocket 연결됨');
 *     };
 * 
 *     ws.onmessage = (event) => {
 *       const newData = JSON.parse(event.data);
 *       setData(newData);
 *       options.onNewData?.(1);
 *     };
 * 
 *     ws.onerror = (error) => {
 *       console.error('❌ WebSocket 에러:', error);
 *     };
 * 
 *     ws.onclose = () => {
 *       console.log('🔌 WebSocket 연결 종료');
 *     };
 * 
 *     wsRef.current = ws;
 * 
 *     // Cleanup
 *     return () => {
 *       ws.close();
 *     };
 *   }, [wsUrl]);
 * 
 *   return { data, ... };
 * }
 * 
 * ============================================================
 */
