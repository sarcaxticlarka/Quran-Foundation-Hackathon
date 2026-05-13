import { Router, Request, Response } from 'express';
import {
  exchangeQuranAuthorizationCode,
  getQuranContentToken,
  introspectQuranToken,
} from '../services/quranOAuth';
import { getQuranApi } from '../services/quranApi';

const router = Router();

function handleQuranError(res: Response, err: any, fallback: string) {
  const status = err.response?.status ?? 500;
  const message = err.response?.data ?? { error: err.message || fallback };
  res.status(status).json(message);
}

function enc(value: unknown) {
  return encodeURIComponent(String(value));
}

router.post('/token', async (req: Request, res: Response) => {
  try {
    const scope = typeof req.body?.scope === 'string' ? req.body.scope : 'content';
    const token = await getQuranContentToken(scope);
    res.json(token);
  } catch (err: any) {
    handleQuranError(res, err, 'Quran OAuth token exchange failed');
  }
});

router.post('/introspect', async (req: Request, res: Response) => {
  const { token, scope } = req.body as { token?: string; scope?: string };

  if (!token) {
    res.status(400).json({ error: 'token is required' });
    return;
  }

  try {
    const result = await introspectQuranToken(token, scope);
    res.json(result);
  } catch (err: any) {
    handleQuranError(res, err, 'Quran OAuth introspection failed');
  }
});

router.post('/oauth/exchange', async (req: Request, res: Response) => {
  const { code, redirectUri, codeVerifier } = req.body as {
    code?: string;
    redirectUri?: string;
    codeVerifier?: string;
  };

  if (!code || !redirectUri || !codeVerifier) {
    res.status(400).json({ error: 'code, redirectUri, and codeVerifier are required' });
    return;
  }

  try {
    const token = await exchangeQuranAuthorizationCode({ code, redirectUri, codeVerifier });
    res.json(token);
  } catch (err) {
    handleQuranError(res, err, 'Failed to exchange Quran authorization code');
  }
});

router.get('/chapters', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi('/chapters', { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran chapters request failed');
  }
});

router.get('/chapters/:chapterId', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi(`/chapters/${enc(req.params.chapterId)}`, { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran chapter request failed');
  }
});

router.get('/verses/by_chapter/:chapterId', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi(`/verses/by_chapter/${enc(req.params.chapterId)}`, { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran chapter verses request failed');
  }
});

router.get('/verses/by_key/:verseKey', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi(`/verses/by_key/${enc(req.params.verseKey)}`, { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran verse request failed');
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi('/search', { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran search request failed');
  }
});

router.get('/resources/tafsirs', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi('/resources/tafsirs', { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran tafsir resources request failed');
  }
});

router.get('/tafsirs/:tafsirId/by_ayah/:verseKey', async (req: Request, res: Response) => {
  const { tafsirId, verseKey } = req.params;

  try {
    res.json(await getQuranApi(
      `/tafsirs/${enc(tafsirId)}/by_ayah/${enc(verseKey)}`,
      { params: req.query },
    ));
  } catch (err) {
    handleQuranError(res, err, 'Quran tafsir verse request failed');
  }
});

router.get('/tafsirs/:tafsirId/by_chapter/:chapterId', async (req: Request, res: Response) => {
  const { tafsirId, chapterId } = req.params;

  try {
    res.json(await getQuranApi(
      `/tafsirs/${enc(tafsirId)}/by_chapter/${enc(chapterId)}`,
      { params: req.query },
    ));
  } catch (err) {
    handleQuranError(res, err, 'Quran tafsir chapter request failed');
  }
});

router.get('/resources/recitations', async (req: Request, res: Response) => {
  try {
    res.json(await getQuranApi('/resources/recitations', { params: req.query }));
  } catch (err) {
    handleQuranError(res, err, 'Quran recitation resources request failed');
  }
});

router.get('/chapter_recitations/:reciterId/:chapterId', async (req: Request, res: Response) => {
  const { reciterId, chapterId } = req.params;

  try {
    res.json(await getQuranApi(
      `/chapter_recitations/${enc(reciterId)}/${enc(chapterId)}`,
      { params: req.query },
    ));
  } catch (err) {
    handleQuranError(res, err, 'Quran chapter audio request failed');
  }
});

router.get('/recitations/:reciterId/by_chapter/:chapterId', async (req: Request, res: Response) => {
  const { reciterId, chapterId } = req.params;

  try {
    res.json(await getQuranApi(
      `/recitations/${enc(reciterId)}/by_chapter/${enc(chapterId)}`,
      { params: req.query },
    ));
  } catch (err) {
    handleQuranError(res, err, 'Quran verse audio request failed');
  }
});

export default router;
