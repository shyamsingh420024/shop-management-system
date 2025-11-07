import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Shop } from '../types/types';
import { 
  Store, 
  Phone, 
  MapPin, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Receipt,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { calculatePenalty } from '../utils/penaltyUtils';
import { PaymentModal } from './PaymentModal';

interface ShopCardProps {
  shop: Shop;
}

export function ShopCard({ shop }: ShopCardProps) {
  const { bills, payments } = useShop();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // --- Helper to coerce amounts reliably to numbers ---
  const toNum = (v: any): number => {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const shopBills = bills.filter(bill => bill.shopId === shop.id);
  const shopPayments = payments.filter(payment => payment.shopId === shop.id);
  
  // Calculate outstanding - only last bill's due
  const pendingBills = shopBills.filter(bill => toNum(bill.remaining) > 0);

  const totalOutstanding = pendingBills.length > 0
    ? [...pendingBills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())[0].remaining
      ? toNum([...pendingBills].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime())[0].remaining)
      : 0
    : 0;

  const totalPaid = shopPayments
    .filter(payment => !payment.isAdvance)
    .reduce((sum, payment) => sum + toNum(payment.amount), 0);

  const totalAdvances = shopPayments
    .filter(payment => payment.isAdvance)
    .reduce((sum, payment) => sum + toNum(payment.amount), 0);

  // Get penalty information for the oldest unpaid bill (by dueDate)
  const oldestUnpaidBill = [...shopBills]
    .filter(bill => toNum(bill.remaining) > 0)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const penaltyInfo = oldestUnpaidBill ? calculatePenalty(oldestUnpaidBill) : null;

  const handleQuickPayment = () => {
    setIsPaymentModalOpen(true);
  };

  // Get status for the shop based on bills
  const getShopStatus = () => {
    if (toNum(totalOutstanding) === 0) {
      return {
        type: 'success' as const,
        icon: CheckCircle,
        message: 'All Clear ✅',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
    
    if (penaltyInfo && (penaltyInfo.warningType === 'penalty' || penaltyInfo.warningType === 'overdue')) {
      return {
        type: 'urgent' as const,
        icon: AlertCircle,
        message: 'Payment Due',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
    
    return {
      type: 'pending' as const,
      icon: AlertCircle,
      message: 'Payment Pending',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    };
  };

  const status = getShopStatus();
  const StatusIcon = status.icon;

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{shop.name}</h3>
                <p className="text-blue-100 text-sm">{shop.owner}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs">Monthly</p>
              <p className="text-lg font-bold">₹{toNum(shop.monthlyRent).toLocaleString()}</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${status.bgColor} ${status.color} border ${status.borderColor}`}>
            <StatusIcon className="h-3 w-3" />
            <span>{status.message}</span>
          </div>
        </div>

        {/* Compact Contact Info */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center text-gray-600 text-sm">
              <Phone className="h-3 w-3 mr-2 text-green-600" />
              <span>{shop.phone || '-'}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="h-3 w-3 mr-2 text-red-600" />
              <span className="truncate">{shop.address || '-'}</span>
            </div>
          </div>
        </div>

        {/* Compact Financial Summary */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Outstanding */}
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="h-4 w-4 text-orange-600" />
                {toNum(totalOutstanding) > 0 && (
                  <div className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-bold">
                    !
                  </div>
                )}
              </div>
              <p className="text-xs text-orange-600 font-medium">Outstanding</p>
              <p className="text-lg font-bold text-orange-700">₹{toNum(totalOutstanding).toLocaleString()}</p>
            </div>
            
            {/* Collected */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <div className="flex items-center justify-between mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                {toNum(totalPaid) > 0 && (
                  <div className="bg-green-500 text-white text-xs px-1 py-0.5 rounded-full font-bold">
                    ✓
                  </div>
                )}
              </div>
              <p className="text-xs text-green-600 font-medium">Collected</p>
              <p className="text-lg font-bold text-green-700">₹{toNum(totalPaid).toLocaleString()}</p>
            </div>
            
            {/* Advances */}
            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between mb-1">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-600 font-bold">₹{toNum(totalAdvances).toLocaleString()}</span>
              </div>
              <p className="text-xs text-purple-600 font-medium">Advances</p>
            </div>
            
            {/* Bills Count */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between mb-1">
                <Receipt className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-600 font-bold">{shopBills.length}</span>
              </div>
              <p className="text-xs text-blue-600 font-medium">Total Bills</p>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleQuickPayment}
            className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg ${
              toNum(totalOutstanding) > 0
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">
                {toNum(totalOutstanding) > 0 ? 'Make Payment' : 'Add Payment'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal 
          onClose={() => setIsPaymentModalOpen(false)}
          preSelectedShopId={shop.id}
        />
      )}
    </>
  );
}
