"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { AnomalyData } from '@/types';
import { AnomalySummaryCard } from '@/components/ui/AnomalySummaryCard';
import { getAnomalies, approveAnomaly, rejectAnomaly } from '@/api/client';

export default function AnomaliesPage() {
    // =========================================================================================
    // [백엔드 연동 가이드 - 완료]
    // Backend API (/api/anomalies)와 연결되어 실제 데이터를 가져옵니다.
    // =========================================================================================
    const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnomalies();
    }, []);

    /**
     * Backend API에서 이상 거래 데이터를 가져오는 함수
     */
    const fetchAnomalies = async () => {
        try {
            setIsLoading(true);
            const data = await getAnomalies('reported'); // Backend API 직접 호출 (Reported only)
            setAnomalies(data);
            console.log('✅ Anomaly 데이터 로드 완료:', data.length, '건');
        } catch (error) {
            console.error('❌ Anomaly 데이터 로드 실패:', error);
            setAnomalies([]);
        } finally {
            setIsLoading(false);
        }
    };

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
        try {
            await approveAnomaly(id);
            alert('승인되었습니다.');
            await fetchAnomalies(); // 목록 새로고침
        } catch (error) {
            console.error('승인 실패:', error);
            alert('처리에 실패했습니다.');
        }
    };

    // 거부 처리 함수
    const handleReject = async (id: number) => {
        try {
            await rejectAnomaly(id);
            alert('거부되었습니다.');
            await fetchAnomalies(); // 목록 새로고침
        } catch (error) {
            console.error('거부 실패:', error);
            alert('처리에 실패했습니다.');
        }
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
                    title="신고된 이상거래"
                    value={`${anomalies.length}건`}
                    icon={AlertTriangle}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-50"
                />
                <AnomalySummaryCard
                    title="금일 신고 건수"
                    value={`${anomalies.filter(a => {
                        const today = new Date().toISOString().split('T')[0];
                        return a.date?.startsWith(today);
                    }).length}건`}
                    icon={Clock}
                    iconColor="text-yellow-600"
                    iconBgColor="bg-yellow-50"
                />
                <AnomalySummaryCard
                    title="탐지된 위험 금액"
                    value={`₩${(totalRiskAmount / 10000).toFixed(1)}만`}
                    icon={AlertTriangle}
                    iconColor="text-red-600"
                    iconBgColor="bg-red-50"
                />
            </div>

            {/* 이상거래 신고 목록 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">이상거래 신고 목록</h3>
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                        총 {anomalies.length}건
                    </span>
                </div>
                <div className="divide-y divide-gray-100">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500">
                            데이터를 불러오는 중입니다...
                        </div>
                    ) : anomalies.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            신고된 이상거래가 없습니다.
                        </div>
                    ) : (
                        anomalies.map((anomaly) => (
                            <div key={anomaly.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${anomaly.riskLevel === '위험' ? 'bg-red-100' :
                                            anomaly.riskLevel === '경고' ? 'bg-yellow-100' : 'bg-blue-100'
                                        }`}>
                                        <AlertTriangle className={`w-5 h-5 ${anomaly.riskLevel === '위험' ? 'text-red-600' :
                                                anomaly.riskLevel === '경고' ? 'text-yellow-600' : 'text-blue-600'
                                            }`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskBadge(anomaly.riskLevel)}`}>
                                                {anomaly.riskLevel}
                                            </span>
                                            <p className="text-sm font-medium text-gray-800">{anomaly.category} - ₩{anomaly.amount.toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{anomaly.date} • {anomaly.userName} • {anomaly.reason}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-xs transition-colors">
                                        상세
                                    </button>
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
