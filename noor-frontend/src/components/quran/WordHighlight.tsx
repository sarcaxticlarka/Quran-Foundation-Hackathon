import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface Word {
  text: string;
  translation: string;
  transliteration: string;
  isHighlighted?: boolean;
}

interface WordHighlightProps {
  words: Word[];
  onWordPress?: (word: Word, index: number) => void;
  activeIndex?: number;
}

export function WordHighlight({ words, onWordPress, activeIndex }: WordHighlightProps) {
  return (
    <View style={styles.container}>
      {words.map((word, index) => {
        const isActive = activeIndex === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onWordPress?.(word, index)}
            style={[styles.wordContainer, isActive && styles.wordActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.arabicWord, isActive && styles.arabicWordActive]}>
              {word.text}
            </Text>
            {isActive && (
              <Text style={styles.transliteration}>{word.transliteration}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    direction: 'rtl' as any,
  },
  wordContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.transparent,
  },
  wordActive: {
    backgroundColor: Colors.goldMuted,
    borderColor: Colors.goldDim,
  },
  arabicWord: {
    fontSize: 24,
    color: Colors.textPrimary,
    lineHeight: 40,
    writingDirection: 'rtl' as any,
  },
  arabicWordActive: {
    color: Colors.goldLight,
  },
  transliteration: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
