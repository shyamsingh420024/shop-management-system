import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { Shop } from '../types/types';
import {
  Plus,
  CreditCard as Edit,
  Trash2,
  Store,
  Phone,
  MapPin,
  DollarSign,
  Zap,
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ShopModal } from './ShopModal';
import { calculateRentIncrease } from '../utils/rentUtils';

export function ShopManagement() {
  const { shops, deleteShop } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const handleAddShop = () => {
    setEditingShop(null);
    setIsModalOpen(true);
  };

  const handleEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setIsModalOpen(true);
  };

  const handleDeleteShop = async (shopId: string) => {
    // confirm is global — OK to use in browser
    if (!confirm('Are you sure you want to delete this shop? This will also delete all associated bills and payments.')) return;

    try {
      // await in case deleteShop is async (harmless if synchronous)
      await deleteShop(shopId);
    } catch (err) {
      console.error('Failed to delete shop:', err);
      // you might want to show a toast / UI feedback here
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShop(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-gray-600 mt-1">Manage your shops and their details</p>
        </div>
        <button
          onClick={handleAddShop}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          type="button"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Shop</span>
        </button>
      </div>

      {/* Shops Grid */}
      {shops.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Shops Added</h3>
          <p className="text-gray-500 mb-6">Start by adding your first shop to manage bills and payments</p>
          <button
            onClick={handleAddShop}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            type="button"
          >
            Add Your First Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => {
            // Safe calculation with fallback
            type RentInfo = {
              shouldIncrease: boolean;
              newRent: number | string;
              increaseAmount: number | string;
              yearsCompleted?: number;
              nextIncreaseDate?: Date | string;
            } | null;

            let rentIncreaseInfo: RentInfo = null;
            try {
              rentIncreaseInfo = calculateRentIncrease(shop) as RentInfo;
            } catch (error) {
              console.error('Error calculating rent increase:', error);
              rentIncreaseInfo = {
                shouldIncrease: false,
                newRent: shop.monthlyRent,
                increaseAmount: 0,
                yearsCompleted: 0,
                nextIncreaseDate: new Date()
              };
            }

            // Defensive conversions when rendering numeric/date fields
            const monthlyRentNumber = Number(shop.monthlyRent) || 0;
            const electricityRateNumber = Number(shop.electricityRate) || 0;
            const yearlyIncreasePercent = shop.yearlyIncreasePercentage ?? 10;
            const nextIncreaseDate = rentIncreaseInfo?.nextIncreaseDate ? new Date(rentIncreaseInfo.nextIncreaseDate) : null;

            return (
              <div key={shop.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                {/* Shop Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{shop.name}</h3>
                        <p className="text-blue-100">{shop.owner}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditShop(shop)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                        type="button"
                        aria-label={`Edit ${shop.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShop(shop.id)}
                        className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
                        type="button"
                        aria-label={`Delete ${shop.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Rent Increase Alert */}
                  {rentIncreaseInfo && rentIncreaseInfo.shouldIncrease && (
                    <div className="mt-3 bg-yellow-500/20 border border-yellow-300/30 rounded-lg p-2">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-200" />
                        <span className="text-sm text-yellow-100">
                          Rent increase due! New rent: ₹{Number(rentIncreaseInfo.newRent).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shop Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-blue-500" />
                    <span>{shop.phone}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-3 text-red-500" />
                    <span className="truncate">{shop.address}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-3 text-green-500" />
                    <div>
                      <span>Monthly Rent: ₹{monthlyRentNumber.toLocaleString()}</span>
                      {rentIncreaseInfo && rentIncreaseInfo.shouldIncrease && (
                        <div className="text-xs text-orange-600 font-medium">
                          → New: ₹{Number(rentIncreaseInfo.newRent).toLocaleString()} (+₹{Number(rentIncreaseInfo.increaseAmount).toLocaleString()})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Zap className="h-4 w-4 mr-3 text-yellow-500" />
                    <span>Electricity: ₹{electricityRateNumber.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-3 text-purple-500" />
                    <span>Start Date: {shop.rentStartDate ? new Date(shop.rentStartDate).toLocaleDateString('en-IN') : 'Not set'}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <TrendingUp className="h-4 w-4 mr-3 text-indigo-500" />
                    <span>11-Month Increase: {yearlyIncreasePercent}%</span>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Added on {shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('en-IN') : 'Unknown'}
                    </p>
                    {rentIncreaseInfo && !rentIncreaseInfo.shouldIncrease && nextIncreaseDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        Next increase: {nextIncreaseDate.toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shop Modal */}
      {isModalOpen && (
        <ShopModal
          shop={editingShop}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
