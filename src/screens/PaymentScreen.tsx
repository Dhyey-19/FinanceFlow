import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAppDialog } from '../components/AppDialogProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';

type RouteParams = {
  name: string;
  email: string;
  amount: number;
  paymentName: string;
};

const BANKS = ['okhdfcbank', 'kotakbank', 'icicibank', 'axisbank', 'sbibank'];

function getDummyUpi(email: string) {
  const local = email.split('@')[0] || 'user';
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  const bank = BANKS[hash % BANKS.length];
  return `${local}@${bank}`;
}

export function PaymentScreen() {
  const theme = useAppTheme();
  const { showMessage } = useAppDialog();
  const { state, addTransaction, formatCurrency } = useFinance();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { name, email, amount, paymentName } = (route.params || {}) as RouteParams;
  const [showSuccess, setShowSuccess] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0.5)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0.25)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const targetUser = state.users.find((u) => u.email === email);
  const upi = targetUser?.upiId || getDummyUpi(email || 'user@domain.com');

  const formattedAmount = formatCurrency(amount || 0);

  const findCategoryIdForPayment = () => {
    const normalizedPaymentName = (paymentName || '').toLowerCase().trim();
    const expenseCategories = state.categories.filter((item) => item.type === 'expense' || item.type === 'both');

    const exactMatch = expenseCategories.find((item) => item.name.toLowerCase() === normalizedPaymentName);
    if (exactMatch) {
      return exactMatch.id;
    }

    const partialMatch = expenseCategories.find((item) => {
      const categoryName = item.name.toLowerCase();
      return (
        normalizedPaymentName.includes(categoryName) ||
        categoryName.includes(normalizedPaymentName)
      );
    });
    if (partialMatch) {
      return partialMatch.id;
    }

    const fallbackPayments = expenseCategories.find((item) => item.name.toLowerCase() === 'payments');
    if (fallbackPayments) {
      return fallbackPayments.id;
    }

    return expenseCategories[0]?.id;
  };

  const runSuccessAnimation = () => {
    if (showSuccess) {
      return;
    }

    const categoryId = findCategoryIdForPayment();
    const resolvedCategory = state.categories.find(c => c.id === categoryId);
    if (categoryId) {
      const budgetStatus = addTransaction({
        amount: Number(amount) || 0,
        categoryId,
        type: 'expense',
        date: new Date().toISOString(),
        note: paymentName ? `UPI payment: ${paymentName}` : 'UPI payment',
      });

      if (budgetStatus.budgetExceeded) {
        const spent = Math.round(budgetStatus.spentAmount || 0);
        const limit = Math.round(budgetStatus.budgetAmount || 0);
        showMessage({
          title: 'Budget exceeded',
          message: `${budgetStatus.categoryName || 'Category'} spending is Rs. ${spent}, above your limit of Rs. ${limit}.`,
          variant: 'warning',
        });
      }
    }

    const comment = resolvedCategory ? resolvedCategory.name : paymentName;
    const upiUrl = `upi://pay?pa=${upi}&pn=${encodeURIComponent(name || '')}&am=${amount}&cu=INR&tn=${encodeURIComponent(comment || '')}`;
    
    Linking.canOpenURL(upiUrl).then((supported) => {
      if (supported) {
        Linking.openURL(upiUrl);
      } else {
        // Fallback specifically for GPay if generic UPI is not caught
        const tezUrl = `tez://upi/pay?pa=${upi}&pn=${encodeURIComponent(name || '')}&am=${amount}&cu=INR&tn=${encodeURIComponent(comment || '')}`;
        Linking.canOpenURL(tezUrl).then((tezSupported) => {
           if (tezSupported) {
             Linking.openURL(tezUrl);
           }
        });
      }
    }).catch(err => console.error("Error opening UPI app", err));

    setShowSuccess(true);

    overlayOpacity.setValue(0);
    checkScale.setValue(0.5);
    checkOpacity.setValue(0);
    rippleScale.setValue(0.25);
    rippleOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(80),
        Animated.parallel([
          Animated.spring(checkScale, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(checkOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(70),
        Animated.timing(rippleOpacity, {
          toValue: 0.4,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.8,
            duration: 680,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 680,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: theme.colors.border }]}>
          <Ionicons name="arrow-back" size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.heading, { color: theme.colors.text }]}>Pay with UPI</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.input }]}>
          <Ionicons name="person" size={22} color={theme.colors.text} />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>{name}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{email}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{upi}</Text>

        <View style={[styles.amountBox, { backgroundColor: theme.colors.input }]}> 
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{paymentName}</Text>
          <Text style={[styles.amount, { color: theme.colors.text }]}>{formattedAmount}</Text>
        </View>

        <Pressable
          style={[styles.payBtn, { backgroundColor: theme.colors.primary }]}
          onPress={runSuccessAnimation}
        >
          <Text style={styles.payText}>Pay Now</Text>
        </Pressable>
      </View>

      {showSuccess ? (
        <Animated.View style={[styles.successOverlay, { opacity: overlayOpacity }]}>
          <Animated.View
            style={[
              styles.ripple,
              {
                borderColor: theme.colors.primary,
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />
          <View style={[styles.successCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Animated.View
              style={[
                styles.successIcon,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: checkOpacity,
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              <Ionicons name="checkmark" size={28} color="#FFFFFF" />
            </Animated.View>
            <Text style={[styles.successTitle, { color: theme.colors.text }]}>Payment Successful</Text>
            <Text style={[styles.successMeta, { color: theme.colors.textMuted }]}>Paid {formattedAmount} to {name}</Text>
            <Pressable
              style={[styles.doneBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                setShowSuccess(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    marginTop: 3,
    fontSize: 13,
  },
  amountBox: {
    marginTop: 14,
    width: '100%',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
  },
  amount: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
  },
  payBtn: {
    marginTop: 16,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  payText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 17, 29, 0.35)',
    zIndex: 20,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  successCard: {
    width: '84%',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
  },
  successMeta: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 24,
  },
  doneText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
