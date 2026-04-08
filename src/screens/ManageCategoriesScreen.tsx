import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAppDialog } from '../components/AppDialogProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAppTheme, useFinance } from '../context/FinanceContext';
import { Category, TransactionType } from '../types';

export function ManageCategoriesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();
  const { state, addCustomCategory, updateCategory, deleteCategory } = useFinance();
  const { showConfirm, showMessage } = useAppDialog();

  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType | 'both'>('both');

  const filteredCategories = state.categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setType(category.type as TransactionType | 'both');
    } else {
      setEditingCategory(null);
      setName('');
      setType('both');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showMessage({ title: 'Validation', message: 'Category name cannot be empty', variant: 'warning' });
      return;
    }

    if (editingCategory) {
      updateCategory({
        ...editingCategory,
        name: trimmed,
        type,
      });
      showMessage({ title: 'Success', message: 'Category updated', variant: 'success' });
    } else {
      addCustomCategory({ name: trimmed, type });
      showMessage({ title: 'Success', message: 'Category added', variant: 'success' });
    }
    setModalVisible(false);
  };

  const handleDelete = (category: Category) => {
    // Basic protection to avoid deleting "both" built-in categories if desired, or let users delete any.
    // For now, let's just warn if there are transactions using it.
    const inUse = state.transactions.some(t => t.categoryId === category.id);
    
    showConfirm({
      title: 'Delete Category',
      message: inUse ? 
        `This category is used in your transactions. Deleting it won't delete the transactions, but might affect reporting. Continue?` : `Are you sure you want to delete "${category.name}"?`,
      confirmText: 'Delete',
      variant: 'error',
      onConfirm: () => {
        deleteCategory(category.id);
        showMessage({ title: 'Deleted', message: 'Category removed', variant: 'success' });
      }
    });
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.cardContent}>
        <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <View style={styles.details}>
          <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.typeText, { color: theme.colors.textMuted }]}>{item.type.toUpperCase()}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => handleOpenModal(item)} style={styles.actionBtn}>
            <Ionicons name="pencil" size={18} color={theme.colors.primary} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
            <Ionicons name="trash" size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>Manage Categories</Text>
      </View>

      <TextInput
        style={[styles.searchInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
        placeholder="Search categories..."
        placeholderTextColor={theme.colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={24} color="#FFF" />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>
            
            <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Name</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.colors.input, color: theme.colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Travel"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={[styles.modalLabel, { color: theme.colors.textMuted }]}>Type</Text>
            <View style={styles.typeRow}>
              {(['income', 'expense', 'both'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeBtn,
                    { 
                      backgroundColor: theme.colors.input,
                      borderColor: type === t ? theme.colors.primary : 'transparent',
                      borderWidth: type === t ? 1 : 0
                    }
                  ]}
                >
                  <Text style={{ color: type === t ? theme.colors.primary : theme.colors.textMuted, fontWeight: '600', textTransform: 'capitalize' }}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.btn, { borderColor: theme.colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: theme.colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  backBtn: {
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeText: {
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
});