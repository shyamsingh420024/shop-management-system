import React, { useMemo, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Payment } from '../types/types';
import {
  Plus,
  CreditCard,
  Search,
  Filter,
  Calendar,
  Trash2,
  Wallet,
  Smartphone,
  Edit
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';

export function PaymentTracking() {
  const { payments, shops, bills, deletePayment } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'cash' | 'online' | 'papa_account'>('all');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'advance' | 'bill'>('all');

  // Helper to coerce amounts to finite numbers (handles "1,000" strings, etc.)
  const toNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const lowerSearch = searchTerm.toLowerCase().trim();

  // memoize filtered and sorted payments for performance
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const shop = shops.find(s => s.id === payment.shopId);
      // const bill = payment.billId ? bills.find(b => b.id === payment.billId) : null;

      const shopName = (shop?.name || '').toLowerCase();
      const shopOwner = (shop?.owner || '').toLowerCase();
      const reference = (payment.reference || '').toLowerCase();
      const notes = (payment.notes || '').toLowerCase();

      const matchesSearch =
        lowerSearch === '' ||
        shopName.includes(lowerSearch) ||
        shopOwner.includes(lowerSearch) ||
        reference.includes(lowerSearch) ||
        notes.includes(lowerSearch);

      const matchesMethod = filterMethod === 'all' || payment.method === filterMethod;
      const matchesShop = filterShop === 'all' || payment.shopId === filterShop;
      const matchesType =
        filterType === 'all' ||
        (filterType === 'advance' && payment.isAdvance) ||
        (filterType === 'bill' && !payment.isAdvance);

      return matchesSearch && matchesMethod && matchesShop && matchesType;
    });
  }, [payments, shops, bills, lowerSearch, filterMethod, filterShop, filterType]);

  const sortedPayments = useMemo(() => {
    // clone before sort to avoid mutating original arrays
    return [...filteredPayments].sort((a, b) => {
      const ad = new Date(a.date);
      const bd = new Date(b.date);
      // fallback to 0 if invalid date
      return (bd.getTime() || 0) - (ad.getTime() || 0);
    });
  }, [filteredPayments]);

  const handleAddPayment = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  // make async in case deletePayment returns a promise
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment? This action cannot be undone.')) return;
    try {
      await deletePayment(paymentId);
    } catch (err) {
      console.error('Failed to delete payment:', err);
      // optional: set a UI-level error / toast here
    }
  };

  const getMethodBadge = (method: Payment['method'] | string) => {
    const methodConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
      cash: { bg: 'bg-green-100', text: 'text-green-800', label: 'Cash', icon: Wallet },
      online: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Online', icon: Smartphone },
      papa_account: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Papa के पास', icon: CreditCard },
    };

    const cfg = methodConfig[String(method)] || methodConfig['cash'];
    const Icon = cfg.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${cfg.bg} ${cfg.text}`}>
        <Icon className="h-3 w-3" />
        <span>{cfg.label}</span>
      </span>
    );
  };

  // Aggregations
  const totalPayments = useMemo(() => sortedPayments.reduce((sum, p) => sum + toNum(p.amount), 0), [sortedPayments]);
  const totalAdvances = useMemo(() => sortedPayments.filter(p => p.isAdvance).reduce((s, p) => s + toNum(p.amount), 0), [sortedPayments]);
  const totalBillPayments = useMemo(() => sortedPayments.filter(p => !p.isAdvance).reduce((s, p) => s + toNum(p.amount), 0), [sortedPayments]);

  const paymentsByMethod = useMemo(() => ({
    cash: payments.filter(p => p.method === 'cash').reduce((s, p) => s + toNum(p.amount), 0),
    online: payments.filter(p => p.method === 'online').reduce((s, p) => s + toNum(p.amount), 0),
    papa_account: payments.filter(p => p.method === 'papa_account').reduce((s, p) => s + toNum(p.amount), 0),
  }), [payments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Tracking</h1>
          <p className="text-gray-600 mt-1">Track all payments and advances with payment methods</p>
        </div>
        <button
          onClick={handleAddPayment}
          className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          type="button"
        >
          <Plus className="h-5 w-5" />
          <span>Add Payment</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Payments</p>
              <p className="text-2xl font-bold">₹{toNum(totalPayments).toLocaleString()}</p>
            </div>
            <CreditCard className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Bill Payments</p>
              <p className="text-2xl font-bold">₹{toNum(totalBillPayments).toLocaleString()}</p>
            </div>
            <CreditCard className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Advance Payments</p>
              <p className="text-2xl font-bold">₹{toNum(totalAdvances).toLocaleString()}</p>
            </div>
            <CreditCard className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Wallet className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-green-600 font-medium">Cash Payments</p>
            <p className="text-2xl font-bold text-green-700">₹{toNum(paymentsByMethod.cash).toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Smartphone className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-blue-600 font-medium">Online Payments</p>
            <p className="text-2xl font-bold text-blue-700">₹{toNum(paymentsByMethod.online).toLocaleString()}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-purple-600 font-medium">Papa के पास</p>
            <p className="text-2xl font-bold text-purple-700">₹{toNum(paymentsByMethod.papa_account).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Method Filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="papa_account">Papa के पास</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="bill">Bill Payments</option>
            <option value="advance">Advances</option>
          </select>

          {/* Shop Filter */}
          <select
            value={filterShop}
            onChange={(e) => setFilterShop(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Shops</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterMethod('all');
              setFilterType('all');
              setFilterShop('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            type="button"
          >
            <Filter className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Payments List */}
      {sortedPayments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Found</h3>
          <p className="text-gray-500 mb-6">
            {payments.length === 0 ? 'Start by recording your first payment' : 'Try adjusting your search or filter criteria'}
          </p>
          {payments.length === 0 && (
            <button onClick={handleAddPayment} className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200" type="button">
              Record Your First Payment
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedPayments.map((payment) => {
                  const shop = shops.find(s => s.id === payment.shopId);
                  const bill = payment.billId ? bills.find(b => b.id === payment.billId) : null;

                  const dateDisplay = (() => {
                    const d = new Date(payment.date);
                    return isNaN(d.getTime()) ? new Date().toLocaleDateString('en-IN') : d.toLocaleDateString('en-IN');
                  })();

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{dateDisplay}</span>
                          </div>
                          {payment.reference && <div className="text-sm text-gray-500">Ref: {payment.reference}</div>}
                          {payment.notes && <div className="text-sm text-gray-500">{payment.notes}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{shop?.name || '-'}</div>
                          <div className="text-sm text-gray-500">{shop?.owner || ''}</div>
                          {bill && <div className="text-xs text-blue-600">Bill: {bill.billNumber}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">₹{toNum(payment.amount).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">{getMethodBadge(payment.method)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.isAdvance ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {payment.isAdvance ? 'Advance' : 'Bill Payment'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleEditPayment(payment)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit Payment" type="button">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeletePayment(payment.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete Payment" type="button">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && (
        <PaymentModal
          payment={editingPayment}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPayment(null);
          }}
        />
      )}
    </div>
  );
}
