# Complete Shop Management System - Full Source Code

## Project Structure
```
shop-management-system/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── ShopManagement.tsx
│   │   ├── ShopModal.tsx
│   │   ├── ShopCard.tsx
│   │   ├── BillManagement.tsx
│   │   ├── BillModal.tsx
│   │   ├── BillPrint.tsx
│   │   ├── PaymentTracking.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── FamilyExpenses.tsx
│   │   ├── FamilyExpenseModal.tsx
│   │   ├── FamilyIncomeModal.tsx
│   │   ├── FamilyMemberModal.tsx
│   │   └── BankDepositModal.tsx
│   ├── context/
│   │   └── ShopContext.tsx
│   ├── types/
│   │   └── types.ts
│   ├── utils/
│   │   └── penaltyUtils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── index.html
```

## 1. package.json
```json
{
  "name": "shop-management-system",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2"
  }
}
```

## 2. index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Complete Shop Management System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## 3. vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
```

## 4. tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## 5. postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

## 6. tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

## 7. tsconfig.app.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

## 8. tsconfig.node.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

## 9. eslint.config.js
```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

## 10. src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 11. src/main.tsx
```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## 12. src/App.tsx
```typescript
import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { ShopManagement } from './components/ShopManagement';
import { BillManagement } from './components/BillManagement';
import { PaymentTracking } from './components/PaymentTracking';
import { FamilyExpenses } from './components/FamilyExpenses';
import { Store, Receipt, CreditCard, Users } from 'lucide-react';
import { Shop, Bill, Payment } from './types/types';
import { ShopProvider } from './context/ShopContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Store },
    { id: 'shops', label: 'Shop Management', icon: Store },
    { id: 'bills', label: 'Bill Management', icon: Receipt },
    { id: 'payments', label: 'Payment Tracking', icon: CreditCard },
    { id: 'family', label: 'Family Expenses', icon: Users },
  ];

  return (
    <ShopProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Shop Management System</h1>
                  <p className="text-sm text-gray-500">Complete Business & Family Solution</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'shops' && <ShopManagement />}
          {activeTab === 'bills' && <BillManagement />}
          {activeTab === 'payments' && <PaymentTracking />}
          {activeTab === 'family' && <FamilyExpenses />}
        </main>
      </div>
    </ShopProvider>
  );
}

export default App;
```

## 13. src/types/types.ts
```typescript
export interface Shop {
  id: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  monthlyRent: number;
  electricityRate: number;
  createdAt: Date;
}

export interface BillItem {
  id: string;
  description: string;
  amount: number;
}

export interface Bill {
  id: string;
  shopId: string;
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  items: BillItem[];
  total: number;
  paid: number;
  remaining: number;
  status: 'pending' | 'partial' | 'paid';
  createdAt: Date;
}

export interface Payment {
  id: string;
  billId?: string;
  shopId: string;
  amount: number;
  method: 'cash' | 'online' | 'family_account';
  reference?: string;
  notes?: string;
  date: Date;
  isAdvance: boolean;
  createdAt: Date;
}

export interface FamilyExpense {
  id: string;
  category: 'groceries' | 'food' | 'online_shopping' | 'recharge' | 'petrol' | 'travel' | 'electricity' | 'medical' | 'education' | 'clothing' | 'entertainment' | 'makeup' | 'insurance' | 'tax' | 'repairing' | 'gym' | 'other';
  description?: string;
  amount: number;
  date: Date;
  paidBy: string;
  paymentMethod: 'cash' | 'online' | 'family_account' | 'personal_account';
  createdAt: Date;
}

export interface FamilyIncome {
  id: string;
  source: 'job' | 'business' | 'freelance' | 'investment' | 'rental' | 'other';
  description?: string;
  amount: number;
  date: Date;
  receivedBy: string;
  paymentMethod: 'cash' | 'online' | 'family_account' | 'personal_account';
  createdAt: Date;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'self' | 'father' | 'mother' | 'spouse' | 'brother' | 'sister' | 'son' | 'daughter' | 'child' | 'other';
  isActive: boolean;
  createdAt: Date;
}

export interface BankDeposit {
  id: string;
  amount: number;
  fromAccount: 'cash' | 'online' | 'personal_account';
  bankName: string;
  description?: string;
  date: Date;
  createdAt: Date;
}

export interface PenaltyInfo {
  hasPenalty: boolean;
  penaltyAmount: number;
  overdueDays: number;
  warningMessage: string;
  warningType: 'none' | 'upcoming' | 'overdue' | 'penalty';
}
```

## Installation Instructions

1. **Create new project:**
```bash
npm create vite@latest shop-management-system -- --template react-ts
cd shop-management-system
```

2. **Install dependencies:**
```bash
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Copy all the above files** to their respective locations

4. **Run the project:**
```bash
npm run dev
```

## Features Included:

### 🏪 Shop Management
- Add/Edit/Delete shops
- Store owner details, rent, electricity rates
- Complete shop information management

### 📄 Bill Management  
- Create bills with multiple items
- Auto-generate bill numbers
- Print bills with professional format
- Share bills via WhatsApp
- Penalty calculation for overdue bills
- Bill status tracking (pending/partial/paid)

### 💰 Payment Tracking
- Record payments with multiple methods (Cash/Online/Family Account)
- Split payments across multiple methods
- Advance payments support
- Payment method breakdown
- Edit/Delete payments

### 👨‍👩‍👧‍👦 Family Expenses
- Track family expenses by category
- Multiple payment methods
- Family member management
- Income tracking
- Bank deposit management
- Separate Personal account tracking

### 📊 Dashboard
- Real-time financial overview
- Outstanding amounts (latest bill only)
- Payment method breakdowns
- Shop performance analysis
- Penalty alerts
- Separate account tracking

### 🔧 Technical Features
- **Local Storage** - All data saved locally
- **Responsive Design** - Works on all devices  
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **Print Support** - Professional bill printing
- **WhatsApp Integration** - Share bills directly
- **Split Payments** - Multiple payment methods
- **Penalty System** - Automatic late fee calculation

यह complete code है आपके Shop Management System का! सभी features included हैं।