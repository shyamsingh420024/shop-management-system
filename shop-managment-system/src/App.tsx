// src/App.tsx
import React, { useState } from 'react'; // <-- Simpler imports
import { Dashboard } from './components/Dashboard';
import { ShopManagement } from './components/ShopManagement';
import { BillManagement } from './components/BillManagement';
import { PaymentTracking } from './components/PaymentTracking';
import { FamilyExpenses } from './components/FamilyExpenses';
import { Store, Receipt, CreditCard, Users } from 'lucide-react';
// --- NO ShopProvider import here! ---

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
    // --- NO ShopProvider tag here! ---
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
    // --- NO ShopProvider tag here! ---
  );
}

export default App;