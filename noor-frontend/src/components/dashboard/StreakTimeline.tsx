import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';

interface DayData {
  date: string;
  completed: boolean;
}

interface StreakTimelineProps {
  days: DayData[];
  onDayPress?: (day: DayData) => void;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function StreakTimeline({ days, onDayPress }: StreakTimelineProps) {
  return (
    <View style={styles.container}>
      {days.map((day, index) => {
        const date = new Date(day.date);
        const dayOfWeek = date.getDay();
        const dayNum = date.getDate();
        const isToday = day.date === new Date().toISOString().split('T')[0];

        return (
          <TouchableOpacity
            key={day.date}
            style={styles.dayColumn}
            onPress={() => onDayPress?.(day)}
            activeOpacity={onDayPress ? 0.72 : 1}
            disabled={!onDayPress}
          >
            <Text style={styles.dayLabel}>{DAY_LABELS[dayOfWeek]}</Text>
            <View
              style={[
                styles.dayCircle,
                day.completed && styles.dayCircleActive,
                isToday && styles.dayCircleToday,
              ]}
            >
              <Text
                style={[
                  styles.dayNum,
                  day.completed && styles.dayNumActive,
                  isToday && styles.dayNumToday,
                ]}
              >
                {dayNum}
              </Text>
            </View>
            {day.completed && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkBg3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.transparent,
  },
  dayCircleActive: {
    backgroundColor: Colors.goldMuted,
    borderColor: Colors.goldDim,
  },
  dayCircleToday: {
    borderColor: Colors.gold,
  },
  dayNum: {
    fontFamily: 'Raleway_600SemiBold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  dayNumActive: {
    color: Colors.gold,
  },
  dayNumToday: {
    color: Colors.goldLight,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
});
