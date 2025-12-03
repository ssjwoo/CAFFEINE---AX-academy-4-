export interface AnomalyData {
    id: number;
    category: string;
    amount: number;
    date: string;
    reason: string;
    riskLevel: '위험' | '경고' | '주의';
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
    userName: string;
}
