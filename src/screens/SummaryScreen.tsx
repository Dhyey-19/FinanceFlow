import React, { useMemo, useState, useCallback } from 'react';
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { EmptyState } from '../components/EmptyState';

type PeriodType = 'monthly' | 'yearly';

type CategorySummary = {
  id: string;
  name: string;
  color: string;
  icon: string | any;
  amount: number;
};

type PeriodSummary = {
  key: string;
  label: string;
  total: number;
  categories: CategorySummary[];
};

export function SummaryScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { state, formatCurrency } = useFinance();
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartKey, setChartKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setChartKey((prev) => prev + 1);
    }, [])
  );

  const summaryData = useMemo(() => {
    const userExpenses = state.transactions.filter(
      (t) => t.userEmail === state.auth.userEmail && t.type === 'expense'
    );

    const grouped = userExpenses.reduce((acc, t) => {
      const d = new Date(t.date);
      let key = '';
      let label = '';

      if (period === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        key = `${d.getFullYear()}`;
        label = key;
      }

      if (!acc[key]) {
        acc[key] = { key, label, total: 0, categoriesMap: {} as Record<string, CategorySummary> };
      }

      acc[key].total += t.amount;

      if (!acc[key].categoriesMap[t.categoryId]) {
        acc[key].categoriesMap[t.categoryId] = {
          id: t.categoryId,
          name: t.categoryName,
          color: t.categoryColor,
          icon: t.categoryIcon,
          amount: 0,
        };
      }
      acc[key].categoriesMap[t.categoryId].amount += t.amount;

      return acc;
    }, {} as Record<string, any>);

    const results: PeriodSummary[] = Object.values(grouped).map((group: any) => ({
      key: group.key,
      label: group.label,
      total: group.total,
      categories: Object.values(group.categoriesMap).sort(
        (a: any, b: any) => b.amount - a.amount
      ) as CategorySummary[],
    }));

    // Sort newest first
    return results.sort((a, b) => b.key.localeCompare(a.key));
  }, [state.transactions, state.auth.userEmail, period]);

  const renderChart = () => {
    if (summaryData.length === 0) return null;
    
    const chartData = [...summaryData].slice(0, 6).reverse();
    
    // Format data for Gifted Charts
    const formattedData = chartData.map((d, i) => {
      const colorPalette = [theme.colors.primary, theme.colors.success, theme.colors.danger, '#0EA5E9', '#F59E0B', '#8B5CF6'];
      return {
        value: d.total,
        label: period === 'monthly' ? d.label.substring(0, 3) : d.label,
        frontColor: theme.colors.primary,
        color: colorPalette[i % colorPalette.length],
        text: period === 'monthly' ? d.label.substring(0, 3) : d.label,
      };
    });

    const maxVal = Math.max(...formattedData.map(d => d.value));
    
    // Total horizontal padding is 16 (ScreenContainer) * 2 + 16 (chartContainer) * 2 = 64
    // We reserve some extra space for the Y-axis labels.
    const chartWidth = Dimensions.get('window').width - 100;

    // Dynamic props for scatter/dot variations on LineChart
    const lineConfig = {
      isAnimated: true,
      animationDuration: 1200,
      data: formattedData,
      color: theme.colors.primary,
      thickness: 3,
      hideDataPoints: false,
      dataPointsColor: theme.colors.primary,
      yAxisTextStyle: { color: theme.colors.textMuted, fontSize: 10 },
      xAxisLabelTextStyle: { color: theme.colors.textMuted, fontSize: 10 },
      yAxisColor: theme.colors.border,
      xAxisColor: theme.colors.border,
      rulesColor: theme.colors.border,
      maxValue: maxVal,
      noOfSections: 4,
      width: chartWidth,
      hideRules: true,
    };

    return (
      <View style={{ marginBottom: 20 }}>
        {/* Chart Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartTypeSelector}>
          {(['bar', 'line', 'pie'] as const).map(type => (
            <Pressable 
              key={type} 
              onPress={() => setChartType(type)}
              style={[styles.chartTypeBtn, chartType === type && { backgroundColor: theme.colors.primary }]}
            >
              <Text style={[styles.chartTypeText, { color: chartType === type ? '#FFF' : theme.colors.textMuted }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View key={chartKey} style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
          {chartType === 'bar' && (
            <BarChart
              isAnimated
              animationDuration={1200}
              data={formattedData}
              frontColor={theme.colors.primary}
              barWidth={24}
              noOfSections={4}
              yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
              yAxisColor={theme.colors.border}
              xAxisColor={theme.colors.border}
              rulesColor={theme.colors.border}
              maxValue={maxVal}
              width={chartWidth}
              hideRules
            />
          )}

          {chartType === 'line' && (
            <LineChart {...lineConfig} />
          )}

          {chartType === 'pie' && (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 20 }}>
              <PieChart
                isAnimated
                data={formattedData}
                radius={100}
                textColor={theme.colors.text}
                textSize={12}
                showText
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPeriodItem = ({ item }: { item: PeriodSummary }) => {
    const handleCardPress = () => {
      let fromD: Date, toD: Date;
      if (period === 'monthly') {
        const [year, month] = item.key.split('-');
        fromD = new Date(parseInt(year), parseInt(month) - 1, 1);
        toD = new Date(parseInt(year), parseInt(month), 0);
      } else {
        const year = parseInt(item.key);
        fromD = new Date(year, 0, 1);
        toD = new Date(year, 11, 31);
      }
      navigation.navigate('History', {
        fromDate: fromD.toISOString(),
        toDate: toD.toISOString(),
      });
    };

    return (
      <Pressable onPress={handleCardPress} style={[styles.periodCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.periodHeader}>
          <Text style={[styles.periodLabel, { color: theme.colors.text }]}>{item.label}</Text>
          <Text style={[styles.periodTotal, { color: theme.colors.danger }]}>{formatCurrency(item.total)}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {item.categories.map((cat) => {
          const percentage = (cat.amount / item.total) * 100;
          
          const handlePress = () => {
            let fromD: Date, toD: Date;
            if (period === 'monthly') {
              const [year, month] = item.key.split('-');
              fromD = new Date(parseInt(year), parseInt(month) - 1, 1);
              toD = new Date(parseInt(year), parseInt(month), 0);
            } else {
              const year = parseInt(item.key);
              fromD = new Date(year, 0, 1);
              toD = new Date(year, 11, 31);
            }
            navigation.navigate('History', {
              categoryFilter: cat.name,
              fromDate: fromD.toISOString(),
              toDate: toD.toISOString(),
            });
          };

          return (
            <Pressable key={cat.id} style={styles.categoryRow} onPress={handlePress}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                </View>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{cat.name}</Text>
              </View>
              
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, { color: theme.colors.text }]}>
                  {formatCurrency(cat.amount)}
                </Text>
                
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressText, { color: theme.colors.textMuted }]}>
                    {percentage.toFixed(0)}%
                  </Text>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { backgroundColor: cat.color, width: `${percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
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

      <Text style={[styles.heading, { color: theme.colors.text }]}>Summary</Text>

      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tabButton,
            period === 'monthly' && styles.tabButtonActive,
            period === 'monthly' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setPeriod('monthly')}
        >
          <Text
            style={[
              styles.tabText,
              { color: period === 'monthly' ? '#FFFFFF' : theme.colors.textMuted },
            ]}
          >
            Monthly
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            period === 'yearly' && styles.tabButtonActive,
            period === 'yearly' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setPeriod('yearly')}
        >
          <Text
            style={[
              styles.tabText,
              { color: period === 'yearly' ? '#FFFFFF' : theme.colors.textMuted },
            ]}
          >
            Yearly
          </Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={summaryData}
          keyExtractor={(item) => item.key}
          renderItem={renderPeriodItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderChart}
          ListEmptyComponent={
            <EmptyState
              title="No expenses found"
              subtitle={`You haven't recorded any expenses for the ${period} view yet.`}
            />
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 24,
    fontWeight: '700',
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chartTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  chartTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  periodCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  periodTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
  },
  progressText: {
    fontSize: 11,
    marginRight: 8,
  },
  progressBarBg: {
    height: 6,
    width: 60,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
