import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { ShopCard } from './ShopCard';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Store,
  Receipt,
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle,
  Wallet,
  Smartphone,
  Building,
  BarChart3,
  Calendar,
  Eye,
  X,
  Landmark,
  Star,
  ChevronDown,
  ChevronUp,
  Calculator,
  Fuel,
  Phone,
  MapPin,
  Home
} from 'lucide-react';
import { calculatePenalty } from '../utils/penaltyUtils';

export function Dashboard() {
  const { shops = [], bills = [], payments = [], familyExpenses = [], familyIncome = [], bankDeposits = [] } = useShop();
  const [showRentBreakdown, setShowRentBreakdown] = useState(false);
  const [showOutstandingBreakdown, setShowOutstandingBreakdown] = useState(false);
  const [showGoldieDetails, setShowGoldieDetails] = useState(false);
  const [showCashDetails, setShowCashDetails] = useState(false);
  const [showOnlineDetails, setShowOnlineDetails] = useState(false);

  // Helper to coerce any value into a safe finite number
  const toNum = (v: any): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // Total monthly rent (sum of shop.monthlyRent)
  const totalMonthlyRent = shops.reduce((sum, shop) => sum + toNum(shop.monthlyRent), 0);

  // Total outstanding - only last bill's due for each shop
  const totalOutstanding = shops.reduce((sum, shop) => {
    const shopBills = bills.filter(bill => bill.shopId === shop.id && toNum(bill.remaining) > 0);
    if (shopBills.length === 0) return sum;
    const latestBill = shopBills.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())[0];
    return sum + toNum(latestBill.remaining);
  }, 0);

  // Critical Alerts
  const billsWithPenalty = bills.filter(bill => {
    const penaltyInfo = calculatePenalty(bill);
    return penaltyInfo?.hasPenalty;
  });

  const totalPenaltyAmount = billsWithPenalty.reduce((sum, bill) => {
    const penaltyInfo = calculatePenalty(bill);
    return sum + toNum(penaltyInfo?.penaltyAmount);
  }, 0);

  const overdueBills = bills.filter(bill => {
    const penaltyInfo = calculatePenalty(bill);
    return penaltyInfo?.warningType === 'overdue' || penaltyInfo?.warningType === 'penalty';
  });

  // Business sums (by method)
  const businessCash = payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + toNum(p.amount), 0);
  const businessOnline = payments.filter(p => p.method === 'online').reduce((sum, p) => sum + toNum(p.amount), 0);
  const businessPapa = payments.filter(p => p.method === 'papa_account').reduce((sum, p) => sum + toNum(p.amount), 0);

  // Family transactions (excluding goldie)
  const familyExpensesCash = familyExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + toNum(e.amount), 0);
  const familyExpensesOnline = familyExpenses.filter(e => e.paymentMethod === 'online').reduce((sum, e) => sum + toNum(e.amount), 0);
  const familyExpensesPapa = familyExpenses.filter(e => e.paymentMethod === 'papa_account').reduce((sum, e) => sum + toNum(e.amount), 0);

  const familyIncomeCash = familyIncome.filter(i => i.paymentMethod === 'cash').reduce((sum, i) => sum + toNum(i.amount), 0);
  const familyIncomeOnline = familyIncome.filter(i => i.paymentMethod === 'online').reduce((sum, i) => sum + toNum(i.amount), 0);
  const familyIncomePapa = familyIncome.filter(i => i.paymentMethod === 'papa_account').reduce((sum, i) => sum + toNum(i.amount), 0);

  // Bank deposits from non-Goldie accounts only
  const mainBankDeposits = bankDeposits.filter(d => d.fromAccount !== 'goldie_account').reduce((sum, d) => sum + toNum(d.amount), 0);

  // Bank deposits by account
  const cashBankDeposits = bankDeposits.filter(d => d.fromAccount === 'cash').reduce((sum, d) => sum + toNum(d.amount), 0);
  const onlineBankDeposits = bankDeposits.filter(d => d.fromAccount === 'online').reduce((sum, d) => sum + toNum(d.amount), 0);
  const papaBankDeposits = bankDeposits.filter(d => d.fromAccount === 'papa_account').reduce((sum, d) => sum + toNum(d.amount), 0);

  // Totals excluding Goldie
  const totalCash = businessCash + familyIncomeCash - familyExpensesCash - cashBankDeposits;
  const totalOnline = businessOnline + familyIncomeOnline - familyExpensesOnline - onlineBankDeposits;
  const totalPapa = businessPapa + familyIncomePapa - familyExpensesPapa - papaBankDeposits;

  // Goldie-specific calculations
  const goldieExpenses = familyExpenses.filter(e => e.paymentMethod === 'goldie_account').reduce((sum, e) => sum + toNum(e.amount), 0);
  const goldieIncome = familyIncome.filter(i => i.paymentMethod === 'goldie_account').reduce((sum, i) => sum + toNum(i.amount), 0);
  const goldieBankDeposits = bankDeposits.filter(d => d.fromAccount === 'goldie_account').reduce((sum, d) => sum + toNum(d.amount), 0);
  const goldieNetAvailable = goldieIncome - goldieExpenses - goldieBankDeposits;

  // Shop performance
  const shopPerformance = shops.map(shop => {
    const shopBills = bills.filter(bill => bill.shopId === shop.id);
    const shopPayments = payments.filter(payment => payment.shopId === shop.id);
    const pendingBills = shopBills.filter(bill => toNum(bill.remaining) > 0);
    const outstanding = pendingBills.length > 0
      ? toNum(pendingBills.sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())[0].remaining)
      : 0;
    const collected = shopPayments.reduce((sum, payment) => sum + toNum(payment.amount), 0);
    const totalBilled = shopBills.reduce((sum, bill) => sum + toNum(bill.total), 0);
    const collectionRate = totalBilled > 0 ? (collected / totalBilled) * 100 : 0;

    return {
      shop,
      outstanding,
      collected,
      totalBilled,
      collectionRate,
      billCount: shopBills.length
    };
  }).sort((a, b) => b.outstanding - a.outstanding);

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {(billsWithPenalty.length > 0 || overdueBills.length > 0) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Urgent Action Required!</h3>
              <div className="mt-1 text-red-700 text-sm">
                {billsWithPenalty.length > 0 && (
                  <p>• {billsWithPenalty.length} bills have penalty charges (₹{toNum(totalPenaltyAmount).toLocaleString()})</p>
                )}
                {overdueBills.length > 0 && (
                  <p>• {overdueBills.length} bills are overdue and need immediate attention</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monthly Rent - CLICKABLE */}
        <div
          className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowRentBreakdown(true)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Monthly Rent</p>
              <p className="text-xl font-bold mt-1">₹{toNum(totalMonthlyRent).toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Building className="h-3 w-3 mr-1" />
                <span className="text-blue-200">{shops.length} shops</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Building className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        {/* Total Outstanding - CLICKABLE */}
        <div
          className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowOutstandingBreakdown(true)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Outstanding</p>
              <p className="text-xl font-bold mt-1">₹{toNum(totalOutstanding).toLocaleString()}</p>
              <div className="flex items-center mt-1 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <span className="text-orange-200">Unpaid</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Receipt className="h-8 w-8 text-orange-200" />
          </div>
        </div>

        {/* Total Cash (Business + Family - EXCLUDING Goldie) */}
        <div
          className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowCashDetails(true)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Total Cash</p>
              <p className="text-xl font-bold mt-1">
                {totalCash >= 0 ? '+' : ''}₹{toNum(totalCash).toLocaleString()}
              </p>
              <div className="flex items-center mt-1 text-xs">
                <Wallet className="h-3 w-3 mr-1" />
                <span className="text-green-200">Available</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Wallet className="h-8 w-8 text-green-200" />
          </div>
        </div>

        {/* Total Online (Business + Family - EXCLUDING Goldie) */}
        <div
          className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowOnlineDetails(true)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Total Online</p>
              <p className="text-xl font-bold mt-1">
                {totalOnline >= 0 ? '+' : ''}₹{toNum(totalOnline).toLocaleString()}
              </p>
              <div className="flex items-center mt-1 text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                <span className="text-purple-200">Available</span>
                <Eye className="h-3 w-3 ml-2" />
              </div>
            </div>
            <Smartphone className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Goldie's Separate Account Summary - CLICKABLE */}
      <div
        className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-xl text-white shadow-lg cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        onClick={() => setShowGoldieDetails(true)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5" />
              <h3 className="text-lg font-bold">Goldie का Account (Separate)</h3>
              <Eye className="h-4 w-4" />
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-yellow-100 text-xs">Income</p>
                <p className="font-bold">₹{toNum(goldieIncome).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-xs">Expenses</p>
                <p className="font-bold">₹{toNum(goldieExpenses).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-xs">Bank Deposits</p>
                <p className="font-bold">₹{toNum(goldieBankDeposits).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-yellow-100 text-xs">Net Available</p>
                <p className={`font-bold ${goldieNetAvailable >= 0 ? 'text-white' : 'text-red-200'}`}>
                  {goldieNetAvailable >= 0 ? '+' : ''}₹{toNum(goldieNetAvailable).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <Star className="h-12 w-12 text-yellow-200" />
        </div>
      </div>

      {/* Bank Deposits Summary (excluding Goldie) */}
      {mainBankDeposits > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Landmark className="h-5 w-5 mr-2 text-indigo-600" />
            Bank Deposits Summary (Main Family - Excluding Goldie)
          </h3>
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Landmark className="h-4 w-4 text-indigo-600" />
                <span className="font-medium text-indigo-800 text-sm">Total Bank Deposits</span>
              </div>
              <span className="text-xl font-bold text-indigo-700">₹{toNum(mainBankDeposits).toLocaleString()}</span>
            </div>
            <div className="text-xs text-indigo-600 mt-1">
              Money safely deposited in bank accounts (excluding Goldie)
            </div>
          </div>
        </div>
      )}

      {/* Shop Performance Analysis */}
      {shopPerformance.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
            Top Shop Performance
          </h3>
          <div className="space-y-2">
            {shopPerformance.slice(0, 3).map(({ shop, outstanding, collected, collectionRate }) => (
              <div key={shop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{shop.name}</div>
                  <div className="text-xs text-gray-500">{shop.owner}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    Due: ₹{toNum(outstanding).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Collected: ₹{toNum(collected).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Store className="h-6 w-6 mr-2 text-blue-600" />
          Shop Overview ({shops.length} shops)
        </h2>

        {shops.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No shops added yet</p>
            <p className="text-gray-400">Start by adding your first shop in Shop Management</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {shops.map(shop => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>

      {/* Rent Breakdown Modal */}
      {showRentBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Monthly Rent Breakdown</h3>
                  <p className="text-blue-100">Total: ₹{toNum(totalMonthlyRent).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setShowRentBreakdown(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {shops.map(shop => (
                  <div key={shop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{shop.name}</div>
                      <div className="text-sm text-gray-500">{shop.owner}</div>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      ₹{toNum(shop.monthlyRent).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outstanding Breakdown Modal */}
      {showOutstandingBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Outstanding Breakdown</h3>
                  <p className="text-orange-100">Total: ₹{toNum(totalOutstanding).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setShowOutstandingBreakdown(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {shopPerformance.filter(({ outstanding }) => outstanding > 0).map(({ shop, outstanding }) => (
                  <div key={shop.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{shop.name}</div>
                      <div className="text-sm text-gray-500">{shop.owner}</div>
                    </div>
                    <div className="text-lg font-bold text-orange-600">₹{toNum(outstanding).toLocaleString()}</div>
                  </div>
                ))}
                {shopPerformance.filter(({ outstanding }) => outstanding > 0).length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">No outstanding dues! All shops are up to date.</p>
                  </div>
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
                    Goldie का Account Details
                  </h3>
                  <p className="text-yellow-100">Complete financial overview</p>
                </div>
                <button
                  onClick={() => setShowGoldieDetails(false)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  type="button"
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
                  <p className="text-2xl font-bold text-green-700">₹{toNum(goldieIncome).toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">Total received</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">₹{toNum(goldieExpenses).toLocaleString()}</p>
                  <p className="text-xs text-red-600 mt-1">Total spent</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Landmark className="h-5 w-5 text-indigo-600" />
                    <span className="text-xs text-indigo-600 font-medium">BANK DEPOSITS</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹{toNum(goldieBankDeposits).toLocaleString()}</p>
                  <p className="text-xs text-indigo-600 mt-1">Deposited</p>
                </div>

                <div className={`p-4 rounded-lg border ${goldieNetAvailable >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Star className={`h-5 w-5 ${goldieNetAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${goldieNetAvailable >= 0 ? 'text-green-600' : 'text-red-600'}`}>NET AVAILABLE</span>
                  </div>
                  <p className={`text-2xl font-bold ${goldieNetAvailable >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {goldieNetAvailable >= 0 ? '+' : ''}₹{toNum(goldieNetAvailable).toLocaleString()}
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

      {/* Cash Details Modal */}
      {showCashDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Total Cash Breakdown</h3>
                  <p className="text-green-100">Net Available: ₹{toNum(totalCash).toLocaleString()}</p>
                </div>
                <button onClick={() => setShowCashDetails(false)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">INCOME</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">₹{toNum(businessCash + familyIncomeCash).toLocaleString()}</p>
                    <div className="text-xs text-green-600 mt-2 space-y-1">
                      <p>Business: ₹{toNum(businessCash).toLocaleString()}</p>
                      <p>Family: ₹{toNum(familyIncomeCash).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">₹{toNum(familyExpensesCash + cashBankDeposits).toLocaleString()}</p>
                    <div className="text-xs text-red-600 mt-2 space-y-1">
                      <p>Family Expenses: ₹{toNum(familyExpensesCash).toLocaleString()}</p>
                      <p>Bank Deposits: ₹{toNum(cashBankDeposits).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${totalCash >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Wallet className={`h-5 w-5 ${totalCash >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${totalCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>NET AVAILABLE CASH</span>
                  </div>
                  <p className={`text-3xl font-bold ${totalCash >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {totalCash >= 0 ? '+' : ''}₹{Math.abs(toNum(totalCash)).toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${totalCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalCash >= 0 ? 'Available cash balance' : 'Cash deficit'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Online Details Modal */}
      {showOnlineDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Total Online Breakdown</h3>
                  <p className="text-purple-100">Net Available: ₹{toNum(totalOnline).toLocaleString()}</p>
                </div>
                <button onClick={() => setShowOnlineDetails(false)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors" type="button">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">INCOME</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">₹{toNum(businessOnline + familyIncomeOnline).toLocaleString()}</p>
                    <div className="text-xs text-blue-600 mt-2 space-y-1">
                      <p>Business: ₹{toNum(businessOnline).toLocaleString()}</p>
                      <p>Family: ₹{toNum(familyIncomeOnline).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">EXPENSES</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">₹{toNum(familyExpensesOnline + onlineBankDeposits).toLocaleString()}</p>
                    <div className="text-xs text-red-600 mt-2 space-y-1">
                      <p>Family Expenses: ₹{toNum(familyExpensesOnline).toLocaleString()}</p>
                      <p>Bank Deposits: ₹{toNum(onlineBankDeposits).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${totalOnline >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Smartphone className={`h-5 w-5 ${totalOnline >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${totalOnline >= 0 ? 'text-blue-600' : 'text-red-600'}`}>NET AVAILABLE ONLINE</span>
                  </div>
                  <p className={`text-3xl font-bold ${totalOnline >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {totalOnline >= 0 ? '+' : ''}₹{Math.abs(toNum(totalOnline)).toLocaleString()}
                  </p>
                  <p className={`text-xs mt-1 ${totalOnline >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {totalOnline >= 0 ? 'Available online balance' : 'Online deficit'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
