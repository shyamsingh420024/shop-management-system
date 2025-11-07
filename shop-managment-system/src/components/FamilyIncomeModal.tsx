import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { FamilyIncome } from '../types/types';
import {
  X,
  TrendingUp,
  Calendar,
  User,
  Briefcase,
  Building,
  Laptop,
  Home,
  MoreHorizontal,
  CreditCard,
  Smartphone,
  Wallet,
  Plus,
  Minus,
  Star
} from 'lucide-react';

interface FamilyIncomeModalProps {
  income: FamilyIncome | null;
  onClose: () => void;
}

interface SplitIncome {
  id: string;
  method: 'cash' | 'online' | 'papa_account' | 'goldie_account';
  amount: string;
}

type FormData = {
  source: FamilyIncome['source'];
  description: string;
  amount: string;
  date: string; // YYYY-MM-DD
  receivedBy: string;
  paymentMethod: FamilyIncome['paymentMethod'];
};

export function FamilyIncomeModal({ income, onClose }: FamilyIncomeModalProps) {
  const { familyMembers, addFamilyIncome, updateFamilyIncome } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSplitPayment, setIsSplitPayment] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    source: 'job',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    receivedBy: '',
    paymentMethod: 'cash',
  });

  const [splitIncomes, setSplitIncomes] = useState<SplitIncome[]>([
    { id: '1', method: 'cash', amount: '' },
    { id: '2', method: 'online', amount: '' },
  ]);

  const sourceOptions = [
    { value: 'job', label: 'Job Salary', icon: Briefcase },
    { value: 'business', label: 'Business Income', icon: Building },
    { value: 'freelance', label: 'Freelance Work', icon: Laptop },
    { value: 'investment', label: 'Investment Returns', icon: TrendingUp },
    { value: 'rental', label: 'Rental Income', icon: Home },
    { value: 'other', label: 'Other Income', icon: MoreHorizontal },
  ] as const;

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: Wallet, color: 'text-green-600' },
    { value: 'online', label: 'Online Payment', icon: Smartphone, color: 'text-blue-600' },
    { value: 'papa_account', label: 'Papa के पास', icon: CreditCard, color: 'text-purple-600' },
    { value: 'goldie_account', label: 'Goldie के पास', icon: Star, color: 'text-yellow-600' },
  ] as const;

  // Sync incoming `income` prop -> formData
  useEffect(() => {
    if (income) {
      setFormData({
        source: income.source,
        description: income.description ?? '',
        amount: (income.amount ?? 0).toString(),
        date: new Date(income.date).toISOString().split('T')[0],
        receivedBy: income.receivedBy ?? '',
        paymentMethod: income.paymentMethod ?? 'cash',
      });

      // When editing an existing income keep split disabled
      setIsSplitPayment(false);
      setSplitIncomes([
        { id: '1', method: 'cash', amount: '' },
        { id: '2', method: 'online', amount: '' },
      ]);
    } else {
      const firstMember = familyMembers.find((m) => m.isActive);
      setFormData({
        source: 'job',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receivedBy: firstMember?.name || '',
        paymentMethod: 'cash',
      });
      setIsSplitPayment(false);
    }
  }, [income, familyMembers]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.receivedBy.trim()) {
      newErrors.receivedBy = 'Please select who received this income';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (isSplitPayment) {
      const validSplitIncomes = splitIncomes.filter((si) => parseFloat(si.amount || '0') > 0);
      if (validSplitIncomes.length === 0) {
        newErrors.splitIncomes = 'कम से कम एक payment method में amount दर्ज करें';
      }
      const totalSplitAmount = validSplitIncomes.reduce((sum, si) => sum + (parseFloat(si.amount || '0') || 0), 0);
      if (totalSplitAmount <= 0) {
        newErrors.splitIncomes = 'कुल amount 0 से अधिक होना चाहिए';
      }
    } else {
      if (!formData.amount || parseFloat(formData.amount || '0') <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
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
      if (isSplitPayment) {
        const validSplitIncomes = splitIncomes.filter((si) => parseFloat(si.amount || '0') > 0);
        for (const splitIncome of validSplitIncomes) {
          const methodLabel = paymentMethodOptions.find((p) => p.value === splitIncome.method)?.label;
          const incomeData = {
            source: formData.source,
            description: formData.description.trim()
              ? `${formData.description} (Split Payment - ${methodLabel})`
              : `Split Payment - ${methodLabel}`,
            amount: parseFloat(splitIncome.amount),
            date: new Date(formData.date),
            receivedBy: formData.receivedBy.trim(),
            paymentMethod: splitIncome.method,
          } as const;

          await addFamilyIncome(incomeData);
        }
      } else {
        const incomeData = {
          source: formData.source,
          description: formData.description.trim() || undefined,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          receivedBy: formData.receivedBy.trim(),
          paymentMethod: formData.paymentMethod,
        };

        if (income) {
          await updateFamilyIncome(income.id, incomeData);
        } else {
          await addFamilyIncome(incomeData);
        }
      }

      onClose();
    } catch (err) {
      console.error('Save income error:', err);
      setErrors({ submit: 'Failed to save income. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Strongly-typed handleChange
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  // handleSplitIncomeChange accepts strings but call-sites cast the method properly
  const handleSplitIncomeChange = (id: string, field: keyof SplitIncome, value: string) => {
    setSplitIncomes((prev) =>
      prev.map((si) => (si.id === id ? { ...si, [field]: value } : si))
    );
    if (errors.splitIncomes) {
      setErrors((prev) => ({ ...prev, splitIncomes: '' }));
    }
  };

  const addSplitIncome = () => {
    const newId = (splitIncomes.length + 1).toString();
    setSplitIncomes((prev) => [...prev, { id: newId, method: 'cash', amount: '' }]);
  };

  const removeSplitIncome = (id: string) => {
    if (splitIncomes.length > 1) {
      setSplitIncomes((prev) => prev.filter((si) => si.id !== id));
    }
  };

  const toggleSplitPayment = () => {
    setIsSplitPayment((s) => {
      const next = !s;
      // If enabling split, clear single amount to avoid user confusion
      if (next) {
        setFormData((prev) => ({ ...prev, amount: '' }));
        setSplitIncomes([
          { id: '1', method: 'cash', amount: '' },
          { id: '2', method: 'online', amount: '' },
        ]);
      } else {
        // disabling split: reset to a single default split entry
        setSplitIncomes([{ id: '1', method: 'cash', amount: '' }]);
      }
      return next;
    });
    setErrors({});
  };

  const activeFamilyMembers = familyMembers.filter((m) => m.isActive);
  const totalSplitAmount = splitIncomes.reduce((sum, si) => sum + (parseFloat(si.amount || '0') || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {income ? 'Edit Income' : 'Add Family Income'}
                </h2>
                <p className="text-green-100">
                  {income ? 'Update income details' : 'Record a new family income with payment methods'}
                </p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
              {errors.submit}
            </div>
          )}

          {activeFamilyMembers.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
              <p className="font-medium">No family members found!</p>
              <p className="text-sm mt-1">Please add family members first before creating income records.</p>
            </div>
          )}

          {/* Split Payment Toggle (only for new income) */}
          {!income && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isSplitPayment}
                  onChange={toggleSplitPayment}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                <div>
                  <span className="text-sm font-medium text-blue-900">Split Payment (Multiple Methods)</span>
                  <p className="text-xs text-blue-700 mt-1">
                    Enable this if you received income through multiple methods (e.g., half cash + half online)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Income Source *</label>
            <div className="grid grid-cols-2 gap-2">
              {sourceOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange('source', value as FormData['source'])}
                  className={`p-3 border rounded-lg text-left transition-colors flex items-center space-x-2 ${
                    formData.source === value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  disabled={isLoading}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What was this income for? (optional)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {isSplitPayment && !income ? (
            /* Split Payment Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Split Payment Methods</h3>
                <button
                  type="button"
                  onClick={addSplitIncome}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Method</span>
                </button>
              </div>

              {errors.splitIncomes && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                  {errors.splitIncomes}
                </div>
              )}

              <div className="space-y-3">
                {splitIncomes.map((splitIncome, index) => (
                  <div key={splitIncome.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Payment Method {index + 1}</h4>
                      {splitIncomes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplitIncome(splitIncome.id)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                          disabled={isLoading}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                        <select
                          value={splitIncome.method}
                          onChange={(e) =>
                            // cast here to ensure TypeScript knows we're setting a valid union
                            handleSplitIncomeChange(splitIncome.id, 'method', e.target.value as SplitIncome['method'])
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          disabled={isLoading}
                        >
                          {paymentMethodOptions.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                        <input
                          type="number"
                          value={splitIncome.amount}
                          onChange={(e) => handleSplitIncomeChange(splitIncome.id, 'amount', e.target.value)}
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Amount Display */}
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Split Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{totalSplitAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Payment Section */
            <>
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TrendingUp className="h-4 w-4 inline mr-2" />
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethodOptions.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('paymentMethod', value as FormData['paymentMethod'])}
                      className={`p-3 border rounded-lg text-left transition-colors flex items-center space-x-3 ${
                        formData.paymentMethod === value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={isLoading}
                    >
                      <Icon className={`h-5 w-5 ${formData.paymentMethod === value ? 'text-green-600' : color}`} />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Received By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Received By *
            </label>
            <select
              value={formData.receivedBy}
              onChange={(e) => handleChange('receivedBy', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                errors.receivedBy ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select family member</option>
              {activeFamilyMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.relation})
                </option>
              ))}
            </select>
            {errors.receivedBy && <p className="mt-1 text-sm text-red-600">{errors.receivedBy}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
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
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading || activeFamilyMembers.length === 0}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : isSplitPayment && !income ? (
                'Add Split Income'
              ) : income ? (
                'Update Income'
              ) : (
                'Add Income'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
