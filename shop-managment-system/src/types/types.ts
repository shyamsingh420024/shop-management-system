export interface Shop {
  id: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  monthlyRent: number;
  electricityRate: number;
  createdAt: Date;
  
  // --- These fields are now required ---
  rentStartDate: Date; 
  lastRentUpdate: Date;
  yearlyIncreasePercentage: number;
}

export interface BillItem {
  id: string;
  description: string;
  amount: number;
}

export interface Bill {
  id: string;
  shopId: string;
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  items: BillItem[];
  total: number;
  paid: number;
  remaining: number;
  status: 'pending' | 'partial' | 'paid';
  createdAt: Date;
}

export interface Payment {
  id: string;
  billId?: string;
  shopId: string;
  amount: number;
  method: 'cash' | 'online' | 'family_account';
  reference?: string;
  notes?: string;
  date: Date;
  isAdvance: boolean;
  createdAt: Date;
}

export interface FamilyExpense {
  id: string;
  category: 'groceries' | 'food' | 'online_shopping' | 'recharge' | 'petrol' | 'travel' | 'electricity' | 'medical' | 'education' | 'clothing' | 'entertainment' | 'makeup' | 'insurance' | 'tax' | 'repairing' | 'gym' | 'other';
  description?: string;
  amount: number;
  date: Date;
  paidBy: string;
  paymentMethod: 'cash' | 'online' | 'family_account' | 'personal_account';
  createdAt: Date;
}

export interface FamilyIncome {
  id: string;
  source: 'job' | 'business' | 'freelance' | 'investment' | 'rental' | 'other';
  description?: string;
  amount: number;
  date: Date;
  receivedBy: string;
  paymentMethod: 'cash' | 'online' | 'family_account' | 'personal_account';
  createdAt: Date;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'self' | 'father' | 'mother' | 'spouse' | 'brother' | 'sister' | 'son' | 'daughter' | 'child' | 'other';
  isActive: boolean;
  createdAt: Date;
}

export interface BankDeposit {
  id: string;
  amount: number;
  fromAccount: 'cash' | 'online' | 'personal_account';
  bankName: string;
  description?: string;
  date: Date;
  createdAt: Date;
}

export interface PenaltyInfo {
  hasPenalty: boolean;
  penaltyAmount: number;
  overdueDays: number;
  warningMessage: string;
  warningType: 'none' | 'upcoming' | 'overdue' | 'penalty';
}