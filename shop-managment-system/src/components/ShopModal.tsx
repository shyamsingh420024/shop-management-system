import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { Shop } from '../types/types';
import { X, Store, User, Phone, MapPin, DollarSign, Zap, Calendar, TrendingUp } from 'lucide-react';

interface ShopModalProps {
  shop: Shop | null;
  onClose: () => void;
}

export function ShopModal({ shop, onClose }: ShopModalProps) {
  const { addShop, updateShop } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    phone: '',
    address: '',
    monthlyRent: '',
    electricityRate: '500',
    rentStartDate: new Date().toISOString().split('T')[0],
    yearlyIncreasePercentage: '10',
  });

  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name ?? '',
        owner: shop.owner ?? '',
        phone: shop.phone ?? '',
        address: shop.address ?? '',
        monthlyRent: shop.monthlyRent !== undefined ? String(shop.monthlyRent) : '',
        electricityRate: shop.electricityRate !== undefined ? String(shop.electricityRate) : '500',
        rentStartDate: shop.rentStartDate ? new Date(shop.rentStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        yearlyIncreasePercentage: (shop.yearlyIncreasePercentage ?? 10).toString(),
      });
    } else {
      // Reset form for new shop
      setFormData({
        name: '',
        owner: '',
        phone: '',
        address: '',
        monthlyRent: '',
        electricityRate: '500',
        rentStartDate: new Date().toISOString().split('T')[0],
        yearlyIncreasePercentage: '10',
      });
    }
  }, [shop]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const phoneDigits = formData.phone.replace(/\D/g, '').trim();

    if (!formData.name.trim()) {
      newErrors.name = 'Shop name is required';
    }
    if (!formData.owner.trim()) {
      newErrors.owner = 'Owner name is required';
    }
    if (!phoneDigits) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phoneDigits)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.monthlyRent || Number.isNaN(Number(formData.monthlyRent)) || parseFloat(formData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Monthly rent must be greater than 0';
    }
    if (formData.electricityRate === '' || Number.isNaN(Number(formData.electricityRate)) || parseFloat(formData.electricityRate) < 0) {
      newErrors.electricityRate = 'Electricity rate must be 0 or greater';
    }
    if (!formData.rentStartDate) {
      newErrors.rentStartDate = 'Rent start date is required';
    }
    if (formData.yearlyIncreasePercentage === '' || Number.isNaN(Number(formData.yearlyIncreasePercentage)) || parseFloat(formData.yearlyIncreasePercentage) < 0) {
      newErrors.yearlyIncreasePercentage = 'Yearly increase percentage must be 0 or greater';
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
      const shopData = {
        name: formData.name.trim(),
        owner: formData.owner.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        monthlyRent: parseFloat(formData.monthlyRent),
        electricityRate: parseFloat(formData.electricityRate),
        rentStartDate: new Date(formData.rentStartDate),
        yearlyIncreasePercentage: parseFloat(formData.yearlyIncreasePercentage),
        lastRentUpdate: new Date(formData.rentStartDate),
      };

      // await in case addShop/updateShop are async (safer)
      if (shop) {
        await updateShop(shop.id, shopData);
      } else {
        await addShop(shopData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving shop:', error);
      setErrors({ submit: 'Failed to save shop. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear single-field error when user edits it
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {shop ? 'Edit Shop' : 'Add New Shop'}
                </h2>
                <p className="text-blue-100">
                  {shop ? 'Update shop details' : 'Enter shop information'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              disabled={isLoading}
              type="button"
              aria-label="Close shop modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg" role="alert">
              {errors.submit}
            </div>
          )}

          {/* Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Store className="h-4 w-4 inline mr-2" />
              Shop Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter shop name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Owner Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Owner Name *
            </label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => handleChange('owner', e.target.value)}
              placeholder="Enter owner name"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.owner ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.owner}
            />
            {errors.owner && <p className="mt-1 text-sm text-red-600">{errors.owner}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Enter phone number"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter complete address"
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              aria-invalid={!!errors.address}
            />
            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
          </div>

          {/* Monthly Rent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-2" />
              Monthly Rent (₹) *
            </label>
            <input
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => handleChange('monthlyRent', e.target.value)}
              placeholder="Enter exact amount (e.g., 11529)"
              min="0"
              step="1"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.monthlyRent ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.monthlyRent}
            />
            {errors.monthlyRent && <p className="mt-1 text-sm text-red-600">{errors.monthlyRent}</p>}
            <p className="mt-1 text-xs text-gray-500">You can enter any exact amount like ₹11,529 or ₹15,750</p>
          </div>

          {/* Electricity Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Zap className="h-4 w-4 inline mr-2" />
              Default Electricity Bill (₹)
            </label>
            <input
              type="number"
              value={formData.electricityRate}
              onChange={(e) => handleChange('electricityRate', e.target.value)}
              placeholder="Enter exact amount (e.g., 1250)"
              min="0"
              step="1"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.electricityRate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.electricityRate}
            />
            {errors.electricityRate && <p className="mt-1 text-sm text-red-600">{errors.electricityRate}</p>}
            <p className="mt-1 text-xs text-gray-500">Enter the typical monthly electricity bill amount</p>
          </div>

          {/* Rent Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Rent Start Date *
            </label>
            <input
              type="date"
              value={formData.rentStartDate}
              onChange={(e) => handleChange('rentStartDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.rentStartDate ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.rentStartDate}
            />
            {errors.rentStartDate && <p className="mt-1 text-sm text-red-600">{errors.rentStartDate}</p>}
            <p className="mt-1 text-xs text-gray-500">Date when rent agreement started (for automatic yearly increase)</p>
          </div>

          {/* Yearly Increase Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Yearly Rent Increase (%) *
            </label>
            <input
              type="number"
              value={formData.yearlyIncreasePercentage}
              onChange={(e) => handleChange('yearlyIncreasePercentage', e.target.value)}
              placeholder="Enter percentage (e.g., 10)"
              min="0"
              step="0.1"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.yearlyIncreasePercentage ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              disabled={isLoading}
              autoComplete="off"
              aria-invalid={!!errors.yearlyIncreasePercentage}
            />
            {errors.yearlyIncreasePercentage && <p className="mt-1 text-sm text-red-600">{errors.yearlyIncreasePercentage}</p>}
            <p className="mt-1 text-xs text-gray-500">Automatic rent increase percentage every 11 months (e.g., 10% means ₹10,000 becomes ₹11,000)</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                shop ? 'Update Shop' : 'Add Shop'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
