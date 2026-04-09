import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useAppDialog } from '../components/AppDialogProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { Category, TransactionType } from '../types';

export function AddTransactionScreen() {
  const { state, addTransaction, addCustomCategory } = useFinance();
  const { showMessage } = useAppDialog();
  const theme = useAppTheme();
  const scrollRef = React.useRef<ScrollView>(null);

  const [type, setType] = React.useState<TransactionType>('expense');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState('');
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customBoth, setCustomBoth] = React.useState(true);

  const filteredCategories = state.categories.filter(
    (item) => item.type === type || item.type === 'both',
  );

  React.useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((item) => item.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  const validate = () => {
    const parsed = Number(amount);
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      showMessage({
        title: 'Invalid amount',
        message: 'Please enter an amount greater than zero.',
        variant: 'error',
      });
      return false;
    }

    if (!categoryId) {
      showMessage({
        title: 'Category missing',
        message: 'Please select a category.',
        variant: 'warning',
      });
      return false;
    }

    return true;
  };

  const onDateChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && pickedDate) {
      setSelectedDate(pickedDate);
    }
  };

  const onSave = () => {
    if (!validate()) {
      return;
    }

    const budgetStatus = addTransaction({
      amount: Number(amount),
      categoryId,
      type,
      date: selectedDate.toISOString(),
      note: note.trim(),
    });

    setAmount('');
    setNote('');
    setSelectedDate(new Date());
    showMessage({
      title: 'Saved',
      message: 'Transaction added successfully.',
      variant: 'success',
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
  };

  const onAddCustomCategory = () => {
    const value = customName.trim();
    if (!value) {
      showMessage({
        title: 'Category name required',
        message: 'Please enter a category name.',
        variant: 'warning',
      });
      return;
    }

    addCustomCategory({
      name: value,
      type: customBoth ? 'both' : type,
    });
    setCustomName('');
    setShowCategoryModal(false);
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.heading, { color: theme.colors.text }]}>Add Transaction</Text>
          <Text style={[styles.sub, { color: theme.colors.textMuted }]}>Create a new income or expense entry</Text>

          <View style={{ marginBottom: 16 }}> 
            <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
              <Pressable
                onPress={() => setType('income')}
                style={[
                  styles.tabButton,
                  type === 'income' ? [styles.tabButtonActive, { borderBottomColor: theme.colors.success }] : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: type === 'income' ? theme.colors.success : theme.colors.textMuted },
                    type === 'income' ? styles.tabLabelActive : null,
                  ]}
                >
                  Income
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setType('expense')}
                style={[
                  styles.tabButton,
                  type === 'expense' ? [styles.tabButtonActive, { borderBottomColor: theme.colors.danger }] : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: type === 'expense' ? theme.colors.danger : theme.colors.textMuted },
                    type === 'expense' ? styles.tabLabelActive : null,
                  ]}
                >
                  Expense
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.block, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
            <Label text="Amount" color={theme.colors.textMuted} />
            <TextInput
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
            />

            <Label text="Expense Date" color={theme.colors.textMuted} />
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, styles.datePickerButton, { backgroundColor: theme.colors.input }]}
            >
              <Text style={{ color: theme.colors.text, fontSize: 14 }}>
                {String(selectedDate.getDate()).padStart(2, '0')} - {String(selectedDate.getMonth() + 1).padStart(2, '0')} - {selectedDate.getFullYear()}
              </Text>
            </Pressable>

            {showDatePicker ? (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            ) : null}

            <Label text="Category" color={theme.colors.textMuted} />
            <View style={styles.chipWrap}>
              {filteredCategories.map((item) => (
                <CategoryChip
                  key={item.id}
                  item={item}
                  active={item.id === categoryId}
                  onPress={() => setCategoryId(item.id)}
                  textColor={theme.colors.text}
                  borderColor={theme.colors.border}
                />
              ))}
            </View>

            <Pressable
              onPress={() => setShowCategoryModal(true)}
              style={[styles.secondaryButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.input }]}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>+ Add custom category</Text>
            </Pressable>
          </View>

          <View style={[styles.block, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
            <Label text="Note" color={theme.colors.textMuted} />
            <TextInput
              value={note}
              onChangeText={setNote}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollToEnd({ animated: true });
                }, 120);
              }}
              placeholder="Optional"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              style={[
                styles.input,
                styles.noteInput,
                { backgroundColor: theme.colors.input, color: theme.colors.text, textAlignVertical: 'top' },
              ]}
            />
          </View>

          <Pressable onPress={onSave} style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.primaryText}>Save Transaction</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Create category</Text>
            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="e.g. Pets"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
            />
            <View style={styles.rowBetween}>
              <Text style={{ color: theme.colors.text }}>Use for both income and expense</Text>
              <Switch value={customBoth} onValueChange={setCustomBoth} />
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setShowCategoryModal(false)}
                style={[styles.modalBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={onAddCustomCategory}
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function Label({ text, color }: { text: string; color: string }) {
  return <Text style={{ color, marginTop: 12, marginBottom: 6, fontWeight: '600' }}>{text}</Text>;
}

function CategoryChip({
  item,
  active,
  onPress,
  textColor,
  borderColor,
}: {
  item: Category;
  active: boolean;
  onPress: () => void;
  textColor: string;
  borderColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.categoryChip,
        {
          backgroundColor: active ? `${item.color}22` : 'transparent',
          borderColor: active ? item.color : borderColor,
        },
      ]}
    >
      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
      <Text style={{ color: textColor, fontWeight: '600' }}>{item.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heading: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    marginTop: 3,
    marginBottom: 10,
    fontSize: 13,
  },
  block: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingTop: 10,
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
  switchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 11,
    fontSize: 14,
  },
  datePickerButton: {
    justifyContent: 'center',
  },
  noteInput: {
    minHeight: 96,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    width: '100%',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,6,23,0.5)',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  rowBetween: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
});
