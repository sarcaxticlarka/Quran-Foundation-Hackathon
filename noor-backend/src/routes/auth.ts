import { Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../services/prisma';

const router = Router();
const SCRYPT_KEY_LEN = 64;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function profileIdFromEmail(email: string) {
  return `email:${normalizeEmail(email)}`;
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, SCRYPT_KEY_LEN).toString('hex');
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicProfile(profile: {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}) {
  return {
    id: profile.id,
    name: profile.name || 'Friend',
    email: profile.email || '',
    avatar: profile.avatarUrl ?? undefined,
    joinedAt: profile.createdAt.toISOString(),
    readingLevel: 'intermediate',
    dailyGoalMinutes: 15,
    notificationsEnabled: true,
  };
}

router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body?.name ?? '').trim();
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const password = String(req.body?.password ?? '');

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your full name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await prisma.emailAccount.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });

    const salt = crypto.randomBytes(16).toString('hex');
    const profileId = profileIdFromEmail(email);
    const account = await prisma.emailAccount.create({
      data: {
        email,
        salt,
        passwordHash: hashPassword(password, salt),
        profile: {
          connectOrCreate: {
            where: { id: profileId },
            create: {
              id: profileId,
              name,
              email,
              readingLevel: 'intermediate',
              dailyGoalMinutes: 15,
            },
          },
        },
      },
      include: { profile: true },
    });

    res.status(201).json({
      token: account.profileId,
      user: publicProfile(account.profile),
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' });
    }
    console.error('Email signup failed:', err);
    res.status(500).json({ error: 'Sign up failed.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const password = String(req.body?.password ?? '');
    const account = await prisma.emailAccount.findUnique({ where: { email }, include: { profile: true } });

    if (!account || !verifyPassword(password, account.salt, account.passwordHash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    res.json({
      token: account.profileId,
      user: publicProfile(account.profile),
    });
  } catch (err) {
    console.error('Email login failed:', err);
    res.status(500).json({ error: 'Sign in failed.' });
  }
});

export default router;
