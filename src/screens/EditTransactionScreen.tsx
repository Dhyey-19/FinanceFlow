import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { useAppDialog } from '../components/AppDialogProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { Category, TransactionType } from '../types';

type RouteParams = {
  transactionId: string;
};

export function EditTransactionScreen() {
  const { state, updateTransaction } = useFinance();
  const { showMessage } = useAppDialog();
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { transactionId } = (route.params || {}) as RouteParams;

  const transaction = state.transactions.find((item) => item.id === transactionId);

  const [type, setType] = React.useState<TransactionType>(transaction?.type || 'expense');
  const [amount, setAmount] = React.useState(transaction ? String(transaction.amount) : '');
  const [note, setNote] = React.useState(transaction?.note || '');
  const [selectedDate, setSelectedDate] = React.useState(transaction ? new Date(transaction.date) : new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState(transaction?.categoryId || '');

  const filteredCategories = state.categories.filter((item) => item.type === type || item.type === 'both');

  React.useEffect(() => {
    if (!transaction) {
      return;
    }

    setType(transaction.type);
    setAmount(String(transaction.amount));
    setNote(transaction.note || '');
    setSelectedDate(new Date(transaction.date));
    setCategoryId(transaction.categoryId);
    setShowDatePicker(false);
  }, [transactionId, transaction]);

  React.useEffect(() => {
    if (!transaction) {
      showMessage({
        title: 'Transaction not found',
        message: 'This transaction no longer exists.',
        variant: 'warning',
        onClose: () => navigation.goBack(),
      });
    }
  }, [transaction, showMessage, navigation]);

  React.useEffect(() => {
    if (filteredCategories.length > 0 && !filteredCategories.some((item) => item.id === categoryId)) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, categoryId]);

  if (!transaction) {
    return (
      <ScreenContainer>
        <View />
      </ScreenContainer>
    );
  }

  const onDateChange = (event: DateTimePickerEvent, pickedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && pickedDate) {
      setSelectedDate(pickedDate);
    }
  };

  const onSave = () => {
    const parsed = Number(amount);
    if (!parsed || Number.isNaN(parsed) || parsed <= 0) {
      showMessage({
        title: 'Invalid amount',
        message: 'Please enter an amount greater than zero.',
        variant: 'error',
      });
      return;
    }

    if (!categoryId) {
      showMessage({
        title: 'Category missing',
        message: 'Please select a category.',
        variant: 'warning',
      });
      return;
    }

    const budgetStatus = updateTransaction({
      id: transaction.id,
      amount: parsed,
      categoryId,
      type,
      date: selectedDate.toISOString(),
      note: note.trim(),
    });

    showMessage({
      title: 'Updated',
      message: 'Transaction updated successfully.',
      variant: 'success',
      onClose: () => navigation.goBack(),
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

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={[styles.heading, { color: theme.colors.text }]}>Edit Transaction</Text>
          <Text style={[styles.sub, { color: theme.colors.textMuted }]}>Update this transaction</Text>

          <View style={[styles.block, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.blockTitle, { color: theme.colors.text }]}>Transaction Type</Text>
            <View style={styles.switchRow}>
              <Pressable
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === 'income' ? theme.colors.success : theme.colors.input,
                    borderColor: type === 'income' ? theme.colors.success : 'transparent',
                  },
                ]}
                onPress={() => setType('income')}
              >
                <Text style={{ color: type === 'income' ? '#FFFFFF' : theme.colors.text, fontWeight: '600' }}>Income</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: type === 'expense' ? theme.colors.danger : theme.colors.input,
                    borderColor: type === 'expense' ? theme.colors.danger : 'transparent',
                  },
                ]}
                onPress={() => setType('expense')}
              >
                <Text style={{ color: type === 'expense' ? '#FFFFFF' : theme.colors.text, fontWeight: '600' }}>Expense</Text>
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

            <Label text="Date" color={theme.colors.textMuted} />
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
          </View>

          <View style={[styles.block, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Label text="Note" color={theme.colors.textMuted} />
            <TextInput
              value={note}
              onChangeText={setNote}
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
            <Text style={styles.primaryText}>Save Changes</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Label({ text, color }: { text: string; color: string }) {
  return <Text style={{ color, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 10 }}>{text}</Text>;
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
      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
      <Text style={{ color: textColor, fontSize: 12, fontWeight: active ? '700' : '500' }}>{item.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
  },
  heading: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
  },
  sub: {
    marginTop: 4,
    marginBottom: 8,
  },
  block: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  input: {
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 14,
  },
  datePickerButton: {
    justifyContent: 'center',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginRight: 7,
  },
  noteInput: {
    minHeight: 92,
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
