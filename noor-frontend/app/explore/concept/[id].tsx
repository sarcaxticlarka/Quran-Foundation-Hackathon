import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/theme/colors';
import { Card } from '../../../src/components/ui/Card';
import { useSavedStore } from '../../../src/stores/savedStore';

const CONCEPT_DATA: Record<string, {
  label: string; arabic: string; color: string; definition: string;
  verses: Array<{ key: string; arabic: string; translation: string; surah: string }>;
}> = {
  mercy: {
    label: 'Mercy', arabic: 'رحمة', color: Colors.teal,
    definition: 'Rahmah — divine mercy and compassion. Allah describes Himself as Ar-Rahman and Ar-Rahim, the two greatest names of mercy. His mercy encompasses all things.',
    verses: [
      { key: '2:163', arabic: 'وَإِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ لَّا إِلَٰهَ إِلَّا هُوَ الرَّحْمَٰنُ الرَّحِيمُ', translation: 'And your god is one God. There is no deity except Him, the Entirely Merciful, the Especially Merciful.', surah: 'Al-Baqarah 2:163' },
      { key: '6:12', arabic: 'كَتَبَ عَلَىٰ نَفْسِهِ الرَّحْمَةَ', translation: 'He has decreed upon Himself mercy. He will surely assemble you for the Day of Resurrection.', surah: 'Al-Anam 6:12' },
      { key: '7:156', arabic: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ', translation: 'My mercy encompasses all things. So I will decree it for those who fear Me.', surah: 'Al-Araf 7:156' },
      { key: '39:53', arabic: 'إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا', translation: 'Indeed, Allah forgives all sins. Indeed, it is He who is the Forgiving, the Merciful.', surah: 'Az-Zumar 39:53' },
    ],
  },
  justice: {
    label: 'Justice', arabic: 'عدل', color: Colors.gold,
    definition: 'Adl — divine justice and equity. Allah commands justice in all matters and stands as the supreme judge who wrongs no soul even by the weight of an atom.',
    verses: [
      { key: '4:40', arabic: 'إِنَّ اللَّهَ لَا يَظْلِمُ مِثْقَالَ ذَرَّةٍ', translation: 'Indeed, Allah does not wrong anyone by as much as an atom\'s weight.', surah: 'An-Nisa 4:40' },
      { key: '16:90', arabic: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ', translation: 'Indeed, Allah commands justice, good conduct, and giving to relatives.', surah: 'An-Nahl 16:90' },
      { key: '5:8', arabic: 'اعْدِلُوا هُوَ أَقْرَبُ لِلتَّقْوَىٰ', translation: 'Be just; that is nearer to righteousness. And fear Allah; indeed, Allah is acquainted with what you do.', surah: 'Al-Maidah 5:8' },
      { key: '57:25', arabic: 'لِيَقُومَ النَّاسُ بِالْقِسْطِ', translation: 'So that people may stand forth in justice.', surah: 'Al-Hadid 57:25' },
    ],
  },
  patience: {
    label: 'Patience', arabic: 'صبر', color: Colors.coral,
    definition: 'Sabr — steadfast patience and perseverance. One of the most praised virtues in the Quran, Allah promises limitless reward for those who are patient.',
    verses: [
      { key: '2:153', arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', translation: 'Indeed, Allah is with the patient.', surah: 'Al-Baqarah 2:153' },
      { key: '3:200', arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اصْبِرُوا وَصَابِرُوا', translation: 'O you who have believed, persevere and endure and remain stationed and fear Allah that you may be successful.', surah: 'Ali Imran 3:200' },
      { key: '39:10', arabic: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ', translation: 'Indeed, the patient will be given their reward without account.', surah: 'Az-Zumar 39:10' },
      { key: '94:5', arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'For indeed, with hardship will be ease.', surah: 'Ash-Sharh 94:5' },
    ],
  },
  knowledge: {
    label: 'Knowledge', arabic: 'علم', color: '#7856FF',
    definition: 'Ilm — sacred knowledge and wisdom. The first revelation commanded "Read!" Knowledge is the path to understanding Allah\'s signs and is elevated above mere worldly gain.',
    verses: [
      { key: '96:1', arabic: 'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ', translation: 'Read in the name of your Lord who created.', surah: 'Al-Alaq 96:1' },
      { key: '20:114', arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', translation: 'And say, My Lord, increase me in knowledge.', surah: 'Ta-Ha 20:114' },
      { key: '58:11', arabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', translation: 'Allah will raise those who have believed among you and those who were given knowledge, by degrees.', surah: 'Al-Mujadila 58:11' },
      { key: '35:28', arabic: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ', translation: 'Only those fear Allah, from among His servants, who have knowledge.', surah: 'Fatir 35:28' },
    ],
  },
  gratitude: {
    label: 'Gratitude', arabic: 'شكر', color: Colors.gold,
    definition: 'Shukr — thankfulness and gratitude to Allah. True shukr is expressed in the heart, on the tongue, and through righteous action. Allah promises to increase blessings for those who are grateful.',
    verses: [
      { key: '14:7', arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', translation: 'If you are grateful, I will surely increase you in favor.', surah: 'Ibrahim 14:7' },
      { key: '2:152', arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ', translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.', surah: 'Al-Baqarah 2:152' },
      { key: '31:12', arabic: 'وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ', translation: 'And whoever is grateful — his gratitude is only for the benefit of himself.', surah: 'Luqman 31:12' },
      { key: '16:18', arabic: 'وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا', translation: 'And if you should count the favors of Allah, you could not enumerate them.', surah: 'An-Nahl 16:18' },
    ],
  },
  tawakkul: {
    label: 'Trust in Allah', arabic: 'توكل', color: Colors.teal,
    definition: 'Tawakkul — complete reliance and trust in Allah. It is to do one\'s utmost and then surrender the outcome entirely to Allah, knowing He is the best of planners.',
    verses: [
      { key: '3:173', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ', translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs.', surah: 'Ali Imran 3:173' },
      { key: '65:3', arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ', translation: 'And whoever relies upon Allah — then He is sufficient for him.', surah: 'At-Talaq 65:3' },
      { key: '9:51', arabic: 'قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا', translation: 'Say, Never will we be struck except by what Allah has decreed for us.', surah: 'At-Tawbah 9:51' },
      { key: '8:2', arabic: 'وَعَلَىٰ رَبِّهِمْ يَتَوَكَّلُونَ', translation: 'And upon their Lord they rely.', surah: 'Al-Anfal 8:2' },
    ],
  },
};

export default function ConceptDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const concept = CONCEPT_DATA[id as string] ?? CONCEPT_DATA.mercy;

  const savedVerses = useSavedStore((s) => s.verses);
  const save = useSavedStore((s) => s.save);
  const remove = useSavedStore((s) => s.remove);

  const isSaved = (key: string) => savedVerses.some((v) => v.verseKey === key);

  const toggleSave = (verse: typeof concept.verses[0]) => {
    if (isSaved(verse.key)) {
      remove(verse.key);
    } else {
      save({ verseKey: verse.key, translation: verse.translation, arabicText: verse.arabic });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.gold} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{concept.label}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.conceptHero, { borderColor: concept.color + '44' }]}>
          <View style={[styles.heroCircle, { backgroundColor: concept.color + '22', borderColor: concept.color + '55' }]}>
            <Text style={[styles.heroArabic, { color: concept.color }]}>{concept.arabic}</Text>
          </View>
          <Text style={styles.heroLabel}>{concept.label}</Text>
          <Text style={styles.heroDefinition}>{concept.definition}</Text>
        </View>

        <Text style={styles.sectionTitle}>Verses About {concept.label}</Text>

        {concept.verses.map((verse) => {
          const saved = isSaved(verse.key);
          return (
            <Card key={verse.key} variant="bordered" padding="md" style={styles.verseCard}>
              <View style={styles.verseKeyRow}>
                <View style={styles.keyBadge}>
                  <Text style={styles.keyBadgeText}>{verse.key}</Text>
                </View>
                <Text style={styles.surahLabel}>{verse.surah}</Text>
              </View>
              <Text style={styles.arabic}>{verse.arabic}</Text>
              <Text style={styles.translation}>{verse.translation}</Text>
              <TouchableOpacity
                style={[styles.bookmarkBtn, saved && styles.bookmarkBtnSaved]}
                onPress={() => toggleSave(verse)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={14}
                  color={saved ? Colors.darkBg : Colors.gold}
                />
                <Text style={[styles.bookmarkText, saved && styles.bookmarkTextSaved]}>
                  {saved ? 'Saved' : 'Save Verse'}
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorder,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backText: { fontFamily: 'Raleway_600SemiBold', color: Colors.gold, fontSize: 14 },
  headerTitle: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 18, color: Colors.textPrimary },
  scroll: { padding: 20, gap: 16 },

  conceptHero: {
    alignItems: 'center', gap: 12, paddingVertical: 28,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 20,
    backgroundColor: Colors.darkBg2,
  },
  heroCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  heroArabic: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 36 },
  heroLabel: { fontFamily: 'Raleway_700Bold', fontSize: 22, color: Colors.textPrimary },
  heroDefinition: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  sectionTitle: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },

  verseCard: { gap: 10 },
  verseKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keyBadge: {
    backgroundColor: Colors.gold + '22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.gold + '44',
  },
  keyBadgeText: { fontFamily: 'Raleway_700Bold', fontSize: 11, color: Colors.gold },
  surahLabel: { fontFamily: 'Raleway_400Regular', fontSize: 12, color: Colors.textMuted },

  arabic: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 22, color: Colors.goldLight, textAlign: 'right',
    lineHeight: 38, writingDirection: 'rtl',
  },
  translation: { fontFamily: 'Raleway_400Regular', fontSize: 14, color: Colors.textPrimary, lineHeight: 22, fontStyle: 'italic' },

  bookmarkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.darkBg3 ?? Colors.darkBorder,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.gold + '44',
  },
  bookmarkBtnSaved: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  bookmarkText: { fontFamily: 'Raleway_600SemiBold', fontSize: 12, color: Colors.gold },
  bookmarkTextSaved: { color: Colors.darkBg },
});
