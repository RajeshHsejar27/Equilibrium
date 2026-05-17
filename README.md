# Equilibrium - Personal Expense & Savings Tracker

A mobile-first, responsive, offline-first personal expense tracking application built for speed, performance, and premium user experience.

## Key Features

*   **Offline-First**: Works entirely without internet using IndexedDB (Dexie.js).
*   **Privacy Centric**: No login required. All data stays 100% locally on your browser.
*   **Inflow/Outflow Management**: Support for both Income (Inflow) and Expenses (Outflow) with automated balancing.
*   **Customizable Aesthetics**: Dynamic accent color selection that persists across sessions.
*   **Mobile Optimized**: Intuitive bottom navigation and fast-entry Floating Action Button (FAB).
*   **Advanced Analytics**: Sliding timeframe windows for category distribution and trend analysis.
*   **Savings Allocation**: Track "Total Savings" pool and allocate funds to specific goals with deficit warnings.
*   **Data Portability**: Full system backup and export via multi-sheet Excel (XLSX).
*   **PWA Support**: Fully installable on Android and iOS with service worker support.

## Alerts & Notifications

The application provides intelligent, real-time alerts and notifications to help you stay on top of your finances:

### Notification Types

*   **Budget Alerts**: Get notified when spending in a category approaches or exceeds your monthly budget threshold.
*   **High Spending Warnings**: Receive alerts when a single category account for a significant portion of your monthly expenses.
*   **Savings Deficit Alerts**: Automatic warning when total allocated savings exceeds your master savings pool balance.
*   **Budget Master Achievements**: Positive reinforcement when you spend less than the previous month.
*   **Recurring Payment Reminders**: Suggestions to review and optimize your recurring/subscription transactions.
*   **Transaction Confirmations**: Instant toast notifications confirming successful expense entries, edits, and deletions.

### Notification Delivery

*   **Toast Notifications**: Non-intrusive, auto-dismissing notifications displayed at the bottom-right corner using Sonner.
*   **In-App Alerts**: Dialog-based alerts for critical warnings (e.g., savings deficit) requiring user acknowledgment.
*   **Dashboard Cards**: Quick-view insight cards displaying active alerts and actionable recommendations.

### Smart Alert Logic

*   **Context-Aware**: Alerts adapt based on your spending patterns and budget configurations.
*   **Non-Intrusive**: Notifications don't disrupt your workflow—only alert you to critical financial events.
*   **Dismissible**: All notifications can be dismissed with a single click or swipe.

## Tech Stack

*   **Frontend**: React 18, TypeScript, Vite 6
*   **Styling**: TailwindCSS 4, shadcn/ui (Base UI), Framer Motion
*   **State Management**: Zustand & Dexie Observable
*   **Database**: IndexedDB (Dexie.js v4) - Schema v2
*   **Data Visualization**: Recharts
*   **Data Grid**: TanStack Table v8
*   **Forms**: React Hook Form, Zod Validation
*   **Notifications**: Sonner (Toast & Alert Management)

## Configuration & Schema

### Database Schema (v2)
The application utilizes a multi-table IndexedDB schema for complex relational data without a backend:
- `expenses`: Transactions with category associations.
- `categories`: Custom categories with `type` (inflow/outflow) and color metadata.
- `savingsGoals`: Tracking targets vs. current progress.
- `budgets`: Monthly limits per category.
- `settings`: Global configuration (Theme, Accent Color, Thresholds).

### PWA Configuration
Configured via `vite-plugin-pwa` for:
- Offline caching of assets.
- Prompt-to-install experience.
- Custom manifest with standalone display mode.

## Project Structure

```txt
Equilibrium/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── expenses/     # Transaction-specific forms
│   │   └── ui/           # shadcn/ui & Base UI primitives
│   ├── context/          # Theme & Accent Color persistence
│   ├── layouts/          # Responsive MainLayout with Nav
│   ├── lib/              # Dexie DB instance & Mock Data
│   ├── pages/            # View-level components
│   ├── store/            # Zustand state management
│   ├── App.tsx           # Router & Providers
│   └── main.tsx          # Entry point
├── public/               # PWA Assets & Icons
├── tailwind.config.js    # Modern Tailwind 4 setup
└── vite.config.ts        # PWA & Path Alias config
```

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone [repository-url]
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run development server**:
    ```bash
    npm run dev
    ```
4.  **Production Build**:
    ```bash
    npm run build
    ```

## License

MIT - Built with passion for personal finance excellence.
