# Docker Compose 환경 설정 가이드

## 🚀 빠른 시작

### 1. 코드 받기
```bash
git clone <repository-url>
cd caffeine
```

### 2. 환경변수 설정 (선택)
필요한 경우 `.env` 파일 생성 또는 수정

### 3. Docker 실행
```bash
# 빌드 및 실행
docker-compose up --build

# 백그라운드 실행
docker-compose up -d --build
```

### 4. 접속
- **프론트엔드**: http://localhost:3001
- **백엔드 API**: http://localhost:8001
- **Nginx**: http://localhost:80

---

## 🔑 로그인 정보

### 관리자 계정
- **이메일**: admin@caffeine.com
- **비밀번호**: secret

### ⚠️ 중요: AWS RDS 사용 시
처음 실행 시 admin 계정의 비밀번호 해시를 업데이트해야 합니다:

```sql
UPDATE users
SET password_hash = '$2b$12$kA.D8/8ZLXsGwbLDcIteTO/pLH5dwUnOjuQYuluk5qt/ahpGI1LSW'
WHERE email = 'admin@caffeine.com';
```

---

## 🔧 문제 해결

### 컨테이너가 시작되지 않을 때
```bash
# 컨테이너 정리
docker-compose down

# 이미지까지 삭제하고 재빌드
docker-compose down --rmi all
docker-compose up --build
```

### 로그 확인
```bash
# 모든 컨테이너 로그
docker-compose logs

# 특정 컨테이너 로그
docker logs caf_backend
docker logs caf_nginx
docker logs caf_front_admin
```

### CORS 에러 발생 시
- 브라우저 시크릿 모드에서 테스트
- 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
- 페이지 하드 리프레시 (Ctrl+Shift+R)

---

## 📋 서비스 목록

| 서비스 | 포트 | 설명 |
|--------|------|------|
| backend | 8001 | FastAPI 백엔드 |
| admin_front | 3001 | Next.js 관리자 프론트엔드 |
| nginx | 80 | 리버스 프록시 |
| llm_analysis | 9102 | LLM 분석 서비스 |

---

## 🔄 업데이트 받기

```bash
# 최신 코드 가져오기
git pull origin main

# 컨테이너 재시작
docker-compose down
docker-compose up --build
```

---

## 💡 팁

1. **개발 환경**: 로컬에서 개발 시 각 서비스를 개별적으로 실행 가능
2. **프로덕션**: `docker-compose.prod.yml` 사용 (별도 설정 필요)
3. **로그 모니터링**: `docker-compose logs -f` 명령으로 실시간 로그 확인

---

## 📞 문제가 있나요?

- 이슈 트래커: [GitHub Issues](repository-url/issues)
- 문서: [상세 분석 리포트](file:///C:/Users/hi/.gemini/antigravity/brain/a0ea445d-49fa-4524-894e-8907c449d38c/login_failure_detailed_analysis.md)
