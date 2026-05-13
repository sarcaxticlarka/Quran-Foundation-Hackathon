import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

function toDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function dateOnly(value: Date | string | null | undefined) {
  if (!value) return value;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function profileRow(profile: any) {
  if (!profile) return profile;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar_url: profile.avatarUrl,
    quranic_identity: profile.quranicIdentity,
    onboarding_done: profile.onboardingDone,
    madhab: profile.madhab,
    reading_level: profile.readingLevel,
    daily_goal_minutes: profile.dailyGoalMinutes,
    translation_id: profile.translationId,
    nudges_enabled: profile.nudgesEnabled,
    nudge_times: profile.nudgeTimes,
    review_reminders: profile.reviewReminders,
    halaqa_alerts: profile.halaqaAlerts,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

function streakRow(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    user_id: row.userId,
    current_streak: row.currentStreak,
    longest_streak: row.longestStreak,
    last_activity: dateOnly(row.lastActivity),
    total_days: row.totalDays,
    freeze_count: row.freezeCount,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function activityRow(row: any) {
  return {
    id: row.id,
    user_id: row.userId,
    date: dateOnly(row.date),
    verses_read: row.versesRead,
    minutes: row.minutes,
    xp_earned: row.xpEarned,
    source: row.source,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function bookmarkRow(row: any) {
  return {
    id: row.id,
    user_id: row.userId,
    verse_key: row.verseKey,
    surah_num: row.surahNum,
    ayah_num: row.ayahNum,
    note: row.note,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function reviewCardRow(row: any) {
  return {
    id: row.id,
    user_id: row.userId,
    verse_key: row.verseKey,
    repetitions: row.repetitions,
    ease_factor: row.easeFactor,
    interval_days: row.intervalDays,
    next_review_at: row.nextReviewAt,
    last_quality: row.lastQuality,
    total_reviews: row.totalReviews,
    correct_reviews: row.correctReviews,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function reflectionRow(row: any) {
  return {
    id: row.id,
    user_id: row.userId,
    verse_key: row.verseKey,
    body: row.body,
    mood: row.mood,
    is_public: row.isPublic,
    ai_enrichment: row.aiEnrichment,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function goalRow(row: any) {
  return {
    id: row.id,
    user_id: row.userId,
    type: row.type,
    target_value: row.targetValue,
    current_value: row.currentValue,
    period: row.period,
    is_active: row.isActive,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

function halaqaMemberRow(row: any) {
  return {
    id: row.id,
    circle_id: row.circleId,
    user_id: row.userId,
    role: row.role,
    created_at: row.createdAt,
    halaqa_circles: row.circle ? {
      id: row.circle.id,
      created_by: row.circle.createdBy,
      name: row.circle.name,
      description: row.circle.description,
      invite_code: row.circle.inviteCode,
      created_at: row.circle.createdAt,
      updated_at: row.circle.updatedAt,
    } : undefined,
  };
}

function halaqaCircleRow(circle: any, viewerId?: string) {
  const members = circle.members ?? [];
  return {
    id: circle.id,
    created_by: circle.createdBy,
    name: circle.name,
    description: circle.description,
    invite_code: circle.inviteCode,
    created_at: circle.createdAt,
    updated_at: circle.updatedAt,
    is_admin: viewerId ? circle.createdBy === viewerId : false,
    members: members.map((member: any) => ({
      id: member.userId,
      member_id: member.id,
      role: member.role,
      name: member.profile?.name ?? 'Noor User',
      avatar_url: member.profile?.avatarUrl,
      verses_read: 0,
      streak: 0,
      is_active: true,
      lantern_intensity: 1,
      created_at: member.createdAt,
    })),
  };
}

function nudgePrefsRow(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    user_id: row.userId,
    nudges_enabled: row.nudgesEnabled,
    active_windows: row.activeWindows,
    review_reminders: row.reviewReminders,
    halaqa_alerts: row.halaqaAlerts,
    push_token: row.pushToken,
    translation_id: row.translationId,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

async function ensureProfile(userId: string, data: Record<string, any> = {}) {
  await prisma.profile.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: data.name,
      email: data.email,
      readingLevel: data.reading_level ?? 'intermediate',
      dailyGoalMinutes: data.daily_goal_minutes ?? 15,
    },
  });
}

function handleError(res: Response, err: any) {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Database request failed' });
}

router.get('/profiles/:userId', async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: req.params.userId } });
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profileRow(profile));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/profiles/:userId', async (req, res) => {
  try {
    const b = req.body ?? {};
    const profile = await prisma.profile.upsert({
      where: { id: req.params.userId },
      create: {
        id: req.params.userId,
        name: b.name,
        email: b.email,
        avatarUrl: b.avatar_url,
        quranicIdentity: b.quranic_identity,
        onboardingDone: b.onboarding_done ?? false,
        madhab: b.madhab,
        readingLevel: b.reading_level ?? 'intermediate',
        dailyGoalMinutes: b.daily_goal_minutes ?? 15,
        translationId: b.translation_id,
        nudgesEnabled: b.nudges_enabled,
        nudgeTimes: b.nudge_times,
        reviewReminders: b.review_reminders,
        halaqaAlerts: b.halaqa_alerts,
      },
      update: {
        name: b.name,
        email: b.email,
        avatarUrl: b.avatar_url,
        quranicIdentity: b.quranic_identity,
        onboardingDone: b.onboarding_done,
        madhab: b.madhab,
        readingLevel: b.reading_level,
        dailyGoalMinutes: b.daily_goal_minutes,
        translationId: b.translation_id,
        nudgesEnabled: b.nudges_enabled,
        nudgeTimes: b.nudge_times,
        reviewReminders: b.review_reminders,
        halaqaAlerts: b.halaqa_alerts,
      },
    });
    res.json(profileRow(profile));
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/profiles/:userId', async (req, res) => {
  try {
    await prisma.profile.deleteMany({ where: { id: req.params.userId } });
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/streaks/:userId', async (req, res) => {
  try {
    res.json(streakRow(await prisma.streak.findUnique({ where: { userId: req.params.userId } })));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/streaks/:userId', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const row = await prisma.streak.upsert({
      where: { userId: req.params.userId },
      create: {
        userId: req.params.userId,
        currentStreak: b.current_streak ?? 0,
        longestStreak: b.longest_streak ?? 0,
        lastActivity: toDate(b.last_activity),
        totalDays: b.total_days ?? 0,
        freezeCount: b.freeze_count ?? 0,
      },
      update: {
        currentStreak: b.current_streak,
        longestStreak: b.longest_streak,
        lastActivity: toDate(b.last_activity),
        totalDays: b.total_days,
        freezeCount: b.freeze_count,
      },
    });
    res.json(streakRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/activity-logs/:userId', async (req, res) => {
  try {
    const days = Number(req.query.days ?? 30);
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const rows = await prisma.activityLog.findMany({
      where: { userId: req.params.userId, date: { gte: since } },
      orderBy: { date: 'desc' },
    });
    res.json(rows.map(activityRow));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/activity-logs/:userId/:date', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const date = toDate(req.params.date)!;
    const row = await prisma.activityLog.upsert({
      where: { userId_date: { userId: req.params.userId, date } },
      create: {
        userId: req.params.userId,
        date,
        versesRead: b.verses_read ?? 0,
        minutes: b.minutes ?? 0,
        xpEarned: b.xp_earned ?? 0,
        source: b.source,
      },
      update: {
        versesRead: b.verses_read,
        minutes: b.minutes,
        xpEarned: b.xp_earned,
        source: b.source,
      },
    });
    res.json(activityRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/bookmarks/:userId', async (req, res) => {
  try {
    const rows = await prisma.bookmark.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: 'desc' } });
    res.json(rows.map(bookmarkRow));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/bookmarks/:userId/:verseKey', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const row = await prisma.bookmark.upsert({
      where: { userId_verseKey: { userId: req.params.userId, verseKey: req.params.verseKey } },
      create: { userId: req.params.userId, verseKey: req.params.verseKey, surahNum: b.surah_num, ayahNum: b.ayah_num, note: b.note },
      update: { surahNum: b.surah_num, ayahNum: b.ayah_num, note: b.note },
    });
    res.json(bookmarkRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/bookmarks/:userId/:verseKey', async (req, res) => {
  try {
    await prisma.bookmark.deleteMany({ where: { userId: req.params.userId, verseKey: req.params.verseKey } });
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/review-cards/:userId', async (req, res) => {
  try {
    const rows = await prisma.reviewCard.findMany({ where: { userId: req.params.userId }, orderBy: { nextReviewAt: 'asc' } });
    res.json(rows.map(reviewCardRow));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/review-cards/:userId/:verseKey', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const row = await prisma.reviewCard.upsert({
      where: { userId_verseKey: { userId: req.params.userId, verseKey: req.params.verseKey } },
      create: {
        userId: req.params.userId,
        verseKey: req.params.verseKey,
        repetitions: b.repetitions ?? 0,
        easeFactor: b.ease_factor ?? 2.5,
        intervalDays: b.interval_days ?? 0,
        nextReviewAt: new Date(b.next_review_at),
        lastQuality: b.last_quality,
        totalReviews: b.total_reviews ?? 0,
        correctReviews: b.correct_reviews ?? 0,
      },
      update: {
        repetitions: b.repetitions,
        easeFactor: b.ease_factor,
        intervalDays: b.interval_days,
        nextReviewAt: b.next_review_at ? new Date(b.next_review_at) : undefined,
        lastQuality: b.last_quality,
        totalReviews: b.total_reviews,
        correctReviews: b.correct_reviews,
      },
    });
    res.json(reviewCardRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/reflections/:userId', async (req, res) => {
  try {
    const rows = await prisma.reflection.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: 'desc' } });
    res.json(rows.map(reflectionRow));
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/reflections/:userId', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const row = await prisma.reflection.create({
      data: { userId: req.params.userId, verseKey: b.verse_key, body: b.body, mood: b.mood, isPublic: b.is_public ?? false, aiEnrichment: b.ai_enrichment },
    });
    res.status(201).json(reflectionRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.patch('/reflections/:reflectionId', async (req, res) => {
  try {
    const b = req.body ?? {};
    const row = await prisma.reflection.update({
      where: { id: req.params.reflectionId },
      data: { body: b.body, mood: b.mood, isPublic: b.is_public, aiEnrichment: b.ai_enrichment },
    });
    res.json(reflectionRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/goals/:userId', async (req, res) => {
  try {
    const rows = await prisma.goal.findMany({ where: { userId: req.params.userId, isActive: true }, orderBy: { createdAt: 'desc' } });
    res.json(rows.map(goalRow));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/goals/:userId/:type', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const row = await prisma.goal.upsert({
      where: { userId_type: { userId: req.params.userId, type: req.params.type } },
      create: { userId: req.params.userId, type: req.params.type, targetValue: b.target_value, currentValue: b.current_value ?? 0, period: b.period ?? 'daily' },
      update: { targetValue: b.target_value, currentValue: b.current_value, period: b.period },
    });
    res.json(goalRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/halaqa/:userId', async (req, res) => {
  try {
    const rows = await prisma.halaqaMember.findMany({
      where: { userId: req.params.userId },
      include: { circle: { include: { members: { include: { profile: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows.map((row) => halaqaCircleRow(row.circle, req.params.userId)));
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/halaqa/circles/:circleId', async (req, res) => {
  try {
    const circle = await prisma.halaqaCircle.findUnique({
      where: { id: req.params.circleId },
      include: { members: { include: { profile: true }, orderBy: { createdAt: 'asc' } } },
    });
    if (!circle) {
      res.status(404).json({ error: 'Halaqa circle not found' });
      return;
    }
    res.json(halaqaCircleRow(circle, String(req.query.userId ?? '')));
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/halaqa/:userId', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const circle = await prisma.halaqaCircle.create({
      data: {
        createdBy: req.params.userId,
        name: req.body.name,
        description: req.body.description,
        inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
        members: { create: { userId: req.params.userId, role: 'admin' } },
      },
    });
    const fullCircle = await prisma.halaqaCircle.findUnique({
      where: { id: circle.id },
      include: { members: { include: { profile: true } } },
    });
    res.status(201).json(halaqaCircleRow(fullCircle, req.params.userId));
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/halaqa/:userId/join', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const circle = await prisma.halaqaCircle.findUnique({ where: { inviteCode: String(req.body.inviteCode ?? '').toUpperCase() } });
    if (!circle) {
      res.status(404).json({ error: 'Invalid invite code' });
      return;
    }
    await prisma.halaqaMember.upsert({
      where: { circleId_userId: { circleId: circle.id, userId: req.params.userId } },
      create: { circleId: circle.id, userId: req.params.userId },
      update: {},
    });
    const fullCircle = await prisma.halaqaCircle.findUnique({
      where: { id: circle.id },
      include: { members: { include: { profile: true } } },
    });
    res.json(halaqaCircleRow(fullCircle, req.params.userId));
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/halaqa/:userId/:circleId', async (req, res) => {
  try {
    await prisma.halaqaMember.deleteMany({
      where: { userId: req.params.userId, circleId: req.params.circleId },
    });
    const remainingMembers = await prisma.halaqaMember.count({ where: { circleId: req.params.circleId } });
    if (remainingMembers === 0) {
      await prisma.halaqaCircle.deleteMany({ where: { id: req.params.circleId, createdBy: req.params.userId } });
    }
    res.json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/crisis-sessions/:userId', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    await prisma.crisisSession.create({
      data: { userId: req.params.userId, mood: b.mood, inputText: b.input_text, verseKey: b.verse_key, dhikrCompleted: b.dhikr_completed ?? false, durationSecs: b.duration_secs },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/stats/:userId', async (req, res) => {
  try {
    const [profile, streak, activity, bookmarks, reviews, reflections] = await Promise.all([
      prisma.profile.findUnique({ where: { id: req.params.userId } }),
      prisma.streak.findUnique({ where: { userId: req.params.userId } }),
      prisma.activityLog.aggregate({ where: { userId: req.params.userId }, _sum: { versesRead: true, minutes: true, xpEarned: true } }),
      prisma.bookmark.count({ where: { userId: req.params.userId } }),
      prisma.reviewCard.count({ where: { userId: req.params.userId } }),
      prisma.reflection.count({ where: { userId: req.params.userId } }),
    ]);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json({
      id: profile.id,
      current_streak: streak?.currentStreak ?? 0,
      longest_streak: streak?.longestStreak ?? 0,
      total_verses_read: activity._sum.versesRead ?? 0,
      total_minutes: activity._sum.minutes ?? 0,
      xp_earned: activity._sum.xpEarned ?? 0,
      bookmarks_count: bookmarks,
      review_cards_count: reviews,
      reflections_count: reflections,
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/nudge-prefs/:userId', async (req, res) => {
  try {
    res.json(nudgePrefsRow(await prisma.nudgePreference.findUnique({ where: { userId: req.params.userId } })));
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/nudge-prefs/:userId', async (req, res) => {
  try {
    await ensureProfile(req.params.userId);
    const b = req.body ?? {};
    const row = await prisma.nudgePreference.upsert({
      where: { userId: req.params.userId },
      create: {
        userId: req.params.userId,
        nudgesEnabled: b.nudges_enabled ?? true,
        activeWindows: b.active_windows,
        reviewReminders: b.review_reminders ?? true,
        halaqaAlerts: b.halaqa_alerts ?? true,
        pushToken: b.push_token,
        translationId: b.translation_id,
      },
      update: {
        nudgesEnabled: b.nudges_enabled,
        activeWindows: b.active_windows,
        reviewReminders: b.review_reminders,
        halaqaAlerts: b.halaqa_alerts,
        pushToken: b.push_token,
        translationId: b.translation_id,
      },
    });
    res.json(nudgePrefsRow(row));
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
