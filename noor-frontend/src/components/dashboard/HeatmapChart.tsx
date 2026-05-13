import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../../theme/colors';

interface HeatmapData {
  date: string;
  value: number; // 0-4
}

interface HeatmapChartProps {
  data: HeatmapData[];
  weeks?: number;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAYS_IN_WEEK = 7;

const INTENSITY_COLORS = [
  Colors.darkBg3,           // 0 - no activity
  Colors.goldMuted,         // 1 - light
  `${Colors.gold}55`,      // 2 - medium
  `${Colors.gold}AA`,      // 3 - strong
  Colors.gold,              // 4 - full
];

function getDateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export function HeatmapChart({ data, weeks = 17 }: HeatmapChartProps) {
  const totalDays = weeks * DAYS_IN_WEEK;
  const dataMap = new Map(data.map((d) => [d.date, d.value]));

  // Build grid: columns = weeks, rows = days (0=Sun ... 6=Sat)
  const grid: Array<Array<{ date: string; value: number }>> = [];

  for (let week = 0; week < weeks; week++) {
    const col: Array<{ date: string; value: number }> = [];
    for (let day = 6; day >= 0; day--) {
      const daysAgo = week * 7 + day;
      const date = getDateKey(daysAgo);
      col.unshift({ date, value: dataMap.get(date) ?? 0 });
    }
    grid.unshift(col);
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {/* Day labels */}
        <View style={styles.dayLabels}>
          {dayLabels.map((label, i) => (
            <Text key={i} style={styles.dayLabel}>{label}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {grid.map((col, colIdx) => (
            <View key={colIdx} style={styles.column}>
              {col.map((cell, rowIdx) => (
                <View
                  key={rowIdx}
                  style={[
                    styles.cell,
                    { backgroundColor: INTENSITY_COLORS[Math.min(4, cell.value)] },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {INTENSITY_COLORS.map((color, i) => (
          <View key={i} style={[styles.cell, { backgroundColor: color }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chart: {
    flexDirection: 'row',
    gap: 4,
  },
  dayLabels: {
    gap: CELL_GAP,
    paddingTop: 2,
  },
  dayLabel: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    fontSize: 8,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: CELL_SIZE,
    marginBottom: CELL_GAP - 1,
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
    flex: 1,
    overflow: 'hidden',
  },
  column: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    justifyContent: 'flex-end',
  },
  legendLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginHorizontal: 2,
  },
});
