import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../context/FinanceContext';

export function AppSplash() {
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}> 
      <LinearGradient
        colors={[
          `${theme.colors.gradientStart}20`,
          theme.colors.background,
          `${theme.colors.gradientEnd}18`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.logoWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}> 
          <Image source={require('../../assets/financeflow_logo.png')} style={styles.logoImage} resizeMode="cover" />
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>FinanceFlow</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Smart money, clear decisions.</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    width: 86,
    height: 86,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
  },
});
