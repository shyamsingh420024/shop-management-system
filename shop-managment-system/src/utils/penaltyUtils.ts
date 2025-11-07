import { Bill } from '../types/types';

export interface PenaltyInfo {
  hasPenalty: boolean;
  penaltyAmount: number;
  overdueDays: number;
  warningMessage: string;
  warningType: 'none' | 'upcoming' | 'overdue' | 'penalty';
}

export function calculatePenalty(bill: Bill): PenaltyInfo {
  const today = new Date();
  const dueDate = new Date(bill.dueDate);
  const timeDiff = today.getTime() - dueDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

  // If bill is fully paid, no penalty
  if (bill.remaining <= 0) {
    return {
      hasPenalty: false,
      penaltyAmount: 0,
      overdueDays: 0,
      warningMessage: '',
      warningType: 'none'
    };
  }

  // Check for upcoming due date (7 days before)
  if (daysDiff >= -7 && daysDiff < 0) {
    const daysLeft = Math.abs(daysDiff);
    return {
      hasPenalty: false,
      penaltyAmount: 0,
      overdueDays: 0,
      warningMessage: `🔔 Due date से पहले अपना payment clear कर दें। ${daysLeft} दिन बाकी हैं। धन्यवाद, आपका दिन शुभ हो! 🙏`,
      warningType: 'upcoming'
    };
  }

  // If not overdue yet
  if (daysDiff < 0) {
    return {
      hasPenalty: false,
      penaltyAmount: 0,
      overdueDays: 0,
      warningMessage: '',
      warningType: 'none'
    };
  }

  // Grace period of 30 days
  const gracePeriod = 30;
  
  if (daysDiff <= gracePeriod) {
    return {
      hasPenalty: false,
      penaltyAmount: 0,
      overdueDays: daysDiff,
      warningMessage: `⚠️ Due date के बाद payment करने पर penalty लग सकती है। कृपया जल्द से जल्द भुगतान करें। धन्यवाद, आपका दिन शुभ हो! 🙏`,
      warningType: 'overdue'
    };
  }

  // Calculate penalty after grace period
  const overdueMonths = Math.floor((daysDiff - gracePeriod) / 30) + 1;
  const penaltyRate = 0.02; // 2% per month
  const penaltyAmount = Math.round(bill.remaining * penaltyRate * overdueMonths);
  const totalDue = bill.remaining + penaltyAmount;

  return {
    hasPenalty: true,
    penaltyAmount,
    overdueDays: daysDiff,
    warningMessage: `🚨 Payment ${daysDiff} दिन से overdue है! Penalty लग गई है: ₹${penaltyAmount.toLocaleString()}। कुल देय राशि: ₹${totalDue.toLocaleString()}। कृपया तुरंत भुगतान करें। धन्यवाद! 🙏`,
    warningType: 'penalty'
  };
}