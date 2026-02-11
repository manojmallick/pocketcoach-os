import { useSegments } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Builds a human-readable breadcrumb from the current route segments.
 * e.g. ["(drawer)", "library"] → "Library"
 * e.g. ["(drawer)", "chat"]    → "Chat"
 *
 * When a `params` map is provided we can append extra context
 * such as the coach slug:  "Chat > Habit Coach"
 */

const LABEL_MAP: Record<string, string> = {
  library: 'Library',
  chat: 'Chat',
  today: 'Today',
  settings: 'Settings',
  onboarding: 'Onboarding',
  paywall: 'Upgrade',
};

function humanize(segment: string): string {
  if (segment.startsWith('(') && segment.endsWith(')')) return ''; // layout groups
  return (
    LABEL_MAP[segment] ??
    segment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

interface BreadcrumbProps {
  /** Optional extra crumb appended at the end, e.g. a coach name */
  suffix?: string;
}

export default function Breadcrumb({ suffix }: BreadcrumbProps) {
  const segments = useSegments();

  const crumbs = segments
    .map(humanize)
    .filter(Boolean);

  if (suffix) crumbs.push(suffix);

  if (crumbs.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1}>
        {crumbs.join(' > ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  text: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
});
