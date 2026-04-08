import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppSplash } from './src/components/AppSplash';
import { AppDialogProvider } from './src/components/AppDialogProvider';
import { FinanceProvider, useAppTheme, useFinance } from './src/context/FinanceContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { BalanceScreen } from './src/screens/BalanceScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { EditTransactionScreen } from './src/screens/EditTransactionScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { ManageCategoriesScreen } from './src/screens/ManageCategoriesScreen';

export type RootTabParamList = {
  Dashboard: undefined;
  Balance: undefined;
  History: { categoryFilter?: string; fromDate?: string; toDate?: string } | undefined;
  Summary: undefined;
  Profile: undefined;
  AddEntry: undefined;
  EditTransaction: {
    transactionId: string;
  };
  PayNow: {
    name: string;
    email: string;
    amount: number;
    paymentName: string;
  };
  ManageCategories: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function AppNavigator() {
  const theme = useAppTheme();
  const { isReady, state } = useFinance();
  const insets = useSafeAreaInsets();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    if (!isReady) {
      return;
    }
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, [isReady]);

  const navTheme: Theme = {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.tabBar,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '800',
      },
    },
  };

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.textMuted }}>Preparing your wallet...</Text>
      </View>
    );
  }

  if (showSplash) {
    return (
      <>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <AppSplash />
      </>
    );
  }

  if (!state.auth.isAuthenticated) {
    return (
      <>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <AuthScreen />
      </>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            height: 56 + insets.bottom,
            paddingBottom: Math.max(8, insets.bottom),
            paddingTop: 8,
            elevation: 0,
          },
          tabBarItemStyle: { borderRadius: 0, flex: 1 },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size, focused }) => {
            const iconMap: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
              Dashboard: focused ? 'home' : 'home-outline',
              Balance: focused ? 'wallet' : 'wallet-outline',
              History: focused ? 'time' : 'time-outline',
              Summary: focused ? 'pie-chart' : 'pie-chart-outline',
              Profile: focused ? 'person' : 'person-outline',
              AddEntry: focused ? 'add-circle' : 'add-circle-outline',
              EditTransaction: focused ? 'create' : 'create-outline',
              PayNow: focused ? 'card' : 'card-outline',
              ManageCategories: focused ? 'list' : 'list-outline',
            };

            return <Ionicons name={iconMap[route.name as keyof RootTabParamList]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Balance" component={BalanceScreen} />
        <Tab.Screen name="History" component={TransactionsScreen} />
        <Tab.Screen name="Summary" component={SummaryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen
          name="AddEntry"
          component={AddTransactionScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
        <Tab.Screen
          name="EditTransaction"
          component={EditTransactionScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
        <Tab.Screen
          name="PayNow"
          component={PaymentScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
        <Tab.Screen
          name="ManageCategories"
          component={ManageCategoriesScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <FinanceProvider>
          <AppDialogProvider>
            <AppNavigator />
          </AppDialogProvider>
        </FinanceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
