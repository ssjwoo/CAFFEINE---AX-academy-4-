 1. 브랜치 전략 (Git Flow 기반)
```
main         최종 배포용 브랜치
develop      팀 개발 통합 브랜치
feature/*    개인이 기능 개발하는 브랜치
hotfix/*     오류 긴급 수정할 때
```
 main 브랜치

배포 가능한 안정된 코드만 존재

PR을 통해서만 merge 가능
(직접 push 금지)

 develop 브랜치

모든 기능 개발(feature 브랜치)이 합쳐지는 공용 개발 브랜치

테스트 환경 구성용

 feature 브랜치

개인 기능 개발용 브랜치
예시:
```
feature/login
feature/user-dashboard
feature/admin-analysis
feature/llm-category
```

브랜치 생성:
```
git checkout -b feature/login develop
```
 hotfix 브랜치

main에서 즉시 수정해야 하는 버그를 고칠 때 사용

 2. PR(Pull Request) 규칙
 PR 목적

다른 팀원에게
“내 기능을 develop/main 브랜치에 merge 해도 될까요?”
라고 요청하는 절차.

 PR 생성 조건

기능 개발이 완료되었을 때

로컬에서 실행 테스트 성공했을 때

커밋 메시지가 명확할 때

 PR 생성 방법

feature 브랜치 작업 후 push

GitHub  Pull Request  New Pull Request

base = develop, compare = feature/* 선택

제목 및 설명 입력

팀원에게 코드 리뷰 요청

승인(Approve) 후 merge

 3. PR 작성 템플릿 (README에 포함 추천)

아래 내용을 GitHub PR Template으로 추가하면 팀원이 자동으로 보게 됨.
```
#  PR 내용

##  작업 내용
- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 리팩토링

### 상세내용
(수정한 상세 사항 작성)

---

##  테스트 방법
- [ ] 로컬에서 docker-compose up 동작 확인
- [ ] API 정상 호출 확인
- [ ] 프론트/백엔드 연동 테스트 완료

---

##  확인 요청
리뷰 부탁드립니다 
```
 4. 커밋 규칙
```
feat: 로그인 API 구현
fix: CORS 오류 해결
docs: README 업데이트
refactor: 폴더 구조 개선
style: 포맷팅 적용
chore: 설정 파일 수정
```
 5. 팀 공통 Git 사용 흐름
1) develop 최신 코드 받기
```
git checkout develop
git pull origin develop
```
2) feature 브랜치 생성
```
git checkout -b feature/login
```
3) 작업
```
git add .
git commit -m "feat: 로그인 API 구현"
git push origin feature/login
```
4) PR 생성 (develop에 merge 요청)
5) 팀원들이 리뷰 후 merge