import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

interface TypographyProps extends Omit<TextProps, 'style'> {
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  style?: StyleProp<TextStyle>;
}

export default function Typography({ 
  children, 
  variant = 'body', 
  style,
  ...rest
}: TypographyProps) {
  return (
    <Text style={[styles.base, styles[variant], style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: '#000000',
  },
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
