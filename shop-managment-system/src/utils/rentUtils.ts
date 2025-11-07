import { Shop } from '../types/types';

export interface RentIncreaseInfo {
  shouldIncrease: boolean;
  newRent: number;
  increaseAmount: number;
  yearsCompleted: number;
  nextIncreaseDate: Date;
}

export function calculateRentIncrease(shop: Shop): RentIncreaseInfo {
  try {
    if (!shop || !shop.rentStartDate || !shop.lastRentUpdate || shop.yearlyIncreasePercentage === undefined) {
      console.warn('Missing required shop data for rent calculation:', {
        hasShop: !!shop,
        hasRentStartDate: !!shop?.rentStartDate,
        hasLastRentUpdate: !!shop?.lastRentUpdate,
        hasYearlyIncreasePercentage: shop?.yearlyIncreasePercentage !== undefined
      });
      return {
        shouldIncrease: false,
        newRent: shop?.monthlyRent || 0,
        increaseAmount: 0,
        yearsCompleted: 0,
        nextIncreaseDate: new Date()
      };
    }

    const today = new Date();
    const rentStartDate = shop.rentStartDate ? new Date(shop.rentStartDate) : new Date();
    const lastUpdateDate = shop.lastRentUpdate ? new Date(shop.lastRentUpdate) : rentStartDate;

    const yearsFromStart = Math.floor((today.getTime() - rentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const yearsSinceUpdate = Math.floor((today.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
    const monthsSinceUpdate = Math.floor((today.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const shouldIncrease = monthsSinceUpdate >= 11;

    let newRent = shop.monthlyRent;
    let increaseAmount = 0;

    if (shouldIncrease) {
      const periodsToIncrease = Math.floor(monthsSinceUpdate / 11);
      for (let i = 0; i < periodsToIncrease; i++) {
        const increase = newRent * (shop.yearlyIncreasePercentage / 100);
        increaseAmount += increase;
        newRent += increase;
      }
      newRent = Math.round(newRent);
      increaseAmount = Math.round(increaseAmount);
    }

    const nextIncreaseDate = new Date(rentStartDate);
    nextIncreaseDate.setMonth(rentStartDate.getMonth() + Math.floor((monthsSinceUpdate / 11) + 1) * 11);

    return {
      shouldIncrease,
      newRent,
      increaseAmount,
      yearsCompleted: yearsFromStart,
      nextIncreaseDate
    };
  } catch (error) {
    console.error('Error in calculateRentIncrease:', error);
    return {
      shouldIncrease: false,
      newRent: shop?.monthlyRent || 0,
      increaseAmount: 0,
      yearsCompleted: 0,
      nextIncreaseDate: new Date()
    };
  }
}

export function getOriginalRent(shop: Shop): number {
  const today = new Date();
  const rentStartDate = new Date(shop.rentStartDate);
  const yearsCompleted = Math.floor((today.getTime() - rentStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  
  // Calculate original rent by working backwards
  let originalRent = shop.monthlyRent;
  for (let i = 0; i < yearsCompleted; i++) {
    originalRent = originalRent / (1 + shop.yearlyIncreasePercentage / 100);
  }
  
  return Math.round(originalRent);
}