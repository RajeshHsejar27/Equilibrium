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

---

## 5. Data Import & Export System Standard

Equilibrium provides a robust, seamless data migration system allowing users to backup, restore, and transfer their financial records via Excel (`.xlsx`, `.xls`) or CSV (`.csv`) formats. To maintain data consistency across systems, a strict standard for schema layouts, required fields, and column parsing is enforced.

### 5.1 Import Workflow & Data Lifecycle
1. **File Selection**: The user uploads an Excel or CSV file.
2. **Workbook Parsing**: SheetNames are analyzed. If sheets like `Categories` or `Expenses` are present, their rows are processed into raw JSON.
3. **Data Mapping & Normalization**: Column headers are parsed using case-insensitive mapping (e.g., matching both `title` and `Title`). Missing optional values are populated with intelligent defaults.
4. **Referential Integrity Resolution**: 
   - Expense `categoryId` is resolved against either an imported category ID or matching category Name.
   - If no category is found, the system defaults to the `"Uncategorized"` category (or fallback index `0`).
5. **Interactive Preview**: Before writing to IndexedDB, an interactive preview modal categorized by tabs (`Expenses`, `Categories`, `Budgets`, etc.) displays parsed records, allowing users to inspect and selectively delete rows before completing the import.
6. **Deduplication & Insertion**:
   - **Categories**: Added if the `id` is not already present.
   - **Expenses**: Added if a record with the identical `title`, `amount`, and `date` doesn't already exist.
   - **Budgets**: Added if a budget with the identical `categoryId` and `period` doesn't already exist.
   - **Recurring**: Added if a recurring expense with the identical `title`, `categoryId`, and `frequency` doesn't already exist.
   - **Savings Goals**: Added if a goal with the identical `title` and `targetAmount` doesn't already exist.

---

### 5.2 Excel (.xlsx) & CSV (.csv) Sheet Standards

Below are the official schemas for each supported spreadsheet. Columns are case-insensitive (e.g. `amount` or `Amount` are both accepted).

#### A. Categories Sheet (`Categories`)
This sheet defines the custom categories used to classify transactions. Categories are imported first so expenses and budgets can establish proper foreign key relationships.

| Column Header | Required | Type | Validation / Description | Fallback Value |
| :--- | :--- | :--- | :--- | :--- |
| `id` / `Id` | No | String | Unique category identifier (UUID). | Generates a new `crypto.randomUUID()` |
| `name` / `Name` | **Yes** | String | Visual name displayed in UI (e.g. "Food", "Salary"). Row is skipped if empty. | *N/A (Row skipped)* |
| `color` / `Color` | No | String | Color hex code (e.g. `#ef4444`). | `#3b82f6` (Primary Blue) |
| `icon` / `Icon` | No | String | Icon identifier string. | `undefined` |
| `budget` | No | Number | Decimal or integer category-specific budget. | `undefined` |
| `type` / `Type` | No | Enum | Direction of cash flow. Must be: `inflow` (income) or `outflow` (expense). | `outflow` |

*Example Row:*
- **id**: `cat-1`
- **name**: `Food & Groceries`
- **color**: `#f59e0b`
- **type**: `outflow`

---

#### B. Expenses Sheet (`Expenses`)
Tracks all individual inflow or outflow transactions.

| Column Header | Required | Type | Validation / Description | Fallback Value |
| :--- | :--- | :--- | :--- | :--- |
| `title` / `Title` | **Yes** | String | Label of the transaction (e.g. "Grocery Shopping"). Row is skipped if empty. | *N/A (Row skipped)* |
| `amount` / `Amount` | **Yes** | Number | Numeric transaction amount (e.g. `1200.50`). Must be a valid number. | *N/A (Row skipped)* |
| `date` / `Date` | **Yes** | Date | Transaction date. Supports standard ISO date strings (`YYYY-MM-DD`) and native Excel serial date numbers. | *N/A (Row skipped)* |
| `categoryId` / `CategoryId` | No | String | Reference to a Category ID from the `Categories` sheet/database. | *See `category` resolution* |
| `category` / `Category` | No | String | Category name (e.g., "Food & Groceries"). Used to resolve the category ID if `categoryId` is absent or invalid. | `"Uncategorized"` or Category index `0` |
| `note` / `Note` | No | String | Additional transaction description/notes. | `""` |
| `isRecurring` | No | Boolean | Indicates if this was generated by a recurring template. `TRUE`/`true` or `FALSE`/`false`. | `false` |
| `recurringId` | No | String | Associated recurring template ID. | `undefined` |

*Example Row:*
- **title**: `Uber Ride`
- **amount**: `350.00`
- **date**: `2026-05-18`
- **category**: `Transport`
- **note**: `Business meeting`

---

#### C. Budgets Sheet (`Budgets`)
Defines limits for specific categories over specified periods.

| Column Header | Required | Type | Validation / Description | Fallback Value |
| :--- | :--- | :--- | :--- | :--- |
| `categoryId` / `CategoryId` | **Yes** | String | Category identifier. Row skipped if empty. | *N/A (Row skipped)* |
| `monthlyLimit` / `MonthlyLimit` | **Yes** | Number | Maximum allowed spending for the month. Must be greater than `0`. | *N/A (Row skipped)* |
| `period` / `Period` | **Yes** | String | The target month in `YYYY-MM` format (e.g. `2026-05`). | *N/A (Row skipped)* |

*Example Row:*
- **categoryId**: `cat-1`
- **monthlyLimit**: `15000`
- **period**: `2026-05`

---

#### D. Recurring Expenses Sheet (`Recurring`)
Lists active templates that generate expenses on a scheduled frequency.

| Column Header | Required | Type | Validation / Description | Fallback Value |
| :--- | :--- | :--- | :--- | :--- |
| `title` / `Title` | **Yes** | String | Name of the recurring transaction template. | *N/A (Row skipped)* |
| `amount` / `Amount` | **Yes** | Number | Template transaction amount. | *N/A (Row skipped)* |
| `categoryId` / `CategoryId` | **Yes** | String | Reference to a valid Category ID. | *Category index `0`* |
| `frequency` / `Frequency` | **Yes** | Enum | Trigger frequency. Options: `weekly`, `monthly`, `yearly`. | `monthly` |
| `startDate` / `StartDate` | **Yes** | Date | Initial start date of schedule (`YYYY-MM-DD`). | *N/A (Row skipped)* |
| `endDate` / `EndDate` | No | Date | Ending date of schedule (`YYYY-MM-DD`). | `undefined` |
| `isActive` / `IsActive` | No | Boolean | If the schedule is actively generating transactions. `TRUE`/`true` or `FALSE`/`false`. | `true` |

*Example Row:*
- **title**: `Netflix Premium`
- **amount**: `649`
- **categoryId**: `cat-netflix`
- **frequency**: `monthly`
- **startDate**: `2026-01-01`
- **isActive**: `true`

---

#### E. Savings Goals Sheet (`SavingsGoals`)
Defines financial savings targets.

| Column Header | Required | Type | Validation / Description | Fallback Value |
| :--- | :--- | :--- | :--- | :--- |
| `title` / `Title` | **Yes** | String | Savings goal title (e.g. "Buy Laptop"). | *N/A (Row skipped)* |
| `targetAmount` / `TargetAmount` | **Yes** | Number | Total target money to save. Must be > 0. | *N/A (Row skipped)* |
| `currentAmount` / `CurrentAmount` | **Yes** | Number | Already saved money toward this goal. | `0` |
| `deadline` / `Deadline` | No | Date | Expected date of completion (`YYYY-MM-DD`). | `undefined` |
| `color` / `Color` | No | String | Hex color code. | `#3b82f6` |

*Example Row:*
- **title**: `Emergency Fund`
- **targetAmount**: `100000`
- **currentAmount**: `25000`
- **deadline**: `2026-12-31`
- **color**: `#ef4444`

---

### 5.3 Export Rules & Safety Sanitization

When exporting database snapshots to protect systems and avoid compatibility crashes:
1. **Format Output**:
   - **XLSX Format**: Generates a unified spreadsheet containing **7 worksheets**: `Expenses`, `Categories`, `Budgets`, `Recurring`, `SavingsGoals`, `Settings`, and `Profile`.
   - **CSV Format**: Generates a single CSV file representing only the `Expenses` sheet (since CSV only supports single sheets).
2. **Date Safety**: All native Date objects are converted to strict `YYYY-MM-DD` strings during formatting for compatibility across regional Excel locales.
3. **Preventing Excel Sheet Crash Limits**:
   - Excel has a maximum character limit per cell of **32,767 characters**. Large text fields, base64 strings, and JSON objects exceeding this limit will crash Excel workbook parsers.
   - To mitigate this, Equilibrium runs a recursive `sanitizeForExcel` engine that slices text values exceeding **30,000 characters**.
   - **Binary Data Exclusion**: Massive binary/base64 columns such as `profilePicture`, `profileImage`, `avatar`, `image`, `blob`, `preview`, `base64`, and `file` are stripped out completely and replaced with `'[Excluded from export]'`.
4. **Data Normalization**: In the exported `Expenses` sheet, both `categoryId` (the raw category identifier) and the human-readable `category` (the visual category name) are preserved. This guarantees exact database mapping during backups/imports while allowing easy sorting and filtering in spreadsheet software.
