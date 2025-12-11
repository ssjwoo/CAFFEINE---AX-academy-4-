"use client";

import { useState, useEffect } from 'react';

import { PieChart, TrendingUp } from 'lucide-react';
import { ConsumptionItem } from '@/components/ui/ConsumptionItem';

export default function ConsumptionPage() {
    const [consumptionData, setConsumptionData] = useState<any[]>([]);

    useEffect(() => {
        // 백엔드에서 소비 데이터 가져오기
        const fetchConsumption = async () => {
            try {
                const response = await fetch('/api/v1/consumption/summary');
                const data = await response.json();
                setConsumptionData(data);
            } catch (error) {
                console.error('소비 데이터를 가져오는데 실패했습니다:', error);
            }
        };
        fetchConsumption();
    }, []);

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">소비 분석</h2>
                <p className="text-gray-500 mt-1">전체적인 소비 트렌드를 분석합니다</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">월간 소비 요약</h3>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <p className="text-gray-400">소비 차트가 여기에 표시됩니다</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">주요 지출 카테고리</h3>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {/* [왕초보 백엔드 연동 가이드]
                            1. 맨 위에 이 줄을 추가하세요: import { useState, useEffect } from 'react';
                            2. 아래의 대괄호 [] 안에 있는 내용(여기부터 map 함수 전까지)을 모두 지우세요.
                            3. 지운 자리에 'consumptionData' 변수를 넣으세요.
                            4. 그리고 컴포넌트 안쪽에 아래 코드를 추가하세요.
                            
                            const [consumptionData, setConsumptionData] = useState([]);

                            useEffect(() => {
                                // 백엔드에서 소비 데이터 가져오기
                                const fetchConsumption = async () => {
                                    try {
                                        const response = await fetch('/api/v1/consumption/summary');
                                        const data = await response.json();
                                        setConsumptionData(data);
                                    } catch (error) {
                                        console.error('소비 데이터를 가져오는데 실패했습니다:', error);
                                    }
                                };
                                fetchConsumption();
                            }, []);
                            
                        */}
                        {consumptionData.map((item, i) => (
                            <ConsumptionItem
                                key={i}
                                name={item.name}
                                amount={item.amount}
                                percent={item.percent}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
