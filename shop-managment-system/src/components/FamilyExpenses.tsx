import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { FamilyExpense, FamilyIncome, FamilyMember, BankDeposit } from '../types/types';
import { Plus, TrendingUp, TrendingDown, Search, Filter, Calendar, Trash2, CreditCard as Edit, Users, DollarSign, Landmark, Star, Wallet, Smartphone, CreditCard, ChevronDown, ChevronUp, Eye, X, ShoppingCart, Zap, Heart, GraduationCap, Car, Gamepad2, Shirt, MoreHorizontal, Briefcase, Building, Laptop, Home, Phone, MapPin, Fuel, BarChart3, UtensilsCrossed, Monitor, Shield, Wrench, Dumbbell } from 'lucide-react';
import { FamilyExpenseModal } from './FamilyExpenseModal';
import { FamilyIncomeModal } from './FamilyIncomeModal';
import { FamilyMemberModal } from './FamilyMemberModal';
import { BankDepositModal } from './BankDepositModal';

export function FamilyExpenses() {
  const { 
    familyExpenses, 
    familyIncome, 
    familyMembers, 
    bankDeposits,
    deleteFamilyExpense, 
    deleteFamilyIncome,
    payments 
  } = useShop();
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isBankDepositModalOpen, setIsBankDepositModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FamilyExpense | null>(null);
  const [editingIncome, setEditingIncome] = useState<FamilyIncome | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<'expenses' | 'income' | 'analysis'>('expenses');
  const [showGoldieDetails, setShowGoldieDetails] = useState(false);
  const [showBankDepositDetails, setShowBankDepositDetails] = useState(false);
  
  // Modal states for clickable cards
  const [showCashDetails, setShowCashDetails] = useState(false);
  const [showOnlineDetails, setShowOnlineDetails] = useState(false);
  const [showPapaDetails, setShowPapaDetails] = useState(false);
  const [showCashExpenseDetails, setShowCashExpenseDetails] = useState(false);
  const [showOnlineExpenseDetails, setShowOnlineExpenseDetails] = useState(false);

  // --- Helper to coerce amounts reliably to numbers ---
  const toNum = (v: any): number => {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (v == null) return 0;
    // remove commas and whitespace and parse
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // Business Income from payments (COMPLETELY EXCLUDING Goldie)
  const businessCash = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + toNum(p.amount), 0);
  const businessOnline = payments.filter(p => p.method === 'online').reduce((sum, p) => sum + toNum(p.amount), 0);
  const businessPapa = payments.filter(p => p.method === 'family_account').reduce((sum, p) => sum + toNum(p.amount), 0);

  // Family transactions (COMPLETELY EXCLUDING Goldie)
  const familyExpensesCash = familyExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + toNum(e.amount), 0);
  const familyExpensesOnline = familyExpenses.filter(e => e.paymentMethod === 'online').reduce((sum, e) => sum + toNum(e.amount), 0);
  const familyExpensesPapa = familyExpenses.filter(e => e.paymentMethod === 'family_account').reduce((sum, e) => sum + toNum(e.amount), 0);

  const familyIncomeCash = familyIncome.filter(i => i.paymentMethod === 'cash').reduce((sum, i) => sum + toNum(i.amount), 0);
  const familyIncomeOnline = familyIncome.filter(i => i.paymentMethod === 'online').reduce((sum, i) => sum + toNum(i.amount), 0);
  const familyIncomePapa = familyIncome.filter(i => i.paymentMethod === 'family_account').reduce((sum, i) => sum + toNum(i.amount), 0);

  // Bank deposits from non-Goldie accounts only
  const mainBankDeposits = bankDeposits
    .filter(d => d.fromAccount !== 'personal_account')
    .reduce((sum, d) => sum + toNum(d.amount), 0);

  // Main Family totals (Business Income + Family Income - Family Expenses) - COMPLETELY EXCLUDING GOLDIE AND BANK DEPOSITS
  // Bank deposits from each account type
  const cashBankDeposits = bankDeposits
    .filter(d => d.fromAccount === 'cash')
    .reduce((sum, d) => sum + toNum(d.amount), 0);
  const onlineBankDeposits = bankDeposits
    .filter(d => d.fromAccount === 'online')
    .reduce((sum, d) => sum + toNum(d.amount), 0);
  const papaBankDeposits = bankDeposits
    .filter(d => d.fromAccount === 'family_account')
    .reduce((sum, d) => sum + toNum(d.amount), 0);

  const totalCash = businessCash + familyIncomeCash - familyExpensesCash - cashBankDeposits;
  const totalOnline = businessOnline + familyIncomeOnline - familyExpensesOnline - onlineBankDeposits;
  const totalPapa = businessPapa + familyIncomePapa - familyExpensesPapa - papaBankDeposits;

  // Total Cash and Online Expenses
  const totalCashExpenses = familyExpensesCash;
  const totalOnlineExpenses = familyExpensesOnline;

  // GOLDIE'S COMPLETELY SEPARATE ACCOUNT CALCULATIONS
  const goldieExpenses = familyExpenses.filter(e => e.paymentMethod === 'personal_account').reduce((sum, e) => sum + toNum(e.amount), 0);
  const goldieIncome = familyIncome.filter(i => i.paymentMethod === 'personal_account').reduce((sum, i) => sum + toNum(i.amount), 0);
  const goldieBankDeposits = bankDeposits.filter(d => d.fromAccount === 'personal_account').reduce((sum, d) => sum + toNum(d.amount), 0);
  const goldieNetAvailable = goldieIncome - goldieExpenses - goldieBankDeposits;

  // Total calculations for display (EXCLUDING BANK DEPOSITS)
  const totalExpenses = familyExpenses.reduce((sum, expense) => sum + toNum(expense.amount), 0);
  const totalIncomeAmount = familyIncome
    .filter(income => income.paymentMethod !== 'personal_account')
    .reduce((sum, income) => sum + toNum(income.amount), 0);
  const totalBankDepositsAmount = bankDeposits.reduce((sum, deposit) => sum + toNum(deposit.amount), 0);

  // Filter functions
  const filteredExpenses = familyExpenses.filter(expense => {
    const matchesSearch = 
      (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (expense.paidBy && expense.paidBy.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    const matchesPaymentMethod = filterPaymentMethod === 'all' || expense.paymentMethod === filterPaymentMethod;
    
    return matchesSearch && matchesCategory && matchesPaymentMethod;
  });

  const filteredIncome = familyIncome.filter(income => {
    const matchesSearch = 
      (income.description && income.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (income.receivedBy && income.receivedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (income.notes && income.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPaymentMethod = filterPaymentMethod === 'all' || income.paymentMethod === filterPaymentMethod;
    
    return matchesSearch && matchesPaymentMethod;
  });

  const sortedExpenses = filteredExpenses.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const sortedIncome = filteredIncome.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const sortedBankDeposits = bankDeposits.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Category options
  const categoryOptions = [
    { value: 'groceries', label: 'Groceries (राशन)', icon: ShoppingCart },
    { value: 'food', label: 'Food (खाना)', icon: UtensilsCrossed },
    { value: 'online_shopping', label: 'Online Shopping (ऑनलाइन शॉपिंग)', icon: Monitor },
    { value: 'recharge', label: 'Recharge (रिचार्ज)', icon: Phone },
    { value: 'petrol', label: 'Petrol/Diesel (पेट्रोल)', icon: Fuel },
    { value: 'travel', label: 'Travel (यात्रा)', icon: MapPin },
    { value: 'electricity', label: 'Electricity Bill (बिजली)', icon: Zap },
    { value: 'medical', label: 'Medical (दवाई)', icon: Heart },
    { value: 'education', label: 'Education (पढ़ाई)', icon: GraduationCap },
    { value: 'clothing', label: 'Clothing (कपड़े)', icon: Shirt },
    { value: 'entertainment', label: 'Entertainment (मनोरंजन)', icon: Gamepad2 },
    { value: 'makeup', label: 'Make Up (मेकअप)', icon: Heart },
    { value: 'insurance', label: 'Insurance (बीमा)', icon: Shield },
    { value: 'tax', label: 'Tax (टैक्स)', icon: MoreHorizontal },
    { value: 'repairing', label: 'Repairing (मरम्मत)', icon: Wrench },
    { value: 'gym', label: 'Gym (जिम)', icon: Dumbbell },
    { value: 'other', label: 'Other (अन्य)', icon: MoreHorizontal },
  ];

  const sourceOptions = [
    { value: 'job', label: 'Job Salary', icon: Briefcase },
    { value: 'business', label: 'Business Income', icon: Building },
    { value: 'freelance', label: 'Freelance Work', icon: Laptop },
    { value: 'investment', label: 'Investment Returns', icon: TrendingUp },
    { value: 'rental', label: 'Rental Income', icon: Home },
    { value: 'other', label: 'Other Income', icon: MoreHorizontal },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: Wallet, color: 'text-green-600' },
    { value: 'online', label: 'Online Payment', icon: Smartphone, color: 'text-blue-600' },
    { value: 'family_account', label: 'Family Account', icon: CreditCard, color: 'text-purple-600' },
    { value: 'personal_account', label: 'Personal', icon: Star, color: 'text-yellow-600' },
  ];

  // Handlers
  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: FamilyExpense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteFamilyExpense(expenseId);
    }
  };

  const handleAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income: FamilyIncome) => {
    setEditingIncome(income);
    setIsIncomeModalOpen(true);
  };

  const handleDeleteIncome = (incomeId: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      deleteFamilyIncome(incomeId);
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryOption = categoryOptions.find(c => c.value === category);
    return categoryOption?.icon || MoreHorizontal;
  };

  const getSourceIcon = (source: string) => {
    const sourceOption = sourceOptions.find(s => s.value === source);
    return sourceOption?.icon || MoreHorizontal;
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodOption = paymentMethodOptions.find(m => m.value === method);
    if (!methodOption) return null;
    
    const Icon = methodOption.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium $${method === 'cash' ? 'bg-green-100 text-green-800' : method === 'online' ? 'bg-blue-100 text-blue-800' : method === 'family_account' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>
        <Icon className="h-3 w-3" />
        <span>{methodOption.label}</span>
      </span>
    );
  };

  // Member-wise and Month-wise Analysis
  const getMemberWiseData = () => {
    const memberData = familyMembers.map(member => {
      const memberExpenses = familyExpenses.filter(e => e.paidBy === member.name);
      const memberIncome = familyIncome.filter(i => i.receivedBy === member.name && i.paymentMethod !== 'personal_account');
      
      return {
        member,
        totalExpenses: memberExpenses.reduce((sum, e) => sum + toNum(e.amount), 0),
        totalIncome: memberIncome.reduce((sum, i) => sum + toNum(i.amount), 0),
        expenseCount: memberExpenses.length,
        incomeCount: memberIncome.length
      };
    }).filter(data => data.totalExpenses > 0 || data.totalIncome > 0)
      .sort((a, b) => (b.totalExpenses + b.totalIncome) - (a.totalExpenses + a.totalIncome));

    return memberData;
  };

  const getMonthWiseData = () => {
    const monthData: { [key: string]: { income: number; expenses: number } } = {};

    // Add business income from payments to monthly data
    payments.forEach(payment => {
      const monthKey = new Date(payment.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!monthData[monthKey]) monthData[monthKey] = { income: 0, expenses: 0 };
      monthData[monthKey].income += toNum(payment.amount);
    });

    familyExpenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!monthData[monthKey]) monthData[monthKey] = { income: 0, expenses: 0 };
      monthData[monthKey].expenses += toNum(expense.amount);
    });

    familyIncome
      .filter(income => income.paymentMethod !== 'personal_account')
      .forEach(income => {
      const monthKey = new Date(income.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!monthData[monthKey]) monthData[monthKey] = { income: 0, expenses: 0 };
      monthData[monthKey].income += toNum(income.amount);
    });

    return Object.entries(monthData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.month + ' 1');
        const dateB = new Date(b.month + ' 1');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 12); // Last 12 months
  };

  const memberWiseData = getMemberWiseData();
  const monthWiseData = getMonthWiseData();

  // Member-wise Month-wise Expense Data
  const getMemberMonthWiseExpenses = () => {
    const memberMonthData: { [memberName: string]: { [month: string]: number } } = {};

    familyExpenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

      if (!memberMonthData[expense.paidBy]) {
        memberMonthData[expense.paidBy] = {};
      }

      if (!memberMonthData[expense.paidBy][monthKey]) {
        memberMonthData[expense.paidBy][monthKey] = 0;
      }

      memberMonthData[expense.paidBy][monthKey] += toNum(expense.amount);
    });

    // Convert to array format for rendering
    return Object.entries(memberMonthData)
      .map(([memberName, monthData]) => ({
        memberName,
        months: Object.entries(monthData)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => {
            const dateA = new Date(a.month + ' 1');
            const dateB = new Date(b.month + ' 1');
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 12) // Last 12 months
      }))
      .filter(data => data.months.length > 0);
  };

  const memberMonthWiseExpenses = getMemberMonthWiseExpenses();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Family Expenses</h1>
          <p className="text-gray-600 mt-1">Track Family Income and Expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsMemberModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 text-sm"
          >
            <Users className="h-4 w-4" />
            <span>Members</span>
          </button>
          <button
            onClick={handleAddIncome}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Income</span>
          </button>
          <button
            onClick={handleAddExpense}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-200 flex items-center space-x-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Expense</span>
          </button>
          <button
            onClick={() => setIsBankDepositModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 text-sm"
          >
            <Landmark className="h-4 w-4" />
            <span>Bank</span>
          </button>
        </div>
      </div>

      {/* Row 1: Total Cash, Total Online, Total Papa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowCashDetails(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Total Cash</p>
              <p className="text-xl font-bold mt-1">₹{Math.abs(totalCash).toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Wallet className="h-3 w-3 mr-1" />
                <span className="text-green-200">Available</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Wallet className="h-6 w-6 text-green-200" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowOnlineDetails(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Online</p>
              <p className="text-xl font-bold mt-1">₹{Math.abs(totalOnline).toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                <span className="text-blue-200">Available</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Smartphone className="h-6 w-6 text-blue-200" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowPapaDetails(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Family Account</p>
              <p className="text-xl font-bold mt-1">₹{Math.abs(totalPapa).toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                <span className="text-purple-200">Available</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <CreditCard className="h-6 w-6 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Row 2: Total Cash Expense, Total Online Expense, Bank Deposits (Clickable) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowCashExpenseDetails(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs font-medium">Total Cash Expense</p>
              <p className="text-xl font-bold mt-1">₹{totalCashExpenses.toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Wallet className="h-3 w-3 mr-1" />
                <span className="text-red-200">Spent</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Wallet className="h-6 w-6 text-red-200" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowOnlineExpenseDetails(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Total Online Expense</p>
              <p className="text-xl font-bold mt-1">₹{totalOnlineExpenses.toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                <span className="text-orange-200">Spent</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Smartphone className="h-6 w-6 text-orange-200" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowBankDepositDetails(true)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-medium">Bank Deposits</p>
              <p className="text-xl font-bold mt-1">₹{totalBankDepositsAmount.toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Landmark className="h-3 w-3 mr-1" />
                <span className="text-indigo-200">Deposited</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Landmark className="h-6 w-6 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* Row 3: Goldie's Separate Account - Same as Dashboard */}
      <div 
        className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        onClick={() => setShowGoldieDetails(true)}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5" />
              <h3 className="text-lg font-bold">Personal Account</h3>
              <Eye className="h-4 w-4" />
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-yellow-100 text-xs">Income</p>
                <p className="font-bold">₹{goldieIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-xs">Expenses</p>
                <p className="font-bold">₹{goldieExpenses.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-xs">Bank Deposits</p>
                <p className="font-bold">₹{goldieBankDeposits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-xs">Net Available</p>
                <p className={`font-bold ${goldieNetAvailable >= 0 ? 'text-white' : 'text-red-200'}`}>
                  {goldieNetAvailable >= 0 ? '+' : ''}₹{goldieNetAvailable.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <Star className="h-12 w-12 text-yellow-200" />
        </div>
      </div>

      {/* Navigation Tabs for detailed views */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto">
          {[
            { id: 'expenses', label: 'Expenses' },
            { id: 'income', label: 'Income' },
            { id: 'analysis', label: 'Financial Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm transition-colors duration-200 whitespace-nowrap border-b-2 ${
                activeSection === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active section */}
      {activeSection === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Family Expenses</h3>
                  <p className="text-sm text-red-600">₹{totalExpenses.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={handleAddExpense}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="all">All Methods</option>
                {paymentMethodOptions.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>

            {/* Expenses List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingDown className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No expenses found</p>
                </div>
              ) : (
                sortedExpenses.map((expense) => {
                  const CategoryIcon = getCategoryIcon(expense.category);
                  
                  return (
                    <div key={expense.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <CategoryIcon className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {expense.description || categoryOptions.find(c => c.value === expense.category)?.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {expense.paidBy} • {new Date(expense.date).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">
                            -₹{toNum(expense.amount).toLocaleString()}
                          </div>
                          <div className="text-xs">
                            {getPaymentMethodBadge(expense.paymentMethod)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'income' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Family Income</h3>
                  <p className="text-sm text-green-600">₹{totalIncomeAmount.toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={handleAddIncome}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Income</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search income..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <select
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Methods</option>
                {paymentMethodOptions.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>

            {/* Income List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedIncome.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No income records</p>
                </div>
              ) : (
                sortedIncome.map((income) => {
                  const SourceIcon = getSourceIcon(income.source);
                  const isGoldieIncome = income.paymentMethod === 'personal_account';
                  
                  return (
                    <div key={income.id} className={`p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors ${
                      isGoldieIncome ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isGoldieIncome ? 'bg-yellow-100' : 'bg-green-100'
                          }`}>
                            <SourceIcon className={`h-4 w-4 ${
                              isGoldieIncome ? 'text-yellow-600' : 'text-green-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {income.description || sourceOptions.find(s => s.value === income.source)?.label}
                              {isGoldieIncome && <span className="text-xs text-yellow-600 ml-2">(Separate Account)</span>}
                            </div>
                            <div className="text-sm text-gray-500">
                              {income.receivedBy} • {new Date(income.date).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            isGoldieIncome ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            +₹{toNum(income.amount).toLocaleString()}
                          </div>
                          <div className="text-xs">
                            {getPaymentMethodBadge(income.paymentMethod)}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => handleEditIncome(income)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteIncome(income.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'analysis' && (
        <div className="space-y-6">
          {/* Financial Analysis Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-indigo-50">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Financial Analysis</h3>
                  <p className="text-sm text-indigo-600">Complete month-wise and member-wise financial overview</p>
                </div>
              </div>
            </div>
          </div>

          {/* Member-wise and Month-wise Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member-wise Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-purple-50">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Member-wise Analysis</h3>
                    <p className="text-sm text-purple-600">Income and expenses by family member</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {memberWiseData.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No member data available</p>
                    </div>
                  ) : (
                    memberWiseData.map(({ member, totalExpenses, totalIncome, expenseCount, incomeCount }) => (
                      <div key={member.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.relation}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                              Income: ₹{totalIncome.toLocaleString()} ({incomeCount})
                            </div>
                            <div className="text-sm font-semibold text-red-600">
                              Expenses: ₹{totalExpenses.toLocaleString()} ({expenseCount})
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Net: {(totalIncome - totalExpenses) >= 0 ? '+' : ''}₹{Math.abs(totalIncome - totalExpenses).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Month-wise Analysis */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Month-wise Analysis</h3>
                    <p className="text-sm text-blue-600">Last 12 months income and expenses</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {monthWiseData.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No monthly data available</p>
                    </div>
                  ) : (
                    monthWiseData.map(({ month, income, expenses }) => (
                      <div key={month} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{month}</div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-green-600">
                              Income: ₹{income.toLocaleString()}
                            </div>
                            <div className="text-sm font-semibold text-red-600">
                              Expenses: ₹{expenses.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Net: {(income - expenses) >= 0 ? '+' : ''}₹{Math.abs(income - expenses).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Member-wise Month-wise Expense Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Member-wise Monthly Expenses</h3>
                  <p className="text-sm text-purple-600">Each member's expenses by month</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {memberMonthWiseExpenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No expense data available</p>
                  </div>
                ) : (
                  memberMonthWiseExpenses.map(({ memberName, months }) => {
                    const maxAmount = Math.max(...months.map(m => m.amount));

                    return (
                      <div key={memberName} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 border-b border-gray-200">
                          <h4 className="font-semibold text-sm text-gray-900 flex items-center">
                            <Users className="h-4 w-4 mr-2 text-purple-600" />
                            {memberName}
                          </h4>
                        </div>
                        <div className="p-2">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {months.map(({ month, amount }) => {
                              const isHighest = amount === maxAmount;
                              return (
                                <div
                                  key={month}
                                  className={`p-2 rounded-lg border ${
                                    isHighest
                                      ? 'bg-red-50 border-red-300'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="text-xs font-medium text-gray-600 mb-1">{month}</div>
                                  <div className={`text-sm font-bold ${
                                    isHighest ? 'text-red-600' : 'text-purple-600'
                                  }`}>
                                    ₹{amount.toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goldie Details Modal */}
      {showGoldieDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center">
                    <Star className="h-6 w-6 mr-2" />
                    Account Details
                  </h3>
                  <p className="text-yellow-100">Complete financial overview</p>
                </div>
                <button
                  onClick={() => setShowGoldieDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">₹{goldieIncome.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">Total received</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">₹{goldieExpenses.toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">Total spent</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs text-indigo-600 font-medium">BANK DEPOSITS</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹{goldieBankDeposits.toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 mt-1">Deposited</p>
                </div>

                <div className={`p-4 rounded-lg border ${goldieNetAvailable >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Star className={`h-5 w-5 ${goldieNetAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${goldieNetAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`}>NET AVAILABLE</span>
                  </div>
                  <p className={`text-2xl font-bold ${goldieNetAvailable >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {goldieNetAvailable >= 0 ? '+' : ''}₹{Math.abs(goldieNetAvailable).toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${goldieNetAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {goldieNetAvailable >= 0 ? 'Available balance' : 'Deficit amount'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Deposit Details Modal */}
      {showBankDepositDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center">
                    <Landmark className="h-6 w-6 mr-2" />
                    Bank Deposit Details
                  </h3>
                  <p className="text-indigo-100">Complete bank deposit history</p>
                </div>
                <button
                  onClick={() => setShowBankDepositDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs text-indigo-600 font-medium">TOTAL DEPOSITS</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹{toNum(totalBankDepositsAmount).toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 mt-1">{bankDeposits.length} transactions</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">FROM CASH</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    ₹{bankDeposits.filter(d => d.fromAccount === 'cash').reduce((sum, d) => sum + toNum(d.amount), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {bankDeposits.filter(d => d.fromAccount === 'cash').length} deposits
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">FROM ONLINE</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    ₹{bankDeposits.filter(d => d.fromAccount === 'online').reduce((sum, d) => sum + toNum(d.amount), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {bankDeposits.filter(d => d.fromAccount === 'online').length} deposits
                  </p>
                </div>
              </div>

              {/* Deposit List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedBankDeposits.length === 0 ? (
                  <div className="text-center py-8">
                    <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No bank deposits found</p>
                  </div>
                ) : (
                  sortedBankDeposits.map((deposit) => {
                    const methodOption = paymentMethodOptions.find(m => m.value === deposit.fromAccount);
                    const Icon = methodOption?.icon || Landmark;
                    
                    return (
                      <div key={deposit.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <Icon className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{deposit.description}</div>
                              <div className="text-sm text-gray-500">
                                {deposit.bankName} • {new Date(deposit.date).toLocaleDateString('en-IN')}
                              </div>
                              {deposit.accountNumber && (
                                <div className="text-xs text-gray-400">
                                  A/C: {deposit.accountNumber}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-indigo-600">
                              ₹{toNum(deposit.amount).toLocaleString()}
                            </div>
                            <div className="text-xs">
                              {getPaymentMethodBadge(deposit.fromAccount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isExpenseModalOpen && (
        <FamilyExpenseModal
          expense={editingExpense}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setEditingExpense(null);
          }}
        />
      )}

      {isIncomeModalOpen && (
        <FamilyIncomeModal
          income={editingIncome}
          onClose={() => {
            setIsIncomeModalOpen(false);
            setEditingIncome(null);
          }}
        />
      )}

      {isMemberModalOpen && (
        <FamilyMemberModal
          member={null}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}

      {isBankDepositModalOpen && (
        <BankDepositModal
          onClose={() => setIsBankDepositModalOpen(false)}
        />
      )}

      {/* Cash Details Modal */}
      {showCashDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Cash Account Details</h3>
                  <p className="text-green-100">Complete cash transactions breakdown</p>
                </div>
                <button
                  onClick={() => setShowCashDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">BUSINESS INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">₹{businessCash.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">From shop payments</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">FAMILY INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">₹{familyIncomeCash.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">Family cash income</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">₹{familyExpensesCash.toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">Family cash expenses</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs text-indigo-600 font-medium">BANK DEPOSITS</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹{cashBankDeposits.toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 mt-1">Deposited to bank</p>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg border ${totalCash >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Net Available Cash:</span>
                  <span className={`text-2xl font-bold ${totalCash >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {totalCash >= 0 ? '+' : ''}₹{totalCash.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Business Income + Family Income - Expenses - Bank Deposits
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Details Modal */}
      {showOnlineDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Online Account Details</h3>
                  <p className="text-blue-100">Complete online transactions breakdown</p>
                </div>
                <button
                  onClick={() => setShowOnlineDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">BUSINESS INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">₹{businessOnline.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">From shop payments</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">FAMILY INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">₹{familyIncomeOnline.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">Family online income</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">₹{familyExpensesOnline.toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">Family online expenses</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs text-indigo-600 font-medium">BANK DEPOSITS</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹{onlineBankDeposits.toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 mt-1">Deposited to bank</p>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg border ${totalOnline >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Net Available Online:</span>
                  <span className={`text-2xl font-bold ${totalOnline >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {totalOnline >= 0 ? '+' : ''}₹{totalOnline.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Business Income + Family Income - Expenses - Bank Deposits
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Papa Account Details Modal */}
      {showPapaDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Family Account Account Details</h3>
                  <p className="text-purple-100">Complete  Account Transactions Breakdown</p>
                </div>
                <button
                  onClick={() => setShowPapaDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">BUSINESS INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">₹{businessPapa.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">From shop payments</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">FAMILY INCOME</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">₹{familyIncomePapa.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">Family papa account income</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">₹{familyExpensesPapa.toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">Family papa account expenses</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs text-indigo-600 font-medium">BANK DEPOSITS</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹{papaBankDeposits.toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 mt-1">Deposited to bank</p>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-lg border ${totalPapa >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Net Available:</span>
                  <span className={`text-2xl font-bold ${totalPapa >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {totalPapa >= 0 ? '+' : ''}₹{totalPapa.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Business Income + Family Income - Expenses - Bank Deposits
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Expense Details Modal */}
      {showCashExpenseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Cash Expenses Details</h3>
                  <p className="text-green-100">All cash expenses breakdown</p>
                </div>
                <button
                  onClick={() => setShowCashExpenseDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Cash Expenses:</span>
                    <span className="text-2xl font-bold text-green-700">₹{familyExpensesCash.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {familyExpenses
                  .filter(expense => expense.paymentMethod === 'cash')
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {expense.category.replace('_', ' ')}
                          </div>
                          {expense.description && (
                            <div className="text-sm text-gray-600">{expense.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(expense.date).toLocaleDateString('en-IN')} • {expense.paidBy}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">₹{toNum(expense.amount).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Cash</div>
                      </div>
                    </div>
                  ))}
                
                {familyExpenses.filter(expense => expense.paymentMethod === 'cash').length === 0 && (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No cash expenses found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Expense Details Modal */}
      {showOnlineExpenseDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Online Expenses Details</h3>
                  <p className="text-blue-100">All online expenses breakdown</p>
                </div>
                <button
                  onClick={() => setShowOnlineExpenseDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Online Expenses:</span>
                    <span className="text-2xl font-bold text-blue-700">₹{familyExpensesOnline.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {familyExpenses
                  .filter(expense => expense.paymentMethod === 'online')
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Smartphone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">
                            {expense.category.replace('_', ' ')}
                          </div>
                          {expense.description && (
                            <div className="text-sm text-gray-600">{expense.description}</div>
                          )}
                          <div className="text-xs text-gray-500">
                            {new Date(expense.date).toLocaleDateString('en-IN')} • {expense.paidBy}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">₹{toNum(expense.amount).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Online</div>
                      </div>
                    </div>
                  ))}
                
                {familyExpenses.filter(expense => expense.paymentMethod === 'online').length === 0 && (
                  <div className="text-center py-8">
                    <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No online expenses found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
