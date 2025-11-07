import express from 'express';
import cors from 'cors';
// Import Prisma and the Decimal type
import { PrismaClient, Prisma } from '@prisma/client';

// Initialize Prisma Client and Express
const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors({
  // Allow connections from the specific frontend ports you use
  origin: [
    'http://localhost:5173', // Your current running frontend port
    'http://localhost:5174', // If Vite ever switches port
    'http://localhost:3000', // Common React port
  ],
  credentials: true, // Needed for cookies/sessions, good practice
})); 
app.use(express.json());

// --- API Endpoints ---

// Test route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from your backend!" });
});

// ----------------------------------------------------
// --- 1. SHOP ENDPOINTS ---
// ----------------------------------------------------

// GET all shops
app.get('/api/shops', async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

// POST (create) a new shop - FIXED
app.post('/api/shops', async (req, res) => {
  try {
    const { 
      name, owner, phone, address, monthlyRent, electricityRate, 
      rentStartDate, yearlyIncreasePercentage 
    } = req.body;
    
    // --- 1. SAFE DATA PREPARATION ---
    const safeName = name || 'Unnamed Shop';
    const safeOwner = owner || 'Unknown Owner';
    const safePhone = phone || '0000000000';
    const safeAddress = address || 'No Address';

    // Pass strings directly to Prisma for Decimal fields
    const safeMonthlyRent = monthlyRent || '0';
    const safeElectricityRate = electricityRate || '0';
    const safeIncreasePercentage = yearlyIncreasePercentage || '0';

    // Safely parse Date, falling back to a new Date() if invalid or empty
    let safeStartDate = new Date(); 
    if (rentStartDate) {
      const parsedDate = new Date(rentStartDate);
      if (!isNaN(parsedDate.getTime())) {
        safeStartDate = parsedDate; // Use parsed date if valid
      }
    }
    
    // 2. DATABASE WRITE
    const newShop = await prisma.shop.create({
      data: {
        name: safeName,
        owner: safeOwner,
        phone: safePhone,
        address: safeAddress,
        monthlyRent: safeMonthlyRent, // Pass string
        electricityRate: safeElectricityRate, // Pass string
        yearlyIncreasePercentage: safeIncreasePercentage, // Pass string
        rentStartDate: safeStartDate,
        lastRentUpdate: safeStartDate, 
      },
    });
    
    res.status(201).json(newShop);
  } catch (error) {
    console.error("PRISMA SHOP CREATION FAILED:", error); 
    // @ts-ignore
    if (error.code === 'P2002') {
         return res.status(409).json({ error: 'A shop with this name or phone number already exists.' });
    }

    res.status(500).json({ error: 'Failed to create shop due to unhandled server error.' });
  }
});

// PUT (update) a shop - FIXED
app.put('/api/shops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, owner, phone, address, monthlyRent, electricityRate } = req.body;

    const updatedShop = await prisma.shop.update({
      where: { id: id },
      data: {
        name,
        owner,
        phone,
        address,
        monthlyRent: monthlyRent || '0', // Pass string
        electricityRate: electricityRate || '0', // Pass string
      },
    });
    res.json(updatedShop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

// DELETE a shop
app.delete('/api/shops/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // We must delete related items in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete payments related to bills of this shop
      await tx.payment.deleteMany({
        where: { bill: { shopId: id } }
      });
      // Delete payments made directly to the shop (advance payments)
      await tx.payment.deleteMany({
        where: { shopId: id, billId: null }
      });
      // Delete bills of this shop
      await tx.bill.deleteMany({
        where: { shopId: id }
      });
      // Finally, delete the shop
      await tx.shop.delete({
        where: { id: id },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete shop:", error);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

// ----------------------------------------------------
// --- 2. BILL ENDPOINTS ---
// ----------------------------------------------------

// GET all bills
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { billDate: 'desc' },
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// POST (create) a new bill - FIXED
app.post('/api/bills', async (req, res) => {
  try {
    const { total, items, ...rest } = req.body;
    const totalAmount = total || '0'; // Pass string

    const newBill = await prisma.bill.create({
      data: {
        ...rest,
        items: items || [], 
        total: totalAmount,
        paid: 0,
        remaining: totalAmount,
        status: 'pending',
      },
    });
    res.status(201).json(newBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// PUT (update) a bill - FIXED
app.put('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total, paid, remaining, status, items, ...rest } = req.body;
    
    const dataToUpdate: any = rest;
    if (total !== undefined) dataToUpdate.total = total; // Pass string
    if (paid !== undefined) dataToUpdate.paid = paid; // Pass string
    if (remaining !== undefined) dataToUpdate.remaining = remaining; // Pass string
    if (status !== undefined) dataToUpdate.status = status;
    if (items !== undefined) dataToUpdate.items = items;

    const updatedBill = await prisma.bill.update({
      where: { id: id },
      data: dataToUpdate,
    });
    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bill' });
  }
});

// DELETE a bill (and all associated payments)
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const billId = req.params.id;

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { billId: billId },
      });
      await tx.bill.delete({
        where: { id: billId },
      });
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});


// ----------------------------------------------------
// --- 3. PAYMENT ENDPOINTS (Transaction Logic) ---
// ----------------------------------------------------

// GET all payments
app.get('/api/payments', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST (create) a new payment and update bill status - FIXED
app.post('/api/payments', async (req, res) => {
  try {
    const { amount, billId, ...rest } = req.body;
    const paymentAmount = new Prisma.Decimal(amount || '0'); // Convert to Decimal

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the payment
      const newPayment = await tx.payment.create({
        data: {
          ...rest,
          billId: billId || null,
          amount: paymentAmount,
        },
      });

      // 2. If it's for a bill, update that bill
      let updatedBill = null;
      if (billId) {
        const bill = await tx.bill.findUnique({ where: { id: billId } });
        if (!bill) { throw new Error('Bill not found'); }

        // Use Decimal methods for math
        const totalPaid = bill.paid.add(paymentAmount);
        const remaining = bill.total.sub(totalPaid);
        const status = remaining.comparedTo(0) <= 0 ? 'paid' : 'partial';

        updatedBill = await tx.bill.update({
          where: { id: billId },
          data: { paid: totalPaid, remaining: remaining, status: status },
        });
      }
      
      return { newPayment, updatedBill };
    });

    res.status(201).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// DELETE a payment and reverse bill status - FIXED
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the payment we are deleting
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment) { throw new Error('Payment not found'); }

      // 2. Delete the payment
      await tx.payment.delete({ where: { id: paymentId } });

      // 3. If it was for a bill, reverse the amount on that bill
      let updatedBill = null;
      if (payment.billId) {
        const bill = await tx.bill.findUnique({ where: { id: payment.billId } });
        if (bill) {
          // Use Decimal methods for math
          const totalPaid = bill.paid.sub(payment.amount);
          const remaining = bill.total.sub(totalPaid);
          const status = totalPaid.comparedTo(0) <= 0 ? 'pending' : 'partial';

          updatedBill = await tx.bill.update({
            where: { id: payment.billId },
            data: { paid: totalPaid, remaining: remaining, status: status },
          });
        }
      }
      return { updatedBill };
    });

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});


// ----------------------------------------------------
// --- 4. FAMILY MEMBER ENDPOINTS ---
// ----------------------------------------------------

// GET all family members
app.get('/api/family-members', async (req, res) => {
  try {
    const members = await prisma.familyMember.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// POST (create) a new family member
app.post('/api/family-members', async (req, res) => {
  try {
    const newMember = await prisma.familyMember.create({ data: req.body });
    res.status(201).json(newMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create family member' });
  }
});

// PUT (update) a family member
app.put('/api/family-members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMember = await prisma.familyMember.update({
      where: { id: id },
      data: req.body,
    });
    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update family member' });
  }
});

// DELETE a family member
app.delete('/api/family-members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.familyMember.delete({
      where: { id: id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete family member' });
  }
});


// ----------------------------------------------------
// --- 5. FAMILY EXPENSE ENDPOINTS ---
// ----------------------------------------------------

// GET all expenses
app.get('/api/family-expenses', async (req, res) => {
  try {
    const expenses = await prisma.familyExpense.findMany({ orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch family expenses' });
  }
});

// POST (create) a new expense - FIXED
app.post('/api/family-expenses', async (req, res) => {
  try {
    const { amount, ...rest } = req.body;
    const newExpense = await prisma.familyExpense.create({
      data: { ...rest, amount: amount || '0' }, // Pass string
    });
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create family expense' });
  }
});

// PUT (update) a family expense - FIXED
app.put('/api/family-expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, ...rest } = req.body;
    
    const updatedExpense = await prisma.familyExpense.update({
      where: { id: id },
      data: {
        ...rest,
        amount: amount || '0', // Pass string
      },
    });
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update family expense' });
  }
});

// DELETE an expense
app.delete('/api/family-expenses/:id', async (req, res) => {
  try {
    await prisma.familyExpense.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete family expense' });
  }
});

// ----------------------------------------------------
// --- 6. FAMILY INCOME ENDPOINTS ---
// ----------------------------------------------------

// GET all income
app.get('/api/family-income', async (req, res) => {
  try {
    const income = await prisma.familyIncome.findMany({ orderBy: { date: 'desc' } });
    res.json(income);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch family income' });
  }
});

// POST (create) new income - FIXED
app.post('/api/family-income', async (req, res) => {
  try {
    const { amount, ...rest } = req.body;
    const newIncome = await prisma.familyIncome.create({
      data: { ...rest, amount: amount || '0' }, // Pass string
    });
    res.status(201).json(newIncome);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create family income' });
  }
});

// PUT (update) family income - FIXED
app.put('/api/family-income/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, ...rest } = req.body;
    
    const updatedIncome = await prisma.familyIncome.update({
      where: { id: id },
      data: {
        ...rest,
        amount: amount || '0', // Pass string
      },
    });
    res.json(updatedIncome);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update family income' });
  }
});

// DELETE income
app.delete('/api/family-income/:id', async (req, res) => {
  try {
    await prisma.familyIncome.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete family income' });
  }
});


// ----------------------------------------------------
// --- 7. BANK DEPOSIT ENDPOINTS ---
// ----------------------------------------------------

// GET all deposits
app.get('/api/bank-deposits', async (req, res) => {
  try {
    const deposits = await prisma.bankDeposit.findMany({ orderBy: { date: 'desc' } });
    res.json(deposits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bank deposits' });
  }
});

// POST (create) a new deposit - FIXED
app.post('/api/bank-deposits', async (req, res) => {
  try {
    const { amount, ...rest } = req.body;
    const newDeposit = await prisma.bankDeposit.create({
      data: { ...rest, amount: amount || '0' }, // Pass string
    });
    res.status(201).json(newDeposit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bank deposit' });
  }
});

// PUT (update) a bank deposit - FIXED
app.put('/api/bank-deposits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, ...rest } = req.body;
    
    const updatedDeposit = await prisma.bankDeposit.update({
      where: { id: id },
      data: {
        ...rest,
        amount: amount || '0', // Pass string
      },
    });
    res.json(updatedDeposit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bank deposit' });
  }
});

// DELETE a bank deposit
app.delete('/api/bank-deposits/:id', async (req, res) => {
  try {
    await prisma.bankDeposit.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete bank deposit' });
  }
});


// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});