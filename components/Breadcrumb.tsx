import { useLocalSearchParams, useSegments } from 'expo-router';
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
  insights: 'Insights',
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

function titleFromParam(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface BreadcrumbProps {
  /** Optional extra crumb appended at the end, e.g. a coach name */
  suffix?: string;
}

export default function Breadcrumb({ suffix }: BreadcrumbProps) {
  const segments = useSegments();
  const params = useLocalSearchParams();

  const crumbs = segments
    .map(humanize)
    .filter(Boolean);

  const coachParam = params.coach_slug;
  const coachSlug = Array.isArray(coachParam) ? coachParam[0] : coachParam;
  const isChat = segments.includes('chat');
  const autoSuffix = isChat && coachSlug ? titleFromParam(coachSlug) : undefined;
  const finalSuffix = suffix ?? autoSuffix;

  if (finalSuffix) crumbs.push(finalSuffix);

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
