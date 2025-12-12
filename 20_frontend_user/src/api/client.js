// 04_app_front/src/api/client.js

import axios from "axios";
import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:8001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});