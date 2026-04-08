import React from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { useAppDialog } from '../components/AppDialogProvider';
import { EmptyState } from '../components/EmptyState';
import { ScreenContainer } from '../components/ScreenContainer';
import { TransactionItem } from '../components/TransactionItem';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';

type Filter = 'all' | TransactionType;
type DateRange = 'all' | 'today' | 'week' | 'month' | 'custom';
type SortBy = 'dateDesc' | 'dateAsc' | 'amountHigh' | 'amountLow';

export function TransactionsScreen() {
  const [filter, setFilter] = React.useState<Filter>('all');
  const [dateRange, setDateRange] = React.useState<DateRange>('all');
  const [sortBy, setSortBy] = React.useState<SortBy>('dateDesc');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [showSortModal, setShowSortModal] = React.useState(false);
  const [fromDate, setFromDate] = React.useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState(new Date());
  const [showFromPicker, setShowFromPicker] = React.useState(false);
  const [showToPicker, setShowToPicker] = React.useState(false);
  const [lastDeleted, setLastDeleted] = React.useState<Transaction | null>(null);
  const [showUndo, setShowUndo] = React.useState(false);
  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerAnimations = React.useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  const listAnimation = React.useRef(new Animated.Value(0)).current;

  const { state, getMonthlySummary, deleteTransaction, restoreTransaction, formatCurrency } = useFinance();
  const { showConfirm, showMessage } = useAppDialog();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  React.useEffect(() => {
    if (route.params?.categoryFilter || (route.params?.fromDate && route.params?.toDate)) {
      if (route.params.categoryFilter) {
        setCategoryFilter(route.params.categoryFilter);
      } else {
        setCategoryFilter('all');
      }
      
      if (route.params.fromDate && route.params.toDate) {
        setDateRange('custom');
        setFromDate(new Date(route.params.fromDate));
        setToDate(new Date(route.params.toDate));
      }
      setFilter('expense');
      
      // Clear params so it doesn't re-apply when navigating back normally
      navigation.setParams({
        categoryFilter: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
    }
  }, [route.params?.categoryFilter, route.params?.fromDate, route.params?.toDate]);

  const today = new Date();
  
  // Calculate summary based on current date range if custom, otherwise today's month
  const getDisplaySummary = () => {
    if (dateRange === 'custom' && fromDate && toDate) {
      if (
        fromDate.getMonth() === toDate.getMonth() && 
        fromDate.getFullYear() === toDate.getFullYear()
      ) {
        return getMonthlySummary(fromDate.getMonth(), fromDate.getFullYear());
      }
      
      if (fromDate.getFullYear() === toDate.getFullYear()) {
        const matchingTx = state.transactions.filter(t => {
          const tDate = new Date(t.date);
          return t.userEmail === state.auth.userEmail && 
                 tDate >= fromDate && 
                 tDate <= new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);
        });
        const totalExpenses = matchingTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = matchingTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        return { expenses: totalExpenses, income: totalIncome, balance: totalIncome - totalExpenses };
      }
    }
    
    return getMonthlySummary(today.getMonth(), today.getFullYear());
  };
  
  const summary = getDisplaySummary();

  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const normalizedQuery = query.trim().toLowerCase();

  useFocusEffect(
    React.useCallback(() => {
      headerAnimations.forEach((value) => value.setValue(0));
      listAnimation.setValue(0);

      const headerSequence = headerAnimations.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      );

      Animated.stagger(90, headerSequence).start();
      Animated.timing(listAnimation, {
        toValue: 1,
        duration: 520,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      return undefined;
    }, [headerAnimations, listAnimation]),
  );

  const getHeaderStyle = (index: number) => ({
    opacity: headerAnimations[index],
    transform: [
      {
        translateY: headerAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });
  const availableCategories = React.useMemo(() => {
    const names = Array.from(
      new Set(
        state.transactions
          .filter((item) => item.userEmail === state.auth.userEmail)
          .map((item) => item.categoryName),
      ),
    );
    return names.sort((a, b) => a.localeCompare(b));
  }, [state.transactions, state.auth.userEmail]);

  const filtered = state.transactions.filter((item) => {
    if (item.userEmail !== state.auth.userEmail) {
      return false;
    }

    if (filter !== 'all' && item.type !== filter) {
      return false;
    }

    if (categoryFilter !== 'all' && item.categoryName.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    const txDate = new Date(item.date);
    if (dateRange === 'today') {
      const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
      const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (txDay.getTime() !== currentDay.getTime()) {
        return false;
      }
    }
    if (dateRange === 'week' && txDate < weekStart) {
      return false;
    }
    if (dateRange === 'month' && txDate < monthStart) {
      return false;
    }
    if (dateRange === 'custom') {
      const start = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);
      if (txDate < start || txDate > end) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = `${item.categoryName} ${item.note} ${item.amount}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'dateDesc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'dateAsc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'amountHigh') {
      return b.amount - a.amount;
    }
    return a.amount - b.amount;
  });

  const onChangeFromDate = (event: DateTimePickerEvent, date?: Date) => {
    setShowFromPicker(false);
    if (event.type === 'set' && date) {
      setFromDate(date);
    }
  };

  const onChangeToDate = (event: DateTimePickerEvent, date?: Date) => {
    setShowToPicker(false);
    if (event.type === 'set' && date) {
      setToDate(date);
    }
  };

  const resetFilters = () => {
    setFilter('all');
    setDateRange('all');
    setCategoryFilter('all');
    setQuery('');
    setFromDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setToDate(new Date());
  };

  React.useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const exportToCsv = async () => {
    if (sorted.length === 0) {
      showMessage({ title: 'No data', message: 'No transactions available for export.', variant: 'warning' });
      return;
    }

    const sortedByDate = [...sorted].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const fromDateLabel = `${String(new Date(sortedByDate[0].date).getDate()).padStart(2, '0')} - ${String(new Date(sortedByDate[0].date).getMonth() + 1).padStart(2, '0')} - ${new Date(sortedByDate[0].date).getFullYear()}`;
    const toDateLabel = `${String(new Date(sortedByDate[sortedByDate.length - 1].date).getDate()).padStart(2, '0')} - ${String(new Date(sortedByDate[sortedByDate.length - 1].date).getMonth() + 1).padStart(2, '0')} - ${new Date(sortedByDate[sortedByDate.length - 1].date).getFullYear()}`;

    const headers = ['Date', 'Amount', 'Note'];
    const rows = sorted.map((item) => [
      `${String(new Date(item.date).getDate()).padStart(2, '0')} - ${String(new Date(item.date).getMonth() + 1).padStart(2, '0')} - ${new Date(item.date).getFullYear()}`,
      `${item.type === 'income' ? '+' : '-'} ${Math.round(item.amount)}`,
      item.note || '',
    ]);

    const topRows: string[][] = [
      ['FinanceFlow Transaction Report'],
      [`Date Range: ${fromDateLabel} to ${toDateLabel}`],
    ];
    if (categoryFilter !== 'all') {
      topRows.push([`Category: ${categoryFilter}`]);
    }
    topRows.push(['']);

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [...topRows, headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
      .join('\n');

    const uri = `${FileSystem.cacheDirectory}financeflow-transactions.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export transactions CSV' });
  };

  const exportToPdf = async () => {
    if (sorted.length === 0) {
      showMessage({ title: 'No data', message: 'No transactions available for export.', variant: 'warning' });
      return;
    }

    const rowsHtml = sorted
      .map((item) => {
        const isIncome = item.type === 'income';
        const typeColor = isIncome ? '#16A34A' : '#DC2626';
        return `
          <tr>
            <td>${String(new Date(item.date).getDate()).padStart(2, '0')} - ${String(new Date(item.date).getMonth() + 1).padStart(2, '0')} - ${new Date(item.date).getFullYear()}</td>
            <td>
              <span style="color:${typeColor};font-weight:700;">
                ${isIncome ? '+' : '-'} Rs. ${Math.round(item.amount)}
              </span>
            </td>
            <td>${item.note || '-'}</td>
          </tr>
        `;
      })
      .join('');

    const sortedByDate = [...sorted].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const fromDateLabel = `${String(new Date(sortedByDate[0].date).getDate()).padStart(2, '0')} - ${String(new Date(sortedByDate[0].date).getMonth() + 1).padStart(2, '0')} - ${new Date(sortedByDate[0].date).getFullYear()}`;
    const toDateLabel = `${String(new Date(sortedByDate[sortedByDate.length - 1].date).getDate()).padStart(2, '0')} - ${String(new Date(sortedByDate[sortedByDate.length - 1].date).getMonth() + 1).padStart(2, '0')} - ${new Date(sortedByDate[sortedByDate.length - 1].date).getFullYear()}`;
    const categoryLine =
      categoryFilter !== 'all'
        ? `<p style="margin:4px 0 12px 0; color:#475569; font-size:12px;"><strong>Category:</strong> ${categoryFilter}</p>`
        : '<div style="height:8px;"></div>';

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 16px; color:#0F172A;">
          <h2 style="margin:0;">FinanceFlow Transaction Report</h2>
          <p style="margin:6px 0 0 0; color:#475569; font-size:12px;"><strong>Date Range:</strong> ${fromDateLabel} to ${toDateLabel}</p>
          ${categoryLine}
          <table border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse; width: 100%; font-size: 12px; border-color:#CBD5E1;">
            <thead>
              <tr style="background:#F8FAFC;">
                <th>Date</th><th>Amount</th><th>Note</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export transactions PDF' });
  };

  const onDeleteTransaction = (item: Transaction) => {
    showConfirm({
      title: 'Delete transaction',
      message: 'Do you want to delete this transaction?',
      variant: 'warning',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        deleteTransaction(item.id);
        setLastDeleted(item);
        setShowUndo(true);

        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current);
        }
        undoTimerRef.current = setTimeout(() => {
          setShowUndo(false);
          setLastDeleted(null);
          undoTimerRef.current = null;
        }, 5000);
      },
    });
  };

  const onUndoDelete = () => {
    if (!lastDeleted) {
      return;
    }

    restoreTransaction(lastDeleted);
    setShowUndo(false);
    setLastDeleted(null);
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
    showMessage({
      title: 'Restored',
      message: 'Transaction restored successfully.',
      variant: 'success',
    });
  };

  const renderRightActions = (item: Transaction) => (
    <Pressable
      onPress={() => onDeleteTransaction(item)}
      style={[styles.deleteSwipeAction, { backgroundColor: theme.colors.danger }]}
    >
      <Text style={styles.deleteSwipeText}>Delete</Text>
    </Pressable>
  );

  const activeSummary = [
    filter !== 'all' ? (filter === 'income' ? 'Income only' : 'Expense only') : null,
    categoryFilter !== 'all' ? categoryFilter : null,
    dateRange !== 'all' ? `Range: ${dateRange}` : null,
    sortBy !== 'dateDesc' ? `Sort: ${sortBy}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <ScreenContainer>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Animated.View
            style={{
              opacity: listAnimation,
              transform: [
                {
                  translateY: listAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Math.min(40, 10 + index * 5), 0],
                  }),
                },
              ],
            }}
          >
            <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false} friction={2}>
              <TransactionItem
                item={item}
                onPress={() => navigation.navigate('EditTransaction', { transactionId: item.id })}
              />
            </Swipeable>
          </Animated.View>
        )}
        ListHeaderComponent={
          <>
            <Animated.View style={getHeaderStyle(0)}>
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

            <Text style={[styles.heading, { color: theme.colors.text }]}>Transaction History</Text>
            </Animated.View>

            <Animated.View style={getHeaderStyle(1)}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
              <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Total spendings</Text>
              <Text style={[styles.summaryAmount, { color: theme.colors.text }]}>{formatCurrency(summary.expenses)}</Text>
            </View>
            </Animated.View>

            <Animated.View style={getHeaderStyle(2)}>
            <View style={[styles.toolbarCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.searchWrap, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}>
                <Ionicons name="search" size={16} color={theme.colors.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search category, note, amount"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.searchInput, { color: theme.colors.text }]}
                />
              </View>

              <View style={styles.toolbarRow}>
                <Pressable onPress={() => setShowFilterModal(true)} style={[styles.toolbarBtn, { borderColor: theme.colors.border }]}>
                  <Ionicons name="funnel-outline" size={14} color={theme.colors.text} />
                  <Text style={[styles.toolbarText, { color: theme.colors.text }]}>Filter</Text>
                </Pressable>
                <Pressable onPress={() => setShowSortModal(true)} style={[styles.toolbarBtn, { borderColor: theme.colors.border }]}>
                  <Ionicons name="swap-vertical-outline" size={14} color={theme.colors.text} />
                  <Text style={[styles.toolbarText, { color: theme.colors.text }]}>Sort</Text>
                </Pressable>
                <Pressable onPress={exportToCsv} style={[styles.toolbarBtn, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.toolbarText, { color: theme.colors.text }]}>CSV</Text>
                </Pressable>
                <Pressable onPress={exportToPdf} style={[styles.toolbarBtn, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.toolbarText, { color: theme.colors.text }]}>PDF</Text>
                </Pressable>
              </View>

              {activeSummary ? <Text style={[styles.activeSummary, { color: theme.colors.textMuted }]}>{activeSummary}</Text> : null}
            </View>
            </Animated.View>
          </>
        }
        ListEmptyComponent={<EmptyState title="Nothing here" subtitle="Try adjusting filters or add new transactions." />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filters</Text>
              <Pressable onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>Transaction Type</Text>
            <View style={[styles.segment, { backgroundColor: theme.colors.input }]}> 
              {(['all', 'income', 'expense'] as const).map((item) => {
                const active = filter === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setFilter(item)}
                    style={[
                      styles.segmentPill,
                      {
                        backgroundColor: active ? theme.colors.card : 'transparent',
                        borderColor: active ? theme.colors.border : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: active ? '700' : '500', fontSize: 12 }}>
                      {item === 'all' ? 'All' : item === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>Date Range</Text>
            <View style={[styles.segment, { backgroundColor: theme.colors.input }]}> 
              {(['all', 'today', 'week', 'month', 'custom'] as const).map((item) => {
                const active = dateRange === item;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setDateRange(item)}
                    style={[
                      styles.segmentPill,
                      {
                        backgroundColor: active ? theme.colors.card : 'transparent',
                        borderColor: active ? theme.colors.border : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: active ? '700' : '500', fontSize: 12 }}>
                      {item === 'all' ? 'All Time' : item === 'today' ? 'Today' : item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'Custom'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {dateRange === 'custom' ? (
              <View style={styles.customDateRow}>
                <Pressable onPress={() => setShowFromPicker(true)} style={[styles.dateBtn, { backgroundColor: theme.colors.input }]}>
                  <Text style={{ color: theme.colors.text, fontSize: 12 }}>From: {fromDate.toLocaleDateString('en-IN')}</Text>
                </Pressable>
                <Pressable onPress={() => setShowToPicker(true)} style={[styles.dateBtn, { backgroundColor: theme.colors.input }]}>
                  <Text style={{ color: theme.colors.text, fontSize: 12 }}>To: {toDate.toLocaleDateString('en-IN')}</Text>
                </Pressable>
              </View>
            ) : null}

            <Text style={[styles.groupLabel, { color: theme.colors.textMuted }]}>Category</Text>
            <View style={styles.categoryWrap}>
              <Pressable
                onPress={() => setCategoryFilter('all')}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: categoryFilter === 'all' ? theme.colors.card : theme.colors.input,
                    borderColor: categoryFilter === 'all' ? theme.colors.border : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: theme.colors.text, fontSize: 11, fontWeight: categoryFilter === 'all' ? '700' : '500' }}>All Categories</Text>
              </Pressable>
              {availableCategories.map((item) => {
                const active = categoryFilter.toLowerCase() === item.toLowerCase();
                return (
                  <Pressable
                    key={item}
                    onPress={() => setCategoryFilter(item)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: active ? theme.colors.card : theme.colors.input,
                        borderColor: active ? theme.colors.border : 'transparent',
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.text, fontSize: 11, fontWeight: active ? '700' : '500' }}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={resetFilters} style={[styles.modalBtn, { borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text }}>Reset</Text>
              </Pressable>
              <Pressable onPress={() => setShowFilterModal(false)} style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Sort</Text>
              <Pressable onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={20} color={theme.colors.text} />
              </Pressable>
            </View>

            {([
              { key: 'dateDesc', label: 'Date Descending' },
              { key: 'dateAsc', label: 'Date Ascending' },
              { key: 'amountHigh', label: 'Amount High to Low' },
              { key: 'amountLow', label: 'Amount Low to High' },
            ] as const).map((item) => {
              const active = sortBy === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => {
                    setSortBy(item.key);
                    setShowSortModal(false);
                  }}
                  style={[styles.sortRow, { borderColor: theme.colors.border, backgroundColor: active ? theme.colors.input : 'transparent' }]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: active ? '700' : '500' }}>{item.label}</Text>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>

      {showFromPicker ? (
        <DateTimePicker value={fromDate} mode="date" display="default" onChange={onChangeFromDate} />
      ) : null}
      {showToPicker ? (
        <DateTimePicker value={toDate} mode="date" display="default" onChange={onChangeToDate} />
      ) : null}

      {showUndo && lastDeleted ? (
        <View style={[styles.undoBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.undoText, { color: theme.colors.text }]}>Transaction deleted</Text>
          <Pressable onPress={onUndoDelete} style={[styles.undoBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.undoBtnText}>UNDO</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 24,
  },
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
  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  toolbarCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  searchWrap: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    fontSize: 13,
  },
  toolbarRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  toolbarBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  toolbarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeSummary: {
    marginTop: 8,
    fontSize: 11,
  },
  deleteSwipeAction: {
    width: 92,
    borderRadius: 14,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSwipeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,6,23,0.55)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 14,
    maxHeight: '86%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 2,
  },
  segment: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },
  segmentPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalActions: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  sortRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  undoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  undoBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  undoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
