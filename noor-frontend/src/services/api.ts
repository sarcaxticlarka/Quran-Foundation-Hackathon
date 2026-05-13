import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, API_TIMEOUT, STORAGE_KEYS } from '../utils/constants';

// ─────────────────────────────────────────────
// Primary API Client
// ─────────────────────────────────────────────
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor — attach auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (_) {
        // Silent fail — proceed without token
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor — handle 401 globally
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        // The auth store listener will pick this up and redirect to login
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient(API_BASE);
export default apiClient;

// ─────────────────────────────────────────────
// Generic typed helpers
// ─────────────────────────────────────────────
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.get<T>(url, config);
  return data;
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.post<T>(url, body, config);
  return data;
}

export async function put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.put<T>(url, body, config);
  return data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.delete<T>(url, config);
  return data;
}
