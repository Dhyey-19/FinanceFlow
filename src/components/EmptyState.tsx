import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../context/FinanceContext';

type Props = {
  title: string;
  subtitle: string;
};

export function EmptyState({ title, subtitle }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
      <Ionicons name="sparkles-outline" size={28} color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
