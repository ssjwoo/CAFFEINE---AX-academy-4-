import axios from "axios";

const LOCAL_BASE_URL = "http://localhost:8001";  // 로컬 개발
const PROD_BASE_URL = "http://alb-caffeine-1030868637.ap-northeast-2.elb.amazonaws.com";

// Expo는 process.env 지원 제한 → 런타임 판별 방식 사용
const isLocal =
  typeof window !== "undefined" &&
  window.location.hostname.includes("localhost");

const API_BASE_URL = isLocal ? LOCAL_BASE_URL : PROD_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});
