import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Share, Alert, ActivityIndicator, ScrollView, Dimensions, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Colors } from '../../src/theme/colors';
import { useStreak } from '../../src/hooks/useStreak';
import { useAuthStore } from '../../src/stores/authStore';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW - 28;
const CARD_H = CARD_W * 1.42;

// ─── Spiritual rank ───────────────────────────────────────────────────────────
function getRank(streak: number) {
  if (streak >= 60) return { arabic: 'عَالِم',      english: 'Scholar',   accent: '#F0D080' };
  if (streak >= 30) return { arabic: 'حَافِظ',      english: 'Preserver', accent: '#C9A456' };
  if (streak >= 14) return { arabic: 'مُجْتَهِد',  english: 'Diligent',  accent: '#8ABCA0' };
  if (streak >= 7)  return { arabic: 'طَالِب',      english: 'Student',   accent: '#88AACC' };
  return              { arabic: 'مُبْتَدِئ',        english: 'Seeker',    accent: '#A898CC' };
}

// ─── Mosque skyline (simplified, bold) ───────────────────────────────────────
function MosqueSkyline() {
  const G = Colors.gold;
  return (
    <View style={ms.wrap} pointerEvents="none">
      {/* Ground line */}
      <View style={ms.ground} />

      {/* Far-left small minaret */}
      <View style={[ms.minaret, { left: '8%',  height: 70, width: 7 }]}>
        <View style={[ms.minaretDome, { width: 11, height: 6 }]} />
        <View style={[ms.minaretTip,  { width: 2,  height: 7 }]} />
      </View>
      {/* Far-right small minaret */}
      <View style={[ms.minaret, { right: '8%', height: 70, width: 7 }]}>
        <View style={[ms.minaretDome, { width: 11, height: 6 }]} />
        <View style={[ms.minaretTip,  { width: 2,  height: 7 }]} />
      </View>

      {/* Left main minaret */}
      <View style={[ms.minaret, { left: '22%', height: 100, width: 10 }]}>
        <View style={[ms.minaretBalcony, { width: 18 }]} />
        <View style={[ms.minaretDome,    { width: 14, height: 7 }]} />
        <View style={[ms.minaretTip,     { width: 2,  height: 9 }]} />
      </View>
      {/* Right main minaret */}
      <View style={[ms.minaret, { right: '22%', height: 100, width: 10 }]}>
        <View style={[ms.minaretBalcony, { width: 18 }]} />
        <View style={[ms.minaretDome,    { width: 14, height: 7 }]} />
        <View style={[ms.minaretTip,     { width: 2,  height: 9 }]} />
      </View>

      {/* Left flanking dome */}
      <View style={[ms.dome, { left: '32%', bottom: 2, width: 44, height: 22 }]} />
      {/* Right flanking dome */}
      <View style={[ms.dome, { right: '32%', bottom: 2, width: 44, height: 22 }]} />

      {/* Main central dome */}
      <View style={[ms.dome, { alignSelf: 'center', bottom: 2, width: 110, height: 56 }]}>
        {/* Finial above dome */}
        <View style={{ position: 'absolute', top: -16, alignSelf: 'center', alignItems: 'center' }}>
          <View style={{ width: 2, height: 12, backgroundColor: G }} />
          <View style={{ width: 8, height: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: G }} />
        </View>
      </View>

      {/* Main building */}
      <View style={[ms.body, { width: CARD_W * 0.58 }]} />
    </View>
  );
}

const ms = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 130,
    opacity: 0.11, alignItems: 'center',
  },
  ground: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.gold },
  minaret: {
    position: 'absolute', bottom: 2, backgroundColor: Colors.gold,
    alignItems: 'center',
  },
  minaretBalcony: { position: 'absolute', top: 0, height: 3, backgroundColor: Colors.gold },
  minaretDome: {
    position: 'absolute', top: -6,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: Colors.gold,
    alignSelf: 'center',
  },
  minaretTip: {
    position: 'absolute', alignSelf: 'center', backgroundColor: Colors.gold,
  },
  dome: {
    position: 'absolute', borderTopLeftRadius: 999, borderTopRightRadius: 999,
    backgroundColor: Colors.gold,
  },
  body: { position: 'absolute', bottom: 0, height: 42, backgroundColor: Colors.gold },
});

// ─── Crescent + star (top-right corner) ──────────────────────────────────────
function MoonAndStar() {
  const sz = 110;
  return (
    <View style={{ position: 'absolute', top: -18, right: -18, opacity: 0.10 }}>
      {/* Crescent — gold circle + offset cutout */}
      <View style={{ width: sz, height: sz }}>
        <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: Colors.gold }} />
        <View style={{
          position: 'absolute', top: sz * 0.06, left: sz * 0.22,
          width: sz * 0.84, height: sz * 0.84,
          borderRadius: sz * 0.42,
          backgroundColor: '#131A0F',
        }} />
      </View>
      {/* Small 4-pointed star beside crescent */}
      <View style={{
        position: 'absolute', top: sz * 0.18, right: -12,
        width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
      }}>
        {[0, 45].map((d) => (
          <View key={d} style={{
            position: 'absolute', width: 22, height: 22,
            borderWidth: 1.5, borderColor: Colors.gold,
            transform: [{ rotate: `${d}deg` }],
          }} />
        ))}
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.gold }} />
      </View>
    </View>
  );
}

// ─── 8-pointed Rub el Hizb star ──────────────────────────────────────────────
function RubElHizb({ size = 72 }: { size?: number }) {
  const sq = size * 0.64;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 22.5, 45].map((d) => (
        <View key={d} style={{
          position: 'absolute', width: sq, height: sq,
          borderWidth: 1.5, borderColor: Colors.gold + '80',
          transform: [{ rotate: `${d}deg` }],
        }} />
      ))}
      <View style={{ position: 'absolute', width: sq * 0.52, height: sq * 0.52, borderRadius: sq * 0.26, borderWidth: 1.5, borderColor: Colors.gold + 'AA' }} />
      <LinearGradient
        colors={[Colors.gold + '90', Colors.gold + '40']}
        style={{ width: sq * 0.26, height: sq * 0.26, borderRadius: sq * 0.13 }}
      />
    </View>
  );
}

// ─── Ornamental divider ───────────────────────────────────────────────────────
function Divider({ w = '78%' }: { w?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: w as any, gap: 6 }}>
      <View style={{ flex: 1, height: 0.5, backgroundColor: Colors.gold + '55' }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold + '88' }} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.gold }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.gold + '88' }} />
      <View style={{ flex: 1, height: 0.5, backgroundColor: Colors.gold + '55' }} />
    </View>
  );
}

// ─── Corner bracket ───────────────────────────────────────────────────────────
function CornerBracket({ flip = false, flipV = false }: { flip?: boolean; flipV?: boolean }) {
  const sx = [
    ...(flip ? [{ scaleX: -1 }] : []),
    ...(flipV ? [{ scaleY: -1 }] : []),
  ] as ViewStyle['transform'];
  return (
    <View style={{ width: 26, height: 26, transform: sx }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 1.5,   backgroundColor: Colors.gold + 'AA' }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: 1.5,  height: 18,  backgroundColor: Colors.gold + 'AA' }} />
      <View style={{ position: 'absolute', top: 5, left: 5, width: 9,   height: 1,   backgroundColor: Colors.gold + '55' }} />
      <View style={{ position: 'absolute', top: 5, left: 5, width: 1,   height: 9,   backgroundColor: Colors.gold + '55' }} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ShareCardScreen() {
  const nav     = useRouter();
  const cardRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);

  const { currentStreak, longestStreak, history } = useStreak();
  const user     = useAuthStore((s) => s.user);
  const userName = user?.name ?? 'Seeker';
  const madhab   = user?.madhab ?? '';

  const totalVerses = Object.values(history).reduce((s, d) => s + d.versesRead, 0);
  const totalDhikr  = Object.values(history).reduce((s, d) => s + d.dhikrCount, 0);
  const activeDays  = Object.values(history).filter((d) => d.completed).length;
  const rank        = getRank(currentStreak);

  const captureCard = async (): Promise<string | null> => {
    try {
      await new Promise((r) => setTimeout(r, 250));
      return await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
    } catch { return null; }
  };

  const handleSaveToGallery = async () => {
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow Noor to save to your photo library.');
        return;
      }
      const uri = await captureCard();
      if (!uri) { Alert.alert('Failed', 'Could not capture card. Try again.'); return; }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved ✦', 'Your journey card has been saved to your gallery.');
    } catch { Alert.alert('Error', 'Could not save. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleShare = async () => {
    setSaving(true);
    try {
      const uri = await captureCard();
      await Share.share({
        url: uri ?? undefined,
        message: `My Quranic journey with Noor — ${currentStreak} day streak · ${totalVerses} verses read\n\nnoor.app`,
        title: 'My Noor Journey',
      });
    } catch {} finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey Card</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ═══════════════════ THE CARD ════════════════════════ */}
        <View
          ref={cardRef}
          collapsable={false}
          style={{ width: CARD_W, height: CARD_H, borderRadius: 24, overflow: 'hidden' }}
        >
          {/* ── Layer 1: Base parchment gradient ── */}
          <LinearGradient
            colors={['#20180A', '#141E0F', '#0C1509', '#171209', '#1E1B0C']}
            locations={[0, 0.25, 0.5, 0.75, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* ── Layer 2: Warm gold shimmer (top-left) ── */}
          <LinearGradient
            colors={['rgba(220,175,80,0.28)', 'rgba(200,155,60,0.08)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 0.65, y: 0.65 }}
            style={StyleSheet.absoluteFill}
          />
          {/* ── Layer 3: Deep vignette (bottom-right) ── */}
          <LinearGradient
            colors={['transparent', 'rgba(3,8,4,0.72)']}
            start={{ x: 0.35, y: 0.35 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* ── Layer 4: Parchment centre glow ── */}
          <LinearGradient
            colors={['transparent', 'rgba(201,164,86,0.05)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* ── Decorative BG elements ── */}
          <MoonAndStar />
          <MosqueSkyline />

          {/* ── Large Arabic watermark ── */}
          <Text style={styles.watermarkText} pointerEvents="none">الله</Text>

          {/* ── Card shadow overlay at top ── */}
          <LinearGradient
            colors={['rgba(0,0,0,0.18)', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.15 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* ══ DOUBLE BORDER FRAME ══ */}
          <View style={styles.frameOuter}>
            <View style={styles.frameInner}>

              {/* Corner brackets */}
              <View style={{ position: 'absolute', top: 8,    left: 8   }}><CornerBracket /></View>
              <View style={{ position: 'absolute', top: 8,    right: 8  }}><CornerBracket flip /></View>
              <View style={{ position: 'absolute', bottom: 8, left: 8   }}><CornerBracket flipV /></View>
              <View style={{ position: 'absolute', bottom: 8, right: 8  }}><CornerBracket flip flipV /></View>

              {/* ─── HEADER BAND ─── */}
              <View style={styles.bandTop}>
                <LinearGradient
                  colors={['rgba(201,164,86,0.22)', 'rgba(201,164,86,0.06)', 'rgba(201,164,86,0.22)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>
              </View>

              {/* ─── MAIN CONTENT ─── */}
              <View style={styles.content}>

                {/* Brand row */}
                <View style={styles.brandRow}>
                  <View style={styles.brandHr} />
                  <View style={{ alignItems: 'center', gap: 1 }}>
                    <Text style={styles.brandAr}>نور</Text>
                    <Text style={styles.brandEn}>N · O · O · R</Text>
                  </View>
                  <View style={styles.brandHr} />
                </View>

                {/* Central Rub el Hizb emblem */}
                <RubElHizb size={CARD_W * 0.19} />

                {/* Username */}
                <View style={{ alignItems: 'center', gap: 3 }}>
                  <Text style={styles.userName} numberOfLines={1} adjustsFontSizeToFit>
                    {userName}
                  </Text>
                  {madhab ? (
                    <Text style={styles.madhabTxt}>{madhab} School of Thought</Text>
                  ) : null}
                </View>

                {/* Rank badge */}
                <View style={[styles.rankBadge, { borderColor: rank.accent + '60', backgroundColor: rank.accent + '12' }]}>
                  <Text style={[styles.rankAr, { color: rank.accent }]}>{rank.arabic}</Text>
                  <View style={{ width: 1, height: 16, backgroundColor: rank.accent + '50' }} />
                  <Text style={[styles.rankEn, { color: rank.accent + 'CC' }]}>{rank.english}</Text>
                </View>

                <Divider />

                {/* Stats */}
                <View style={styles.statsBox}>
                  {[
                    { val: String(currentStreak), lbl: 'Day Streak', flame: true },
                    { val: String(longestStreak), lbl: 'Personal Best', flame: false },
                    { val: String(totalVerses),   lbl: 'Verses Read',  flame: false },
                    {
                      val: totalDhikr > 999
                        ? `${(totalDhikr / 1000).toFixed(1)}k`
                        : String(totalDhikr),
                      lbl: 'Dhikr', flame: false,
                    },
                  ].map((s, i, a) => (
                    <React.Fragment key={s.lbl}>
                      <View style={styles.statCell}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          {s.flame && <Ionicons name="flame" size={13} color={Colors.gold} />}
                          <Text style={styles.statVal}>{s.val}</Text>
                        </View>
                        <Text style={styles.statLbl}>{s.lbl}</Text>
                      </View>
                      {i < a.length - 1 && <View style={styles.statDivV} />}
                    </React.Fragment>
                  ))}
                </View>

                {/* Active days */}
                <View style={styles.activePill}>
                  <Ionicons name="moon-outline" size={10} color={Colors.gold + 'BB'} />
                  <Text style={styles.activeTxt}>{activeDays} active days on Noor</Text>
                </View>

                <Divider w="70%" />

                {/* Quranic ayah */}
                <View style={{ alignItems: 'center', gap: 3, paddingHorizontal: 12 }}>
                  <Text style={styles.ayah}>
                    وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ
                  </Text>
                  <Text style={styles.ayahRef}>Al-Baqarah  2:186</Text>
                </View>

              </View>

              {/* ─── FOOTER BAND ─── */}
              <View style={styles.bandBottom}>
                <LinearGradient
                  colors={['rgba(201,164,86,0.2)', 'rgba(201,164,86,0.05)', 'rgba(201,164,86,0.2)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.footerTxt}>noor.app  ·  Quran Foundation  2026</Text>
              </View>

            </View>
          </View>
        </View>

        {/* ─── Action buttons ── */}
        <View style={{ width: CARD_W, gap: 12 }}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveToGallery}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#0A1810" />
              : <Ionicons name="download-outline" size={19} color="#0A1810" />}
            <Text style={styles.saveTxt}>Save to Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name="share-outline" size={18} color={Colors.gold} />
            <Text style={styles.shareTxt}>Share</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060E08' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(201,164,86,0.12)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },

  body: { padding: 14, alignItems: 'center', gap: 18, paddingBottom: 44 },

  // ── Frame ─────────────────────────────────────────────────────────────────
  frameOuter: {
    position: 'absolute', top: 11, left: 11, right: 11, bottom: 11,
    borderWidth: 1.5, borderColor: Colors.gold + '70', borderRadius: 15,
  },
  frameInner: {
    flex: 1,
    borderWidth: 0.5, borderColor: Colors.gold + '35', borderRadius: 14,
    overflow: 'hidden', justifyContent: 'space-between',
  },

  // ── Background watermark ──────────────────────────────────────────────────
  watermarkText: {
    position: 'absolute',
    fontSize: CARD_W * 0.62,
    color: 'rgba(201,164,86,0.05)',
    fontFamily: 'CormorantGaramond_700Bold',
    top: CARD_H * 0.15,
    alignSelf: 'center',
    includeFontPadding: false,
  },

  // ── Header / footer bands ─────────────────────────────────────────────────
  bandTop: {
    paddingVertical: 9, alignItems: 'center',
    borderBottomWidth: 0.5, borderBottomColor: Colors.gold + '45',
  },
  bandBottom: {
    paddingVertical: 7, alignItems: 'center',
    borderTopWidth: 0.5, borderTopColor: Colors.gold + '45',
  },
  bismillah: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 15, color: Colors.gold + 'DD', letterSpacing: 0.4,
  },
  footerTxt: {
    fontFamily: 'Raleway_300Light',
    fontSize: 8.5, color: Colors.gold + '99', letterSpacing: 2,
  },

  // ── Content area ─────────────────────────────────────────────────────────
  content: {
    flex: 1, alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 18, paddingVertical: 4,
  },

  // ── Brand ─────────────────────────────────────────────────────────────────
  brandRow: { flexDirection: 'row', alignItems: 'center', width: '88%', gap: 10 },
  brandHr: { flex: 1, height: 0.5, backgroundColor: Colors.gold + '55' },
  brandAr: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 30, color: Colors.gold, lineHeight: 34,
  },
  brandEn: {
    fontFamily: 'Raleway_300Light',
    fontSize: 7.5, color: Colors.gold + 'AA', letterSpacing: 5.5,
  },

  // ── User ─────────────────────────────────────────────────────────────────
  userName: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 32, color: Colors.textPrimary, letterSpacing: 1.5, textAlign: 'center',
  },
  madhabTxt: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 11, color: Colors.textMuted, letterSpacing: 0.6,
  },

  // ── Rank ─────────────────────────────────────────────────────────────────
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 7,
  },
  rankAr: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 20 },
  rankEn: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase',
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  statsBox: {
    flexDirection: 'row', width: '96%', alignItems: 'center',
    backgroundColor: 'rgba(201,164,86,0.07)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(201,164,86,0.22)',
    paddingVertical: 13,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statDivV: { width: 0.5, height: 30, backgroundColor: 'rgba(201,164,86,0.28)' },
  statVal: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 22, color: Colors.gold,
  },
  statLbl: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 8, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // ── Active pill ───────────────────────────────────────────────────────────
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(201,164,86,0.25)',
    backgroundColor: 'rgba(201,164,86,0.07)',
    paddingHorizontal: 12, paddingVertical: 5,
  },
  activeTxt: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 9.5, color: Colors.gold + 'BB',
  },

  // ── Ayah ──────────────────────────────────────────────────────────────────
  ayah: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 16, color: Colors.goldLight,
    textAlign: 'center', lineHeight: 28,
  },
  ayahRef: {
    fontFamily: 'Raleway_400Regular',
    fontSize: 9.5, color: Colors.textMuted,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 17,
  },
  saveTxt: { fontFamily: 'Raleway_700Bold', fontSize: 16, color: '#0A1810' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 15,
    borderWidth: 1.5, borderColor: Colors.gold + '55',
    backgroundColor: 'rgba(201,164,86,0.07)',
  },
  shareTxt: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.gold },
});
