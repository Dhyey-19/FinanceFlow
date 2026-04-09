import React from 'react';
import {
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useAppDialog } from '../components/AppDialogProvider';
import { EmptyState } from '../components/EmptyState';
import { GradientBalanceCard } from '../components/GradientBalanceCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { SummaryRing } from '../components/SummaryRing';
import { TransactionItem } from '../components/TransactionItem';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { AppUser, PaymentReminder, ReminderFrequency } from '../types';

const REMINDER_TEMPLATES = [
  'Rent',
  'Maintenance',
  'Newspaper',
  'Milk Man',
  'Fees / Salary',
  'Services',
  'Miscellaneous',
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getNextDueDate(reminder: PaymentReminder, now: Date) {
  const base = new Date(reminder.reminderDate);
  const today = startOfDay(now);

  if (reminder.frequency === 'weekly') {
    const due = startOfDay(base);
    if (due >= today) {
      return due;
    }
    const diffDays = Math.floor((today.getTime() - due.getTime()) / DAY_MS);
    const weeksToAdd = Math.floor(diffDays / 7) + 1;
    return new Date(due.getFullYear(), due.getMonth(), due.getDate() + weeksToAdd * 7);
  }

  if (reminder.frequency === 'monthly') {
    const targetDay = base.getDate();
    const year = today.getFullYear();
    const month = today.getMonth();

    const dayThisMonth = Math.min(targetDay, daysInMonth(year, month));
    const dueThisMonth = new Date(year, month, dayThisMonth);

    if (dueThisMonth >= today) {
      return dueThisMonth;
    }

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dayNextMonth = Math.min(targetDay, daysInMonth(nextYear, nextMonth));
    return new Date(nextYear, nextMonth, dayNextMonth);
  }

  const targetDay = base.getDate();
  const targetMonth = base.getMonth();
  const year = today.getFullYear();

  const dayThisYear = Math.min(targetDay, daysInMonth(year, targetMonth));
  const dueThisYear = new Date(year, targetMonth, dayThisYear);

  if (dueThisYear >= today) {
    return dueThisYear;
  }

  const nextYear = year + 1;
  const dayNextYear = Math.min(targetDay, daysInMonth(nextYear, targetMonth));
  return new Date(nextYear, targetMonth, dayNextYear);
}

function getUpcomingReminder(reminder: PaymentReminder, now: Date) {
  const dueDate = getNextDueDate(reminder, now);
  const daysLeft = Math.floor((startOfDay(dueDate).getTime() - startOfDay(now).getTime()) / DAY_MS);

  return {
    ...reminder,
    dueDate,
    daysLeft,
  };
}

export function DashboardScreen() {
  const { state, signOut, getMonthlySummary, addReminder, formatCurrency } = useFinance();
  const { showMessage } = useAppDialog();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const [chartRange, setChartRange] = React.useState<'weekly' | 'monthly'>('weekly');

  const [showReminderModal, setShowReminderModal] = React.useState(false);
  const [showQrModal, setShowQrModal] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const gpayCardRef = React.useRef<any>(null);
  const qrRef = React.useRef<any>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<AppUser | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [reminderDate, setReminderDate] = React.useState(new Date());
  const [frequency, setFrequency] = React.useState<ReminderFrequency>('monthly');
  const [amount, setAmount] = React.useState('');
  const [paymentName, setPaymentName] = React.useState('');
  const [ringAnimateKey, setRingAnimateKey] = React.useState(0);
  const sectionAnimations = React.useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useFocusEffect(
    React.useCallback(() => {
      setRingAnimateKey((prev) => prev + 1);
      sectionAnimations.forEach((value) => value.setValue(0));

      const animations = sectionAnimations.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      );

      Animated.stagger(70, animations).start();
      return undefined;
    }, [sectionAnimations]),
  );

  const getSectionStyle = (index: number) => ({
    opacity: sectionAnimations[index],
    transform: [
      {
        translateY: sectionAnimations[index].interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  const currentUser = state.users.find(u => u.email === state.auth.userEmail);
  const upiId = currentUser?.upiId;

  const today = new Date();
  const monthSummary = getMonthlySummary(today.getMonth(), today.getFullYear());

  const weekStart = React.useMemo(() => {
    const day = (today.getDay() + 6) % 7;
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
  }, [today]);
  const weekEnd = React.useMemo(
    () => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7),
    [weekStart],
  );

  const weeklyTransactions = state.transactions.filter((item) => {
    const date = new Date(item.date);
    return item.userEmail === state.auth.userEmail && date >= weekStart && date < weekEnd;
  });

  const weekSummary = React.useMemo(() => {
    const income = weeklyTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    const expenses = weeklyTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [weeklyTransactions]);

  const selectedSummary = chartRange === 'weekly' ? weekSummary : monthSummary;

  const monthTransactions = state.transactions.filter((item) => {
    const date = new Date(item.date);
    return (
      item.userEmail === state.auth.userEmail &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  });

  const latest = monthTransactions.slice(0, 4);

  const reminders = state.reminders.filter((item) => item.ownerEmail === state.auth.userEmail);
  const upcomingReminders = reminders
    .map((item) => getUpcomingReminder(item, today))
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 3)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const usersForReminder = state.users.filter((item) => item.email !== state.auth.userEmail);
  const q = searchTerm.toLowerCase().trim();
  const filteredUsers = usersForReminder
    .filter((user) => user.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
      const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
      if (aStarts !== bStarts) {
        return bStarts - aStarts;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 8);

  const openReminderModal = (template: string) => {
    setPaymentName(template);
    setSearchTerm('');
    setSelectedUser(null);
    setShowSuggestions(false);
    setReminderDate(new Date());
    setFrequency('monthly');
    setAmount('');
    setShowReminderModal(true);
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && date) {
      setReminderDate(date);
    }
  };

  const handleScanOpen = async () => {
    setShowQrModal(false);
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showMessage({ title: 'Permission denied', message: 'Camera permission is required to scan QR codes.', variant: 'error' });
        return;
      }
    }
    setShowScanner(true);
  };

  const shareQRCode = async () => {
    try {
      if (gpayCardRef.current) {
        const uri = await captureRef(gpayCardRef, {
          format: 'png',
          quality: 1,
        });
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share my UPI QR Code' });
      }
    } catch (error) {
      showMessage({ title: 'Error', message: 'Unable to share QR code.', variant: 'error' });
    }
  };

  const onSetReminder = () => {
    const manualName = searchTerm.trim();
    if (!selectedUser && !manualName) {
      showMessage({
        title: 'Beneficiary required',
        message: 'Please type a beneficiary or select one from suggestions.',
        variant: 'warning',
      });
      return;
    }

    const parsedAmount = Number(amount);
    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showMessage({
        title: 'Invalid amount',
        message: 'Please enter a valid reminder amount.',
        variant: 'error',
      });
      return;
    }

    if (!paymentName.trim()) {
      showMessage({
        title: 'Payment name required',
        message: 'Please enter the payment name.',
        variant: 'warning',
      });
      return;
    }

    addReminder({
      payeeEmail: selectedUser?.email || '',
      payeeName: selectedUser?.name || manualName,
      paymentName: paymentName.trim(),
      amount: parsedAmount,
      frequency,
      reminderDate: reminderDate.toISOString(),
    });

    setShowReminderModal(false);
    showMessage({
      title: 'Reminder set',
      message: 'Reminder will appear 3 days before due date on dashboard.',
      variant: 'success',
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.wrap}>
        <FlatList
          data={latest}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <Animated.View style={getSectionStyle(0)}>
                <View style={styles.topBar}>
                  <View style={styles.logoRow}>
                    <View style={[styles.brandDot, { backgroundColor: theme.colors.text }]}>
                      <Image source={require('../../assets/financeflow_logo.png')} style={styles.brandLogo} resizeMode="cover" />
                    </View>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={[styles.brandText, { color: theme.colors.text }]}>
                      FinanceFlow
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <Pressable style={[styles.actionBtn, { borderColor: theme.colors.border }]} onPress={() => setShowQrModal(true)}>
                      <Ionicons name="qr-code-outline" color={theme.colors.text} size={14} />
                    </Pressable>
                    <Pressable style={[styles.actionBtn, { borderColor: theme.colors.border }]} onPress={() => signOut()}>
                      <Ionicons name="log-out-outline" color={theme.colors.danger} size={14} />
                    </Pressable>
                  </View>
                </View>

                <Text style={[styles.headline, { color: theme.colors.text }]}>Welcome, {state.auth.userName || 'User'}</Text>
                <Text style={[styles.subhead, { color: theme.colors.textMuted }]}>FinanceFlow - your expenses and transactions</Text>
              </Animated.View>

              <Animated.View style={getSectionStyle(1)}>
                <GradientBalanceCard income={monthSummary.income} expenses={monthSummary.expenses} balance={monthSummary.balance} />
              </Animated.View>

              <Animated.View style={getSectionStyle(2)}>
                <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
                    <Pressable
                      onPress={() => setChartRange('weekly')}
                      style={[
                        styles.tabButton,
                        chartRange === 'weekly' ? [styles.tabButtonActive, { borderBottomColor: theme.colors.primary }] : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabLabel,
                          { color: chartRange === 'weekly' ? theme.colors.primary : theme.colors.textMuted },
                          chartRange === 'weekly' ? styles.tabLabelActive : null,
                        ]}
                      >
                        Weekly
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setChartRange('monthly')}
                      style={[
                        styles.tabButton,
                        chartRange === 'monthly' ? [styles.tabButtonActive, { borderBottomColor: theme.colors.primary }] : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabLabel,
                          { color: chartRange === 'monthly' ? theme.colors.primary : theme.colors.textMuted },
                          chartRange === 'monthly' ? styles.tabLabelActive : null,
                        ]}
                      >
                        Monthly
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.row}>
                    <SummaryRing income={selectedSummary.income} expenses={selectedSummary.expenses} animateKey={ringAnimateKey} />
                    <View style={styles.legendWrap}>
                      <View style={styles.legendLine}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
                        <Text style={[styles.legendText, { color: theme.colors.text }]}>Income</Text>
                      </View>
                      <View style={styles.legendLine}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
                        <Text style={[styles.legendText, { color: theme.colors.text }]}>Expenses</Text>
                      </View>
                      <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
                        {chartRange === 'weekly' ? 'Based on current week activity' : 'Based on current month activity'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              <Animated.View style={getSectionStyle(3)}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent transactions</Text>
                  <Pressable onPress={() => navigation.navigate('History')}>
                    <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View Full History</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </>
          }
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              onPress={() => navigation.navigate('EditTransaction', { transactionId: item.id })}
            />
          )}
          ListFooterComponent={
            <Animated.View style={[styles.reminderSection, getSectionStyle(4)]}>
              <Text style={[styles.reminderTitle, { color: theme.colors.text }]}>Regular Payment Reminders</Text>
              <Text style={[styles.reminderSubtitle, { color: theme.colors.textMuted }]}>Tap a section to set a recurring reminder</Text>

              <View style={styles.reminderChipWrap}>
                {REMINDER_TEMPLATES.map((template) => (
                  <Pressable
                    key={template}
                    onPress={() => openReminderModal(template)}
                    style={[styles.reminderChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 12 }}>{template}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 12 }]}>Upcoming reminders (next 3 days)</Text>

              {upcomingReminders.length === 0 ? (
                <EmptyState title="No reminders due" subtitle="Reminders will appear here 3 days before their due date." />
              ) : (
                <View style={styles.reminderList}>
                  {upcomingReminders.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() =>
                        navigation.navigate('PayNow', {
                          name: item.payeeName,
                          email: item.payeeEmail,
                          amount: item.amount,
                          paymentName: item.paymentName,
                        })
                      }
                      style={[styles.reminderCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                    >
                      <View style={styles.reminderTop}>
                        <Text style={[styles.reminderName, { color: theme.colors.text }]} numberOfLines={1}>
                          {item.paymentName}
                        </Text>
                        <Text style={[styles.reminderAmount, { color: theme.colors.primary }]}>{formatCurrency(item.amount)}</Text>
                      </View>
                      <Text style={[styles.reminderMeta, { color: theme.colors.textMuted }]}>
                        {item.payeeName} • {item.frequency.toUpperCase()} • Due {item.dueDate.toLocaleDateString('en-IN')}
                      </Text>
                      <Text style={[styles.reminderMeta, { color: theme.colors.textMuted }]}>In {item.daysLeft} day(s) • Tap to Pay</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          }
          ListEmptyComponent={<EmptyState title="No transactions yet" subtitle="Tap + to add your first income or expense transaction." />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        />

        {showReminderModal ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowReminderModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Set reminder</Text>

              <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Beneficiary</Text>
              <TextInput
                value={searchTerm}
                onChangeText={(value) => {
                  setSearchTerm(value);
                  setSelectedUser(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type name to search"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.modalInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
              />

              {showSuggestions && searchTerm.trim().length > 0 ? (
                <View style={[styles.userList, { borderColor: theme.colors.border }]}>
                  {filteredUsers.length === 0 ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, paddingHorizontal: 6, paddingVertical: 8 }}>
                      No matching user found. You can continue with this typed name.
                    </Text>
                  ) : (
                    filteredUsers.map((user) => {
                      const active = selectedUser?.email === user.email;
                      return (
                        <Pressable
                          key={user.email}
                          onPress={() => {
                            setSelectedUser(user);
                            setSearchTerm(user.name);
                            setShowSuggestions(false);
                          }}
                          style={[
                            styles.userRow,
                            {
                              backgroundColor: active ? `${theme.colors.primary}22` : 'transparent',
                              borderColor: active ? theme.colors.primary : theme.colors.border,
                            },
                          ]}
                        >
                          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{user.name}</Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              ) : null}

              <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Payment name</Text>
              <TextInput
                value={paymentName}
                onChangeText={setPaymentName}
                placeholder="Rent, Salary, Fees..."
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.modalInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
              />

              <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Amount</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.modalInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
              />

              <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Reminder date</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={[styles.modalInput, styles.dateButton, { backgroundColor: theme.colors.input }]}>
                <Text style={{ color: theme.colors.text }}>{reminderDate.toLocaleDateString('en-IN')}</Text>
              </Pressable>
              {showDatePicker ? (
                <DateTimePicker
                  value={reminderDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              ) : null}

              <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Frequency</Text>
              <View style={styles.freqRow}>
                {(['weekly', 'monthly', 'yearly'] as const).map((item) => {
                  const active = frequency === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setFrequency(item)}
                      style={[
                        styles.freqChip,
                        {
                          backgroundColor: active ? theme.colors.primary : theme.colors.input,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? '#FFFFFF' : theme.colors.text, fontWeight: '600', fontSize: 12 }}>
                        {item.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setShowReminderModal(false)}
                  style={[styles.modalBtn, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.text }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={onSetReminder} style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Set Reminder</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        ) : null}

        {showQrModal ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowQrModal(false)}>
          <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', padding: 20 }}>
              {upiId ? (
                <>
                  <View style={styles.gpayCard} ref={gpayCardRef} collapsable={false}>
                    <View style={styles.gpayHeader}>
                      <View style={styles.gpayAvatar}>
                        <Text style={styles.gpayAvatarText}>{(state.auth.userName || 'U').charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.gpayName}>{state.auth.userName}</Text>
                      <Text style={styles.gpayUpiId}>{upiId}</Text>
                    </View>

                    <View style={styles.gpayQrWrapper}>
                      <QRCode 
                        getRef={(c) => (qrRef.current = c)} 
                        value={`upi://pay?pa=${upiId}&pn=${state.auth.userName}&cu=INR`} 
                        size={200} 
                        backgroundColor="#FFFFFF" 
                        color="#000000" 
                        logo={require('../../assets/financeflow_logo.png')}
                        logoSize={40}
                        logoBackgroundColor="#FFFFFF"
                        logoBorderRadius={20}
                      />
                    </View>

                    <View style={styles.gpayFooter}>
                      <Text style={styles.gpayFooterText}>Scan to pay with any UPI app</Text>
                      <View style={styles.gpayLogosRow}>
                        <Text style={styles.gpayUpiAppText}>GPay</Text>
                        <Text style={styles.gpayUpiAppText}>PhonePe</Text>
                        <Text style={styles.gpayUpiAppText}>Paytm</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.gpayActionRow}>
                    <Pressable onPress={() => setShowQrModal(false)} style={styles.gpayActionBtn}>
                      <View style={styles.gpayActionIcon}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.gpayActionText}>Close</Text>
                    </Pressable>
                    <Pressable onPress={handleScanOpen} style={styles.gpayActionBtn}>
                      <View style={styles.gpayActionIcon}>
                        <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.gpayActionText}>Scan QR</Text>
                    </Pressable>
                    <Pressable onPress={shareQRCode} style={styles.gpayActionBtn}>
                      <View style={styles.gpayActionIcon}>
                        <Ionicons name="share-social-outline" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.gpayActionText}>Share QR</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, alignItems: 'center' }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text }]}>No UPI ID Found</Text>
                  <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginVertical: 16 }}>
                    You haven't set up your UPI ID. Please set it up in your profile.
                  </Text>
                  <View style={[styles.modalButtons, { width: '100%' }]}>
                    <Pressable onPress={() => setShowQrModal(false)} style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}>
                      <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Close</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
        ) : null}

        {showScanner ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowScanner(false)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={(result) => {
                setShowScanner(false);
                showMessage({ title: 'Scanned', message: result.data, variant: 'success' });
              }}
            />
            <View style={{ position: 'absolute', top: 50, right: 20 }}>
              <Pressable onPress={() => setShowScanner(false)} style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
                <Ionicons name="close" size={24} color="#FFF" />
              </Pressable>
            </View>
          </View>
        </Modal>
        ) : null}

        <Animated.View style={getSectionStyle(5)}>
          <Pressable onPress={() => navigation.navigate('AddEntry')} style={[styles.fab, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  content: {
    paddingBottom: 96,
  },
  topBar: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
  },
  subhead: {
    marginTop: 4,
    marginBottom: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendWrap: {
    flex: 1,
    paddingLeft: 16,
  },
  legendLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '700',
  },
  reminderSection: {
    marginTop: 8,
    marginBottom: 10,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reminderSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  reminderChipWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  reminderList: {
    gap: 8,
  },
  reminderCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  reminderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderName: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: '65%',
  },
  reminderAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  reminderMeta: {
    marginTop: 5,
    fontSize: 12,
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
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalLabel: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  modalInput: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 14,
  },
  userList: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    maxHeight: 160,
    gap: 6,
  },
  userRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dateButton: {
    justifyContent: 'center',
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    alignItems: 'center',
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  gpayCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  gpayHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gpayAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpayAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A73E8',
  },
  gpayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202124',
    marginBottom: 4,
    textAlign: 'center',
  },
  gpayUpiId: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '500',
  },
  gpayQrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    marginBottom: 24,
  },
  gpayFooter: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8F9FA',
  },
  gpayFooterText: {
    fontSize: 14,
    color: '#3C4043',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  gpayLogosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  gpayUpiAppText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#80868B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F3F4',
    overflow: 'hidden',
    borderRadius: 8,
  },
  gpayActionRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 40,
    justifyContent: 'center',
  },
  gpayActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpayActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  gpayActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
