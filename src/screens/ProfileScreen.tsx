import React from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAppDialog } from '../components/AppDialogProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { CurrencyCode } from '../types';

export function ProfileScreen() {
  const { state, toggleTheme, setMasterCurrency, signOut, deleteAccount, updateProfile, setCategoryBudget, getCategoryBudget, getCategorySpent } = useFinance();
  const { showConfirm, showMessage } = useAppDialog();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  const expenseCategories = state.categories.filter((item) => item.type === 'expense' || item.type === 'both');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(expenseCategories[0]?.id || '');
  const [budgetAmount, setBudgetAmount] = React.useState('');
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const currentUser = state.users.find(u => u.email === state.auth.userEmail);
  const [profileName, setProfileName] = React.useState(state.auth.userName || '');
  const [profileUpiId, setProfileUpiId] = React.useState(currentUser?.upiId || '');
  const sectionAnimations = React.useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  useFocusEffect(
    React.useCallback(() => {
      sectionAnimations.forEach((value) => value.setValue(0));
      const animations = sectionAnimations.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: 460,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      );
      Animated.stagger(100, animations).start();
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

  React.useEffect(() => {
    if (!isEditingProfile) {
      setProfileName(state.auth.userName || '');
      setProfileUpiId(currentUser?.upiId || '');
    }
  }, [state.auth.userName, currentUser?.upiId, isEditingProfile]);

  React.useEffect(() => {
    if (expenseCategories.length > 0 && !expenseCategories.some((item) => item.id === selectedCategoryId)) {
      setSelectedCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, selectedCategoryId]);

  React.useEffect(() => {
    if (!selectedCategoryId) {
      setBudgetAmount('');
      return;
    }
    const budget = getCategoryBudget({ categoryId: selectedCategoryId, month, year });
    setBudgetAmount(budget ? String(Math.round(budget.amount)) : '');
  }, [selectedCategoryId, getCategoryBudget, month, year, state.budgets]);

  const onSignOut = () => {
    showConfirm({
      title: 'Sign out',
      message: 'Are you sure you want to sign out from this device?',
      variant: 'warning',
      confirmText: 'Sign out',
      cancelText: 'Cancel',
      onConfirm: signOut,
    });
  };

  const onDeleteAccount = () => {
    showConfirm({
      title: 'Delete Account',
      message: 'Are you sure you want to permanently delete your account and ALL associated data (transactions, goals, reminders, budgets)? This action cannot be undone.',
      variant: 'warning',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      onConfirm: deleteAccount,
    });
  };

  const onSaveProfile = () => {
    const result = updateProfile({ name: profileName, upiId: profileUpiId });
    if (!result.ok) {
      showMessage({
        title: 'Unable to update profile',
        message: result.message || 'Please try again.',
        variant: 'warning',
      });
      return;
    }

    setIsEditingProfile(false);
    showMessage({
      title: 'Profile updated',
      message: 'Your details were saved successfully.',
      variant: 'success',
    });
  };

  const onSaveBudget = () => {
    if (!selectedCategoryId) {
      return;
    }

    const parsed = Number(budgetAmount);
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      showMessage({
        title: 'Invalid budget',
        message: 'Enter an amount greater than zero to set budget.',
        variant: 'warning',
      });
      return;
    }

    setCategoryBudget({
      categoryId: selectedCategoryId,
      amount: parsed,
      month,
      year,
    });

    showMessage({
      title: 'Budget saved',
      message: 'Monthly category budget updated successfully.',
      variant: 'success',
    });
  };

  const monthBudgets = state.budgets
    .filter((item) => item.userEmail === state.auth.userEmail && item.month === month && item.year === year)
    .map((budget) => {
      const category = state.categories.find((item) => item.id === budget.categoryId);
      const spent = getCategorySpent({ categoryId: budget.categoryId, month, year });
      const ratio = budget.amount > 0 ? Math.min(spent / budget.amount, 1) : 0;
      return {
        ...budget,
        categoryName: category?.name || 'Category',
        categoryColor: category?.color || theme.colors.primary,
        spent,
        ratio,
      };
    });

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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

          <Text style={[styles.heading, { color: theme.colors.text }]}>Profile</Text>
          </Animated.View>

          <Animated.View style={getSectionStyle(1)}>
          <Pressable
            onPress={() => {
              if (!isEditingProfile) {
                setIsEditingProfile(true);
              }
            }}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.userRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.input }]}> 
                <Ionicons name="person" size={18} color={theme.colors.text} />
              </View>
              <View style={styles.userTextWrap}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{state.auth.userName || 'User'}</Text>
                <Text style={[styles.helper, { color: theme.colors.textMuted }]}>{state.auth.userEmail || 'user@email.com'}</Text>
              </View>
              {!isEditingProfile ? <Ionicons name="create-outline" size={18} color={theme.colors.textMuted} /> : null}
            </View>

            {!isEditingProfile ? (
              <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Tap this card to edit profile details.</Text>
            ) : (
              <View style={styles.profileForm}>
                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>Name</Text>
                <TextInput
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.profileInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
                />

                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>Email (read-only)</Text>
                <TextInput
                  value={state.auth.userEmail}
                  editable={false}
                  selectTextOnFocus={false}
                  style={[
                    styles.profileInput,
                    styles.profileInputDisabled,
                    { backgroundColor: theme.colors.input, color: theme.colors.textMuted },
                  ]}
                />

                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>UPI ID</Text>
                <TextInput
                  value={profileUpiId}
                  onChangeText={setProfileUpiId}
                  placeholder="e.g. user@okaxis"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  style={[styles.profileInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
                />

                <View style={styles.profileActions}>
                  <Pressable
                    onPress={() => {
                      setProfileName(state.auth.userName || '');
                      setProfileUpiId(currentUser?.upiId || '');
                      setIsEditingProfile(false);
                    }}
                    style={[styles.profileCancelBtn, { borderColor: theme.colors.border }]}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={onSaveProfile} style={[styles.profileSaveBtn, { backgroundColor: theme.colors.primary }]}> 
                    <Text style={styles.profileSaveText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={[styles.row, styles.modeRow]}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Dark mode</Text>
              <Switch value={state.themeMode === 'dark'} onValueChange={toggleTheme} />
            </View>

            <View style={[styles.row, { marginTop: 16, marginBottom: 8 }]}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Select Currency</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {(['USD', 'INR', 'EUR', 'GBP'] as CurrencyCode[]).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setMasterCurrency(c)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: state.masterCurrency === c ? theme.colors.primary : theme.colors.border,
                    backgroundColor: state.masterCurrency === c ? `${theme.colors.primary}22` : theme.colors.input,
                  }}
                >
                  <Text style={{ fontWeight: '500', color: state.masterCurrency === c ? theme.colors.primary : theme.colors.text }}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Choose your preferred currency symbol. It will be used in all figures.</Text>
          
            <Pressable 
              style={[styles.menuItem, { borderTopColor: theme.colors.border }]} 
              onPress={() => navigation.navigate('ManageCategories')}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="list" size={20} color={theme.colors.text} />
                <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Manage Categories</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </Pressable>

          </Pressable>
          </Animated.View>

                    <Animated.View style={getSectionStyle(2)}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
              <Text style={[styles.title, { color: theme.colors.text }]}>About FinanceFlow</Text>
              <Text style={[styles.helper, { color: theme.colors.textMuted }]}>FinanceFlow is a local-first expense tracker built with React Native and Expo.</Text>


              <Pressable onPress={onSignOut} style={[styles.signOutBtn, { borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Sign out</Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View style={getSectionStyle(3)}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Monthly category budget</Text>
              <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Set limits to get overspending warnings while adding expenses.</Text>

              <View style={styles.categoryRow}>
                {expenseCategories.map((category) => {
                  const active = category.id === selectedCategoryId;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => setSelectedCategoryId(category.id)}
                      style={[
                        styles.categoryChip,
                        {
                          borderColor: active ? category.color : theme.colors.border,
                          backgroundColor: active ? `${category.color}22` : theme.colors.input,
                        },
                      ]}
                    >
                      <Text style={{ color: theme.colors.text, fontSize: 12, fontWeight: active ? '700' : '500' }}>{category.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
  
              <TextInput
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="numeric"
                placeholder="Enter monthly budget"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.budgetInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
              />
  
              <Pressable onPress={onSaveBudget} style={[styles.saveBudgetBtn, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.saveBudgetText}>Save Budget</Text>
              </Pressable>
  
              {monthBudgets.length > 0 ? (
                <View style={styles.budgetList}>
                  {monthBudgets.map((item) => (
                    <View key={item.id} style={styles.budgetItem}>
                      <View style={styles.budgetRowTop}>
                        <Text style={[styles.budgetTitle, { color: theme.colors.text }]}>{item.categoryName}</Text>
                        <Text style={[styles.budgetMeta, { color: theme.colors.textMuted }]}>Rs. {Math.round(item.spent)} / Rs. {Math.round(item.amount)}</Text>
                      </View>
                      <View style={[styles.track, { backgroundColor: theme.colors.input }]}> 
                        <View style={[styles.fill, { width: `${Math.max(4, item.ratio * 100)}%`, backgroundColor: item.categoryColor }]} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </Animated.View>

          <Animated.View style={getSectionStyle(4)}>
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.danger }]}> 
              <Text style={[styles.title, { color: theme.colors.danger }]}>Danger Zone</Text>
              <Text style={[styles.helper, { color: theme.colors.textMuted }]}>Permanently delete all your personal data and account records.</Text>

              <Pressable onPress={onDeleteAccount} style={[styles.signOutBtn, { borderColor: theme.colors.danger, backgroundColor: theme.colors.danger + '15', marginTop: 10 }]}>
                <Text style={{ color: theme.colors.danger, fontWeight: '600' }}>Delete Account</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heading: {
    marginTop: 8,
    marginBottom: 10,
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
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userTextWrap: {
    flex: 1,
  },
  profileForm: {
    marginTop: 2,
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  profileInput: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  profileInputDisabled: {
    opacity: 0.75,
  },
  profileActions: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  profileCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  profileSaveBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.2)',
    paddingTop: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  helper: {
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  linkBtn: {
    marginTop: 12,
  },
  signOutBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  categoryRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  budgetInput: {
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  saveBudgetBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBudgetText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  budgetList: {
    marginTop: 14,
    gap: 10,
  },
  budgetItem: {
    gap: 4,
  },
  budgetRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetTitle: {
    fontWeight: '700',
    fontSize: 13,
  },
  budgetMeta: {
    fontSize: 11,
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  }
});
