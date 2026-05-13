import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Card } from '../ui/Card';

interface TafsirCardProps {
  text: string;
  source: string;
  author?: string;
  verseKey: string;
}

export function TafsirCard({ text, source, author, verseKey }: TafsirCardProps) {
  const [expanded, setExpanded] = useState(false);
  const preview = text.slice(0, 200);
  const hasMore = text.length > 200;

  return (
    <Card variant="default" padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Tafsir</Text>
        </View>
        <Text style={styles.source}>{source}</Text>
        {author && <Text style={styles.author}>— {author}</Text>}
      </View>

      <Text style={styles.text}>
        {expanded || !hasMore ? text : `${preview}...`}
      </Text>

      {hasMore && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {expanded ? 'Show less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: Colors.tealDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { color: Colors.tealLight, fontSize: 10, fontWeight: '700' },
  source: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  author: { color: Colors.textMuted, fontSize: 12, flex: 1, textAlign: 'right' },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  toggle: { marginTop: 8 },
  toggleText: { color: Colors.gold, fontSize: 13, fontWeight: '600' },
});
