import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { ArabicText } from '../quran/ArabicText';
import type { ReviewCard } from '../../utils/sm2Algorithm';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlashCardProps {
  card: ReviewCard & {
    arabicText?: string;
    translation?: string;
    surahName?: string;
  };
  onRate: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
}

export function FlashCard({ card, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flip = () => {
    if (flipped) return;
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setFlipped(true);
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.container}>
      {/* Card */}
      <TouchableOpacity onPress={flip} activeOpacity={0.95} style={styles.cardWrapper}>
        {/* Front */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ rotateY: frontRotate }], opacity: frontOpacity },
          ]}
        >
          <View style={styles.verseKeyBadge}>
            <Text style={styles.verseKey}>{card.verseKey}</Text>
          </View>
          <ArabicText
            text={card.arabicText ?? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
            size="xl"
            color={Colors.goldLight}
          />
          <Text style={styles.tapHint}>Tap to reveal translation</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ rotateY: backRotate }], opacity: backOpacity },
          ]}
        >
          <ArabicText
            text={card.arabicText ?? ''}
            size="lg"
            color={Colors.goldLight}
          />
          <View style={styles.divider} />
          <Text style={styles.translation}>
            {card.translation ?? 'In the name of Allah, the Most Gracious, the Most Merciful.'}
          </Text>
          {card.surahName && (
            <Text style={styles.surahName}>{card.surahName}</Text>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Rating buttons (shown after flip) */}
      {flipped && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>How well did you remember?</Text>
          <View style={styles.ratingButtons}>
            {RATING_BUTTONS.map((btn) => (
              <TouchableOpacity
                key={btn.quality}
                onPress={() => onRate(btn.quality as 0 | 1 | 2 | 3 | 4 | 5)}
                style={[styles.ratingBtn, { backgroundColor: btn.color }]}
              >
                <Text style={styles.ratingBtnLabel}>{btn.label}</Text>
                <Text style={styles.ratingBtnSub}>{btn.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const RATING_BUTTONS = [
  { quality: 1, label: 'Again', sub: 'Forgot', color: Colors.error },
  { quality: 3, label: 'Hard', sub: 'Difficult', color: Colors.coral },
  { quality: 4, label: 'Good', sub: 'Recalled', color: Colors.teal },
  { quality: 5, label: 'Easy', sub: 'Perfect', color: Colors.blue },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  cardWrapper: {
    height: 340,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.darkCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backgroundColor: Colors.darkBg2,
    borderColor: Colors.goldDim,
  },
  verseKeyBadge: {
    backgroundColor: Colors.goldMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  verseKey: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tapHint: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.darkBorder,
  },
  translation: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  surahName: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  ratingContainer: {
    gap: 12,
  },
  ratingTitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 2,
  },
  ratingBtnLabel: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  ratingBtnSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
});
