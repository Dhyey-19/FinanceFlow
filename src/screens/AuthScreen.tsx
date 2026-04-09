import React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDialog } from '../components/AppDialogProvider';
import { useAppTheme, useFinance } from '../context/FinanceContext';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const theme = useAppTheme();
  const { showMessage } = useAppDialog();
  const { signIn, signUp } = useFinance();
  const insets = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);

  const [mode, setMode] = React.useState<Mode>('signin');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [upiId, setUpiId] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (index: number) => {
    const y = 130 + index * 72;
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  const submitBg = theme.mode === 'light' ? '#0F172A' : '#FFFFFF';
  const submitTextColor = theme.mode === 'light' ? '#FFFFFF' : '#0F172A';

  const onSubmit = () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showMessage({
        title: 'Invalid email',
        message: 'Please enter a valid email address.',
        variant: 'error',
      });
      return;
    }

    if (password.length < 4) {
      showMessage({
        title: 'Weak password',
        message: 'Password must be at least 4 characters.',
        variant: 'warning',
      });
      return;
    }

    if (mode === 'signup') {
      if (!trimmedName) {
        showMessage({
          title: 'Name required',
          message: 'Please enter your full name.',
          variant: 'warning',
        });
        return;
      }
      if (password !== confirmPassword) {
        showMessage({
          title: 'Password mismatch',
          message: 'Confirm password should match password.',
          variant: 'error',
        });
        return;
      }
      const result = signUp({
        name: trimmedName,
        email: trimmedEmail,
        password,
        rememberMe,
        upiId,
      });
      if (!result.ok) {
        showMessage({
          title: 'Sign up failed',
          message: result.message || 'Unable to create account.',
          variant: 'error',
        });
      }
      return;
    }

    const result = signIn({
      email: trimmedEmail,
      password,
      rememberMe,
    });
    if (!result.ok) {
      showMessage({
        title: 'Sign in failed',
        message: result.message || 'Unable to sign in.',
        variant: 'error',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}> 
      <LinearGradient
        colors={[
          theme.colors.background,
          `${theme.colors.gradientStart}14`,
          theme.colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.scroll,
              isKeyboardVisible ? styles.scrollKeyboard : styles.scrollCentered,
              { paddingBottom: Math.max(insets.bottom, 16) + (isKeyboardVisible ? 140 : 24) },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
              <View style={[styles.logoWrap, { backgroundColor: theme.colors.input }]}> 
                <Image source={require('../../assets/financeflow_logo.png')} style={styles.logoImage} resizeMode="cover" />
              </View>
              <Text style={[styles.welcome, { color: theme.colors.text }]}>Welcome to FinanceFlow</Text>
              <Text style={[styles.caption, { color: theme.colors.textMuted }]}>Send money globally with the real exchange rate</Text>

              <View style={[styles.segment, { backgroundColor: theme.colors.input }]}> 
                <Pressable
                  onPress={() => setMode('signin')}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: mode === 'signin' ? theme.colors.card : 'transparent',
                      borderColor: mode === 'signin' ? theme.colors.border : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 12 }}>Sign In</Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode('signup')}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: mode === 'signup' ? theme.colors.card : 'transparent',
                      borderColor: mode === 'signup' ? theme.colors.border : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 12 }}>Sign Up</Text>
                </Pressable>
              </View>

              {mode === 'signup' ? (
                <>
                  <Label text="Full Name" color={theme.colors.textMuted} />
                  <Input value={name} onChangeText={setName} placeholder="Enter your full name" color={theme.colors.text} muted={theme.colors.textMuted} inputBg={theme.colors.input} onFocus={() => scrollToField(0)} autoCapitalize="words" />
                </>
              ) : null}

              <Label text="Email" color={theme.colors.textMuted} />
              <Input value={email} onChangeText={setEmail} placeholder="Enter your email" color={theme.colors.text} muted={theme.colors.textMuted} inputBg={theme.colors.input} onFocus={() => scrollToField(mode === 'signup' ? 1 : 0)} autoCapitalize="none" keyboardType="email-address" />

              <Label text="Password" color={theme.colors.textMuted} />
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                color={theme.colors.text}
                muted={theme.colors.textMuted}
                inputBg={theme.colors.input}
                secureTextEntry
                onFocus={() => scrollToField(mode === 'signup' ? 2 : 1)}
                autoCapitalize="none"
              />

              {mode === 'signup' ? (
                <>
                  <Label text="Confirm Password" color={theme.colors.textMuted} />
                  <Input
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    color={theme.colors.text}
                    muted={theme.colors.textMuted}
                    inputBg={theme.colors.input}
                    secureTextEntry
                    onFocus={() => scrollToField(3)}
                    autoCapitalize="none"
                  />

                  <Label text="UPI ID (Optional)" color={theme.colors.textMuted} />
                  <Input
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="e.g. user@okaxis"
                    color={theme.colors.text}
                    muted={theme.colors.textMuted}
                    inputBg={theme.colors.input}
                    onFocus={() => scrollToField(4)}
                    autoCapitalize="none"
                  />
                </>
              ) : null}

              <Pressable style={styles.rememberRow} onPress={() => setRememberMe((prev) => !prev)}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: rememberMe ? theme.colors.primary : theme.colors.border,
                      backgroundColor: rememberMe ? theme.colors.primary : 'transparent',
                    },
                  ]}
                >
                  {rememberMe ? <Ionicons name="checkmark" color="#FFFFFF" size={12} /> : null}
                </View>
                <Text style={{ color: theme.colors.text, fontSize: 12 }}>Remember me</Text>
              </Pressable>

              <Pressable onPress={onSubmit} style={[styles.submit, { backgroundColor: submitBg }]}>
                <Text style={[styles.submitText, { color: submitTextColor }]}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function Label({ text, color }: { text: string; color: string }) {
  return <Text style={{ color, fontSize: 11, marginBottom: 6, marginTop: 10 }}>{text}</Text>;
}

function Input({
  value,
  onChangeText,
  placeholder,
  color,
  muted,
  inputBg,
  secureTextEntry,
  onFocus,
  autoCapitalize,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  color: string;
  muted: string;
  inputBg: string;
  secureTextEntry?: boolean;
  onFocus?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={onFocus}
      placeholder={placeholder}
      placeholderTextColor={muted}
      secureTextEntry={secureTextEntry}
      style={[styles.input, { color, backgroundColor: inputBg }]}
      autoCapitalize={autoCapitalize || 'none'}
      keyboardType={keyboardType || 'default'}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  scrollCentered: {
    justifyContent: 'center',
    paddingTop: 24,
  },
  scrollKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  welcome: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
  },
  rememberRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submit: {
    marginTop: 14,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
