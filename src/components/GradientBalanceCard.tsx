import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme, useFinance } from '../context/FinanceContext';

type Props = {
  income: number;
  expenses: number;
  balance: number;
};

export function GradientBalanceCard({ income, expenses, balance }: Props) {
  const { formatCurrency } = useFinance();
  const theme = useAppTheme();

  const format = (value: number) => formatCurrency(value);

  return (
    <LinearGradient
      colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.label}>Available Balance</Text>
      <Text style={styles.balance}>{format(balance)}</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>{format(income)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>{format(expenses)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  label: {
    color: '#DBEAFE',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: '#BFDBFE',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
