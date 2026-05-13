import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import { CRISIS_MOOD_OPTIONS } from '../../utils/constants';

interface MoodChipsProps {
  selected?: string;
  onSelect: (mood: string) => void;
}

export function MoodChips({ selected, onSelect }: MoodChipsProps) {
  return (
    <View style={styles.grid}>
      {CRISIS_MOOD_OPTIONS.map((mood) => {
        const isSelected = selected === mood.id;
        return (
          <TouchableOpacity
            key={mood.id}
            onPress={() => onSelect(mood.id)}
            activeOpacity={0.75}
            style={[
              styles.chip,
              isSelected && { borderColor: mood.color, backgroundColor: `${mood.color}22` },
            ]}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[styles.label, isSelected && { color: mood.color }]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  chip: {
    width: '44%',
    backgroundColor: Colors.darkCard,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.darkBorder,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
