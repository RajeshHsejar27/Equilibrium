# Equilibrium - Financial Logic Documentation

This document outlines the core calculation formulas and data processing logic used throughout the Equilibrium application.

## 1. Dashboard Metrics

### Core Aggregates
- **Total Expenses**: Sum of all transactions with a category marked as `type: 'outflow'` within the current timeframe.
- **Total Income**: Sum of all transactions with a category marked as `type: 'inflow'` within the current timeframe.
- **Cash Balance**: `Total Income - Total Expenses` (Net position for the period).
- **Expense Change (%)**: `((Current Month Total - Last Month Total) / Last Month Total) * 100`.

### Savings Logic
- **Allocated Savings**: Sum of `currentAmount` across all active `savingsGoals`.
- **Master Savings Pool**: Fetched from `settings.totalSavings`.
- **Savings Progress (%)**: `(Allocated Savings / Master Savings Pool) * 100`.
- **Savings Deficit**: If `Allocated Savings > Master Savings Pool`, the system triggers a "Deficit" warning in the UI.

---

## 2. Analytics & Visualizations

### Cash Flow Trend (Area Chart)
- **Timeframe**: Sliding 12-month window based on the selected year.
- **Logic**: For each month, the system calculates:
  - `Income`: Sum of all inflow transactions in that month.
  - `Spent`: Sum of all outflow transactions in that month.
- **Visualization**: Stacked area chart showing the gap between earning and spending.

### Category Distribution (Pie Chart)
- **Timeframe**: Individual month selected via the 12-dot slider.
- **Logic**:
  1. Filter transactions for the selected month and year.
  2. Group by category (outflow only).
  3. Sort by amount descending.
  4. **Grouping Strategy**: If categories > 7, keep top 6 and bundle the rest into an "Other" category (Color: `#94a3b8`).
- **Fallback**: If no data is found for the month, a grey circle with "NA" (Not Applicable) is displayed.

### Category Trends (Bar Chart)
- **Timeframe**: 4-month chunks (Q1-Q4 style) based on the `trendChunk` selector.
- **Selection Logic**: Automatically identifies the **Top 7 categories** by total expenditure across the entire selected year to track their performance over time.

---

## 3. Alerts & Notifications System

### Overview
The notification system is built on a two-tier architecture:
1. **Toast Notifications** (Sonner): Lightweight, auto-dismissing feedback for user actions.
2. **Dialog Alerts**: Modal-based alerts for critical warnings requiring acknowledgment.

### Alert Evaluation Engine

The system continuously evaluates transaction data against user-defined thresholds to generate real-time alerts:

#### Budget Threshold Alerts
- **Trigger Condition**: When a category's spending reaches a percentage of its monthly budget.
- **Formula**: `(Category Spend / Monthly Budget) * 100 >= Threshold %`
- **Default Threshold**: Typically 80-90% (configurable per budget).
- **Notification Format**: Toast alert with category name, spent amount, and remaining budget.
- **Implementation**: Evaluated during transaction insertion and on budget/settings updates via Zustand store observers.

#### High Spending Alerts
- **Trigger Condition**: When a single category accounts for >25% of total monthly spending.
- **Formula**: `(Category Spend / Total Monthly Spend) * 100 > 25%`
- **Evaluation Frequency**: Recalculated on the 1st of each month or on significant expense additions.
- **Notification Format**: Dashboard insight card with dynamic message: *"You've spent ₹X on Category Y, which is Z% of your total budget."*

#### Savings Deficit Warning
- **Trigger Condition**: When total allocated savings exceeds the master savings pool.
- **Formula**: `Sum(savingsGoals[].currentAmount) > settings.totalSavings`
- **Severity**: Critical (dialog-based alert requiring dismissal).
- **Notification Format**: Modal dialog displaying deficit amount and suggestions to rebalance savings goals.
- **Persistence**: Warning state cached in settings; cleared when deficit is resolved.

#### Budget Master (Positive Trend)
- **Trigger Condition**: When current month spending is less than previous month.
- **Formula**: `Current Month Spend < Previous Month Spend`
- **Notification Format**: Encouraging dashboard card displaying savings amount: *"Great job! You've saved ₹X compared to last month."*
- **Evaluation**: Automatic on month-end or when Dashboard page loads.

#### Recurring Payment Reminders
- **Trigger Condition**: Detection of repeated transactions (same category, similar amount, recurring pattern).
- **Pattern Recognition**: Transactions matching criteria (amount within ±10%, category, recurring date pattern).
- **Notification Format**: Dashboard suggestion card recommending recurring transaction management.
- **Implementation**: Mock-based evaluation (can be enhanced with ML prediction later).

### Notification Dispatch

#### Toast Notifications (Sonner)
- **Trigger Events**:
  - Successful expense creation: `toast.success("Expense added successfully")`
  - Successful expense update: `toast.success("Expense updated")`
  - Successful expense deletion: `toast.success("Expense deleted")`
  - Budget threshold reached: `toast.warning("Budget alert: Category X is now Z% full")`
  - Error handling: `toast.error("Failed to save expense")`
- **Auto-Dismiss**: 3-4 second timeout.
- **Position**: Bottom-right corner (configurable).
- **Dismissal**: Users can manually close or swipe away.

#### Dialog Alerts
- **Trigger Events**:
  - Savings deficit detection: Modal with deficit details and action buttons.
  - Confirmation dialogs: Before deleting expenses or modifying budgets.
  - Critical validation errors: Form submission failures.
- **Behavior**: Blocks further interaction until acknowledged.
- **Implementation**: Uses shadcn/ui Dialog component with Zod validation feedback.

#### Dashboard Insight Cards
- **Rendering Logic**: Dynamically rendered based on current alert state in Zustand store.
- **Card Types**:
  - High Spending Alert Card
  - Budget Master Achievement Card
  - Savings Deficit Warning Card
  - Subscription Cleanup Suggestion Card
- **Update Trigger**: On Dashboard mount, monthly date change, or after transaction modification.

### State Management for Alerts

**Zustand Store Structure** (in `useStore.ts`):
```typescript
alerts: {
  highSpendingAlert: { isActive: boolean; category: string; amount: number; percentage: number },
  budgetThresholdAlert: { isActive: boolean; budgetId: string; category: string; percentage: number },
  savingsDeficitAlert: { isActive: boolean; deficitAmount: number },
  budgetMasterAlert: { isActive: boolean; savedAmount: number },
  recurringPaymentSuggestion: { isActive: boolean; transactionIds: string[] }
}
```

- **Persistence**: Alert states are evaluated on-demand and not persisted to IndexedDB (transient).
- **Reactivity**: Store subscribers trigger re-renders when alert state changes.
- **Dismissal**: Users can manually dismiss alerts; state updates to `isActive: false`.

### Performance Optimization

- **Lazy Evaluation**: Alerts are computed only when accessed (Dashboard page load, settings change).
- **Debouncing**: Rapid transaction entries are debounced before alert re-evaluation.
- **Memoization**: Alert calculations cache results for the current month to avoid redundant computations.
- **Batch Updates**: Multiple related alerts are computed in a single operation and dispatched together.

---

## 4. Smart Insights Engine (Legacy)

### Theme & Accent Color
- **Persistence**: Stored in the `settings` table of IndexedDB.
- **Application**: The `ThemeContext` uses a `MutationObserver` or effect to update the `--primary` and `--sidebar-primary` CSS variables on the `:root` element.
- **Contrast Control**: Colors are applied using Tailwind 4's dynamic variable system, ensuring consistency across all UI components (Tabs, Buttons, Icons).

### Month-over-Month Comparison
- All "vs last month" metrics use a strict `startOfMonth` to `endOfMonth` interval from the `date-fns` library to ensure data parity.
