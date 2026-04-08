import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme, useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';

type Props = {
  item: Transaction;
  onPress?: (item: Transaction) => void;
};

export function TransactionItem({ item, onPress }: Props) {
  const theme = useAppTheme();
  const { formatCurrency } = useFinance();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  const sign = item.type === 'income' ? '+' : '-';
  const color = item.type === 'income' ? theme.colors.success : theme.colors.danger;

  const amount = formatCurrency(item.amount);

  return (
    <Animated.View style={{ opacity: fade }}>
      <Pressable onPress={() => onPress?.(item)}>
        <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: `${item.categoryColor}22` }]}>
            <Ionicons name={item.categoryIcon as keyof typeof Ionicons.glyphMap} size={18} color={item.categoryColor} />
          </View>
          <View style={styles.left}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{item.categoryName}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {item.note || 'No note'}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color }]}>{`${sign}${amount}`}</Text>
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {new Date(item.date).toLocaleDateString('en-IN')}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
