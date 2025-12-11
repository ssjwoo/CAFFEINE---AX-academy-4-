import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        dailyTransactions: [
            { name: '1', value: 4000 }, { name: '2', value: 3000 }, { name: '3', value: 2000 }, { name: '4', value: 2780 },
            { name: '5', value: 1890 }, { name: '6', value: 2390 }, { name: '7', value: 3490 }, { name: '8', value: 4000 },
            { name: '9', value: 3000 }, { name: '10', value: 2000 }, { name: '11', value: 2780 }, { name: '12', value: 1890 },
            { name: '13', value: 2390 }, { name: '14', value: 3490 }, { name: '15', value: 4200 }, { name: '16', value: 3800 },
            { name: '17', value: 3500 }, { name: '18', value: 3000 }, { name: '19', value: 2500 }, { name: '20', value: 2800 },
            { name: '21', value: 3200 }, { name: '22', value: 3600 }, { name: '23', value: 4000 }, { name: '24', value: 4500 },
            { name: '25', value: 4800 }, { name: '26', value: 4600 }, { name: '27', value: 4200 }, { name: '28', value: 3800 },
            { name: '29', value: 3500 }, { name: '30', value: 3200 },
        ],
        categoryConsumption: [
            { name: '마트/편의점', value: 4000 },
            { name: '배달음식', value: 3000 },
            { name: '카페/디저트', value: 2000 },
            { name: '교육', value: 1800 },
            { name: '패션/뷰티', value: 1500 },
            { name: '주유', value: 1200 },
            { name: '기타', value: 800 },
        ]
    });
}
