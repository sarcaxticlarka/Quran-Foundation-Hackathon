import axios from 'axios';
import { getQuranContentEnvironment, getQuranContentToken, getQuranOAuthClientId } from './quranOAuth';

const QURAN_API_BASE =
  process.env.QURAN_CONTENT_API_BASE_URL ??
  process.env.QURAN_API_BASE_URL ??
  (getQuranContentEnvironment() === 'prelive'
    ? 'https://apis-prelive.quran.foundation/content/api/v4'
    : 'https://apis.quran.foundation/content/api/v4');

const quranClient = axios.create({
  baseURL: QURAN_API_BASE,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

export async function getQuranApi<T>(path: string, config?: any): Promise<T> {
  const token = await getQuranContentToken('content');
  const clientId = getQuranOAuthClientId();

  const { data } = await quranClient.get<T>(path, {
    ...config,
    headers: {
      ...config?.headers,
      'x-auth-token': token.access_token,
      ...(clientId ? { 'x-client-id': clientId } : {}),
    },
  });
  return data;
}
