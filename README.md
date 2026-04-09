## FinanceFlow – Personal Finance Manager

FinanceFlow is a modern, mobile‑first personal finance manager built with **React Native (Expo) + TypeScript**.  
It helps you track income and expenses, analyze spending patterns, manage budgets and savings goals, and keep everything stored securely on‑device with SQLite.

---

### 📚 Table of Contents

- **Project Description**
- **Features**
- **Architecture Overview**
- **Project Structure**
- **Installation & Setup**
- **Running & Building**
- **Screenshots**
- **Tech Stack**
- **Notes**

---

### 🧾 Project Description

FinanceFlow is designed as a fintech‑style wallet and expense tracker:

- Multiple local users with simple PIN‑style auth and optional UPI ID.
- Categorized income/expense tracking with budgets and savings goals.
- Rich dashboard with charts, reminders, and quick payment helpers.
- Local‑first design with no backend dependencies – ideal for offline usage and demos.

---

### ✨ Features

- **Authentication & Profiles**
  - Local email + PIN sign‑in / sign‑up.
  - Remember‑me support and persisted auth session.
  - Profile screen with editable name and UPI ID.

- **Transactions & History**
  - Add, edit, and delete income/expense transactions.
  - Fields: amount, category, type, date, note.
  - Full transaction history with filters.
  - Undo/restore for deleted items in context state.

- **Categories & Budgets**
  - Pre‑seeded default categories with icons and colors.
  - Custom categories (including income/expense types).
  - Per‑category monthly budgets and actual‑vs‑budget calculations.

- **Dashboard & Insights**
  - Dashboard with welcome header and quick stats.
  - Gradient balance card showing income, expenses, and net balance.
  - Weekly / monthly charts using `react-native-gifted-charts`.
  - Circular summary ring and highlight cards.

- **Reminders & Payments**
  - Payment reminders with frequency and reminder date.
  - Lightweight “Pay now” helper screen, QR usage, and GPay‑style card export.

- **Savings & Goals**
  - Savings goals per user with target amounts.
  - Simple list and CRUD operations stored in SQLite.

- **Theming & UX**
  - Light / Dark mode toggle stored in settings.
  - Fintech‑style gradients, cards, and smooth animations.
  - Keyboard‑aware forms and safe‑area handling.

---

### 🏗 Architecture Overview

- **UI / Navigation**
  - `App.tsx` defines a **bottom‑tab navigator** (`Dashboard`, `Balance`, `History`, `Summary`, `Profile`) plus hidden routes (`AddEntry`, `EditTransaction`, `PayNow`, `ManageCategories`).
  - Navigation is driven by `@react-navigation/native` and `@react-navigation/bottom-tabs`.
  - Global theming is wired into the navigation theme for consistent colors.

- **State Management**
  - `src/context/FinanceContext.tsx` exposes a `FinanceProvider` and `useFinance` hook.
  - Central `FinanceState` (users, transactions, categories, budgets, reminders, goals, theme, auth) with a reducer handling actions for all domains.
  - All screens interact with the app state via this context (e.g., `addTransaction`, `setCategoryBudget`, `addSavingsGoal`, `addReminder`, `signIn`, `signOut`).

- **Persistence Layer**
  - `src/db/sqliteStorage.ts` handles:
    - Database initialization and schema migrations.
    - Seeding default categories and deterministic demo data for users.
    - CRUD helpers for users, transactions, categories, reminders, budgets, goals, theme, currency, and auth.
  - Data is stored in a local SQLite database (`financeflow.db`) using `expo-sqlite`.

- **Theming & Design System**
  - `src/theme/theme.ts` provides a small design system (colors, typography, spacing) and theme modes (`light` / `dark`).
  - Shared UI primitives such as `ScreenContainer`, `GradientBalanceCard`, `SummaryRing`, `EmptyState`, and `AppDialogProvider` make screens consistent and polished.

- **Screens**
  - `DashboardScreen`: overview of balances, charts, reminders, and quick actions.
  - `BalanceScreen`: wallet‑style breakdown of income vs expenses over time.
  - `TransactionsScreen` (`History` tab): full transaction list and detail navigation.
  - `SummaryScreen`: analytics and category‑wise summaries.
  - `ProfileScreen`: theme toggle, profile details, and account actions.
  - `AddTransactionScreen` / `EditTransactionScreen`: forms for adding/updating entries.
  - `PaymentScreen`: quick payment helper UI.
  - `ManageCategoriesScreen`: manage default and custom categories.
  - `AuthScreen`: sign‑in / sign‑up experience.

---

### 📁 Project Structure

```text
FinanceFlow/
  src/
    components/        # Shared UI components (cards, dialogs, chart wrappers, etc.)
    constants/         # Defaults like category definitions
    context/           # FinanceContext (global state + hooks)
    db/                # SQLite persistence helpers
    screens/           # Feature screens (Dashboard, History, Profile, etc.)
    theme/             # Theme + design tokens
    types.ts           # Core domain types (Transaction, Category, Budget, User, ...)
  App.tsx              # Navigation + app shell
  app.json             # Expo app configuration
  package.json         # Scripts and dependencies
  README.md
```

---

### ⚙️ Installation & Setup

1. **Prerequisites**
   - Node.js LTS (v20+ recommended).
   - Yarn or npm.
   - Expo CLI (optional) and Android/iOS tooling if you want to run on simulators.

2. **Clone the repository**

```bash
git clone https://github.com/Dhyey-19/FinanceFlow.git
cd FinanceFlow
```

3. **Install dependencies**

```bash
npm install
```

4. **Start the Metro bundler**

```bash
npm run start
```

5. **Run the app**

- Press `a` in the terminal for Android emulator.
- Press `i` for iOS simulator (on macOS).
- Or scan the QR code with the **Expo Go** app.

---

### 📦 Running & Building

**Development**

```bash
npm run start          # start Metro bundler
npm run android        # run with expo run:android
npm run ios            # run with expo run:ios
npm run web            # run in browser
```

**Type‑checking**

```bash
npm run typecheck
```

**Android APK (local Gradle build)**

From the project root:

```bash
cd android
./gradlew.bat assembleDebug   # Windows
```

This produces a debug APK under `android/app/build/outputs/apk/debug/` that already includes the seeded local data from SQLite.

**EAS (hosted) builds** – if you prefer Expo’s cloud builds:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

---

### 📱 Screenshots

The repository includes a full set of screenshots in the `screenshots` folder. The gallery below uses root-relative paths so every image renders correctly on GitHub.

<table>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(1).jpg" width="260" alt="Screenshot 1" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(2).jpg" width="260" alt="Screenshot 2" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(3).jpg" width="260" alt="Screenshot 3" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(4).jpg" width="260" alt="Screenshot 4" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(5).jpg" width="260" alt="Screenshot 5" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(6).jpg" width="260" alt="Screenshot 6" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(7).jpg" width="260" alt="Screenshot 7" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(8).jpg" width="260" alt="Screenshot 8" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(9).jpg" width="260" alt="Screenshot 9" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(10).jpg" width="260" alt="Screenshot 10" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(11).jpg" width="260" alt="Screenshot 11" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(12).jpg" width="260" alt="Screenshot 12" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(13).jpg" width="260" alt="Screenshot 13" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(14).jpg" width="260" alt="Screenshot 14" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(15).jpg" width="260" alt="Screenshot 15" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(16).jpg" width="260" alt="Screenshot 16" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(17).jpg" width="260" alt="Screenshot 17" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(18).jpg" width="260" alt="Screenshot 18" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(19).jpg" width="260" alt="Screenshot 19" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(20).jpg" width="260" alt="Screenshot 20" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(21).jpg" width="260" alt="Screenshot 21" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(22).jpg" width="260" alt="Screenshot 22" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(23).jpg" width="260" alt="Screenshot 23" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(24).jpg" width="260" alt="Screenshot 24" /></td>
  </tr>
  <tr>
    <td align="center"><img src="screenshots/ScreenShot%20(25).jpeg" width="260" alt="Screenshot 25" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(26).jpg" width="260" alt="Screenshot 26" /></td>
    <td align="center"><img src="screenshots/ScreenShot%20(27).jpg" width="260" alt="Screenshot 27" /></td>
  </tr>
</table>

---

### 🧰 Tech Stack

- **React Native** (Expo SDK 54)
- **TypeScript**
- **React Navigation** (bottom tabs)
- **SQLite** via `expo-sqlite` for local persistence
- **Expo Camera, File System, Sharing, Print** for QR, exports, and utilities
- **React Native SVG** and **react-native-gifted-charts** for visualizations

---

### 📝 Notes

- All data is stored **locally on‑device**; there is no backend dependency.
- Theme mode, currency, and auth session are persisted in the SQLite database.
- The app seeds deterministic demo data on first run, so fresh installs (including APK builds) open with meaningful sample transactions and users.
