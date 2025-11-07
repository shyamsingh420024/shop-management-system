import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { BankDeposit } from '../types/types';
import { X, Landmark, Calendar, FileText, DollarSign, CreditCard, Smartphone, Wallet, Star, Edit, Trash2 } from 'lucide-react';

interface BankDepositModalProps {
  deposit?: BankDeposit | null;
  onClose: () => void;
}

export function BankDepositModal({ deposit, onClose }: BankDepositModalProps) {
  const { addBankDeposit, updateBankDeposit, deleteBankDeposit, familyExpenses, familyIncome, bankDeposits, payments } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDepositsList, setShowDepositsList] = useState(!deposit);
  const [editingDeposit, setEditingDeposit] = useState<BankDeposit | null>(deposit ?? null);

  // Helper: coerce values reliably to numbers (handles "1,000" or numeric strings)
  const toNum = (v: any): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const [formData, setFormData] = useState({
    amount: '',
    fromAccount: 'cash' as 'cash' | 'online' | 'goldie_account',
    bankName: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const accountOptions = [
    { value: 'cash', label: 'Cash', icon: Wallet, color: 'text-green-600' },
    { value: 'online', label: 'Online Account', icon: Smartphone, color: 'text-blue-600' },
    { value: 'goldie_account', label: 'Goldie के पास', icon: Star, color: 'text-yellow-600' },
  ];

  // Populate form when editingDeposit changes
  useEffect(() => {
    if (editingDeposit) {
      setFormData({
        amount: String(toNum(editingDeposit.amount)),
        fromAccount: editingDeposit.fromAccount as any,
        bankName: editingDeposit.bankName || '',
        description: editingDeposit.description || '',
        date: editingDeposit.date ? new Date(editingDeposit.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
      setShowDepositsList(false);
    } else {
      setFormData({
        amount: '',
        fromAccount: 'cash',
        bankName: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [editingDeposit]);

  // Calculate available balance for selected account
  const getAvailableBalance = () => {
    // Goldie / personal account separate calculation
    if (formData.fromAccount === 'goldie_account') {
      const goldieIncome = familyIncome
        .filter(i => i.paymentMethod === 'goldie_account' || i.paymentMethod === 'personal_account')
        .reduce((sum, i) => sum + toNum(i.amount), 0);

      const goldieExpenses = familyExpenses
        .filter(e => e.paymentMethod === 'goldie_account' || e.paymentMethod === 'personal_account')
        .reduce((sum, e) => sum + toNum(e.amount), 0);

      const goldieDeposits = bankDeposits
        .filter(d => (d.fromAccount === 'goldie_account' || d.fromAccount === 'personal_account') && d.id !== editingDeposit?.id)
        .reduce((sum, d) => sum + toNum(d.amount), 0);

      return goldieIncome - goldieExpenses - goldieDeposits;
    }

    // Main family accounts (cash/online/papa) - exclude goldie/personal
    const businessIncome = payments
      .filter(p => p.method === formData.fromAccount)
      .reduce((sum, p) => sum + toNum(p.amount), 0);

    const income = familyIncome
      .filter(i => i.paymentMethod === formData.fromAccount)
      .reduce((sum, i) => sum + toNum(i.amount), 0);

    const expenses = familyExpenses
      .filter(e => e.paymentMethod === formData.fromAccount)
      .reduce((sum, e) => sum + toNum(e.amount), 0);

    const deposits = bankDeposits
      .filter(d => d.fromAccount === formData.fromAccount && d.id !== editingDeposit?.id)
      .reduce((sum, d) => sum + toNum(d.amount), 0);

    // Debug logging — safe to keep for now
    // console.debug('Account:', formData.fromAccount, { businessIncome, income, expenses, deposits });

    return businessIncome + income - expenses - deposits;
  };

  const availableBalance = getAvailableBalance();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || toNum(formData.amount) <= 0) {
      newErrors.amount = 'कृपया सही राशि दर्ज करें';
    } else if (toNum(formData.amount) > toNum(availableBalance)) {
      newErrors.amount = `राशि उपलब्ध बैलेंस (₹${toNum(availableBalance).toLocaleString()}) से अधिक नहीं हो सकती`;
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'कृपया बैंक का नाम दर्ज करें';
    }

    if (!formData.date) {
      newErrors.date = 'कृपया तारीख चुनें';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const depositData = {
        amount: toNum(formData.amount),
        fromAccount: formData.fromAccount,
        bankName: formData.bankName.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date),
      };

      if (editingDeposit) {
        await updateBankDeposit(editingDeposit.id, depositData);
        setEditingDeposit(null);
        setShowDepositsList(true);
      } else {
        await addBankDeposit(depositData);

        // Reset form (do not reference undefined fields)
        setFormData({
          amount: '',
          fromAccount: 'cash',
          bankName: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      setErrors({ submit: 'बैंक डिपॉजिट सेव करने में त्रुटि। कृपया पुनः प्रयास करें।' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDeposit = async (depositId: string) => {
    if (!confirm('Are you sure you want to delete this bank deposit?')) return;
    try {
      await deleteBankDeposit(depositId);
    } catch (err) {
      console.error('Error deleting deposit:', err);
      setErrors({ submit: 'डिलीट करते समय त्रुटि।' });
    }
  };

  const handleEditDeposit = (depositToEdit: BankDeposit) => {
    setEditingDeposit(depositToEdit);
    setShowDepositsList(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // avoid mutating original array when sorting
  const sortedDeposits = [...bankDeposits].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Bank Deposits</h2>
                <p className="text-indigo-100">Manage bank deposits and transfers</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showDepositsList ? (
            /* Deposits List View */
            <div className="space-y-6">
              {/* Add New Deposit Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Bank Deposit</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                      {errors.submit}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* From Account */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From Account *</label>
                      <select
                        value={formData.fromAccount}
                        onChange={(e) => handleChange('fromAccount', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isLoading}
                      >
                        {accountOptions.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Available: ₹{toNum(availableBalance).toLocaleString()}</p>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleChange('amount', e.target.value)}
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                      {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => handleChange('bankName', e.target.value)}
                        placeholder="e.g., SBI, HDFC"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.bankName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                      {errors.bankName && <p className="mt-1 text-xs text-red-600">{errors.bankName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Deposit description (optional)"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        disabled={isLoading}
                      />
                      {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || toNum(availableBalance) <= 0}
                  >
                    {isLoading ? 'Adding...' : 'Add Deposit'}
                  </button>
                </form>
              </div>

              {/* Deposits List */}
              {sortedDeposits.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Deposit History</h3>
                  <div className="space-y-3">
                    {sortedDeposits.map((d) => {
                      const accountOption = accountOptions.find(a => a.value === d.fromAccount);
                      const Icon = accountOption?.icon || Landmark;

                      return (
                        <div key={d.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <Icon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{d.description || '-'}</div>
                              <div className="text-sm text-gray-500">{d.bankName} • {d.date ? new Date(d.date).toLocaleDateString('en-IN') : '-'}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-bold text-indigo-600">₹{toNum(d.amount).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{accountOption?.label}</div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditDeposit(d)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                title="Edit Deposit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDeposit(d.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Delete Deposit"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No bank deposits found. Add your first deposit above.</p>
                </div>
              )}
            </div>
          ) : (
            /* Edit Deposit Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">{errors.submit}</div>
              )}

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Bank Deposit</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositsList(true);
                    setEditingDeposit(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ← Back to List
                </button>
              </div>

              {/* From Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Account *</label>
                <div className="grid grid-cols-1 gap-2">
                  {accountOptions.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('fromAccount', value)}
                      className={`p-3 border rounded-lg text-left transition-colors flex items-center justify-between ${
                        formData.fromAccount === value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={isLoading}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-5 w-5 ${formData.fromAccount === value ? 'text-indigo-600' : color}`} />
                        <span className="font-medium">{label}</span>
                      </div>
                      {formData.fromAccount === value && (
                        <div className="text-sm text-indigo-600">Available: ₹{toNum(availableBalance).toLocaleString()}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="Enter deposit amount"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>

              {/* Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Landmark className="h-4 w-4 inline mr-2" />
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  placeholder="Enter bank name (e.g., SBI, HDFC, ICICI)"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.bankName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Enter deposit description (optional)"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Deposit Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositsList(true);
                    setEditingDeposit(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={isLoading || toNum(availableBalance) < 0}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    'Update Deposit'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
