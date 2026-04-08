import React, { createContext, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../context/FinanceContext';

type DialogVariant = 'info' | 'success' | 'error' | 'warning';

type ShowMessageInput = {
  title: string;
  message: string;
  variant?: DialogVariant;
  buttonText?: string;
  onClose?: () => void;
};

type ShowConfirmInput = {
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type DialogState = {
  visible: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmText: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type AppDialogContextValue = {
  showMessage: (input: ShowMessageInput) => void;
  showConfirm: (input: ShowConfirmInput) => void;
};

const AppDialogContext = createContext<AppDialogContextValue | undefined>(undefined);

const INITIAL_STATE: DialogState = {
  visible: false,
  title: '',
  message: '',
  variant: 'info',
  confirmText: 'OK',
};

function getVariantColors(variant: DialogVariant, mode: 'light' | 'dark') {
  if (variant === 'success') {
    return { accent: '#16A34A', soft: mode === 'light' ? '#DCFCE7' : '#14532D' };
  }
  if (variant === 'error') {
    return { accent: '#DC2626', soft: mode === 'light' ? '#FEE2E2' : '#7F1D1D' };
  }
  if (variant === 'warning') {
    return { accent: '#D97706', soft: mode === 'light' ? '#FEF3C7' : '#78350F' };
  }
  return { accent: '#2563EB', soft: mode === 'light' ? '#DBEAFE' : '#1E3A8A' };
}

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppTheme();
  const [dialog, setDialog] = useState<DialogState>(INITIAL_STATE);

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, visible: false }));
  };

  const showMessage = ({ title, message, variant = 'info', buttonText = 'OK', onClose }: ShowMessageInput) => {
    setDialog({
      visible: true,
      title,
      message,
      variant,
      confirmText: buttonText,
      onConfirm: onClose,
    });
  };

  const showConfirm = ({
    title,
    message,
    variant = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
  }: ShowConfirmInput) => {
    setDialog({
      visible: true,
      title,
      message,
      variant,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    });
  };

  const colors = getVariantColors(dialog.variant, theme.mode);

  const value = useMemo(
    () => ({
      showMessage,
      showConfirm,
    }),
    [],
  );

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <Modal visible={dialog.visible} transparent animationType="fade" onRequestClose={closeDialog}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.badge, { backgroundColor: colors.soft }]}> 
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.badgeText, { color: colors.accent }]}>{dialog.variant.toUpperCase()}</Text>
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>{dialog.title}</Text>
            <Text style={[styles.message, { color: theme.colors.textMuted }]}>{dialog.message}</Text>

            <View style={styles.footer}>
              {dialog.cancelText ? (
                <Pressable
                  style={[styles.button, styles.cancelBtn, { borderColor: theme.colors.border }]}
                  onPress={() => {
                    closeDialog();
                    dialog.onCancel?.();
                  }}
                >
                  <Text style={[styles.cancelText, { color: theme.colors.text }]}>{dialog.cancelText}</Text>
                </Pressable>
              ) : null}

              <Pressable
                style={[styles.button, styles.confirmBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  closeDialog();
                  dialog.onConfirm?.();
                }}
              >
                <Text style={styles.confirmText}>{dialog.confirmText}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppDialogContext.Provider>
  );
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used inside AppDialogProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 88,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {
    borderWidth: 0,
  },
  cancelText: {
    fontWeight: '600',
    fontSize: 13,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
