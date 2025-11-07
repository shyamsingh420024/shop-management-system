import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Bill } from '../types/types';
import { Plus, Receipt, Search, Filter, Printer, CreditCard as Edit, Trash2 } from 'lucide-react';
import { BillModal } from './BillModal';
import { BillPrint } from './BillPrint';
import { calculatePenalty } from '../utils/penaltyUtils';

export function BillManagement() {
  const { bills, shops, deleteBill } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [printingBill, setPrintingBill] = useState<Bill | null>(null);

  // helper to coerce numeric-like values into numbers safely
  const toNum = (v: any): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (v == null) return 0;
    const cleaned = String(v).replace(/,/g, '').trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  const filteredBills = bills.filter(bill => {
    const shop = shops.find(s => s.id === bill.shopId);
    const billNumber = (bill.billNumber ?? '').toString();
    const shopName = shop?.name ?? '';
    const shopOwner = shop?.owner ?? '';

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      billNumber.toLowerCase().includes(normalizedSearch) ||
      shopName.toLowerCase().includes(normalizedSearch) ||
      shopOwner.toLowerCase().includes(normalizedSearch);

    const matchesStatus = filterStatus === 'all' || bill.status === filterStatus;
    const matchesShop = filterShop === 'all' || bill.shopId === filterShop;

    return matchesSearch && matchesStatus && matchesShop;
  });

  // clone before sorting to avoid mutating original array in store
  const sortedBills = [...filteredBills].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddBill = () => {
    setEditingBill(null);
    setIsModalOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handleDeleteBill = (billId: string) => {
    if (confirm('Are you sure you want to delete this bill? This action cannot be undone.')) {
      deleteBill(billId);
    }
  };

  const handlePrintBill = (bill: Bill) => {
    setPrintingBill(bill);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-red-100', text: 'text-red-800', label: 'Pending' },
      partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Partial' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' }
    };

    const config = statusConfig[status] ?? { bg: 'bg-gray-100', text: 'text-gray-800', label: status ?? 'Unknown' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bill Management</h1>
          <p className="text-gray-600 mt-1">Create and manage shop bills</p>
        </div>
        <button
          onClick={handleAddBill}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bills, shops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
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
              setFilterStatus('all');
              setFilterShop('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Bills List */}
      {sortedBills.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bills Found</h3>
          <p className="text-gray-500 mb-6">
            {bills.length === 0
              ? 'Start by creating your first bill'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {bills.length === 0 && (
            <button
              onClick={handleAddBill}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Create Your First Bill
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedBills.map((bill) => {
                  const shop = shops.find(s => s.id === bill.shopId);
                  const penaltyInfo = calculatePenalty(bill);

                  return (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{bill.billNumber}</div>
                          <div className="text-sm text-gray-500">{new Date(bill.billDate).toLocaleDateString('en-IN')}</div>
                          <div className="text-xs text-gray-400">Due: {new Date(bill.dueDate).toLocaleDateString('en-IN')}</div>

                          {penaltyInfo?.hasPenalty && (
                            <div className="text-xs text-red-600 font-medium">
                              Penalty: ₹{toNum(penaltyInfo.penaltyAmount).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{shop?.name ?? '-'}</div>
                          <div className="text-sm text-gray-500">{shop?.owner ?? '-'}</div>
                          <div className="text-xs text-gray-400">{shop?.phone ?? '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">₹{toNum(bill.total).toLocaleString()}</div>
                          <div className="text-sm text-green-600">Paid: ₹{toNum(bill.paid).toLocaleString()}</div>
                          <div className="text-sm text-red-600">Due: ₹{toNum(bill.remaining).toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(bill.status)}
                        {penaltyInfo && penaltyInfo.warningType !== 'none' && (
                          <div className={`mt-1 text-xs px-2 py-1 rounded ${
                            penaltyInfo.warningType === 'penalty' ? 'bg-red-100 text-red-700' :
                            penaltyInfo.warningType === 'overdue' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {toNum(penaltyInfo.overdueDays)} days overdue
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePrintBill(bill)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Print Bill"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditBill(bill)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Bill"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBill(bill.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Bill"
                          >
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

      {/* Modals */}
      {isModalOpen && (
        <BillModal
          bill={editingBill}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBill(null);
          }}
        />
      )}

      {printingBill && (
        <BillPrint
          bill={printingBill}
          onClose={() => setPrintingBill(null)}
        />
      )}
    </div>
  );
}
