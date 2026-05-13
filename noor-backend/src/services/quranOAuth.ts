import axios from 'axios';

const USER_OAUTH_BASE = process.env.QURAN_OAUTH_ENDPOINT ?? 'https://prelive-oauth2.quran.foundation';
const USER_CLIENT_ID = process.env.QURAN_OAUTH_CLIENT_ID ?? '';
const USER_CLIENT_SECRET = process.env.QURAN_OAUTH_CLIENT_SECRET ?? '';

const CONTENT_ENV = process.env.QURAN_CONTENT_ENV ?? 'production';
const CONTENT_OAUTH_BASE =
  process.env.QURAN_CONTENT_OAUTH_ENDPOINT ??
  (CONTENT_ENV === 'prelive'
    ? process.env.QURAN_OAUTH_ENDPOINT ?? 'https://prelive-oauth2.quran.foundation'
    : process.env.QURAN_PRODUCTION_OAUTH_ENDPOINT ?? 'https://oauth2.quran.foundation');
const CONTENT_CLIENT_ID =
  process.env.QURAN_CONTENT_CLIENT_ID ??
  (CONTENT_ENV === 'prelive' ? process.env.QURAN_OAUTH_CLIENT_ID : process.env.QURAN_PRODUCTION_OAUTH_CLIENT_ID) ??
  '';
const CONTENT_CLIENT_SECRET =
  process.env.QURAN_CONTENT_CLIENT_SECRET ??
  (CONTENT_ENV === 'prelive' ? process.env.QURAN_OAUTH_CLIENT_SECRET : process.env.QURAN_PRODUCTION_OAUTH_CLIENT_SECRET) ??
  '';

const USER_TOKEN_URL = `${USER_OAUTH_BASE}/oauth2/token`;
const USER_INTROSPECT_URL = `${USER_OAUTH_BASE}/oauth2/introspect`;
const CONTENT_TOKEN_URL = `${CONTENT_OAUTH_BASE}/oauth2/token`;
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface TokenCache {
  accessToken: string;
  expiresAt: number;
  expiresIn: number;
  scope?: string;
  tokenType: string;
}

export interface QuranTokenResponse {
  access_token: string;
  expires_in: number;
  expires_at?: string;
  id_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type: string;
}

let cache: TokenCache | null = null;
let inflightRequest: Promise<TokenCache> | null = null;

function assertUserOAuthConfigured() {
  if (!USER_CLIENT_ID || !USER_CLIENT_SECRET) {
    throw new Error('Quran OAuth is not configured. Set QURAN_OAUTH_CLIENT_ID and QURAN_OAUTH_CLIENT_SECRET.');
  }
}

function assertContentOAuthConfigured() {
  if (!CONTENT_CLIENT_ID || !CONTENT_CLIENT_SECRET) {
    throw new Error('Quran content OAuth is not configured. Set QURAN_CONTENT_CLIENT_ID/QURAN_CONTENT_CLIENT_SECRET or QURAN_PRODUCTION_OAUTH_CLIENT_ID/QURAN_PRODUCTION_OAUTH_CLIENT_SECRET.');
  }
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

async function fetchClientCredentialsToken(scope = 'content'): Promise<TokenCache> {
  assertContentOAuthConfigured();

  const params = new URLSearchParams();
  params.set('grant_type', 'client_credentials');
  params.set('client_id', CONTENT_CLIENT_ID);
  params.set('scope', scope);

  const { data } = await axios.post<QuranTokenResponse>(CONTENT_TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: basicAuthHeader(CONTENT_CLIENT_ID, CONTENT_CLIENT_SECRET),
    },
    timeout: 10000,
  });

  const expiresIn = data.expires_in ?? 3600;
  const expiresAt = data.expires_at ? Date.parse(data.expires_at) : Date.now() + expiresIn * 1000;

  return {
    accessToken: data.access_token,
    expiresAt,
    expiresIn,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

export async function getQuranContentToken(scope = 'content'): Promise<QuranTokenResponse> {
  if (cache && Date.now() < cache.expiresAt - REFRESH_BUFFER_MS) {
    return {
      access_token: cache.accessToken,
      expires_in: Math.max(0, Math.floor((cache.expiresAt - Date.now()) / 1000)),
      expires_at: new Date(cache.expiresAt).toISOString(),
      scope: cache.scope,
      token_type: cache.tokenType,
    };
  }

  if (!inflightRequest) {
    inflightRequest = fetchClientCredentialsToken(scope)
      .then((token) => {
        cache = token;
        return token;
      })
      .finally(() => {
        inflightRequest = null;
      });
  }

  const token = await inflightRequest;
  return {
    access_token: token.accessToken,
    expires_in: Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000)),
    expires_at: new Date(token.expiresAt).toISOString(),
    scope: token.scope,
    token_type: token.tokenType,
  };
}

export async function introspectQuranToken(token: string, scope?: string) {
  assertUserOAuthConfigured();

  const params = new URLSearchParams();
  params.set('token', token);
  if (scope) params.set('scope', scope);

  const { data } = await axios.post(USER_INTROSPECT_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: basicAuthHeader(USER_CLIENT_ID, USER_CLIENT_SECRET),
    },
    timeout: 10000,
  });

  return data;
}

export async function exchangeQuranAuthorizationCode(options: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<QuranTokenResponse> {
  assertUserOAuthConfigured();

  const params = new URLSearchParams();
  params.set('grant_type', 'authorization_code');
  params.set('client_id', USER_CLIENT_ID);
  params.set('code', options.code);
  params.set('redirect_uri', options.redirectUri);
  params.set('code_verifier', options.codeVerifier);

  const { data } = await axios.post<QuranTokenResponse>(USER_TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: basicAuthHeader(USER_CLIENT_ID, USER_CLIENT_SECRET),
    },
    timeout: 10000,
  });

  return data;
}

export function clearQuranTokenCache() {
  cache = null;
}

export function getQuranOAuthClientId() {
  return CONTENT_CLIENT_ID;
}

export function getQuranContentEnvironment() {
  return CONTENT_ENV;
}
