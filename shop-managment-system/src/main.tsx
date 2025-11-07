// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShopProvider } from './context/ShopContext.tsx'; // <-- 1. IMPORT IT HERE

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShopProvider> {/* <-- 2. WRAP YOUR APP HERE */}
      <App />
    </ShopProvider>
  </StrictMode>
);