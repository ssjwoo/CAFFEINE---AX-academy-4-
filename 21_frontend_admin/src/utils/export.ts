/**
 * ============================================================
 * 데이터 Export 유틸리티
 * ============================================================
 * 
 * 역할:
 * - 대시보드/이상거래 데이터를 Excel, CSV, PNG 형식으로 다운로드
 * - 관리자가 리포트 작성 시 사용
 * - 외부 시스템과 데이터 공유 시 사용
 * 
 * 지원 형식:
 * 1. Excel (.xlsx) - 통계 데이터, 테이블 데이터
 * 2. CSV (.csv) - 거래 내역, 이상 거래 목록
 * 3. PNG - 차트 이미지
 * 
 * 사용 라이브러리:
 * - xlsx: Excel 파일 생성
 * - html2canvas: 차트를 이미지로 캡처
 * 
 * TODO: 패키지 설치 필요
 * npm install xlsx html2canvas
 * ============================================================
 */

/**
 * CSV 파일로 다운로드
 * 
 * 사용 예시:
 * - 이상 거래 목록 다운로드
 * - 거래 내역 다운로드
 * 
 * @example
 * const data = [
 *   { id: 1, merchant: '스타벅스', amount: 15000, category: '식비' },
 *   { id: 2, merchant: '이마트', amount: 50000, category: '쇼핑' },
 * ];
 * exportToCSV(data, 'anomalies', '이상_거래_목록_20241203');
 * 
 * @param data - 내보낼 데이터 배열
 * @param type - 데이터 타입 ('anomalies' | 'transactions' | 'dashboard')
 * @param filename - 파일명 (확장자 제외)
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    type: 'anomalies' | 'transactions' | 'dashboard',
    filename: string = `export_${new Date().toISOString().split('T')[0]}`
): void {
    if (!data || data.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }

    try {
        // 1. 헤더 생성 (첫 번째 객체의 키 사용)
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');

        // 2. 데이터 행 생성
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];

                // 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
                if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }

                return value ?? '';
            }).join(',');
        });

        // 3. CSV 문자열 생성
        const csvContent = [csvHeaders, ...csvRows].join('\n');

        // 4. BOM 추가 (한글 깨짐 방지)
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // 5. Blob 생성 및 다운로드
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(`✅ CSV 다운로드 완료: ${filename}.csv`);
    } catch (error) {
        console.error('❌ CSV 내보내기 실패:', error);
        alert('CSV 파일 생성에 실패했습니다.');
    }
}

/**
 * Excel 파일로 다운로드
 * 
 * 사용 예시:
 * - 대시보드 통계 다운로드 (여러 시트)
 * - 카테고리별 분석 데이터
 * 
 * TODO: xlsx 패키지 설치 후 주석 해제
 * npm install xlsx
 * 
 * @example
 * import * as XLSX from 'xlsx';
 * 
 * const sheetData = {
 *   '통계': [
 *     { 항목: '총 거래액', 값: '₩12.5억' },
 *     { 항목: '총 거래 건수', 값: '89,234' },
 *   ],
 *   '카테고리': [
 *     { 카테고리: '식비', 금액: 4200000 },
 *     { 카테고리: '쇼핑', 금액: 3000000 },
 *   ],
 * };
 * exportToExcel(sheetData, '대시보드_통계_20241203');
 * 
 * @param sheets - 시트별 데이터 객체 { 시트명: 데이터배열 }
 * @param filename - 파일명 (확장자 제외)
 */
export function exportToExcel(
    sheets: Record<string, any[]>,
    filename: string = `export_${new Date().toISOString().split('T')[0]}`
): void {
    // TODO: xlsx 패키지 설치 후 구현
    console.warn('⚠️ Excel 내보내기: xlsx 패키지를 설치하세요');
    console.log('설치 명령어: npm install xlsx');

    alert('Excel 내보내기 기능을 사용하려면 xlsx 패키지가 필요합니다.\n\n설치: npm install xlsx');

    // 패키지 설치 후 아래 주석 해제:
    /*
    try {
      // @ts-ignore
      const XLSX = require('xlsx');
      
      // 1. 워크북 생성
      const workbook = XLSX.utils.book_new();
      
      // 2. 각 시트 추가
      Object.entries(sheets).forEach(([sheetName, data]) => {
        if (data && data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      });
      
      // 3. Excel 파일 생성 및 다운로드
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      
      console.log(`✅ Excel 다운로드 완료: ${filename}.xlsx`);
    } catch (error) {
      console.error('❌ Excel 내보내기 실패:', error);
      alert('Excel 파일 생성에 실패했습니다.');
    }
    */
}

/**
 * 차트를 PNG 이미지로 다운로드
 * 
 * 사용 예시:
 * - 대시보드 차트를 보고서에 삽입
 * - 프레젠테이션 자료용
 * 
 * TODO: html2canvas 패키지 설치 후 주석 해제
 * npm install html2canvas
 * 
 * @example
 * // Chart 컴포넌트에 id 속성 추가
 * <div id="monthly-chart">
 *   <BarChart data={...} />
 * </div>
 * 
 * // 다운로드 버튼
 * <button onClick={() => exportChartToPNG('monthly-chart', '월별_거래_추이')}>
 *   차트 다운로드
 * </button>
 * 
 * @param elementId - 캡처할 HTML 요소의 ID
 * @param filename - 파일명 (확장자 제외)
 * @param scale - 이미지 해상도 (기본: 2 = 2배 고해상도)
 */
export async function exportChartToPNG(
    elementId: string,
    filename: string = `chart_${new Date().toISOString().split('T')[0]}`,
    scale: number = 2
): Promise<void> {
    // TODO: html2canvas 패키지 설치 후 구현
    console.warn('⚠️ 차트 이미지 다운로드: html2canvas 패키지를 설치하세요');
    console.log('설치 명령어: npm install html2canvas');

    alert('차트 이미지 다운로드 기능을 사용하려면 html2canvas 패키지가 필요합니다.\n\n설치: npm install html2canvas');

    // 패키지 설치 후 아래 주석 해제:
    /*
    const element = document.getElementById(elementId);
    
    if (!element) {
      console.error(`❌ ID "${elementId}"를 가진 요소를 찾을 수 없습니다.`);
      alert('차트를 찾을 수 없습니다.');
      return;
    }
  
    try {
      // @ts-ignore
      const html2canvas = (await import('html2canvas')).default;
      
      // 1. HTML 요소를 캔버스로 변환
      const canvas = await html2canvas(element, {
        scale: scale,              // 고해상도
        backgroundColor: '#ffffff', // 배경색
        logging: false,            // 콘솔 로그 비활성화
      });
      
      // 2. 캔버스를 Blob으로 변환
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('이미지 생성에 실패했습니다.');
          return;
        }
        
        // 3. 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ 차트 이미지 다운로드 완료: ${filename}.png`);
      });
    } catch (error) {
      console.error('❌ 차트 이미지 다운로드 실패:', error);
      alert('차트 이미지 다운로드에 실패했습니다.');
    }
    */
}

/**
 * ============================================================
 * 백엔드 연동 가이드
 * ============================================================
 * 
 * 옵션 1: 클라이언트 사이드 Export (현재 구현)
 * - 장점: 서버 부하 없음, 빠른 다운로드
 * - 단점: 대용량 데이터 처리 제한
 * - 적합: 최대 10,000행 이하의 데이터
 * 
 * 옵션 2: 서버 사이드 Export (대용량 데이터)
 * - 백엔드에서 파일 생성 후 다운로드 링크 반환
 * - 대용량 데이터 처리 가능
 * - 이메일로 파일 전송 옵션
 * 
 * @example 서버 사이드 Export 구현
 * 
 * async function exportFromBackend(type: 'csv' | 'excel', filters: any) {
 *   try {
 *     // 1. 백엔드에 Export 요청
 *     const response = await fetch('/api/export', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({
 *         type,
 *         filters,
 *         format: type === 'csv' ? 'csv' : 'xlsx',
 *       }),
 *     });
 * 
 *     // 2. Blob 응답 받기
 *     const blob = await response.blob();
 * 
 *     // 3. 다운로드
 *     const url = URL.createObjectURL(blob);
 *     const link = document.createElement('a');
 *     link.href = url;
 *     link.download = `export.${type}`;
 *     link.click();
 *     URL.revokeObjectURL(url);
 *   } catch (error) {
 *     console.error('Export 실패:', error);
 *   }
 * }
 * 
 * ============================================================
 */
