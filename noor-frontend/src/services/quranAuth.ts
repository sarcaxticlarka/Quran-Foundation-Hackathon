import axios from 'axios';
import { BACKEND_API_KEY, BACKEND_URL } from '../utils/constants';

const TOKEN_URL = `${BACKEND_URL}/api/quran/token`;

interface QuranTokenResponse {
  access_token: string;
  expires_in: number;
  expires_at?: string;
  scope?: string;
  token_type: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

const REFRESH_BUFFER_MS = 5 * 60 * 1000;
let cache: TokenCache | null = null;
let inflightRequest: Promise<string> | null = null;

async function fetchNewToken(): Promise<TokenCache> {
  if (!BACKEND_API_KEY) return { accessToken: '', expiresAt: 0 };

  const { data } = await axios.post<QuranTokenResponse>(TOKEN_URL, { scope: 'content' }, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-Key': BACKEND_API_KEY,
    },
    timeout: 10000,
  });

  const expiresAt = data.expires_at ? Date.parse(data.expires_at) : Date.now() + data.expires_in * 1000;
  return { accessToken: data.access_token, expiresAt };
}

export async function getContentToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt - REFRESH_BUFFER_MS) {
    return cache.accessToken;
  }

  if (!inflightRequest) {
    inflightRequest = fetchNewToken()
      .then((tok) => {
        cache = tok;
        return tok.accessToken;
      })
      .finally(() => {
        inflightRequest = null;
      });
  }

  return inflightRequest;
}

export function clearTokenCache() {
  cache = null;
}
