import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { ArabicText } from './ArabicText';
import { Card } from '../ui/Card';

interface VerseCardProps {
  verseKey: string;
  arabicText: string;
  translation?: string;
  surahName?: string;
  onPress?: () => void;
  onBookmark?: () => void;
  onPlay?: () => void;
  isBookmarked?: boolean;
  isPlaying?: boolean;
  isAudioLoading?: boolean;
  showKey?: boolean;
  compact?: boolean;
}

export function VerseCard({
  verseKey,
  arabicText,
  translation,
  surahName,
  onPress,
  onBookmark,
  onPlay,
  isBookmarked = false,
  isPlaying = false,
  isAudioLoading = false,
  showKey = true,
  compact = false,
}: VerseCardProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.8}>
      <Card variant="bordered" padding={compact ? 'sm' : 'lg'} style={styles.card}>
        {/* Header */}
        {(showKey || surahName) && (
          <View style={styles.header}>
            <View style={styles.verseKeyBadge}>
              <Text style={styles.verseKeyText}>{verseKey}</Text>
            </View>
            {surahName && <Text style={styles.surahName}>{surahName}</Text>}
            {onPlay && (
              <TouchableOpacity onPress={onPlay} style={styles.audioBtn} activeOpacity={0.7}>
                {isAudioLoading ? (
                  <ActivityIndicator size="small" color={Colors.teal} />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause-circle' : 'play-circle'}
                    size={26}
                    color={isPlaying ? Colors.teal : Colors.textMuted}
                  />
                )}
              </TouchableOpacity>
            )}
            {onBookmark && (
              <TouchableOpacity onPress={onBookmark} style={styles.bookmarkBtn}>
                <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={Colors.gold} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Arabic Text */}
        <View style={styles.arabicContainer}>
          <ArabicText
            text={arabicText}
            size={compact ? 'base' : 'lg'}
            color={Colors.goldLight}
            centered
          />
        </View>

        {/* Translation */}
        {translation && (
          <View style={styles.divider} />
        )}
        {translation && (
          <Text style={[styles.translation, compact && styles.translationCompact]}>
            {translation}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  verseKeyBadge: {
    backgroundColor: Colors.goldMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  verseKeyText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  surahName: {
    fontFamily: 'Raleway_400Regular',
    color: Colors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  audioBtn: {
    padding: 2,
  },
  bookmarkBtn: {
    padding: 4,
  },
  arabicContainer: {
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.darkBorder,
    marginVertical: 12,
  },
  translation: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  translationCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
});
