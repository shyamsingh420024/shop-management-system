# 🏪 Shop Management System

A full-stack **Shop Management System** built with **React (Vite + TypeScript)** and **Node.js (Express + Prisma + MySQL)**.  
This project helps manage shops, bills, payments, and family finances through a clean and intuitive dashboard interface.

---

## ⚙️ Database Configuration (Prisma + MySQL)

### 1️⃣ Configure Prisma
In your `server/.env` file:
```env
DATABASE_URL="mysql://root:@localhost:3306/shop_management"

2️⃣ Apply Prisma Migrations

npx prisma migrate dev --name init
npx prisma generate

🚀 Running the Project Locally
🧩 1. Start Backend (Server)

cd server
npm install
npm run dev

Server runs on http://localhost:3001

💻 2. Start Frontend (React App)
Open another terminal:

cd shop-managment-system
npm install
npm run dev

Frontend runs on http://localhost:5173

🔗 API Configuration

Make sure your frontend connects to the backend.
In shop-managment-system/src/context/ShopContext.tsx, confirm:

const API_URL = 'http://localhost:3001/api';

🧭 API Endpoints Reference
🏬 Shop Routes
Method	Endpoint	Description
GET	/api/shops	Get all shops
POST	/api/shops	Create a new shop
PUT	/api/shops/:id	Update shop details
DELETE	/api/shops/:id	Delete a shop and related data

🧾 Bill Routes
Method	Endpoint	Description
GET	/api/bills	Get all bills
POST	/api/bills	Add a new bill
PUT	/api/bills/:id	Update a bill
DELETE	/api/bills/:id	Delete a bill and its payments

💰 Payment Routes
Method	Endpoint	Description
GET	/api/payments	Get all payments
POST	/api/payments	Add a payment (updates related bill)
DELETE	/api/payments/:id	Delete a payment (updates related bill)

👨‍👩‍👧 Family Members
Method	Endpoint	Description
GET	/api/family-members	Get all family members
POST	/api/family-members	Add a family member
PUT	/api/family-members/:id	Update member info
DELETE	/api/family-members/:id	Delete a family member

🏠 Family Expenses
Method	Endpoint	Description
GET	/api/family-expenses	Get all expenses
POST	/api/family-expenses	Add a new expense
PUT	/api/family-expenses/:id	Update expense
DELETE	/api/family-expenses/:id	Delete expense

💵 Family Income
Method	Endpoint	Description
GET	/api/family-income	Get all income records
POST	/api/family-income	Add a new income
PUT	/api/family-income/:id	Update income
DELETE	/api/family-income/:id	Delete income

🏦 Bank Deposits
Method	Endpoint	Description
GET	/api/bank-deposits	Get all deposits
POST	/api/bank-deposits	Add a new deposit
PUT	/api/bank-deposits/:id	Update deposit
DELETE	/api/bank-deposits/:id	Delete deposit

📊 Key Features

✅ Manage multiple shops & track rent and bills

✅ Generate printable bills with late payment penalties

✅ Track payments by method (cash / online / account)

✅ Record family income & expenses

✅ Manage family members and activity status

✅ Add bank deposits & financial summaries

✅ Clean, responsive dashboard UI

⚙️ Environment Variables
/server/.env
DATABASE_URL="mysql://root:@localhost:3306/shop_management"
PORT=3001

/shop-managment-system/.env
VITE_API_URL="http://localhost:3001/api"

💾 Useful Commands
Command	Description
npx prisma studio	Open Prisma database UI
npx prisma migrate dev	Apply database migrations
npm run dev	Start development server
npm run build	Build production version
git add . && git commit -m "msg"	Commit changes

👨‍💻 Author

Shyam Singh
🎓 MCA Student | 💻 Full Stack Developer
🔗 GitHub Profile

⚠️ Disclaimer

This project is for academic and educational purposes only.
Not intended for production use.

🏁 Summary

✅ React + Node.js full-stack application
✅ MySQL handled through Prisma ORM
✅ Fully working backend REST API
✅ Can be run locally via XAMPP
✅ Clean architecture ready for future expansion