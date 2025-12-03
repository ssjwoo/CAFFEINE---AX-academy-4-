export default function SummaryPage() {
    return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">분석 요약</h2>
                {/* [왕초보 백엔드 연동 가이드]
                    1. 맨 위에 이 줄을 추가하세요: import { useState, useEffect } from 'react';
                    2. 컴포넌트 안쪽에 아래 코드를 추가해서 데이터를 가져오세요.
                    
                    const [summary, setSummary] = useState(null);

                    useEffect(() => {
                        const fetchSummary = async () => {
                            try {
                                const response = await fetch('/api/v1/summary');
                                const data = await response.json();
                                setSummary(data);
                            } catch (error) {
                                console.error('요약 데이터를 가져오는데 실패했습니다:', error);
                            }
                        };
                        fetchSummary();
                    }, []);
                    
                    3. 가져온 'summary' 데이터를 화면에 표시하도록 코드를 수정하세요.
                */}
                <p className="text-gray-500">이 페이지는 준비 중입니다.</p>
            </div>
        </div>
    );
}
