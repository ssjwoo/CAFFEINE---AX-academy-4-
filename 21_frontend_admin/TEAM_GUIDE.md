#  Admin 대시보드 팀 협업 가이드

##  프로젝트 구조 이해하기

```
admin/
├── src/
│   ├── app/                    # 페이지 파일들 (Next.js App Router)
│   │   ├── page.tsx           # 메인 대시보드 (/)
│   │   ├── layout.tsx         # 전체 레이아웃 (사이드바 + 헤더 포함)
│   │   ├── consumption/       # 소비 분석 관련 페이지
│   │   │   ├── page.tsx       # 소비 분석 메인
│   │   │   └── anomalies/     # 이상 거래 탐지 (서브 페이지)
│   │   ├── age-analysis/      # 연령대별 분석
│   │   └── summary/           # 분석 요약
│   │
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── Header.tsx         # 상단 헤더 (모든 페이지 공통)
│   │   ├── Sidebar.tsx        # 왼쪽 사이드바
│   │   └── ui/                # UI 컴포넌트 모음
│   │       ├── DashboardStatCard.tsx   # 통계 카드
│   │       ├── CategoryTable.tsx       # 카테고리 테이블
│   │       └── ...
│   │
│   └── types/                 # TypeScript 타입 정의
│       └── index.ts
│
└── package.json
```

---

##  역할 분담 가이드

### ‍ 프론트엔드 담당자
**당신이 해야 할 일**:
1. UI 컴포넌트 만들기
2. 페이지 레이아웃 구성
3. 차트/그래프 구현
4. Mock 데이터로 화면 완성

**건드리지 말아야 할 것**:
- 백엔드 API 연동 코드 (주석으로 표시된 부분)
- 데이터 fetching 로직

###  백엔드 연동 담당자
**당신이 해야 할 일**:
1. API 엔드포인트 연결
2. 데이터 fetching 함수 작성
3. 에러 처리 추가
4. 로딩 상태 관리

**참고할 주석 찾는 법**:
- 파일에서 `[왕초보 백엔드 연동 가이드]` 검색
- 주석 블록 `/* ... */` 안에 구현 예시 있음

---

##  새 페이지 추가하는 법

### 1단계: 페이지 파일 생성
```bash
# 예: "쿠폰 관리" 페이지 만들기
admin/src/app/coupons/page.tsx
```

### 2단계: 기본 코드 작성
```tsx
"use client";

export default function CouponsPage() {
    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">쿠폰 관리</h2>
                <p className="text-gray-500 mt-1">발급된 쿠폰을 관리합니다</p>
            </div>
            
            {/* 여기에 내용 추가 */}
        </div>
    );
}
```

### 3단계: 헤더에 제목 추가
`components/Header.tsx` 파일에서:

```tsx
const pageTitles = {
    // ... 기존 코드
    '/coupons': '쿠폰 관리',  //  이 줄 추가
};

const pageDescriptions = {
    // ... 기존 코드
    '/coupons': '발급된 쿠폰을 관리합니다',  //  이 줄 추가
};
```

### 4단계: 사이드바에 메뉴 추가
`components/Sidebar.tsx` 또는 `components/SidebarNew.tsx`에서:

```tsx
<Link href="/coupons">
    <Gift className="w-5 h-5" />
    쿠폰 관리
</Link>
```

---

##  백엔드 API 연동 예시

### 예시 1: 통계 데이터 가져오기

```tsx
"use client";
import { useState, useEffect } from 'react';

export default function Dashboard() {
    // 1. 상태 선언
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 2. 데이터 가져오기
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 백엔드 API 호출
                const response = await fetch('http://localhost:8000/api/v1/dashboard/stats');
                
                if (!response.ok) {
                    throw new Error('데이터를 불러올 수 없습니다');
                }
                
                const data = await response.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
                console.error('에러 발생:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStats();
    }, []); // 빈 배열 = 컴포넌트가 처음 렌더링될 때만 실행
    
    // 3. 로딩 중일 때
    if (loading) {
        return <div>로딩 중...</div>;
    }
    
    // 4. 에러 발생 시
    if (error) {
        return <div>에러: {error}</div>;
    }
    
    // 5. 정상적으로 데이터 표시
    return (
        <div>
            {stats.map((stat, index) => (
                <DashboardStatCard key={index} {...stat} />
            ))}
        </div>
    );
}
```

### 예시 2: POST 요청으로 데이터 전송

```tsx
const handleSubmit = async (formData) => {
    try {
        const response = await fetch('http://localhost:8000/api/v1/coupons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        alert('쿠폰이 발급되었습니다!');
    } catch (error) {
        console.error('쿠폰 발급 실패:', error);
        alert('쿠폰 발급에 실패했습니다.');
    }
};
```

---

##  TailwindCSS 클래스 자주 쓰는 것들

### 레이아웃
- `flex` - Flexbox 사용
- `grid` - Grid 사용
- `space-y-6` - 세로 간격 24px
- `gap-6` - 그리드 간격 24px

### 크기
- `w-full` - 너비 100%
- `h-64` - 높이 256px (16rem)
- `p-6` - 패딩 24px
- `px-4 py-2` - 가로 패딩 16px, 세로 패딩 8px

### 색상
- `bg-white` - 흰색 배경
- `text-gray-800` - 진한 회색 텍스트
- `border-gray-100` - 연한 회색 테두리

### 둥근 모서리
- `rounded-xl` - 매우 둥글게
- `rounded-lg` - 둥글게
- `rounded-full` - 완전 원형

### 그림자
- `shadow-sm` - 약한 그림자
- `shadow-lg` - 강한 그림자

---

##  자주 하는 실수와 해결법

### 실수 1: 컴포넌트가 화면에 안 나와요
**원인**: `export default` 빠뜨림
```tsx
//  잘못된 예
function MyComponent() {
    return <div>Hello</div>
}

//  올바른 예
export default function MyComponent() {
    return <div>Hello</div>
}
```

### 실수 2: "use client" 에러
**원인**: useState, useEffect 등을 쓸 때 필요
```tsx
//  파일 맨 위에 추가
"use client";

import { useState } from 'react';
```

### 실수 3: API 호출이 안 돼요
**체크리스트**:
- [ ] 백엔드 서버가 실행 중인가? (`http://localhost:8000`)
- [ ] CORS 설정이 되어있나?
- [ ] URL이 정확한가?
- [ ] 응답 형식이 JSON인가?

### 실수 4: TypeScript 에러
**원인**: props 타입이 안 맞음
```tsx
//  잘못된 예
<DashboardStatCard title={123} />  // title은 string이어야 함

//  올바른 예
<DashboardStatCard title="전체 사용자" />
```

---

##  팁과 트릭

### 1. 개발 서버 실행
```bash
cd admin
npm run dev
```
 `http://localhost:3000` 에서 확인

### 2. 빠른 디버깅
```tsx
console.log('데이터:', stats);  // 콘솔에 출력
console.table(tableData);        // 테이블 형태로 보기
```

### 3. 컴포넌트 재사용
```tsx
//  components/ui/ 폴더의 컴포넌트들은 그냥 import 해서 쓰세요
import { DashboardStatCard } from '@/components/ui/DashboardStatCard';
```

### 4. 아이콘 추가
```tsx
import { Heart, Star, Bell } from 'lucide-react';

<Heart className="w-5 h-5 text-red-500" />
```

---

##  도움이 필요할 때

### 1. 주석 읽어보기
- 모든 주요 컴포넌트에 상세한 주석이 있습니다
- `/* ... */` 또는 `//` 로 시작하는 설명을 찾아보세요

### 2. 기존 코드 참고하기
- `page.tsx` - 백엔드 연동 예시
- `DashboardStatCard.tsx` - 컴포넌트 만드는 법
- `Header.tsx` - 페이지 제목 설정하는 법

### 3. 에러 메시지 읽기
- 브라우저 콘솔 (F12) 확인
- 터미널 에러 메시지 확인

---

**이 가이드로도 해결이 안 되면 팀원에게 물어보세요! ‍**
