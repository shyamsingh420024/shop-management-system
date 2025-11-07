import React, { useEffect, useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Bill, Payment } from '../types/types';
import {
  X,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  Wallet,
  Smartphone,
  Plus,
  Minus
} from 'lucide-react';

interface PaymentModalProps {
  payment?: Payment | null;
  onClose: () => void;
  preSelectedShopId?: string;
}

interface SplitPayment {
  id: string;
  method: 'cash' | 'online' | 'papa_account';
  amount: string;
  reference: string;
}

type Method = SplitPayment['method'];

interface FormData {
  shopId: string;
  billId: string;
  amount: string;
  method: Method | string;
  reference: string;
  notes: string;
  date: string; // yyyy-mm-dd
  isAdvance: boolean;
}

/**
 * PaymentModal (corrected & typed)
 */
export function PaymentModal({ payment, onClose, preSelectedShopId }: PaymentModalProps) {
  const { shops, bills, addPayment, updatePayment } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSplitPayment, setIsSplitPayment] = useState(false);

  // Helper: coerce to finite number (handles strings like "1,000")
  const toNum = (v: any): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const initialFormData: FormData = {
    shopId: preSelectedShopId || payment?.shopId || '',
    billId: payment?.billId || '',
    amount: payment ? String(toNum(payment.amount)) : '',
    method: (payment?.method as Method) || 'cash',
    reference: payment?.reference || '',
    notes: payment?.notes || '',
    date: payment ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isAdvance: !!payment?.isAdvance,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  // fill form when editing
  useEffect(() => {
    if (payment) {
      setFormData({
        shopId: payment.shopId || '',
        billId: payment.billId || '',
        amount: String(toNum(payment.amount)),
        method: (payment.method as Method) || 'cash',
        reference: payment.reference || '',
        notes: payment.notes || '',
        date: new Date(payment.date).toISOString().split('T')[0],
        isAdvance: !!payment.isAdvance,
      });
      setIsSplitPayment(false); // editing disables split by default
    }
  }, [payment]);

  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { id: '1', method: 'cash', amount: '', reference: '' },
    { id: '2', method: 'online', amount: '', reference: '' }
  ]);

  const [shopBills, setShopBills] = useState<Bill[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const paymentMethodOptions: Array<{ value: Method; label: string; icon: any; color: string }> = [
    { value: 'cash', label: 'Cash', icon: Wallet, color: 'text-green-600' },
    { value: 'online', label: 'Online Payment', icon: Smartphone, color: 'text-blue-600' },
    { value: 'papa_account', label: 'Papa के पास', icon: CreditCard, color: 'text-purple-600' },
  ];

  // Update shop bills when shop changes (show only the most recent pending bill)
  useEffect(() => {
    if (formData.shopId) {
      const sb = bills
        .filter(bill => bill.shopId === formData.shopId && toNum(bill.remaining) > 0)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const filtered = sb.length > 0 ? [sb[0]] : [];
      setShopBills(filtered);
      setFormData(prev => ({ ...prev, billId: '' }));
      setSelectedBill(null);
    } else {
      setShopBills([]);
      setFormData(prev => ({ ...prev, billId: '' }));
      setSelectedBill(null);
    }
  }, [formData.shopId, bills]);

  // Update selected bill and optionally autofill amount
  useEffect(() => {
    if (formData.billId) {
      const bill = shopBills.find(b => b.id === formData.billId) || null;
      setSelectedBill(bill);
      if (bill && !formData.amount && !isSplitPayment) {
        setFormData(prev => ({ ...prev, amount: String(toNum(bill.remaining)) }));
      }
    } else {
      setSelectedBill(null);
    }
  }, [formData.billId, shopBills, isSplitPayment, formData.amount]);

  // If method becomes cash, clear single reference
  useEffect(() => {
    if (formData.method === 'cash') {
      setFormData(prev => ({ ...prev, reference: '' }));
    }
  }, [formData.method]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.shopId) newErrors.shopId = 'कृपया दुकान चुनें';

    if (isSplitPayment) {
      const valid = splitPayments.filter(sp => toNum(sp.amount) > 0);
      if (valid.length === 0) newErrors.splitPayments = 'कम से कम एक payment method में amount दर्ज करें';

      const total = valid.reduce((s, sp) => s + toNum(sp.amount), 0);
      if (total <= 0) newErrors.splitPayments = 'कुल amount 0 से अधिक होना चाहिए';

      if (!formData.isAdvance && formData.billId && selectedBill) {
        if (total > toNum(selectedBill.remaining)) {
          newErrors.splitPayments = `कुल amount ₹${toNum(selectedBill.remaining).toLocaleString()} से अधिक नहीं हो सकती`;
        }
      }
    } else {
      if (!formData.amount || toNum(formData.amount) <= 0) {
        newErrors.amount = 'कृपया सही राशि दर्ज करें';
      } else if (!formData.isAdvance && formData.billId && selectedBill) {
        const amount = toNum(formData.amount);
        if (amount > toNum(selectedBill.remaining)) {
          newErrors.amount = `राशि ₹${toNum(selectedBill.remaining).toLocaleString()} से अधिक नहीं हो सकती`;
        }
      }
    }

    if (!formData.date) newErrors.date = 'कृपया तारीख चुनें';

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
        const valid = splitPayments.filter(sp => toNum(sp.amount) > 0);

        for (const sp of valid) {
          const methodLabel = paymentMethodOptions.find(p => p.value === sp.method)?.label || sp.method;
          const paymentData = {
            shopId: formData.shopId,
            billId: formData.isAdvance ? undefined : (formData.billId || undefined),
            amount: toNum(sp.amount),
            method: sp.method,
            reference: sp.reference?.trim() || undefined,
            notes: formData.notes?.trim() ? `${formData.notes.trim()} (Split Payment - ${methodLabel})` : `Split Payment - ${methodLabel}`,
            date: new Date(formData.date),
            isAdvance: !!formData.isAdvance,
          };

          await addPayment(paymentData);
        }
      } else {
        const paymentData = {
          shopId: formData.shopId,
          billId: formData.isAdvance ? undefined : (formData.billId || undefined),
          amount: toNum(formData.amount),
          method: formData.method as Method,
          reference: formData.reference?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          date: new Date(formData.date),
          isAdvance: !!formData.isAdvance,
        };

        if (payment) {
          await updatePayment(payment.id, paymentData);
        } else {
          await addPayment(paymentData);
        }
      }

      onClose();
    } catch (err) {
      console.error('Payment save error', err);
      setErrors({ submit: 'भुगतान सेव करने में त्रुटि। कृपया पुनः प्रयास करें।' });
    } finally {
      setIsLoading(false);
    }
  };

  // strongly typed field change
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    }
  };

  const handleSplitPaymentChange = (id: string, field: keyof SplitPayment, value: string) => {
    setSplitPayments(prev => {
      const next = prev.map(sp => (sp.id === id ? { ...sp, [field]: value } : sp));
      return next;
    });

    // clear generic split error (recompute validation will catch specifics)
    setErrors(prev => {
      const copy = { ...prev };
      if (copy.splitPayments) delete copy.splitPayments;
      return copy;
    });
  };

  const addSplitPayment = () => {
    setSplitPayments(prev => {
      const newId = String(prev.length + 1);
      return [...prev, { id: newId, method: 'cash', amount: '', reference: '' }];
    });
  };

  const removeSplitPayment = (id: string) => {
    setSplitPayments(prev => (prev.length > 1 ? prev.filter(sp => sp.id !== id) : prev));
  };

  // toggle uses functional update so we can act on next value reliably
  const toggleSplitPayment = () => {
    setIsSplitPayment(prev => {
      const next = !prev;
      setErrors({});
      if (next) {
        setSplitPayments([
          { id: '1', method: 'cash', amount: '', reference: '' },
          { id: '2', method: 'online', amount: '', reference: '' }
        ]);
        setFormData(prevForm => ({ ...prevForm, amount: '' }));
      } else {
        setSplitPayments([{ id: '1', method: 'cash', amount: '', reference: '' }]);
      }
      return next;
    });
  };

  const shop = shops.find(s => s.id === formData.shopId) || null;
  const totalSplitAmount = splitPayments.reduce((sum, sp) => sum + toNum(sp.amount), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{payment ? 'Update payment' : 'Add Payment'}</h2>
                <p className="text-green-100">
                  {payment ? 'Update payment details' : 'Record payment with multiple methods support'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              disabled={isLoading}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
              {errors.submit}
            </div>
          )}

          {!payment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Payment Type *</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={!formData.isAdvance}
                    onChange={() => handleChange('isAdvance', false)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <span>Bill Payment</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={formData.isAdvance}
                    onChange={() => handleChange('isAdvance', true)}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <span>Advance Payment</span>
                </label>
              </div>
            </div>
          )}

          {/* Split toggle */}
          {!payment && (
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
                    Enable this if customer pays with multiple methods (e.g., half cash + half online)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Shop */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Shop *</label>
            <select
              value={formData.shopId}
              onChange={(e) => handleChange('shopId', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.shopId ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading || !!preSelectedShopId || !!payment}
            >
              <option value="">Choose a shop</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.owner}
                </option>
              ))}
            </select>
            {errors.shopId && <p className="mt-1 text-sm text-red-600">{errors.shopId}</p>}
          </div>

          {/* Bill selection */}
          {!formData.isAdvance && formData.shopId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Bill (Optional)</label>
              <select
                value={formData.billId}
                onChange={(e) => handleChange('billId', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">General Payment</option>
                {shopBills.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.billNumber} - Due: ₹{toNum(b.remaining).toLocaleString()}
                  </option>
                ))}
              </select>
              {shopBills.length === 0 && <p className="mt-1 text-sm text-gray-500">No pending bills for this shop</p>}
            </div>
          )}

          {selectedBill && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Bill Details</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>Bill Number: {selectedBill.billNumber}</p>
                <p>Total Amount: ₹{toNum(selectedBill.total).toLocaleString()}</p>
                <p>Paid: ₹{toNum(selectedBill.paid).toLocaleString()}</p>
                <p>Remaining: ₹{toNum(selectedBill.remaining).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Split Payment UI */}
          {isSplitPayment ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Split Payment Methods</h3>
                <button
                  type="button"
                  onClick={addSplitPayment}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 text-sm"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Method</span>
                </button>
              </div>

              {errors.splitPayments && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">{errors.splitPayments}</div>
              )}

              <div className="space-y-3">
                {splitPayments.map((sp, idx) => (
                  <div key={sp.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Payment Method {idx + 1}</h4>
                      {splitPayments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSplitPayment(sp.id)}
                          className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                          disabled={isLoading}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
                        <select
                          value={sp.method}
                          onChange={(e) => handleSplitPaymentChange(sp.id, 'method', e.target.value as Method)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        >
                          {paymentMethodOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
                        <input
                          type="number"
                          value={sp.amount}
                          onChange={(e) => handleSplitPaymentChange(sp.id, 'amount', e.target.value)}
                          placeholder="Enter amount"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {(sp.method === 'online' || sp.method === 'papa_account') && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number (Optional)</label>
                        <input
                          type="text"
                          value={sp.reference}
                          onChange={(e) => handleSplitPaymentChange(sp.id, 'reference', e.target.value)}
                          placeholder={sp.method === 'online' ? 'Transaction ID' : 'Reference / note'}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total Split Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{totalSplitAmount.toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Single Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  placeholder="Enter exact amount (e.g., 11529)"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <div className="grid grid-cols-1 gap-2">
                  {paymentMethodOptions.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('method', value)}
                      className={`p-3 border rounded-lg text-left transition-colors flex items-center space-x-3 ${
                        formData.method === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      disabled={isLoading}
                    >
                      <Icon className={`h-5 w-5 ${formData.method === value ? 'text-blue-600' : color}`} />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.method !== 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => handleChange('reference', e.target.value)}
                    placeholder={formData.method === 'online' ? 'Transaction ID' : 'Reference / note'}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.reference ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.reference && <p className="mt-1 text-sm text-red-600">{errors.reference}</p>}
                </div>
              )}
            </>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Payment Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.date ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any notes or comments"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
              disabled={isLoading}
            />
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
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{payment ? 'Updating...' : 'Saving...'}</span>
                </div>
              ) : (
                payment ? 'Update Payment' : (isSplitPayment ? 'Add Split Payment' : 'Add Payment')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
