import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Bill, BillItem } from '../types/types';
import { X, Receipt, Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { calculateRentIncrease } from '../utils/rentUtils';

interface BillModalProps {
  bill: Bill | null;
  onClose: () => void;
}

export function BillModal({ bill, onClose }: BillModalProps) {
  const { shops, bills, addBill, updateBill, updateShop } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper: convert anything numeric-like to a safe number
  const toNum = (v: any): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const [formData, setFormData] = useState({
    shopId: '',
    billNumber: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [] as BillItem[],
  });

  // Generate bill number
  const generateBillNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const billCount = bills.length + 1;
    return `BILL${year}${month}${billCount.toString().padStart(3, '0')}`;
  };

  // Calculate due date (11th of the bill month as earlier logic)
  const calculateDueDate = (billDate: string) => {
    const date = new Date(billDate);
    const dueDate = new Date(date.getFullYear(), date.getMonth(), 11);
    return dueDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (bill) {
      setFormData({
        shopId: bill.shopId,
        billNumber: bill.billNumber,
        billDate: new Date(bill.billDate).toISOString().split('T')[0],
        dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
        items: bill.items || [],
      });
    } else {
      const billNumber = generateBillNumber();
      const billDate = new Date().toISOString().split('T')[0];
      const dueDate = calculateDueDate(billDate);

      setFormData({
        shopId: '',
        billNumber,
        billDate,
        dueDate,
        items: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill, bills]);

  // Auto-generate bill items when shop is selected (only for new bill)
  useEffect(() => {
    if (formData.shopId && !bill) {
      const shop = shops.find(s => s.id === formData.shopId);
      if (!shop) return;

      const billDate = new Date(formData.billDate);
      const previousMonth = new Date(billDate.getFullYear(), billDate.getMonth() - 1, 1);
      const hindiMonths = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
      const monthYear = `${hindiMonths[previousMonth.getMonth()]} ${previousMonth.getFullYear()}`;

      // Calculate rent increase safely
      let rentIncreaseInfo = {
        shouldIncrease: false,
        newRent: toNum(shop.monthlyRent),
        increaseAmount: 0,
        yearsCompleted: 0,
        nextIncreaseDate: new Date()
      };

      try {
        const ri = calculateRentIncrease(shop);
        rentIncreaseInfo = {
          shouldIncrease: !!ri.shouldIncrease,
          newRent: toNum(ri.newRent),
          increaseAmount: toNum(ri.increaseAmount),
          yearsCompleted: ri.yearsCompleted ?? 0,
          nextIncreaseDate: ri.nextIncreaseDate ? new Date(ri.nextIncreaseDate) : new Date()
        };
      } catch (err) {
        console.error('Error calculating rent increase:', err);
      }

      // previous dues: find latest unpaid bill's remaining (non-mutating sort)
      const shopBills = bills.filter(b => b.shopId === shop.id);
      const unpaidBills = shopBills.filter(b => toNum(b.remaining) > 0);
      const latestUnpaidBill = unpaidBills.length > 0
        ? [...unpaidBills].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;
      const previousDues = latestUnpaidBill ? toNum(latestUnpaidBill.remaining) : 0;

      const autoItems: BillItem[] = [];

      // Determine if this is exact increase month
      const lastUpdateDate = shop.lastRentUpdate ? new Date(shop.lastRentUpdate) : new Date(shop.rentStartDate);
      const monthsSinceLastUpdate = Math.floor((billDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const isExactIncreaseMonth = rentIncreaseInfo.shouldIncrease && monthsSinceLastUpdate >= 11;

      // Add previous dues first if any
      if (previousDues > 0) {
        autoItems.push({
          id: Date.now().toString() + '0',
          description: 'पिछला बकाया',
          amount: previousDues,
        });
      }

      // Add rent items (normal or with increase breakdown)
      if (isExactIncreaseMonth) {
        autoItems.push({
          id: Date.now().toString() + '1',
          description: `${monthYear} का किराया`,
          amount: toNum(shop.monthlyRent),
        });
        if (toNum(rentIncreaseInfo.increaseAmount) > 0) {
          autoItems.push({
            id: Date.now().toString() + '2',
            description: `किराया वृद्धि (${toNum(shop.yearlyIncreasePercentage)}% - 11 महीने)`,
            amount: toNum(rentIncreaseInfo.increaseAmount),
          });
        }
      } else {
        autoItems.push({
          id: Date.now().toString() + '1',
          description: `${monthYear} का किराया`,
          amount: toNum(shop.monthlyRent),
        });
      }

      // Add electricity (ensure numeric)
      autoItems.push({
        id: Date.now().toString() + '3',
        description: 'बिजली का बिल',
        amount: toNum(shop.electricityRate),
      });

      setFormData(prev => ({ ...prev, items: autoItems }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.shopId, formData.billDate, shops, bills, bill]);

  // Update dueDate when billDate changes (for new bills)
  useEffect(() => {
    if (!bill) {
      setFormData(prev => ({ ...prev, dueDate: calculateDueDate(prev.billDate) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.billDate, bill]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shopId) newErrors.shopId = 'Please select a shop';
    if (!String(formData.billNumber || '').trim()) newErrors.billNumber = 'Bill number is required';
    if (!formData.billDate) newErrors.billDate = 'Bill date is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.items || formData.items.length === 0) newErrors.items = 'At least one item is required';

    if (formData.items && formData.items.some(item => !String(item.description || '').trim() || toNum(item.amount) <= 0)) {
      newErrors.items = 'All items must have valid description and amount';
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
      // ensure all item.amount are numbers
      const normalizedItems = formData.items.map(it => ({ ...it, amount: toNum(it.amount) }));

      const total = normalizedItems.reduce((sum, item) => sum + toNum(item.amount), 0);

      const billData: Partial<Bill> = {
        shopId: formData.shopId,
        billNumber: String(formData.billNumber).trim(),
        billDate: new Date(formData.billDate),
        dueDate: new Date(formData.dueDate),
        items: normalizedItems,
        total: total,
        paid: bill ? toNum(bill.paid) : 0,
        remaining: bill ? (total - toNum(bill.paid)) : total,
        status: bill ? bill.status : 'pending',
      };

      if (bill) {
        await updateBill(bill.id, billData as Bill);
      } else {
        await addBill(billData as Bill);

        // Check & apply rent increase to shop if needed
        const shop = shops.find(s => s.id === formData.shopId);
        if (shop) {
          try {
            const rentIncreaseInfo = calculateRentIncrease(shop);
            const lastUpdateDate = shop.lastRentUpdate ? new Date(shop.lastRentUpdate) : new Date(shop.rentStartDate);
            const billDt = new Date(formData.billDate);
            const monthsSinceLastUpdate = Math.floor((billDt.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            const isExactIncreaseMonth = !!rentIncreaseInfo.shouldIncrease && monthsSinceLastUpdate >= 11;

            if (isExactIncreaseMonth) {
              await updateShop(shop.id, {
                monthlyRent: toNum(rentIncreaseInfo.newRent),
                lastRentUpdate: new Date().toISOString()
              } as any);
            }
          } catch (err) {
            console.error('Error updating shop rent:', err);
          }
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Failed to save bill. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
  };

  const updateItem = (itemId: string, field: keyof BillItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: field === 'amount' ? toNum(value) : (value as any) } : item
      )
    }));
  };

  const total = formData.items.reduce((sum, item) => sum + toNum(item.amount), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{bill ? 'Edit Bill' : 'Create New Bill'}</h2>
                <p className="text-blue-100">{bill ? 'Update bill details' : 'Generate a new bill for shop'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors" disabled={isLoading}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">{errors.submit}</div>}

          {/* Bill Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Shop *</label>
              <select
                value={formData.shopId}
                onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.shopId ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                disabled={isLoading || !!bill}
              >
                <option value="">Choose a shop</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name} - {s.owner}</option>)}
              </select>
              {errors.shopId && <p className="mt-1 text-sm text-red-600">{errors.shopId}</p>}
            </div>

            {/* Bill Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number *</label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
                placeholder="Enter bill number"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.billNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              {errors.billNumber && <p className="mt-1 text-sm text-red-600">{errors.billNumber}</p>}
            </div>

            {/* Bill Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="h-4 w-4 inline mr-2" />Bill Date *</label>
              <input type="date" value={formData.billDate} onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.billDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} disabled={isLoading} />
              {errors.billDate && <p className="mt-1 text-sm text-red-600">{errors.billDate}</p>}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="h-4 w-4 inline mr-2" />Due Date *</label>
              <input type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.dueDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`} disabled={isLoading} />
              {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Bill Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bill Items</h3>
              <button type="button" onClick={addItem} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2" disabled={isLoading}>
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {errors.items && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">{errors.items}</div>}

            <div className="space-y-3">
              {formData.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <input type="text" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Item description" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={isLoading} />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input type="number" value={String(item.amount)} onChange={(e) => updateItem(item.id, 'amount', e.target.value ? parseFloat(e.target.value) : 0)} placeholder="Amount" min="0" step="0.01" className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={isLoading} />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(item.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" disabled={isLoading}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">₹{toNum(total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors" disabled={isLoading}>Cancel</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? 'Saving...' : bill ? 'Update Bill' : 'Create Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
