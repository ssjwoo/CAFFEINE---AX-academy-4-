// 04_app_front/src/api/client.js

import axios from "axios";

// 개발용 기본 서버 주소 (나중에 .env로 분리 가능)
const API_BASE_URL = "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});
