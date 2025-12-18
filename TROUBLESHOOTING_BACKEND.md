# 🛠️ 백엔드 실행 트러블슈팅 로그 (2025-12-12)

이 문서는 로컬 개발 환경(Windows + Python 3.13)에서 백엔드 서버(`10_backend`) 실행 시 발생한 문제와 그 해결 과정을 기록합니다.

## 1. 개요
- **문제 상황**: `uvicorn` 명령어로 백엔드 실행 시 `SyntaxError` 발생 및 `pip install` 실패
- **환경**: Windows 11, Python 3.13.0
- **결과**: 정상 실행 완료

---

## 2. 발생한 문제 및 해결

### 🔴 Issue 1: `jose` 패키지로 인한 SyntaxError

#### 증상
서버 실행 시 다음과 같은 에러 발생:
```python
File "C:\...\site-packages\jose.py", line 546
    print decrypt(deserialize_compact(jwt), {'k':key},
    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
SyntaxError: Missing parentheses in call to 'print'. Did you mean print(...)?
```

#### 원인
- `requirements.txt`에 명시된 `python-jose` 대신, 이름이 유사한 **`jose`** 패키지가 설치됨.
- `jose` 패키지는 Python 2 시절의 아주 오래된 라이브러리로, Python 3에서는 `print` 문법 호환성 문제로 작동하지 않음.

#### 해결
- 충돌하는 `jose` 패키지 강제 삭제
- 올바른 패키지인 `python-jose` 확인
```powershell
pip uninstall jose
pip install python-jose
```

---

### 🔴 Issue 2: Python 3.13 호환성 및 빌드 에러

#### 증상
`pip install -r requirements.txt` 실행 시 설치 실패:
```
error: failed to install component: 'rust-std-x86_64-pc-windows-msvc'
...
Collecting pydantic==2.5.0
...
error: metadata-generation-failed
```

#### 원인
- 사용 중인 Python 버전이 **3.13** (최신 버전)임.
- 기존 `requirements.txt`에 고정된 버전(`pydantic==2.5.0` 등)들이 구버전이라 Python 3.13용 바이너리(Wheel)가 제공되지 않음.
- 이로 인해 `pip`가 소스 코드 컴파일을 시도했으나, 로컬에 Rust/C++ 빌드 도구가 없어 설치 실패.

#### 해결
- `requirements.txt`의 버전 제약 조건을 완화하여 Python 3.13을 지원하는 최신 버전을 설치하도록 변경.
- **주요 변경 사항**:
    - `fastapi`: `0.104.1` → `>=0.110.0`
    - `pydantic`: `2.5.0` → `>=2.9.0` (Python 3.13 공식 지원 버전)
    - `sqlalchemy`: `>=2.0.23` → `>=2.0.30`
    - 그 외 `numpy`, `pandas` 등도 최신 버전으로 업데이트 허용

---

## 3. 결론 및 권장 사항

1. **Python 버전 확인**: 팀 내 표준은 3.10.x이지만, 3.13을 사용할 경우 라이브러리 버전을 최신으로 유지해야 함.
2. **패키지 주의**: `jose` 와 `python-jose`는 다른 패키지이므로 혼동하지 않도록 주의.
3. **실행 방법**:
   ```powershell
   # 10_backend 폴더에서
   uvicorn app.main:app --reload
   ```
