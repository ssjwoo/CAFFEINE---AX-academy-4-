"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { AnomalyData } from '@/types';
import { AnomalySummaryCard } from '@/components/ui/AnomalySummaryCard';

export default function AnomaliesPage() {
    // =========================================================================================
    // [백엔드 연동 가이드 - 데이터 목록 가져오기]
    // 1. useState를 사용하여 데이터를 저장할 상태 변수를 만듭니다. (이미 만들어져 있음)
    // 2. useEffect를 사용하여 페이지가 로드될 때 백엔드 API를 호출합니다.
    // =========================================================================================
    const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

    useEffect(() => {
        /**
         * 백엔드 API에서 이상 거래 데이터를 가져오는 함수
         * 
         * [연동 단계]
         * 1. fetch 함수 내부의 URL을 실제 백엔드 API 주소로 변경하세요. (예: /api/v1/anomalies)
         * 2. 백엔드 응답 형태에 맞춰 data 구조를 확인하세요.
         * 3. 필요한 경우 인증 토큰(Header)을 fetch 옵션에 추가해야 할 수도 있습니다.
         */
        const fetchAnomalies = async () => {
            try {
                setIsLoading(true);
                // [TODO] 실제 백엔드 API 엔드포인트로 교체 필요
                const response = await fetch('/api/v1/anomalies'); 
                
                if (!response.ok) {
                    throw new Error('서버 응답이 올바르지 않습니다.');
                }

                const data = await response.json();
                setAnomalies(data); // 데이터 상태 업데이트
            } catch (error) {
                console.error('❌ 데이터를 가져오는데 실패했습니다:', error);
                // 에러 발생 시 사용자에게 알림을 보여주는 로직을 추가할 수 있습니다.
            } finally {
                setIsLoading(false); // 로딩 완료
            }
        };

        fetchAnomalies();
    }, []);

    // =========================================================================================
    // [데이터 요약 계산]
    // 백엔드에서 받아온 데이터를 기반으로 화면에 표시할 요약 정보를 계산합니다.
    // =========================================================================================
    const pendingCount = anomalies.filter(a => a.status === 'pending').length;
    const approvedCount = anomalies.filter(a => a.status === 'approved').length;
    const rejectedCount = anomalies.filter(a => a.status === 'rejected').length;
    
    // 위험 금액 합계 계산 (모든 이상 거래의 금액 합계)
    const totalRiskAmount = anomalies.reduce((sum, item) => sum + item.amount, 0);

    const getRiskBadge = (level: string) => {
        switch (level) {
            case '위험': return 'bg-red-100 text-red-800';
            case '경고': return 'bg-yellow-100 text-yellow-800';
            case '주의': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // =========================================================================================
    // [백엔드 연동 가이드 - 승인/거부 처리]
    // 각 버튼을 클릭했을 때 실행될 함수들입니다.
    // =========================================================================================
    
    // 승인 처리 함수
    const handleApprove = async (id: number) => {
        console.log(`[승인 요청] ID: ${id}`);
        // [코드 예시]
        // try {
        //     await fetch(`/api/v1/anomalies/${id}/approve`, { method: 'POST' });
        //     // 성공 시 목록을 다시 불러오거나 상태를 업데이트
        //     alert('승인되었습니다.');
        // } catch (e) {
        //     alert('처리에 실패했습니다.');
        // }
    };

    // 거부 처리 함수
    const handleReject = async (id: number) => {
        console.log(`[거부 요청] ID: ${id}`);
        // [코드 예시]
        // try {
        //     await fetch(`/api/v1/anomalies/${id}/reject`, { method: 'POST' });
        //     // 성공 시 목록을 다시 불러오거나 상태를 업데이트
        //     alert('거부되었습니다.');
        // } catch (e) {
        //     alert('처리에 실패했습니다.');
        // }
    };

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">이상 거래 탐지</h2>
                <p className="text-gray-500 mt-1">실시간으로 감지된 이상 거래를 모니터링하고 관리합니다</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnomalySummaryCard
                    title="대기 중인 알림"
                    value={`${pendingCount}건`}
                    icon={Clock}
                    iconColor="text-yellow-600"
                    iconBgColor="bg-yellow-50"
                />
                <AnomalySummaryCard
                    title="금일 처리 완료"
                    value={`${approvedCount + rejectedCount}건`}
                    icon={CheckCircle}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-50"
                />
                <AnomalySummaryCard
                    title="탐지된 위험 금액"
                    value={`₩${(totalRiskAmount / 10000).toFixed(1)}만`}
                    icon={AlertTriangle}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-50"
                />
            </div>

            {/* Pending Anomalies List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">대기 중인 이상 거래</h3>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {pendingCount}건의 검토 필요 항목
                    </span>
                </div>
                
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">
                        데이터를 불러오는 중입니다...
                    </div>
                ) : anomalies.filter(a => a.status === 'pending').length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        대기 중인 이상 거래가 없습니다.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {anomalies.filter(a => a.status === 'pending').map((anomaly) => (
                            <div key={anomaly.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${anomaly.riskLevel === '위험' ? 'bg-red-100' : anomaly.riskLevel === '경고' ? 'bg-yellow-100' : 'bg-blue-100'
                                            }`}>
                                            <AlertTriangle className={`w-6 h-6 ${anomaly.riskLevel === '위험' ? 'text-red-600' : anomaly.riskLevel === '경고' ? 'text-yellow-600' : 'text-blue-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadge(anomaly.riskLevel)}`}>
                                                    {anomaly.riskLevel}
                                                </span>
                                                <h4 className="text-base font-bold text-gray-800">{anomaly.category}</h4>
                                                <span className="text-sm text-gray-500">• {anomaly.date}</span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 mb-2">₩{anomaly.amount.toLocaleString()}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                                <span className="font-medium">의심 사유:</span>
                                                {anomaly.reason}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                사용자: <span className="font-medium text-gray-700">{anomaly.userName}</span> ({anomaly.userId})
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">
                                            상세 보기
                                        </button>
                                        <button 
                                            onClick={() => handleReject(anomaly.id)}
                                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors">
                                            거부
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(anomaly.id)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm">
                                            정상 승인
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Processed History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">최근 처리 내역</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {anomalies.filter(a => a.status !== 'pending').length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            처리된 내역이 없습니다.
                        </div>
                    ) : (
                        anomalies.filter(a => a.status !== 'pending').map((anomaly) => (
                            <div key={anomaly.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${anomaly.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                        {anomaly.status === 'approved' ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{anomaly.category} - ₩{anomaly.amount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">{anomaly.date} • {anomaly.userName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${anomaly.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {anomaly.status === 'approved' ? '정상 승인됨' : '거부됨'}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
