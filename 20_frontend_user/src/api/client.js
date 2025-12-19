import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_BASE_URL = "http://localhost:8001";  // 로컬 개발 (Docker backend port)
const PROD_BASE_URL = "https://d26uyg5darllja.cloudfront.net/api";

// 환경 판별: 웹에서 localhost면 로컬, 그 외(앱 포함)는 프로덕션
const isLocal = 
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  window.location?.hostname?.includes("localhost");

const API_BASE_URL = isLocal ? LOCAL_BASE_URL : PROD_BASE_URL;

// API Client - Axios 인스턴스
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// 요청 인터셉터: 모든 API 요청에 Authorization 헤더 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("토큰 로드 실패:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 401 에러 시 처리 (선택적)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("인증 만료 또는 권한 없음");
      // 필요시 로그아웃 처리 또는 토큰 갱신 로직
    }
    return Promise.reject(error);
  }
);
