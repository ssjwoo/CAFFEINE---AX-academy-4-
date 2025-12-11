import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json([
        { name: '식비', amount: '₩450,000', percent: '35%' },
        { name: '쇼핑', amount: '₩320,000', percent: '25%' },
        { name: '교통', amount: '₩150,000', percent: '12%' },
    ]);
}
