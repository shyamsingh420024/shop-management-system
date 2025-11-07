import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { FamilyExpense } from '../types/types';
import { 
  X, 
  DollarSign, 
  Calendar, 
  FileText, 
  User,
  ShoppingCart,
  Zap,
  Heart,
  GraduationCap,
  Car,
  Gamepad2,
  Shirt,
  MoreHorizontal,
  CreditCard,
  Smartphone,
  Wallet,
  Plus,
  Minus,
  Star,
  Fuel,
  Phone,
  MapPin,
  Home,
  UtensilsCrossed,
  Monitor,
  Shield,
  Wrench,
  Dumbbell
} from 'lucide-react';

interface FamilyExpenseModalProps {
  expense: FamilyExpense | null;
  onClose: () => void;
}

interface SplitExpense {
  id: string;
  method: 'cash' | 'online' | 'papa_account' | 'goldie_account';
  amount: string;
}

export function FamilyExpenseModal({ expense, onClose }: FamilyExpenseModalProps) {
  const { familyMembers, addFamilyExpense, updateFamilyExpense } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  
  const [formData, setFormData] = useState({
    category: 'groceries' as FamilyExpense['category'],
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    paymentMethod: 'cash' as FamilyExpense['paymentMethod'],
  });

  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>([
    { id: '1', method: 'cash', amount: '' },
    { id: '2', method: 'online', amount: '' }
  ]);

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
    { value: 'tax', label: 'Tax (टैक्स)', icon: FileText },
    { value: 'repairing', label: 'Repairing (मरम्मत)', icon: Wrench },
    { value: 'gym', label: 'Gym (जिम)', icon: Dumbbell },
    { value: 'other', label: 'Other (अन्य)', icon: MoreHorizontal },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash', icon: Wallet, color: 'text-green-600' },
    { value: 'online', label: 'Online Payment', icon: Smartphone, color: 'text-blue-600' },
    { value: 'papa_account', label: 'Papa के पास', icon: CreditCard, color: 'text-purple-600' },
    { value: 'goldie_account', label: 'Goldie के पास', icon: Star, color: 'text-yellow-600' },
  ];

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category,
        description: expense.description || '',
        amount: expense.amount.toString(),
        date: new Date(expense.date).toISOString().split('T')[0],
        paidBy: expense.paidBy,
        paymentMethod: expense.paymentMethod || 'cash',
      });
    } else {
      // Set default paid by to first active member
      const firstMember = familyMembers.find(m => m.isActive);
      setFormData({
        category: 'groceries',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paidBy: firstMember?.name || '',
        paymentMethod: 'cash',
      });
    }
  }, [expense, familyMembers]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.paidBy.trim()) {
      newErrors.paidBy = 'Please select who paid for this expense';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (isSplitPayment) {
      // Validate split expenses
      const validSplitExpenses = splitExpenses.filter(se => parseFloat(se.amount) > 0);
      if (validSplitExpenses.length === 0) {
        newErrors.splitExpenses = 'कम से कम एक payment method में amount दर्ज करें';
      }

      const totalSplitAmount = validSplitExpenses.reduce((sum, se) => sum + parseFloat(se.amount), 0);
      if (totalSplitAmount <= 0) {
        newErrors.splitExpenses = 'कुल amount 0 से अधिक होना चाहिए';
      }
    } else {
      // Validate single expense
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        newErrors.amount = 'Amount must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (isSplitPayment) {
        // Handle split expenses - create multiple expense records
        const validSplitExpenses = splitExpenses.filter(se => parseFloat(se.amount) > 0);
        
        for (const splitExpense of validSplitExpenses) {
          const expenseData = {
            category: formData.category,
            description: formData.description.trim() ? `${formData.description} (Split Payment - ${paymentMethodOptions.find(p => p.value === splitExpense.method)?.label})` : `Split Payment - ${paymentMethodOptions.find(p => p.value === splitExpense.method)?.label}`,
            amount: parseFloat(splitExpense.amount),
            date: new Date(formData.date),
            paidBy: formData.paidBy.trim(),
            paymentMethod: splitExpense.method,
          };

          await addFamilyExpense(expenseData);
        }
      } else {
        // Handle single expense
        const expenseData = {
          category: formData.category,
          description: formData.description.trim() || undefined,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          paidBy: formData.paidBy.trim(),
          paymentMethod: formData.paymentMethod,
        };

        if (expense) {
          await updateFamilyExpense(expense.id, expenseData);
        } else {
          await addFamilyExpense(expenseData);
        }
      }

      onClose();
    } catch (error) {
      setErrors({ submit: 'Failed to save expense. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSplitExpenseChange = (id: string, field: keyof SplitExpense, value: string) => {
    setSplitExpenses(prev => prev.map(se => 
      se.id === id ? { ...se, [field]: value } : se
    ));
    if (errors.splitExpenses) {
      setErrors(prev => ({ ...prev, splitExpenses: '' }));
    }
  };

  const addSplitExpense = () => {
    const newId = (splitExpenses.length + 1).toString();
    setSplitExpenses(prev => [...prev, { id: newId, method: 'cash', amount: '' }]);
  };

  const removeSplitExpense = (id: string) => {
    if (splitExpenses.length > 1) {
      setSplitExpenses(prev => prev.filter(se => se.id !== id));
    }
  };

  const toggleSplitPayment = () => {
    setIsSplitPayment(!isSplitPayment);
    setErrors({});
    if (!isSplitPayment) {
      // Reset split expenses when enabling
      setSplitExpenses([
        { id: '1', method: 'cash', amount: '' },
        { id: '2', method: 'online', amount: '' }
      ]);
    }
  };

  const activeFamilyMembers = familyMembers.filter(m => m.isActive);
  const totalSplitAmount = splitExpenses.reduce((sum, se) => sum + (parseFloat(se.amount) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {expense ? 'Edit Expense' : 'Add Family Expense'}
                </h2>
                <p className="text-red-100">
                  {expense ? 'Update expense details' : 'Record a new family expense with payment methods'}
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
              <p className="text-sm mt-1">Please add family members first before creating expenses.</p>
            </div>
          )}

          {/* Split Payment Toggle (only for new expenses) */}
          {!expense && (
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
                  <span className="text-sm font-medium text-blue-900">
                    Split Payment (Multiple Methods)
                  </span>
                  <p className="text-xs text-blue-700 mt-1">
                    Enable this if you paid with multiple methods (e.g., half cash + half online)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors appearance-none bg-white"
                disabled={isLoading}
              >
                {categoryOptions.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What was this expense for? (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {isSplitPayment && !expense ? (
            /* Split Payment Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Split Payment Methods</h3>
                <button
                  type="button"
                  onClick={addSplitExpense}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Method</span>
                </button>
              </div>

              {errors.splitExpenses && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                  {errors.splitExpenses}
                </div>
              )}

              <div className="space-y-3">
                {splitExpenses.map((splitExpense, index) => (
                  <div key={splitExpense.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Payment Method {index + 1}</h4>
                      {splitExpenses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplitExpense(splitExpense.id)}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Method
                        </label>
                        <select
                          value={splitExpense.method}
                          onChange={(e) => handleSplitExpenseChange(splitExpense.id, 'method', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          disabled={isLoading}
                        >
                          {paymentMethodOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (₹)
                        </label>
                        <input
                          type="number"
                          value={splitExpense.amount}
                          onChange={(e) => handleSplitExpenseChange(splitExpense.id, 'amount', e.target.value)}
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Amount Display */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Split Amount:</span>
                  <span className="text-2xl font-bold text-red-600">₹{totalSplitAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Payment Section */
            <>
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
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                    errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethodOptions.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('paymentMethod', value)}
                      className={`p-3 border rounded-lg text-left transition-colors flex items-center space-x-3 ${
                        formData.paymentMethod === value
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={isLoading}
                    >
                      <Icon className={`h-5 w-5 ${formData.paymentMethod === value ? 'text-red-600' : color}`} />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Paid By *
            </label>
            <select
              value={formData.paidBy}
              onChange={(e) => handleChange('paidBy', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                errors.paidBy ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">Select family member</option>
              {activeFamilyMembers.map(member => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.relation})
                </option>
              ))}
            </select>
            {errors.paidBy && (
              <p className="mt-1 text-sm text-red-600">{errors.paidBy}</p>
            )}
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
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
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
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading || activeFamilyMembers.length === 0}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                isSplitPayment && !expense ? 'Add Split Expense' : expense ? 'Update Expense' : 'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}