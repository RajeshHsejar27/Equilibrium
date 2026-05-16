# Equilibrium - Personal Expense & Savings Tracker

A mobile-first, responsive, offline-first personal expense tracking application built for speed, performance, and premium user experience.

## Key Features

*   **Offline-First**: Works entirely without internet using IndexedDB (Dexie.js).
*   **No Login Required**: All data stays on your device.
*   **Mobile Optimized**: Intuitive bottom navigation and fast expense entry.
*   **Desktop Dashboard**: Comprehensive analytics and management tools.
*   **Savings Tracking**: Set and monitor financial goals.
*   **Budgeting**: Category-wise monthly limits with overspending alerts.
*   **Recurring Expenses**: Automate repeating transactions.
*   **Data Portability**: Export/Import via Excel (XLSX).
*   **PWA Support**: Installable on Android and iOS devices.

## Tech Stack

*   **Frontend**: React, TypeScript, Vite
*   **Styling**: TailwindCSS, shadcn/ui, Framer Motion
*   **State Management**: Zustand
*   **Database**: IndexedDB (Dexie.js)
*   **Charts**: Recharts
*   **Table**: TanStack Table
*   **Forms**: React Hook Form, Zod
*   **Excel**: SheetJS (xlsx)

## Project Structure

```txt
Equilibrium/
├── src/
│   ├── components/       # Reusable UI & Module components
│   │   ├── layout/       # Main navigation and structure
│   │   ├── expenses/     # Expense-specific forms and views
│   │   └── ui/           # shadcn/ui base components
│   ├── context/          # Theme and global contexts
│   ├── hooks/            # Custom React hooks
│   ├── layouts/          # Main application layouts
│   ├── lib/              # Database schema and utilities
│   ├── pages/            # Application views (Dashboard, Expenses, etc.)
│   ├── store/            # Zustand state slices
│   ├── utils/            # Helper functions
│   ├── App.tsx           # Router and Provider setup
│   └── main.tsx          # Entry point
├── public/               # Static assets & PWA icons
├── tailwind.config.js    # Styling configuration
├── vite.config.ts        # PWA & Alias configuration
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run development server: `npm run dev`
4.  Build for production: `npm run build`

## License

MIT
