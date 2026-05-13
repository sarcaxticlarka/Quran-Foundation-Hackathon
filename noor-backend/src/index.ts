import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { requireApiKey } from './middleware/auth';
import crisisRouter from './routes/crisis';
import reflectRouter from './routes/reflect';
import tajweedRouter from './routes/tajweed';
import nudgeRouter from './routes/nudge';
import identityRouter from './routes/identity';
import aiRouter from './routes/ai';
import quranRouter from './routes/quran';
import dbRouter from './routes/db';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// If the app is running behind a proxy (load balancer, reverse proxy, or a
// hosting provider that sets the X-Forwarded-* headers), enable Express
// `trust proxy` so middleware like `express-rate-limit` can rely on the
// X-Forwarded-For header to identify the client's IP correctly.
// Set the environment variable `TRUST_PROXY=true` in production if needed.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', true);
}

// ── Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '2mb' }));

// ── Rate limiting
const limiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true });
app.use('/api', limiter);

// ── Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'noorbackend', time: new Date().toISOString() });
});

// ── Auth callback page (legacy deep-link helper)
app.get('/oauth/callback', (req, res) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') query.set(key, value);
  }
  res.redirect(`noor://oauth/callback${query.toString() ? `?${query.toString()}` : ''}`);
});

app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Noor — Authentication</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0B2214;color:#F5EFE6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#0A1E10;border:1px solid rgba(201,164,86,0.2);border-radius:24px;padding:48px 36px;max-width:420px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.5)}
    .icon{width:72px;height:72px;background:rgba(201,164,86,0.1);border:1px solid rgba(201,164,86,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:32px}
    h1{font-size:26px;font-weight:600;color:#F5EFE6;margin-bottom:12px}
    .arabic{font-size:20px;color:#C9A84C;margin-bottom:20px;direction:rtl}
    p{font-size:15px;color:rgba(245,239,230,0.65);line-height:1.6;margin-bottom:32px}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(201,164,86,0.12);border:1px solid rgba(201,164,86,0.3);border-radius:100px;padding:10px 20px;font-size:13px;color:#C9A84C;font-weight:500}
    .dot{width:8px;height:8px;background:#C9A84C;border-radius:50%}
    .sub{margin-top:16px;font-size:13px;color:rgba(245,239,230,0.35)}
  </style>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      var hash = window.location.hash;
      var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && hash) {
        setTimeout(function() {
          window.location.href = 'noor://oauth/callback' + hash;
        }, 600);
      }
    });
  </script>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <div class="arabic">بِسْمِ اللَّهِ</div>
    <h1>Authentication Successful</h1>
    <p>Your Quran.Foundation sign in completed.<br/>Open the <strong style="color:#C9A84C">Noor</strong> app on your phone to continue your spiritual journey.</p>
    <div class="badge"><div class="dot"></div>You're now signed in</div>
    <p class="sub">If you're on your phone, the app will open automatically.</p>
  </div>
</body>
</html>`);
});

// ── Protected routes
app.use('/api/crisis',   requireApiKey, crisisRouter);
app.use('/api/reflect',  requireApiKey, reflectRouter);
app.use('/api/tajweed',  requireApiKey, tajweedRouter);
app.use('/api/nudge',    requireApiKey, nudgeRouter);
app.use('/api/identity', requireApiKey, identityRouter);
app.use('/api/ai',       requireApiKey, aiRouter);
app.use('/api/auth',     requireApiKey, authRouter);
app.use('/api/quran',    requireApiKey, quranRouter);
app.use('/api/db',       requireApiKey, dbRouter);

// ── 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const server = app.listen(PORT, () => {
  console.log(`\n🕌 Noor Backend running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

server.on('error', (err: any) => {
  const code = (err as NodeJS.ErrnoException).code;
  if (code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the process using the port or set a different PORT.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
