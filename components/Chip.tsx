import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface ChipProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
}

export default function Chip({ label, variant = 'default', style }: ChipProps) {
  return (
    <View style={[styles.chip, styles[`${variant}Chip`], style]}>
      <Text style={[styles.chipText, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  defaultChip: {
    backgroundColor: '#F5F5F5',
  },
  successChip: {
    backgroundColor: '#E8F5E9',
  },
  warningChip: {
    backgroundColor: '#FFF3E0',
  },
  errorChip: {
    backgroundColor: '#FFEBEE',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultText: {
    color: '#666666',
  },
  successText: {
    color: '#2E7D32',
  },
  warningText: {
    color: '#E65100',
  },
  errorText: {
    color: '#C62828',
  },
});
