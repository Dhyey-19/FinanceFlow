import React from "react";
import { View, Text, StyleSheet, Pressable, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFinance, useAppTheme } from "../context/FinanceContext";

export function BalanceSummaryCard() {
  const { state, getMonthlySummary, formatCurrency } = useFinance();
  const theme = useAppTheme();
  const d = new Date();
  const summary = getMonthlySummary(d.getMonth(), d.getFullYear());

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Total Balance</Text>
      <Text style={[styles.amount, { color: theme.colors.text }]}>{formatCurrency(summary.balance)}</Text>
      <View style={styles.row}>
        <View style={styles.statBox}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Income</Text>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>+{formatCurrency(summary.income)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>Expenses</Text>
          <Text style={[styles.statValue, { color: theme.colors.danger }]}>-{formatCurrency(summary.expenses)}</Text>
        </View>
      </View>
    </View>
  );
}

export function CreditScoreCard() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
       <Text style={[styles.title, { color: theme.colors.text }]}>Credit Score</Text>
       <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
         <Ionicons name="speedometer-outline" size={32} color={theme.colors.success} style={{ marginRight: 15 }} />
         <View>
           <Text style={[styles.amount, { color: theme.colors.success, fontSize: 24 }]}>784</Text>
           <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>Excellent - Keep it up!</Text>
         </View>
       </View>
    </View>
  );
}

export function ExpenseChartCard() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
       <Text style={[styles.title, { color: theme.colors.text }]}>Analytics</Text>
       <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: theme.colors.textMuted }}>Chart data goes here</Text>
       </View>
    </View>
  );
}

export function SavingsGoalsCard() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
       <Text style={[styles.title, { color: theme.colors.text }]}>Savings Goals</Text>
       <Text style={{ color: theme.colors.textMuted, marginTop: 10 }}>No savings goals set yet.</Text>
    </View>
  );
}

export function ProfileDetailsCard() {
  const { state } = useFinance();
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Personal Details</Text>
      <View style={{ marginTop: 10 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16 }}>{state.auth.userName}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>{state.auth.userEmail}</Text>
      </View>
    </View>
  );
}

export function ProfilePreferencesCard() {
  const { state, toggleTheme } = useFinance();
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Preferences</Text>
      <View style={[styles.row, { marginTop: 15, justifyContent: "space-between" }]}>
        <Text style={{ color: theme.colors.text, fontSize: 15 }}>Dark Mode</Text>
        <Switch 
          value={state.themeMode === "dark"} 
          onValueChange={(val) => toggleTheme()} 
        />
      </View>
    </View>
  );
}

export function MonthlyBudgetCard() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Monthly Budget</Text>
      <Text style={{ color: theme.colors.textMuted, marginTop: 10 }}>Budgets reset on the 1st of every month.</Text>
    </View>
  );
}

export function ProfileAboutCard() {
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>About FinanceFlow</Text>
      <Text style={{ color: theme.colors.textMuted, marginTop: 10 }}>Version 1.0.0</Text>
    </View>
  );
}

export function ProfileDangerZone() {
  const { deleteAccount, signOut } = useFinance();
  const theme = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.danger }]}>
      <Text style={[styles.title, { color: theme.colors.danger }]}>Danger Zone</Text>
      
      <Pressable onPress={signOut} style={[styles.btn, { backgroundColor: theme.colors.input, marginTop: 15 }]}>
        <Text style={{ color: theme.colors.text, fontWeight: "600", textAlign: "center" }}>Sign Out</Text>
      </Pressable>

      <Pressable 
        onPress={() => {
          Alert.alert("Delete Account", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: deleteAccount }
          ])
        }} 
        style={[styles.btn, { backgroundColor: theme.colors.danger, marginTop: 10 }]}
      >
        <Text style={{ color: "#FFF", fontWeight: "600", textAlign: "center" }}>Delete Account</Text>
      </Pressable>
    </View>
  );
}

// Stubs for TransactionHeader things if missing
export const TransactionHeader = (props: any) => null;
export const TransactionToolbar = (props: any) => null;
export const TransactionModals = (props: any) => null;
export const TransactionUndoBanner = (props: any) => null;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  amount: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    marginTop: 16,
  },
  statBox: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  btn: {
    padding: 14,
    borderRadius: 12,
  },
});
