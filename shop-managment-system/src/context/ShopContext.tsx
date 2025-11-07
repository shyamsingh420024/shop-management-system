import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { 
  Shop, 
  Bill, 
  Payment, 
  FamilyExpense, 
  FamilyIncome, 
  FamilyMember, 
  BankDeposit 
} from '../types/types';

// Define the URL of your backend server
const API_URL = 'http://localhost:3001/api';

// --- Interface defines all functions and state ---
interface ShopContextType {
  shops: Shop[];
  bills: Bill[];
  payments: Payment[];
  familyExpenses: FamilyExpense[];
  familyIncome: FamilyIncome[];
  familyMembers: FamilyMember[];
  bankDeposits: BankDeposit[];
  
  // All our functions
  addShop: (shop: Omit<Shop, 'id' | 'createdAt'>) => Promise<void>;
  updateShop: (id: string, shop: Partial<Shop>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;
  
  addBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => Promise<void>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
  
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  
  addFamilyExpense: (expense: Omit<FamilyExpense, 'id' | 'createdAt'>) => Promise<void>;
  updateFamilyExpense: (id: string, expense: Partial<FamilyExpense>) => Promise<void>;
  deleteFamilyExpense: (id: string) => Promise<void>;
  
  addFamilyIncome: (income: Omit<FamilyIncome, 'id' | 'createdAt'>) => Promise<void>;
  updateFamilyIncome: (id: string, income: Partial<FamilyIncome>) => Promise<void>;
  deleteFamilyIncome: (id: string) => Promise<void>;
  
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'createdAt'>) => Promise<void>;
  updateFamilyMember: (id: string, member: Partial<FamilyMember>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  
  addBankDeposit: (deposit: Omit<BankDeposit, 'id' | 'createdAt'>) => Promise<void>;
  updateBankDeposit: (id: string, deposit: Partial<BankDeposit>) => Promise<void>;
  deleteBankDeposit: (id: string) => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  // --- State for ALL data ---
  const [shops, setShops] = useState<Shop[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [familyExpenses, setFamilyExpenses] = useState<FamilyExpense[]>([]);
  const [familyIncome, setFamilyIncome] = useState<FamilyIncome[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [bankDeposits, setBankDeposits] = useState<BankDeposit[]>([]);

  // --- Load ALL data from backend on app start ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [
          shopsRes, 
          familyMembersRes, 
          familyExpensesRes, 
          familyIncomeRes, 
          bankDepositsRes,
          billsRes, 
          paymentsRes 
        ] = await Promise.all([
          axios.get(`${API_URL}/shops`),
          axios.get(`${API_URL}/family-members`),
          axios.get(`${API_URL}/family-expenses`),
          axios.get(`${API_URL}/family-income`),
          axios.get(`${API_URL}/bank-deposits`),
          axios.get(`${API_URL}/bills`), 
          axios.get(`${API_URL}/payments`), 
        ]);

        setShops(shopsRes.data);
        setFamilyMembers(familyMembersRes.data);
        setFamilyExpenses(familyExpensesRes.data);
        setFamilyIncome(familyIncomeRes.data);
        setBankDeposits(bankDepositsRes.data);
        setBills(billsRes.data); 
        setPayments(paymentsRes.data); 

      } catch (error) {
        console.error("Failed to fetch data from backend:", error);
      }
    };

    fetchAllData();
  }, []); 

  // ----------------------------------------------------
  // --- 1. SHOP FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addShop = async (shopData: Omit<Shop, 'id' | 'createdAt'>) => {
    try {
      // This payload must match the robust backend `app.post('/api/shops')`
      const payload = {
        ...shopData,
        // Ensure all fields are present to avoid backend 500 errors
        monthlyRent: shopData.monthlyRent || 0,
        electricityRate: shopData.electricityRate || 0,
        yearlyIncreasePercentage: shopData.yearlyIncreasePercentage || 10,
        rentStartDate: shopData.rentStartDate || new Date().toISOString(),
      };
      
      const response = await axios.post(`${API_URL}/shops`, payload);
      setShops(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add shop:", error);
    }
  };
  
  const updateShop = async (id: string, shopData: Partial<Shop>) => {
    try {
      const response = await axios.put(`${API_URL}/shops/${id}`, shopData);
      setShops(prev => prev.map(s => (s.id === id ? response.data : s)));
    } catch (error) {
      console.error("Failed to update shop:", error);
    }
  };

  const deleteShop = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shop? This is permanent.')) return;
    try {
      await axios.delete(`${API_URL}/shops/${id}`);
      setShops(prev => prev.filter(s => s.id !== id));
      setBills(prev => prev.filter(bill => bill.shopId !== id));
      setPayments(prev => prev.filter(payment => payment.shopId !== id));
    } catch (error) {
      console.error("Failed to delete shop:", error);
    }
  };

  // ----------------------------------------------------
  // --- 2. BILL FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addBill = async (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post(`${API_URL}/bills`, billData);
      setBills(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add bill:", error);
    }
  };

  const deleteBill = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this bill? This will also delete ALL associated payments.')) return;
      await axios.delete(`${API_URL}/bills/${id}`);
      setBills(prev => prev.filter(b => b.id !== id));
      setPayments(prev => prev.filter(p => p.billId !== id));
    } catch (error) {
      console.error("Failed to delete bill:", error);
    }
  };
  
  const updateBill = async (id: string, billData: Partial<Bill>) => { 
    try {
      const response = await axios.put(`${API_URL}/bills/${id}`, billData);
      setBills(prev => prev.map(b => (b.id === id ? response.data : b)));
    } catch (error) {
      console.error("Failed to update bill:", error);
    }
  };

  // ----------------------------------------------------
  // --- 3. PAYMENT FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    try {
      // Backend returns { newPayment, updatedBill }
      const response = await axios.post(`${API_URL}/payments`, paymentData);
      const { newPayment, updatedBill } = response.data;
      
      setPayments(prev => [newPayment, ...prev]);
      
      // Update the bill in state if one was updated
      if (updatedBill) {
        setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
      }
    } catch (error) {
      console.error("Failed to add payment:", error);
    }
  };
  
  const deletePayment = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this payment?')) return;
      // Backend returns { updatedBill }
      const response = await axios.delete(`${API_URL}/payments/${id}`);
      const { updatedBill } = response.data;

      setPayments(prev => prev.filter(p => p.id !== id));

      if (updatedBill) {
        setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
      }
    } catch (error) {
      console.error("Failed to delete payment:", error);
    }
  };
  
  const updatePayment = async (id: string, paymentData: Partial<Payment>) => { 
    console.log("Update payment logic is complex and needs specific backend support.", id, paymentData);
    // This function is complex because it would also need to reverse/re-apply bill logic
    // We will leave this as a TODO for now.
  };

  // ----------------------------------------------------
  // --- 4. FAMILY EXPENSE FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addFamilyExpense = async (expenseData: Omit<FamilyExpense, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post(`${API_URL}/family-expenses`, expenseData);
      setFamilyExpenses(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add family expense:", error);
    }
  };
  
  const deleteFamilyExpense = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this expense?')) return;
      await axios.delete(`${API_URL}/family-expenses/${id}`);
      setFamilyExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error("Failed to delete family expense:", error);
    }
  };
  
  const updateFamilyExpense = async (id: string, expenseData: Partial<FamilyExpense>) => { 
    try {
      const response = await axios.put(`${API_URL}/family-expenses/${id}`, expenseData);
      setFamilyExpenses(prev => prev.map(e => (e.id === id ? response.data : e)));
    } catch (error) {
      console.error("Failed to update family expense:", error);
    }
  };

  // ----------------------------------------------------
  // --- 5. FAMILY INCOME FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addFamilyIncome = async (incomeData: Omit<FamilyIncome, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post(`${API_URL}/family-income`, incomeData);
      setFamilyIncome(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add family income:", error);
    }
  };
  
  const deleteFamilyIncome = async (id: string) => {
    try {
      if (!confirm('Are you sure you want to delete this income?')) return;
      await axios.delete(`${API_URL}/family-income/${id}`);
      setFamilyIncome(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error("Failed to delete family income:", error);
    }
  };
  
  const updateFamilyIncome = async (id: string, incomeData: Partial<FamilyIncome>) => { 
    try {
      const response = await axios.put(`${API_URL}/family-income/${id}`, incomeData);
      setFamilyIncome(prev => prev.map(i => (i.id === id ? response.data : i)));
    } catch (error) {
      console.error("Failed to update family income:", error);
    }
  };

  // ----------------------------------------------------
  // --- 6. FAMILY MEMBER FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addFamilyMember = async (memberData: Omit<FamilyMember, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post(`${API_URL}/family-members`, memberData);
      setFamilyMembers(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add family member:", error);
    }
  };
  
  const updateFamilyMember = async (id: string, memberData: Partial<FamilyMember>) => { 
    try {
      const response = await axios.put(`${API_URL}/family-members/${id}`, memberData);
      setFamilyMembers(prev => prev.map(m => (m.id === id ? response.data : m)));
    } catch (error) {
      console.error("Failed to update family member:", error);
    }
  };
  
  const deleteFamilyMember = async (id: string) => { 
    try {
        if (!confirm('Are you sure you want to delete this family member?')) return;
        await axios.delete(`${API_URL}/family-members/${id}`); 
        setFamilyMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
        console.error("Failed to delete family member:", error);
    }
  };

  // ----------------------------------------------------
  // --- 7. BANK DEPOSIT FUNCTIONS (Complete) ---
  // ----------------------------------------------------
  const addBankDeposit = async (depositData: Omit<BankDeposit, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post(`${API_URL}/bank-deposits`, depositData);
      setBankDeposits(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add bank deposit:", error);
    }
  };
  
  const updateBankDeposit = async (id: string, depositData: Partial<BankDeposit>) => { 
    try {
      const response = await axios.put(`${API_URL}/bank-deposits/${id}`, depositData);
      setBankDeposits(prev => prev.map(d => (d.id === id ? response.data : d)));
    } catch (error) {
      console.error("Failed to update bank deposit:", error);
    }
  };
  
  const deleteBankDeposit = async (id: string) => { 
    try {
        if (!confirm('Are you sure you want to delete this bank deposit?')) return;
        await axios.delete(`${API_URL}/bank-deposits/${id}`);
        setBankDeposits(prev => prev.filter(d => d.id !== id));
    } catch (error) {
        console.error("Failed to delete bank deposit:", error);
    }
  };

  // --- Value provided to context ---
  const value = {
    shops, bills, payments, familyExpenses, familyIncome, familyMembers, bankDeposits,
    addShop, updateShop, deleteShop,
    addBill, updateBill, deleteBill,
    addPayment, updatePayment, deletePayment,
    addFamilyExpense, updateFamilyExpense, deleteFamilyExpense,
    addFamilyIncome, updateFamilyIncome, deleteFamilyIncome,
    addFamilyMember, updateFamilyMember, deleteFamilyMember,
    addBankDeposit, updateBankDeposit, deleteBankDeposit,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

// --- Custom Hook ---
export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}