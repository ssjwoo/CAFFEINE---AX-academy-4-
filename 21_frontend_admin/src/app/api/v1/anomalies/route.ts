import { NextResponse } from 'next/server';

export async function GET() {
    // [백엔드 연동 가이드]
    // 이 파일은 Next.js의 API Route 기능입니다. 
    // 프론트엔드에서 /api/v1/anomalies 로 요청을 보내면 이 함수가 실행됩니다.

    // 현재는 빈 배열([])을 반환하도록 설정되어 있습니다.
    // 실제 백엔드 서버가 있다면 여기서 그 서버로 요청을 전달(Proxy)하거나,
    // DB에 직접 연결해서 데이터를 가져와야 합니다.

    /* 
    // [예시 1: 외부 백엔드 서버로 요청 전달하기]
    const backendResponse = await fetch('http://YOUR_BACKEND_SERVER/api/anomalies');
    const data = await backendResponse.json();
    return NextResponse.json(data);
    */

    /*
    // [예시 2: 직접 DB 쿼리하기 (Prisma 등 사용 시)]
    const data = await prisma.anomaly.findMany();
    return NextResponse.json(data);
    */

    // 더미 데이터 제거됨 -> 실제 데이터 연동 전까지는 빈 목록 반환
    return NextResponse.json([]);
}
