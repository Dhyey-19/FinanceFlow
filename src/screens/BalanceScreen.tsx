import React from 'react';
import { Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAppDialog } from '../components/AppDialogProvider';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';

type ExpenseBucket = {
  name: string;
  amount: number;
  color: string;
};

export function BalanceScreen() {
  const { state, addSavingsGoal, removeSavingsGoal, formatCurrency } = useFinance();
  const { showConfirm, showMessage } = useAppDialog();
  const theme = useAppTheme();
  const [goalTitle, setGoalTitle] = React.useState('');
  const [goalTarget, setGoalTarget] = React.useState('');
  const sectionAnimations = React.useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const scoreProgress = React.useRef(new Animated.Value(0)).current;
  const expenseBarsProgress = React.useRef(new Animated.Value(0)).current;
  const goalBarsProgress = React.useRef(new Animated.Value(0)).current;

  const userTransactions = state.transactions.filter((item) => item.userEmail === state.auth.userEmail);
  const income = userTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = userTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const balance = income - expenses;
  const effectiveSavings = Math.max(0, balance);

  const expenseMap = new Map<string, ExpenseBucket>();
  userTransactions
    .filter((item) => item.type === 'expense')
    .forEach((item) => {
      const current = expenseMap.get(item.categoryId);
      if (current) {
        current.amount += item.amount;
      } else {
        expenseMap.set(item.categoryId, {
          name: item.categoryName,
          amount: item.amount,
          color: item.categoryColor,
        });
      }
    });

  const categoryBuckets = Array.from(expenseMap.values()).sort((a, b) => b.amount - a.amount);
  const maxCategoryAmount = categoryBuckets[0]?.amount || 1;

  const utilization = income <= 0 ? 1 : expenses / income;
  const rawScore = Math.round(850 - utilization * 300);
  const creditScore = Math.max(300, Math.min(850, rawScore));
  const scoreBand =
    creditScore >= 750
      ? 'Excellent'
      : creditScore >= 670
        ? 'Good'
        : creditScore >= 580
          ? 'Average'
          : 'Needs Work';
  const scoreRatio = (creditScore - 300) / (850 - 300);

  const levels = [580, 670, 750, 850];
  const nextLevel = levels.find((level) => level > creditScore);
  const pointsToNext = nextLevel ? nextLevel - creditScore : 0;

  const savingsGoals = state.goals.filter((item) => item.userEmail === state.auth.userEmail);

  useFocusEffect(
    React.useCallback(() => {
      sectionAnimations.forEach((value) => value.setValue(0));
      const animations = sectionAnimations.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      );

      Animated.stagger(120, animations).start();

      scoreProgress.setValue(0);
      const animation = Animated.timing(scoreProgress, {
        toValue: 1,
        duration: 1800,
        delay: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });

      animation.start();

      expenseBarsProgress.setValue(0);
      goalBarsProgress.setValue(0);
      Animated.timing(expenseBarsProgress, {
        toValue: 1,
        duration: 1000,
        delay: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(goalBarsProgress, {
        toValue: 1,
        duration: 1000,
        delay: 720,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      return () => {
        scoreProgress.stopAnimation();
        expenseBarsProgress.stopAnimation();
        goalBarsProgress.stopAnimation();
      };
    }, [expenseBarsProgress, goalBarsProgress, scoreProgress, scoreRatio, sectionAnimations]),
  );

  const getSectionStyle = (index: number) => ({
    opacity: sectionAnimations[index],
    transform: [
      {
        translateY: sectionAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  });

  const onAddGoal = () => {
    const title = goalTitle.trim();
    const targetAmount = Number(goalTarget);

    if (!title) {
      showMessage({
        title: 'Goal title required',
        message: 'Please enter a title for the savings goal.',
        variant: 'warning',
      });
      return;
    }

    if (!targetAmount || Number.isNaN(targetAmount) || targetAmount <= 0) {
      showMessage({
        title: 'Invalid target',
        message: 'Please enter a valid target amount greater than zero.',
        variant: 'warning',
      });
      return;
    }

    addSavingsGoal({
      title,
      targetAmount,
    });

    setGoalTitle('');
    setGoalTarget('');
    showMessage({
      title: 'Goal added',
      message: 'Savings goal created successfully.',
      variant: 'success',
    });
  };

  const onRemoveGoal = (id: string, title: string) => {
    showConfirm({
      title: 'Delete savings goal',
      message: `Remove "${title}" from your goals?`,
      variant: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => removeSavingsGoal(id),
    });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={getSectionStyle(0)}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: theme.colors.text }]}>
            <Image source={require('../../assets/financeflow_logo.png')} style={styles.brandLogo} resizeMode="cover" />
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[styles.brandText, { color: theme.colors.text }]}
          >
            FinanceFlow
          </Text>
        </View>

        <Text style={[styles.heading, { color: theme.colors.text }]}>Balance Overview</Text>
        <Text style={[styles.subheading, { color: theme.colors.textMuted }]}>Category-wise expenses and credit score</Text>
        </Animated.View>

        <Animated.View style={getSectionStyle(1)}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Total Income</Text>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>{formatCurrency(income)}</Text>
            </View>
            <View>
              <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>Total Expense</Text>
              <Text style={[styles.statValue, { color: theme.colors.danger }]}>{formatCurrency(expenses)}</Text>
            </View>
          </View>
        </View>
        </Animated.View>

        <Animated.View style={getSectionStyle(2)}>
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>Credit Score</Text>

          <View style={styles.gaugeWrap}>
            <SemiGauge ratio={scoreRatio} progress={scoreProgress} color={theme.colors.primary} track={theme.colors.border} />
            <View style={styles.gaugeCenter}>
              <Text style={[styles.scoreBand, { color: theme.colors.textMuted }]}>{scoreBand}</Text>
              <Text style={[styles.scoreValue, { color: theme.colors.text }]}>{creditScore}</Text>
              {nextLevel ? (
                <Text style={[styles.nextLevel, { color: theme.colors.textMuted }]}>
                  Need <Text style={{ color: '#F59E0B', fontWeight: '700' }}>+{pointsToNext}pts</Text> for next level
                </Text>
              ) : (
                <Text style={[styles.nextLevel, { color: theme.colors.textMuted }]}>You are at the highest level</Text>
              )}
            </View>
          </View>

          <View style={styles.rangeRow}>
            <Text style={[styles.rangeText, { color: theme.colors.textMuted }]}>300</Text>
            <Text style={[styles.rangeText, { color: theme.colors.textMuted }]}>850</Text>
          </View>

          <Text style={[styles.scoreHint, { color: theme.colors.textMuted }]}>
            Score is based on your income-to-expense ratio. Lower spending relative to income increases score.
          </Text>
        </View>
        </Animated.View>

        <Animated.View style={getSectionStyle(3)}>
        <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Expenses by Category</Text>

          {categoryBuckets.length === 0 ? (
            <EmptyState title="No expense data" subtitle="Add expense transactions to generate your category chart." />
          ) : (
            <View style={styles.chartList}>
              {categoryBuckets.map((bucket) => {
                const widthPercent = Math.max(6, (bucket.amount / maxCategoryAmount) * 100);
                const animatedWidth = expenseBarsProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${widthPercent}%`],
                });
                return (
                  <View key={bucket.name} style={styles.chartRow}>
                    <View style={styles.chartLabels}>
                      <Text style={[styles.categoryText, { color: theme.colors.text }]} numberOfLines={1}>
                        {bucket.name}
                      </Text>
                      <Text style={[styles.amountText, { color: theme.colors.textMuted }]}>{formatCurrency(bucket.amount)}</Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: theme.colors.input }]}> 
                      <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: bucket.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        </Animated.View>

        <Animated.View style={getSectionStyle(4)}>
        <View style={[styles.goalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.chartTitle, { color: theme.colors.text }]}>Savings Goals</Text>
          <Text style={[styles.goalHint, { color: theme.colors.textMuted }]}>
            Progress is tracked against your current balance ({formatCurrency(balance)}).
          </Text>

          <View style={styles.goalInputRow}>
            <TextInput
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="Goal name (e.g. New Phone)"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.goalInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
            />
            <TextInput
              value={goalTarget}
              onChangeText={setGoalTarget}
              keyboardType="numeric"
              placeholder="Target"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.goalInput, styles.goalTargetInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
            />
          </View>

          <Pressable onPress={onAddGoal} style={[styles.goalAddBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.goalAddText}>Add Goal</Text>
          </Pressable>

          {savingsGoals.length === 0 ? (
            <Text style={[styles.goalEmpty, { color: theme.colors.textMuted }]}>No savings goals yet.</Text>
          ) : (
            <View style={styles.goalList}>
              {savingsGoals.map((goal) => {
                const ratio = Math.max(0, Math.min(1, effectiveSavings / goal.targetAmount));
                const percent = Math.round(ratio * 100);
                const animatedWidth = goalBarsProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', `${Math.max(3, ratio * 100)}%`],
                });
                return (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalRowTop}>
                      <Text style={[styles.goalTitle, { color: theme.colors.text }]} numberOfLines={1}>
                        {goal.title}
                      </Text>
                      <Pressable onPress={() => onRemoveGoal(goal.id, goal.title)}>
                        <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                    <Text style={[styles.goalMeta, { color: theme.colors.textMuted }]}>
                      {formatCurrency(effectiveSavings)} / {formatCurrency(goal.targetAmount)} ({percent}%)
                    </Text>
                    <View style={[styles.track, { backgroundColor: theme.colors.input }]}> 
                      <Animated.View style={[styles.fill, { width: animatedWidth, backgroundColor: theme.colors.success }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

function SemiGauge({ ratio, progress, color, track }: { ratio: number; progress: Animated.Value; color: string; track: string }) {
  const width = 250;
  const height = 140;
  const stroke = 10;

  const leftX = stroke;
  const rightX = width - stroke;
  const centerX = width / 2;
  const centerY = height;
  const radius = (rightX - leftX) / 2;

  const startX = leftX;
  const startY = centerY;
  const endX = rightX;
  const endY = centerY;

  const clamped = Math.max(0, Math.min(1, ratio));

  const trackPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  const arcLength = Math.PI * radius;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [arcLength, arcLength * (1 - clamped)],
  });

  return (
    <Svg width={width} height={height}>
      <Path d={trackPath} stroke={track} strokeWidth={stroke} fill="none" strokeLinecap="round" opacity={0.25} />
      <AnimatedPath
        d={trackPath}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${arcLength}`}
        strokeDashoffset={strokeDashoffset as unknown as number}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 20,
  },
  brandRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  heading: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
  },
  subheading: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 13,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  goalHint: {
    marginTop: -2,
    marginBottom: 10,
    fontSize: 12,
  },
  goalInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalInput: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  goalTargetInput: {
    maxWidth: 110,
  },
  goalAddBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  goalAddText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  goalEmpty: {
    marginTop: 12,
    fontSize: 12,
  },
  goalList: {
    marginTop: 10,
    gap: 10,
  },
  goalItem: {
    gap: 5,
  },
  goalRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '92%',
  },
  goalMeta: {
    fontSize: 11,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  gaugeWrap: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  gaugeCenter: {
    position: 'absolute',
    top: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    marginTop: 2,
    fontSize: 42,
    fontWeight: '800',
  },
  scoreBand: {
    fontSize: 18,
    fontWeight: '600',
  },
  nextLevel: {
    marginTop: 4,
    fontSize: 12,
  },
  rangeRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  chartList: {
    gap: 10,
  },
  chartRow: {
    gap: 6,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '55%',
  },
  amountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  track: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
