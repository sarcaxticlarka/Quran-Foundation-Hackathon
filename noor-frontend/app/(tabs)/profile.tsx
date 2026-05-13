import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { useReview } from '../../src/hooks/useReview';
import { useStreak } from '../../src/hooks/useStreak';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
interface NavItem { icon: IoniconName; label: string; route: string; badge?: string; badgeVariant?: 'gold'|'teal'|'coral'|'muted' }
const NAV_ITEMS: NavItem[] = [
  { icon: 'bookmark-outline', label: 'Bookmarks',   route: '/profile/journal' },
  { icon: 'share-outline',    label: 'Share',       route: '/profile/share' },
  { icon: 'person-outline',   label: 'Identity',    route: '/profile/identity' },
  { icon: 'create-outline',   label: 'Reflections', route: '/profile/journal' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { dueCount, retention, cards } = useReview();
  const { currentStreak } = useStreak();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user?.name?.charAt(0).toUpperCase() ?? 'N'}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={11} color={Colors.gold} />
              <Text style={styles.streakBadgeText}>{currentStreak}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Friend'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
            <View style={styles.profileTags}>
              {user?.madhab && <Badge label={user.madhab} variant="muted" />}
              {user?.readingLevel && <Badge label={user.readingLevel} variant="gold" />}
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Identity card */}
        <TouchableOpacity onPress={() => router.push('/profile/identity')} activeOpacity={0.85}>
          <Card variant="gold" padding="md">
            <View style={styles.identityRow}>
              <View style={styles.identityIconWrap}>
                <Ionicons name="search-outline" size={22} color={Colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.identityTitle}>The Seeker</Text>
                <Text style={styles.identityArabic}>الطالب</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.goldDim} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Nav grid */}
        <View style={styles.navGrid}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={styles.navCard} activeOpacity={0.75}>
              <View style={styles.navIconWrap}><Ionicons name={item.icon} size={20} color={Colors.gold} /></View>
              <Text style={styles.navLabel}>{item.label}</Text>
              {item.badge && <Badge label={item.badge} variant={item.badgeVariant ?? 'muted'} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => router.push('/profile/review/queue')} style={styles.navCard} activeOpacity={0.75}>
            <View style={styles.navIconWrap}><Ionicons name="school-outline" size={20} color={Colors.gold} /></View>
            <Text style={styles.navLabel}>Review</Text>
            {dueCount > 0 && <Badge label={`${dueCount} due`} variant="coral" />}
          </TouchableOpacity>
        </View>

        {/* Review stats */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Review Queue</Text>
            <TouchableOpacity onPress={() => router.push('/profile/review/queue')} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>Open</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.gold} />
            </TouchableOpacity>
          </View>
          <Card variant="bordered" padding="md">
            <View style={styles.reviewStats}>
              {[
                { num: cards.length, label: 'Total Cards' },
                { num: dueCount,     label: 'Due Today'   },
                { num: `${retention}%`, label: 'Retention' },
              ].map((s, i, arr) => (
                <React.Fragment key={s.label}>
                  <View style={styles.reviewStat}>
                    <Text style={styles.reviewStatNum}>{s.num}</Text>
                    <Text style={styles.reviewStatLabel}>{s.label}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.reviewStatDivider} />}
                </React.Fragment>
              ))}
            </View>
            {dueCount > 0 && (
              <TouchableOpacity style={styles.reviewStartBtn} onPress={() => router.push('/profile/review/flashcard')}>
                <Ionicons name="school" size={15} color={Colors.darkBg} />
                <Text style={styles.reviewStartBtnText}>Start Review Session</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Journal */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Journal</Text>
            <TouchableOpacity onPress={() => router.push('/profile/journal')} style={styles.linkBtn}>
              <Text style={styles.linkBtnText}>All entries</Text>
              <Ionicons name="chevron-forward" size={13} color={Colors.gold} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile/reflection/write')} activeOpacity={0.82}>
            <Card variant="bordered" padding="md" style={styles.writeCard}>
              <View style={styles.writeCardRow}>
                <View style={styles.writeIconWrap}><Ionicons name="create-outline" size={18} color={Colors.gold} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.writeCardPrompt}>Write today's reflection...</Text>
                  <Text style={styles.writeCardSub}>What verse moved you today?</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 16 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.darkBg3, borderWidth: 2, borderColor: Colors.darkBorder, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 26, color: Colors.gold },
  streakBadge: { position: 'absolute', bottom: -4, right: -4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.darkBg3, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(201,164,86,0.3)' },
  streakBadgeText: { fontFamily: 'Raleway_700Bold', fontSize: 10, color: Colors.gold },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 22, color: Colors.textPrimary },
  profileEmail: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },
  profileTags: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  settingsBtn: { padding: 6 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  identityTitle: { fontFamily: 'Raleway_700Bold', fontSize: 15, color: Colors.gold },
  identityArabic: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 18, color: Colors.textMuted },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  navCard: { width: '47%', flex: 1, minWidth: '47%', backgroundColor: Colors.darkBg2, borderRadius: 14, borderWidth: 1, borderColor: Colors.darkBorder, paddingVertical: 16, paddingHorizontal: 14, gap: 8 },
  navIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  section: { gap: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 20, color: Colors.textPrimary },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkBtnText: { fontFamily: 'Raleway_600SemiBold', fontSize: 13, color: Colors.gold },
  reviewStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 4 },
  reviewStat: { alignItems: 'center', gap: 4 },
  reviewStatNum: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 26, color: Colors.textPrimary },
  reviewStatLabel: { fontFamily: 'Raleway_400Regular', fontSize: 11, color: Colors.textMuted },
  reviewStatDivider: { width: 1, height: 40, backgroundColor: Colors.darkBorder },
  reviewStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, backgroundColor: Colors.gold, borderRadius: 10, paddingVertical: 12 },
  reviewStartBtnText: { fontFamily: 'Raleway_700Bold', fontSize: 14, color: Colors.darkBg },
  writeCard: {},
  writeCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  writeIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(201,164,86,0.1)', alignItems: 'center', justifyContent: 'center' },
  writeCardPrompt: { fontFamily: 'Raleway_600SemiBold', fontSize: 14, color: Colors.textSecondary },
  writeCardSub: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted, marginTop: 3 },
});
