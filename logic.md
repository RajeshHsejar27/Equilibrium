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

## 3. Smart Insights Engine

The application periodically evaluates transaction history to generate actionable alerts:

### High Spending Alert
- **Formula**: `(Category Spend / Total Monthly Spend) * 100`.
- **Trigger**: If a single category accounts for a significant portion of the month's budget.
- **UI Logic**: Dynamic text generation: *"You've spent ₹X on Category Y, which is Z% of your total budget."*

### Budget Master (Positive Trend)
- **Logic**: Compares `Current Month Total Spent` vs. `Previous Month Total Spent`.
- **Trigger**: If `Current < Previous`.
- **Insight**: Encouraging feedback with the exact amount saved compared to last month.

### Subscription Cleanup
- **Trigger**: Mock evaluation of recurring payments.
- **Action**: Suggests reviewing recurring transactions to optimize cash outflow.

---

## 4. Global Configuration

### Theme & Accent Color
- **Persistence**: Stored in the `settings` table of IndexedDB.
- **Application**: The `ThemeContext` uses a `MutationObserver` or effect to update the `--primary` and `--sidebar-primary` CSS variables on the `:root` element.
- **Contrast Control**: Colors are applied using Tailwind 4's dynamic variable system, ensuring consistency across all UI components (Tabs, Buttons, Icons).

### Month-over-Month Comparison
- All "vs last month" metrics use a strict `startOfMonth` to `endOfMonth` interval from the `date-fns` library to ensure data parity.
