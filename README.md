# FinanceFlow

A complete personal finance tracker designed to help you manage your money, analyze your spending habits, and secure your financial future.

## ✨ Features
*   **Intuitive Dashboard:** Get an overview of your weekly/monthly income and expenses.
*   **Transaction Management:** Easily add, edit, and delete transactions. Categorize your spending for better insights.
*   **Categories Administration:** Create and manage custom categories with icons and colors.
*   **Monthly Budget Set:** Set and track custom monthly budgets for specific categories with visual progress bars.
*   **Savings Goals:** Track and manage personal savings goals and check your progress easily.
*   **Payment Reminders:** Set up monthly or regular payment reminders so you never forget a bill.
*   **Data Export:** Securely export your transaction history and financial summaries directly to PDF and CSV formats.
*   **Sort & Filter:** Advanced custom sorting and filtering options in your transaction history pages.
*   **Interactive Charts:** Use robust pie charts and dynamic animated graphs to visualize where your money goes.
*   **QR Scanner & Sharing:** Scan transaction receipts and share them instantly as perfectly styled full-image cards using the camera view.
*   **Dark/Light Mode:** Seamlessly toggle your app's overarching display theme directly from the Profile screen.

## 🚀 Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Dhyey-19/FinanceFlow.git
    cd FinanceFlow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Expo server:**
    ```bash
    npx expo start
    ```

4.  **Run the app:**
    *   Press `a` in the terminal to run on an Android emulator.
    *   Press `i` in the terminal to open it in Xcode iOS Simulator.
    *   Alternatively, scan the QR code using the **Expo Go** app on your physical device.

## 📱 Screenshots
*(Add screenshots inside a "screenshots" folder and replace these placeholders)*

| Dashboard | Summary |
| :---: | :---: |
| <img src="screenshots/dashboard.png" width="300"/> | <img src="screenshots/summary.png" width="300"/> |

| Profile | Manage Categories |
| :---: | :---: |
| <img src="screenshots/profile.png" width="300"/> | <img src="screenshots/manage_categories.png" width="300"/> |

## 🛠 Built With
*   **React Native / Expo**
*   **TypeScript**
*   **SQLite** (Local state)
*   **React Navigation**
# FinanceFlow - Finance Manager / Expense Tracker

A modern fintech-style React Native app built with Expo and TypeScript.

## Features

- Add income and expense transactions
- Fields: amount, category, date, note
- Form validation with user-friendly alerts
- Predefined categories + custom category creation
- Category visual distinction via colors and icons
- Monthly finance summary:
  - Total income
  - Total expenses
  - Remaining balance
- Gradient balance cards and clean mobile UI
- Dark/Light mode toggle (persisted locally)
- Bottom tab navigation with 4 tabs:
  - Dashboard
  - Add
  - Transactions
  - Settings
- Animations:
  - Screen fade/slide transitions
  - Transaction item reveal animation
- Keyboard-friendly form UX with `KeyboardAvoidingView`
- Local-first data persistence using AsyncStorage (no backend)
- Bonus:
  - Circular spending summary ring
  - Smart empty states

## Tech Stack

- Expo SDK 54
- React Native + TypeScript
- React Navigation (Bottom Tabs)
- AsyncStorage
- Expo Linear Gradient
- React Native SVG

## Project Structure

```text
FinanceFlow/
  src/
    components/
    constants/
    context/
    screens/
    theme/
    types.ts
  App.tsx
  app.json
```

## Setup

1. Install Node.js LTS (v20+ recommended).
2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run start
```

4. Run on device/emulator:

```bash
npm run android
npm run ios
npm run web
```

5. Type-check:

```bash
npm run typecheck
```

## Build Delivery

### Android APK (recommended for assignment submission)

1. Install EAS CLI:

```bash
npm install -g eas-cli
```

2. Login to Expo:

```bash
eas login
```

3. Configure EAS in project:

```bash
eas build:configure
```

4. Build APK:

```bash
eas build -p android --profile preview
```

The command returns a build URL where you can download the APK.

### Android Play Store Internal Testing (AAB)

```bash
eas build -p android --profile production
```

Upload generated `.aab` to Google Play Console -> Internal testing.

### iOS TestFlight (requires Apple Developer account + macOS setup)

```bash
eas build -p ios --profile production
```

Then submit using:

```bash
eas submit -p ios
```

## Screenshots

Add screenshots in a folder named `screenshots/` and reference them here:

- Dashboard
- Add Transaction
- Transactions
- Settings
- Dark Mode

## Validation Done

- TypeScript compile check passed:

```bash
npm run typecheck
```

## App Identifier

- App Name: `FinanceFlow`
- Android Package: `it.dtech.financeflow`
- iOS Bundle Identifier: `it.dtech.financeflow`

## Notes

- All data is stored locally on-device.
- No backend service is required.
- Date input uses `YYYY-MM-DD` format for quick manual entry.
