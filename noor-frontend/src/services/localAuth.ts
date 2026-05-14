import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL } from '../utils/constants';
import { UserProfile } from '../stores/authStore';

interface EmailAuthResponse {
  token: string;
  user: UserProfile;
}

const authApi = axios.create({
  baseURL: `${BACKEND_URL}/api/auth`,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-API-Key': BACKEND_API_KEY,
  },
});

function readError(err: any, fallback: string) {
  if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
    return 'Request timed out. The server may be waking up — please try again in a moment.';
  }
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  return err?.response?.data?.error ?? err?.message ?? fallback;
}

export async function createLocalAccount(name: string, email: string, password: string) {
  try {
    const { data } = await authApi.post<EmailAuthResponse>('/signup', { name, email, password });
    return data;
  } catch (err: any) {
    throw new Error(readError(err, 'Sign up failed.'));
  }
}

export async function verifyLocalAccount(email: string, password: string) {
  try {
    const { data } = await authApi.post<EmailAuthResponse>('/login', { email, password });
    return data;
  } catch (err: any) {
    throw new Error(readError(err, 'Incorrect email or password.'));
  }
}
