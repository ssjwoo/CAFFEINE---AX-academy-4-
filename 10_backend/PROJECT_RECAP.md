# 프로젝트 작업 내역 보고서 (Caffeine 리포트 시스템 고도화)

본 문서는 프로젝트 클론 이후 진행된 주요 코드 변경 사항과 기능 구현 내역을 상세히 기록합니다.

## 1. 개요
이메일 리포트의 가독성 문제를 해결하기 위해 **전문적인 PDF 리포트 생성 및 첨부 시스템**을 구축하고, AI 분석의 품질을 **Fact-Based 비즈니스 인사이트** 수준으로 고도화했습니다.

---

## 2. 주요 변경 사항 및 파일별 내역

### 🛠️ 환경 및 기반 설정
- **[MODIFY] [settings.py](file:///c:/final%20project/caffeine/10_backend/app/core/settings.py)**
  - **내용**: 백엔드 서버가 프로젝트 루트의 `.env.local` 파일을 인식하지 못해 API Key 및 SMTP 설정이 누락되던 문제 수정.
  - **조치**: `python-dotenv`를 사용하여 루트 경로의 `.env.local`과 백엔드 폴더의 `.env`를 명시적으로 로드하도록 로직 보완.
- **[MODIFY] [requirements.txt](file:///c:/final%20project/caffeine/10_backend/requirements.txt)**
  - **내용**: PDF 생성을 위한 핵심 라이브러리 의존성 추가.
  - **조치**: `reportlab`, `svglib` 라이브러리 명시.

### 📧 이메일 & PDF 리포트 엔진 개발
- **[MODIFY] [report_service.py](file:///c:/final%20project/caffeine/10_backend/app/services/report_service.py)**
  - **내용**: 본문 HTML 방식의 한계를 극복하기 위해 PDF 생성 로직 전면 도입.
  - **조치**: 
    - `reportlab` 기반의 PDF 레이아웃 설계 (한글 폰트 지원).
    - 핵심 지표 요약 및 상위 카테고리 표(Table) 구현 (가운데 정렬, 색상 지표 적용).
    - `LayoutError` 방지를 위한 가변적 문단 렌더링 시스템 구축.
    - AI 분석 텍스트 파서 개발 (계층형 리스트, 볼드체 자동 적용).
- **[MODIFY] [email_service.py](file:///c:/final%20project/caffeine/10_backend/app/services/email_service.py)**
  - **내용**: PDF 파일을 이메일에 첨부할 수 있도록 기능 확장.
  - **조치**: `MIMEMultipart` 형식을 사용하여 PDF 파일을 바이너리로 인코딩 후 자동 첨부되도록 구현.
- **[MODIFY] [reports.py (Router)](file:///c:/final%20project/caffeine/10_backend/app/routers/reports.py)**
  - **내용**: 리포트 요청 시 PDF 생성 - 이메일 발송 - 임시 파일 삭제 프로세스 통합.
  - **조치**: 원클릭으로 PDF가 포함된 리포트가 발송되도록 엔드포인트 수정.

### � 리포트 고도화 핵심 요소 (New)
- **AI 헤드라인 (Headline)**: 데이터 내 핵심 이슈를 포착하여 최상단에 1줄 요약 배치 (파싱 로직 구현).
- **지출 하이라이트 카드**: 기간 내 최대 지출 내역(상호명, 금액, 카테고리)을 시각적 카드로 최신 스타일링.
- **데이터 시각화 (Graph)**: 상위 5개 카테고리의 지출액을 도넛형 파이 차트로 시각화하여 정보 전달력 극대화.
- **마케팅 전략 실행 방안**: 데이터 기반의 구체적인 **실행 전략** 및 **핵심 과제** 도출 및 스타일링.

---

## 3. 기술적 특징 (Key Features)

| 항목 | 구현 내용 | 비고 |
|:---:|:--- |:---:|
| **PDF 렌더링** | 맑은 고딕 한글 폰트 완벽 지원 및 레이아웃 최적화 | ReportLab |
| **디자인** | 지표별 조건부 컬러(Red/Green), Divider, Header 스타일링 | Premium UI |
| **데이터 정확도** | 1위 기준 비중이 아닌 전체 데이터 대비 실제 비중 계산 로직 | Logic Fix |
| **AIInsight** | 구조화된 문단 정렬(Indent) 및 핵심 키워드 강조 컬러링 | 용어 정제 완료 |

---

## 4. 향후 유지보수 가이드
- **폰트**: 윈도우 환경(`malgun.ttf`) 기반으로 설정되어 있으므로, 리눅스 서버 배포 시 경로 및 폰트 파일 포함 여부 확인이 필요합니다.
- **API**: 현재 Gemini 2.0 Flash 모델을 사용 중이며, 분석 깊이를 조절하려면 `ai_service.py`의 프롬프트를 수정하면 됩니다.

---
**작업 관리자**: Antigravity AI
**마지막 업데이트**: 2025-12-31 00:07 (KST)
