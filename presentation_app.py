import streamlit as st

# 페이지 설정
st.set_page_config(
    page_title="Caffeine 프로젝트 - 3차 발표 (개인)",
    layout="wide"
)

# 보라색 테마 CSS 스타일
st.markdown("""
<style>
    .stApp {
        background-color: #FAFAFA;
    }
    .header-banner {
        background: linear-gradient(135deg, #6B21A8, #7C3AED, #8B5CF6);
        padding: 2.5rem 2rem;
        border-radius: 20px;
        margin: 1rem 0 2rem 0;
        text-align: center;
        color: white;
    }
    .header-title {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }
    .header-subtitle {
        font-size: 1.1rem;
        opacity: 0.9;
    }
    .tech-badge {
        display: inline-block;
        background: rgba(255,255,255,0.2);
        color: white;
        padding: 0.4rem 1rem;
        border-radius: 20px;
        margin: 0.3rem;
        font-size: 0.9rem;
        border: 1px solid rgba(255,255,255,0.3);
    }
    .section-header {
        background: linear-gradient(135deg, #6B21A8, #7C3AED);
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        font-size: 1.2rem;
        font-weight: 700;
        margin: 1rem 0 1rem 0;
    }
    .card-purple {
        background: white;
        border-left: 4px solid #7C3AED;
        padding: 1.2rem;
        margin: 0.8rem 0;
        border-radius: 0 8px 8px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .card-title {
        color: #6B21A8;
        font-weight: 700;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }
    .card-desc {
        color: #64748B;
        font-size: 0.9rem;
        line-height: 1.6;
    }
    .metric-box {
        background: linear-gradient(135deg, #F3E8FF, #EDE9FE);
        border: 2px solid #C4B5FD;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
    }
    .metric-label {
        color: #7C3AED;
        font-size: 0.9rem;
        margin-bottom: 0.3rem;
    }
    .metric-value {
        color: #6B21A8;
        font-size: 2.5rem;
        font-weight: 800;
    }
    .toc-header {
        background: linear-gradient(135deg, #6B21A8, #7C3AED);
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        font-size: 1.2rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }
    .badge-new {
        background: #EF4444;
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-left: 0.5rem;
    }
    .badge-fix {
        background: #F59E0B;
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-left: 0.5rem;
    }
    .badge-update {
        background: #3B82F6;
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 700;
        margin-left: 0.5rem;
    }
    .file-tag {
        background: #FEF3C7;
        color: #B45309;
        padding: 0.2rem 0.6rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    .file-tag-green {
        background: #D1FAE5;
        color: #047857;
    }
    .file-tag-blue {
        background: #DBEAFE;
        color: #1D4ED8;
    }
    .file-tag-purple {
        background: #EDE9FE;
        color: #6B21A8;
    }
    .commit-item {
        background: #F8FAFC;
        border-left: 3px solid #7C3AED;
        padding: 0.8rem 1rem;
        margin: 0.5rem 0;
        border-radius: 0 8px 8px 0;
        font-size: 0.9rem;
    }
    .commit-hash {
        color: #7C3AED;
        font-family: monospace;
        font-size: 0.85rem;
    }
    /* 탭 스타일 커스텀 */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background: white;
        padding: 0.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .stTabs [data-baseweb="tab"] {
        background: #F3E8FF;
        border-radius: 8px;
        color: #6B21A8;
        font-weight: 600;
        padding: 0.5rem 1rem;
    }
    .stTabs [aria-selected="true"] {
        background: linear-gradient(135deg, #6B21A8, #7C3AED) !important;
        color: white !important;
    }
</style>
""", unsafe_allow_html=True)

# 로고 이미지 표시
import base64
from pathlib import Path

def get_base64_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode()

logo_path = "/home/jj/proct/20_frontend_user/assets/images/caffeine_logo.png"
logo_base64 = get_base64_image(logo_path)

st.markdown(f"""
<div class="header-banner">
    <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 10px;">
        <img src="data:image/png;base64,{logo_base64}" style="width: 80px; height: 80px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
        <div>
            <div class="header-title">Caffeine - 3차 발표 (개인)</div>
        </div>
    </div>
    <div style="margin-top: 1.5rem;">
        <span class="tech-badge">React Native</span>
        <span class="tech-badge">Expo</span>
        <span class="tech-badge">FastAPI</span>
        <span class="tech-badge">PostgreSQL</span>
        <span class="tech-badge">OAuth2</span>
        <span class="tech-badge">Python</span>
        <span class="tech-badge">JavaScript</span>
    </div>
    <div style="margin-top: 1rem; font-size: 1.2rem; opacity: 1.0;">
        작업기간: 12/15 ~ 12/28 (2주) | 팀원: 전종인
    </div>
</div>
""", unsafe_allow_html=True)

# ==================== 발표 목차 (가로 탭) ====================
st.markdown('<div class="toc-header">발표 목차</div>', unsafe_allow_html=True)

# 탭 생성
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "1. 프로젝트 개요",
    "2. 인증 시스템",
    "3. UI/UX 개선",
    "4. 백엔드 연동",
    "5. 버그 수정",
    "6. 요약"
])

# ==================== 탭 1: 프로젝트 개요 ====================
with tab1:
    st.markdown('<div class="section-header">프로젝트 개요</div>', unsafe_allow_html=True)
    
    st.markdown("### Caffeine - AI 기반 스마트 소비 관리 앱")
    st.markdown("**12/15 이후 2주간 Frontend + Backend 연동 작업 수행**")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">인증 시스템</div>
            <div class="card-desc">
                • <b>카카오/구글 OAuth2 소셜 로그인 구현<br>
                • <b>아이디(이메일) 찾기 기능</b> - 이름 + 생년월일로 조회<br>
                • <b>비밀번호 재설정 기능</b> - 이메일 인증 코드 3단계 플로우<br>
                • <b>비밀번호 변경 기능</b> - 설정 화면에서 변경<br>
                • <b>회원탈퇴 기능</b> - 백엔드 연동<br>
                • <b>Redirect URI 동적 처리 (로컬/배포 환경 대응)
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">UI/UX 개선</div>
            <div class="card-desc">
                • <b>다크모드 수정 (쿠폰함, EmptyState, 설정화면 등)<br>
                • <b>생년월일 입력 기능</b> - 회원가입 시 저장<br>
                • <b>예산 초과 알림</b> - 월 목표 예산 설정<br>
                • <b>차트 스타일 통일 및 날짜 파싱 버그 수정<br>
                • <b>모바일 웹 로그인 스크롤 문제 해결
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">쿠폰 시스템</div>
            <div class="card-desc">
                • <b>쿠폰 자동 발급 기능 수정<br>
                • <b>쿠폰함 다크모드 대응<br>
                • <b>쿠폰 텍스트 노드 버그 수정
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">백엔드 연동</div>
            <div class="card-desc">
                • <b>Auth 라우터 모듈화 (kakao.py, google.py, password.py)<br>
                • <b>CORS 도메인 추가 (caffeineai.net)<br>
                • <b>거래 데이터 동기화 및 캐시 격리<br>
                • <b>DB 스키마 마이그레이션 (birth_date, budget_limit)
            </div>
        </div>
        """, unsafe_allow_html=True)

# ==================== 탭 2: 인증 시스템 ====================
with tab2:
    st.markdown('<div class="section-header">인증 시스템</div>', unsafe_allow_html=True)
    
    # 2-1. 소셜 로그인
    st.markdown("### 소셜 로그인 (카카오/구글 OAuth2)")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">AuthContext.js</span> <b>카카오/구글 로그인</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • <b>kakaoLogin()</b> - 카카오 인증 코드로 로그인<br>
                • <b>googleLogin()</b> - 구글 인증 코드로 로그인<br>
                • <b>kakaoSignup() / googleSignup()</b> - 소셜 회원가입<br>
                • Redirect URI 동적 생성 (window.location.origin)<br>
                • 로컬(localhost)과 배포(caffeineai.net) 자동 대응
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 카카오 로그인"):
            st.code("""
// AuthContext.js - 카카오 로그인
const kakaoLogin = async (code) => {
    try {
        // 현재 접속 환경에 맞는 redirect_uri 자동 생성
        const redirect_uri = typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/kakao/callback`
            : 'http://localhost:8081/auth/kakao/callback';

        const response = await fetch(`${API_BASE_URL}/auth/kakao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri }),
        });

        if (response.ok) {
            const data = await response.json();
            await AsyncStorage.setItem('accessToken', data.access_token);
            await AsyncStorage.setItem('userId', data.user_id.toString());
            setIsLoggedIn(true);
        }
    } catch (error) {
        console.error('카카오 로그인 오류:', error);
    }
};
            """, language="javascript")

    with col2:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-green">kakao.py / google.py</span> <b>Backend Auth 모듈화</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • 기존 auth.py → kakao.py, google.py, password.py 분리<br>
                • 클라이언트가 보낸 <b>redirect_uri 우선 사용</b><br>
                • 환경변수 fallback 처리<br>
                • birth_date 응답 필드 추가
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - Backend"):
            st.code("""
# kakao.py - FastAPI
class KakaoLoginRequest(BaseModel):
    code: str
    redirect_uri: str | None = None

@router.post("/kakao")
async def kakao_login(payload: KakaoLoginRequest, db: DB_Dependency):
    redirect_uri = payload.redirect_uri or KAKAO_REDIRECT_URI
    token_data = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_REST_API_KEY,
        "redirect_uri": redirect_uri,
        "code": payload.code,
    }
            """, language="python")

    st.markdown("---")
    
    # 2-2. 아이디 찾기
    st.markdown("### 아이디(이메일) 찾기")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">FindEmailScreen.js</span> <b>아이디 찾기 화면</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • 이름 + 생년월일로 이메일 조회<br>
                • 생년월일 자동 포맷팅 (YYYY-MM-DD)<br>
                • 조회 결과 마스킹 처리 (ex: t***@gmail.com)<br>
                • 다크모드 완벽 대응
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 생년월일 포맷팅"):
            st.code("""
// FindEmailScreen.js - 생년월일 자동 포맷팅
const formatBirthDate = (text) => {
    const cleaned = text.replace(/\\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 5 && cleaned.length < 7) {
        formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    } else if (cleaned.length >= 7) {
        formatted = cleaned.slice(0, 4) + '-' + 
                    cleaned.slice(4, 6) + '-' + 
                    cleaned.slice(6, 8);
    }
    
    return formatted;  // ex) "19990101" → "1999-01-01"
};

// 이메일 찾기 API 호출
const handleFindEmail = async () => {
    const response = await apiClient.post('/auth/find-email', {
        name: name,
        birth_date: birthDate
    });
    setResult(response.data.email);  // 마스킹된 이메일
};
            """, language="javascript")

    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">아이디 찾기 플로우</div>
            <div class="card-desc">
                <b>1. 이름 입력</b><br>
                &nbsp;&nbsp;→ 가입 시 입력한 이름<br><br>
                <b>2. 생년월일 입력</b><br>
                &nbsp;&nbsp;→ YYYY-MM-DD 형식 자동 변환<br>
                &nbsp;&nbsp;→ 숫자만 입력해도 자동 포맷팅<br><br>
                <b>3. 이메일 조회</b><br>
                &nbsp;&nbsp;→ 일치하는 계정 검색<br>
                &nbsp;&nbsp;→ 결과 마스킹 처리 (개인정보 보호)
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 2-3. 비밀번호 재설정
    st.markdown("### 비밀번호 재설정 (이메일 인증)")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">ResetPasswordScreen.js</span> <b>비밀번호 재설정</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • <b>3단계 인증 플로우</b>:<br>
                &nbsp;&nbsp;1️⃣ 이메일 입력 → 인증 코드 발송<br>
                &nbsp;&nbsp;2️⃣ 6자리 인증 코드 확인<br>
                &nbsp;&nbsp;3️⃣ 새 비밀번호 설정<br>
                • 단계별 진행 상태 표시 (Progress Bar)<br>
                • 인증 코드 재발송 기능<br>
                • 비밀번호 유효성 검사 (8자 이상)
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 3단계 플로우"):
            st.code("""
// ResetPasswordScreen.js - 3단계 비밀번호 재설정
const [step, setStep] = useState(1);

// 1단계: 인증 코드 발송
const handleRequestCode = async () => {
    await apiClient.post('/auth/request-password-reset', { email });
    Alert.alert('발송 완료', '인증 코드가 이메일로 발송되었습니다.');
    setStep(2);
};

// 2단계: 인증 코드 확인
const handleVerifyCode = async () => {
    await apiClient.post('/auth/verify-reset-code', { email, code });
    setStep(3);
};

// 3단계: 비밀번호 변경
const handleResetPassword = async () => {
    await apiClient.post('/auth/reset-password', { 
        email, code, new_password: newPassword 
    });
    alert('비밀번호가 성공적으로 변경되었습니다!');
    navigation.navigate('Login');
};
            """, language="javascript")

    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">비밀번호 재설정 플로우</div>
            <div class="card-desc">
                <b>1️⃣ 이메일 입력 단계</b><br>
                • 가입 시 사용한 이메일 입력<br>
                • 이메일 형식 유효성 검사<br>
                • 인증 코드 발송 API 호출<br><br>
                <b>2️⃣ 인증 코드 확인 단계</b><br>
                • 6자리 인증 코드 입력<br>
                • 코드 재발송 버튼<br>
                • 코드 확인 API 호출<br><br>
                <b>3️⃣ 새 비밀번호 설정 단계</b><br>
                • 새 비밀번호 입력 (8자 이상)<br>
                • 비밀번호 확인 입력<br>
                • 비밀번호 일치 여부 실시간 검증
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">UI 특징</div>
            <div class="card-desc">
                • 단계별 아이콘 (mail → shield → lock)<br>
                • 진행 상태 표시 (Progress Dots)<br>
                • 뒤로가기 시 이전 단계로 이동<br>
                • LinearGradient 배경 + 카드 스타일<br>
                • 다크모드 완벽 대응
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    
    # 2-4. 비밀번호 변경
    st.markdown("### 비밀번호 변경 (로그인 후)")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">PasswordChangeScreen.js</span> <b>비밀번호 변경</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • 설정 화면에서 접근<br>
                • 현재 비밀번호 확인<br>
                • 새 비밀번호 + 확인 입력<br>
                • 비밀번호 표시/숨김 토글
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-green">password.py</span> <b>Backend 비밀번호 관리</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • POST /auth/password/change<br>
                • POST /auth/request-password-reset<br>
                • POST /auth/verify-reset-code<br>
                • POST /auth/reset-password
            </div>
        </div>
        """, unsafe_allow_html=True)

# ==================== 탭 3: UI/UX 개선 ====================
with tab3:
    st.markdown('<div class="section-header">UI/UX 개선</div>', unsafe_allow_html=True)
    
    # 3-1. 다크모드
    st.markdown("### 다크모드 수정")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag">CouponScreen.js</span> <b>쿠폰함 다크모드</b>
            <div class="card-desc">
                • 선택된 쿠폰 카드 배경색 동적 적용<br>
                • <code>colors.cardBackground</code> 사용
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag">EmptyState.js</span> <b>빈 화면 다크모드</b>
            <div class="card-desc">
                • LinearGradient 테마 색상 적용<br>
                • 아이콘, 텍스트 색상 동적 변경
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag">MoreScreen.js</span> <b>더보기 화면</b>
            <div class="card-desc">
                • 예산 입력 섹션과 고객센터 시각적 분리<br>
                • <code>budgetInlineSection</code> 스타일 분리
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-blue">SettingsScreen.js</span> <b>설정 화면</b> <span class="badge-update">UPDATE</span>
            <div class="card-desc">
                • Feather 아이콘 추가<br>
                • 앱설정 정보 섹션 신규 추가<br>
                • 비밀번호 변경 메뉴 연결
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-blue">LoginScreen.js</span> <b>로그인 화면</b>
            <div class="card-desc">
                • 모바일 웹 스크롤 안되는 문제 해결<br>
                • ScrollView 추가 및 flex 스타일 수정
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-blue">AnalysisScreen.js</span> <b>월별 차트</b>
            <div class="card-desc">
                • 날짜 파싱 오류 수정<br>
                • 차트 스타일 설정 통일
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    
    # 3-2. 생년월일 기능
    st.markdown("### 생년월일 입력 기능")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">SignupScreen.js</span> <b>회원가입 시 생년월일 입력</b>
            <div class="card-desc">
                • 회원가입 시 생년월일 입력 필드 추가<br>
                • YYYY-MM-DD 형식 자동 포맷팅<br>
                • 숫자만 입력해도 하이픈 자동 삽입<br>
                • DB에 birth_date 저장 → 아이디 찾기 시 활용<br>
                • 사용자 연령대 구분
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 3-3. 쿠폰 시스템
    st.markdown("### 쿠폰 자동 발급")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag">CouponScreen.js</span> <b>쿠폰함 수정</b>
            <div class="card-desc">
                • 쿠폰 자동 발급 로직 수정<br>
                • 텍스트 노드 버그 수정<br>
                • 다크모드 선택 쿠폰 배경색 수정<br>
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-green">coupons.py</span> <b>쿠폰 API</b> <span class="badge-update">UPDATE</span>
            <div class="card-desc">
                • 쿠폰 발급 조건 수정<br>
                • 사용자별 쿠폰 조회<br>
                • 만료일 관리
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with st.expander("▼ 코드 보기 - 쿠폰 다크모드"):
        st.code("""
// CouponScreen.js - 다크모드 적용
const { colors } = useTheme();

<TouchableOpacity
    style={[
        styles.couponCard,
        { 
            backgroundColor: isSelected 
                ? colors.cardBackground  // 다크모드 대응
                : '#FFFFFF'
        }
    ]}
    onPress={() => handleCouponSelect(coupon)}
>
    <Text style={[styles.couponTitle, { color: colors.text }]}>
        {coupon.title}
    </Text>
</TouchableOpacity>
        """, language="javascript")

    st.markdown("---")
    
    # 3-4. 예산 초과 알림
    st.markdown("### 예산 초과 알림 (월 목표 예산)")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">MoreScreen.js</span> <b>예산 알림 기능</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • <b>예산 초과 알림 토글</b> - Switch 컴포넌트<br>
                • <b>월 목표 예산 입력</b> - 숫자 자동 포맷팅 (1,000,000)<br>
                • <b>예산 저장 버튼</b> - 백엔드 API 연동<br>
                • <b>예산 초기화 버튼</b> - 설정 리셋<br>
                • 예산 80% 도달 시 알림 표시
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 예산 저장"):
            st.code("""
// MoreScreen.js - 예산 저장 (백엔드 연동)
const handleSaveBudget = async () => {
    try {
        const { updateUserProfile } = await import('../api/users');
        await updateUserProfile({
            budget_alert_enabled: budgetAlertEnabled,
            budget_limit: parseInt(monthlyBudget) || 0
        });
        alert(`예산이 저장되었습니다!
월 예산: ${Number(monthlyBudget).toLocaleString()}원`);
    } catch (error) {
        console.error('예산 저장 실패:', error);
        alert('예산 저장에 실패했습니다.');
    }
};

// 예산 초기화
const handleResetBudget = async () => {
    await updateUserProfile({
        budget_alert_enabled: false,
        budget_limit: 0
    });
    setMonthlyBudget('0');
    setBudgetAlertEnabled(false);
};
            """, language="javascript")

    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">예산 알림 플로우</div>
            <div class="card-desc">
                <b>1. 알림 토글 ON</b><br>
                &nbsp;&nbsp;→ 예산 입력 UI 표시<br><br>
                <b>2. 월 목표 예산 입력</b><br>
                &nbsp;&nbsp;→ 숫자만 입력, 천 단위 콤마 자동<br><br>
                <b>3. 저장 버튼 클릭</b><br>
                &nbsp;&nbsp;→ 백엔드 API 호출 (updateUserProfile)<br><br>
                <b>4. 예산 80% 도달 시</b><br>
                &nbsp;&nbsp;→ 푸시 알림 발송
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-green">user.py</span> <b>Backend 예산 저장</b> <span class="badge-update">UPDATE</span>
            <div class="card-desc">
                • budget_alert_enabled 필드 추가<br>
                • budget_limit 필드 추가<br>
                • updateUserProfile API에서 처리
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 3-5. 회원탈퇴
    st.markdown("### 회원탈퇴 기능")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">ProfileScreen.js</span> <b>회원탈퇴</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • 프로필 화면에서 회원탈퇴 버튼<br>
                • <b>경고 확인 다이얼로그</b> 표시<br>
                • ⚠️ "모든 데이터가 영구적으로 삭제됩니다" 안내<br>
                • 탈퇴 후 자동 로그아웃 처리
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 회원탈퇴"):
            st.code("""
// ProfileScreen.js - 회원탈퇴 (백엔드 연동)
const handleDeleteAccount = async () => {
    if (!confirm('정말 회원탈퇴를 진행하시겠습니까?\\n\\n' +
                 '⚠️ 모든 데이터가 영구적으로 삭제됩니다.')) {
        return;
    }

    try {
        // 백엔드 API 호출
        await apiClient.delete('/users/me');
        
        await logout();
        
        alert('회원탈퇴가 완료되었습니다.\\n' +
              '이용해 주셔서 감사합니다.');
    } catch (error) {
        console.error('회원탈퇴 실패:', error);
        alert('회원탈퇴 중 오류가 발생했습니다.');
    }
};
            """, language="javascript")

    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">회원탈퇴 플로우</div>
            <div class="card-desc">
                <b>1. 프로필 화면 → 회원탈퇴 버튼</b><br><br>
                <b>2. 경고 확인 다이얼로그</b><br>
                &nbsp;&nbsp;→ "모든 데이터 영구 삭제" 경고<br><br>
                <b>3. 확인 시 DELETE /users/me 호출</b><br>
                &nbsp;&nbsp;→ 백엔드에서 사용자 데이터 삭제<br><br>
                <b>4. 자동 로그아웃 및 안내 메시지</b>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-green">user.py</span> <b>Backend 회원탈퇴</b> <span class="badge-new">NEW</span>
            <div class="card-desc">
                • DELETE /users/me 엔드포인트<br>
                • 사용자 데이터 영구 삭제<br>
                • 관련 거래내역, 설정 모두 삭제
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    
    # 3-6. 데이터 초기화
    st.markdown("### 거래 데이터 초기화")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <span class="file-tag file-tag-purple">ProfileScreen.js</span> <b>데이터 초기화</b>
            <div class="card-desc">
                • 프로필 화면에서 거래 데이터 초기화<br>
                • 확인 다이얼로그로 실수 방지<br>
                • AsyncStorage 캐시 삭제<br>
                • 초기화 후 대시보드로 자동 이동
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">데이터 초기화 플로우</div>
            <div class="card-desc">
                <b>1. 프로필 화면 → 거래 데이터 초기화</b><br><br>
                <b>2. 확인 다이얼로그</b><br>
                &nbsp;&nbsp;→ "정말 삭제하시겠습니까?"<br><br>
                <b>3. AsyncStorage 캐시 삭제</b><br>
                &nbsp;&nbsp;→ transactions_cache 삭제<br><br>
                <b>4. 대시보드로 이동</b>
            </div>
        </div>
        """, unsafe_allow_html=True)

# ==================== 탭 4: 백엔드 연동 ====================
with tab4:
    st.markdown('<div class="section-header"> 백엔드 연동</div>', unsafe_allow_html=True)
    
    st.markdown("### Auth 라우터 모듈화")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">📁 기존 구조</div>
            <div class="card-desc">
                <code>app/routers/auth.py</code> (단일 파일)<br>
                • 모든 인증 관련 로직이 한 파일에 집중<br>
                • 카카오, 구글, 비밀번호 로직 혼재<br>
                • 유지보수 어려움
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">📁 변경된 구조</div>
            <div class="card-desc">
                <code>app/routers/auth/</code> (디렉토리)<br>
                ├── <code>__init__.py</code><br>
                ├── <code>kakao.py</code> (347줄)<br>
                ├── <code>google.py</code> (255줄)<br>
                └── <code>password.py</code> (369줄)
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### CORS 설정")
    
    st.code("""
# main.py - CORS 도메인 추가
origins = [
    "http://localhost:8081",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://caffeineai.net",         # 사용자 앱
    "https://admin.caffeineai.net",   # 관리자 앱
    "https://api.caffeineai.net",     # API 서버
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    """, language="python")
    
    st.markdown("---")
    st.markdown("### 사용자 API (user.py)")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">회원탈퇴 API</div>
            <div class="card-desc">
                • <b>DELETE /users/me</b> 엔드포인트<br>
                • 사용자 + 관련 데이터 영구 삭제<br>
                • JWT 토큰으로 사용자 인증
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 회원탈퇴 API"):
            st.code("""
# user.py - 회원탈퇴 엔드포인트
@router.delete("/users/me")
async def delete_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 관련 데이터 삭제
    db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).delete()
    
    # 사용자 삭제
    db.delete(current_user)
    db.commit()
    
    return {"message": "회원탈퇴가 완료되었습니다"}
            """, language="python")
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">예산 알림 설정 API</div>
            <div class="card-desc">
                • <b>PUT /users/me</b> 프로필 수정<br>
                • budget_alert_enabled (토글)<br>
                • budget_limit (월 목표 예산)
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">사용자 정보 수정 API</div>
            <div class="card-desc">
                • <b>PUT /users/me</b> 프로필 업데이트<br>
                • birth_date 필드 저장<br>
                • name, email 수정 가능
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 프로필 수정"):
            st.code("""
# user.py - 프로필 수정
@router.put("/users/me")
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.birth_date:
        current_user.birth_date = user_update.birth_date
    if user_update.budget_limit is not None:
        current_user.budget_limit = user_update.budget_limit
    if user_update.budget_alert_enabled is not None:
        current_user.budget_alert_enabled = user_update.budget_alert_enabled
    
    db.commit()
    return current_user
            """, language="python")
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">사용자 조회 API</div>
            <div class="card-desc">
                • <b>GET /users/me</b> 내 정보<br>
                • birth_date, budget_limit 포함<br>
                • budget_alert_enabled 포함
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("### 쿠폰 API (coupons.py)")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">쿠폰 자동 발급</div>
            <div class="card-desc">
                • 신규 가입 시 웰컴 쿠폰 발급<br>
                • 발급 조건 체크 로직 수정<br>
                • 중복 발급 방지
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">쿠폰 조회/사용</div>
            <div class="card-desc">
                • <b>GET /coupons</b> 내 쿠폰 목록<br>
                • <b>POST /coupons/{id}/use</b> 쿠폰 사용<br>
                • 만료일 체크
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("### DB 스키마 마이그레이션")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">User 모델 필드 추가</div>
            <div class="card-desc">
                • <b>birth_date</b>: Date (생년월일)<br>
                • <b>budget_limit</b>: Integer (월 예산)<br>
                • <b>budget_alert_enabled</b>: Boolean
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - User 모델"):
            st.code("""
# db/model/user.py
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    birth_date = Column(Date, nullable=True)  # 추가
    budget_limit = Column(Integer, default=0)  # 추가
    budget_alert_enabled = Column(Boolean, default=False)  # 추가
            """, language="python")
        
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">마이그레이션 스크립트</div>
            <div class="card-desc">
                • <code>migrations/add_birth_date.py</code><br>
                • ALTER TABLE users ADD COLUMN<br>
                • 기존 데이터 영향 없음
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("▼ 코드 보기 - 마이그레이션"):
            st.code("""
# migrations/add_birth_date.py
def upgrade(engine):
    with engine.connect() as conn:
        # birth_date 컬럼 추가
        conn.execute(text('''
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS birth_date DATE
        '''))
        
        # budget 관련 컬럼 추가
        conn.execute(text('''
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS budget_limit INTEGER DEFAULT 0
        '''))
        conn.execute(text('''
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS budget_alert_enabled BOOLEAN DEFAULT FALSE
        '''))
        conn.commit()
            """, language="python")
    
    st.markdown("---")
    st.markdown("### 기타 백엔드 연동")
    
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">거래 데이터 동기화</div>
            <div class="card-desc">
                • CSV 파일 업로드 → DB 동기화<br>
                • user_id 필터링으로 데이터 격리<br>
                • 거래내역 시간순 정렬
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">로그아웃 개선</div>
            <div class="card-desc">
                • 로그아웃 시 페이지 새로고침<br>
                • AsyncStorage 토큰 삭제<br>
                • 사용자별 데이터 격리
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">API 라우터 정리</div>
            <div class="card-desc">
                • /api/api/... 중복 경로 해결<br>
                • 라우터별 prefix 통일<br>
                • 404 에러 해결
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">이메일 서비스</div>
            <div class="card-desc">
                • 비밀번호 재설정 이메일 발송<br>
                • 인증 코드 생성 및 검증<br>
                • email_service.py 연동
            </div>
        </div>
        """, unsafe_allow_html=True)


# ==================== 탭 5: 버그 수정 ====================
with tab5:
    st.markdown('<div class="section-header"> 버그 수정</div>', unsafe_allow_html=True)
    
    st.markdown("### 해결한 버그 목록 (9건)")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">소셜 로그인 Redirect URI mismatch</div>
            <div class="card-desc">
                <b>증상:</b> 배포 환경에서 카카오/구글 로그인 시 에러<br>
                <b>원인:</b> 백엔드가 localhost URI 하드코딩<br>
                <b>해결:</b> 동적 URI 생성, 클라이언트 URI 우선 사용
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">회원가입 생년월일 저장 실패</div>
            <div class="card-desc">
                <b>증상:</b> 회원가입 시 생년월일 저장 안됨<br>
                <b>원인:</b> DB 스키마에 birth_date 컬럼 누락<br>
                <b>해결:</b> 마이그레이션으로 컬럼 추가
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">월별 지출 그래프 날짜 파싱 오류</div>
            <div class="card-desc">
                <b>증상:</b> 월별 차트가 깨지거나 미표시<br>
                <b>원인:</b> 날짜 형식 불일치 (YYYYMMDD vs YYYY-MM-DD)<br>
                <b>해결:</b> parseTransactionDate() 함수로 대응
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">API 경로 prefix 중복</div>
            <div class="card-desc">
                <b>증상:</b> API 호출 시 404 에러 (/api/api/...)<br>
                <b>원인:</b> baseURL과 라우터 prefix 중복<br>
                <b>해결:</b> 라우터 prefix 통일 및 정리
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title"> 다크모드 미적용 화면</div>
            <div class="card-desc">
                <b>증상:</b> 쿠폰함, EmptyState 다크모드 미적용<br>
                <b>원인:</b> 컴포넌트 내 색상 하드코딩<br>
                <b>해결:</b> useTheme 훅으로 동적 적용
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">구글 로그인 birth_date 누락</div>
            <div class="card-desc">
                <b>증상:</b> 구글 로그인 시 생년월일 미포함<br>
                <b>원인:</b> google.py 응답에 필드 누락<br>
                <b>해결:</b> 응답에 birth_date 필드 추가
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">쿠폰 자동 발급 / 텍스트 노드 버그</div>
            <div class="card-desc">
                <b>증상:</b> 쿠폰 발급 안됨, 텍스트 노드 에러<br>
                <b>원인:</b> 발급 조건 로직 오류, JSX 처리<br>
                <b>해결:</b> 쿠폰 발급 로직 및 텍스트 노드 수정
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">모바일 웹 로그인 스크롤 불가</div>
            <div class="card-desc">
                <b>증상:</b> 모바일 웹에서 로그인 화면 스크롤 안됨<br>
                <b>원인:</b> LoginScreen에 ScrollView 미적용<br>
                <b>해결:</b> ScrollView 추가 및 flex 스타일 수정
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">챗봇 자동시작 버그</div>
            <div class="card-desc">
                <b>증상:</b> 대시보드에서 챗봇 열기 클릭 시 자동시작 안됨<br>
                <b>원인:</b> route.params 전달 및 useEffect 의존성<br>
                <b>해결:</b> openChat 파라미터 처리 로직 수정
            </div>
        </div>
        """, unsafe_allow_html=True)

# ==================== 탭 6: 요약 ====================
with tab6:
    st.markdown('<div class="section-header">요약</div>', unsafe_allow_html=True)
    
    # 핵심 성과 수치
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown("""
        <div class="metric-box">
            <div class="metric-label">수정 파일</div>
            <div class="metric-value">30+</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        st.markdown("""
        <div class="metric-box">
            <div class="metric-label">코드 라인</div>
            <div class="metric-value">2500+</div>
        </div>
        """, unsafe_allow_html=True)
    with col3:
        st.markdown("""
        <div class="metric-box">
            <div class="metric-label">버그 해결</div>
            <div class="metric-value">9건</div>
        </div>
        """, unsafe_allow_html=True)
    with col4:
        st.markdown("""
        <div class="metric-box">
            <div class="metric-label">신규 기능</div>
            <div class="metric-value">10+</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 주요 성과
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">주요 신규 개발</div>
            <div class="card-desc">
                • 카카오/구글 OAuth2 소셜 로그인<br>
                • 아이디(이메일) 찾기 화면<br>
                • 비밀번호 재설정 (3단계 플로우)<br>
                • 비밀번호 변경 화면<br>
                • 회원탈퇴 기능<br>
                • 예산 초과 알림 설정
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">주요 수정 파일 (Frontend)</div>
            <div class="card-desc">
                • FindEmailScreen.js (362줄)<br>
                • ResetPasswordScreen.js (603줄)<br>
                • PasswordChangeScreen.js (264줄)<br>
                • AuthContext.js (103줄)<br>
                • MoreScreen.js (243줄)<br>
                • ProfileScreen.js (81줄)
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">주요 버그 수정</div>
            <div class="card-desc">
                • 소셜 로그인 Redirect URI 오류<br>
                • 회원가입 생년월일 저장 실패<br>
                • 월별 차트 날짜 파싱 오류<br>
                • 다크모드 미적용 화면<br>
                • 쿠폰 자동 발급 오류<br>
                • 모바일 웹 스크롤 불가
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class="card-purple">
            <div class="card-title">주요 수정 파일 (Backend)</div>
            <div class="card-desc">
                • auth/kakao.py (347줄)<br>
                • auth/google.py (255줄)<br>
                • auth/password.py (369줄)<br>
                • user.py (57줄)<br>
                • coupons.py (수정)<br>
                • db/schema/user.py (17줄)
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown('<div class="section-header">느낀 점</div>', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        st.success("""
        **기술적 성장**
        - OAuth2 인증 흐름에 대한 깊은 이해
        - 이메일 인증 플로우 설계 및 구현
        - 로컬 vs 배포 환경 차이 대응 경험
        - Frontend + Backend 풀스택 연동 능력 향상
        """)
    with col2:
        st.info("""
        **문제 해결 능력**
        - 에러 메시지 분석 및 디버깅 역량
        - Git 브랜치 전략 및 충돌 해결 경험
        - 팀 협업 및 코드 머지 경험
        - DB 스키마 마이그레이션 경험
        """)

    st.markdown("---")
    st.markdown("### 🔗 GitHub")
    st.info("**https://github.com/HosikYOON/caffeine**")

st.markdown("---")
