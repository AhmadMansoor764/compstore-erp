import React from "react";

import { Routes, Route, Navigate } from "react-router-dom";
import Landingpage from "./userpages/Landingpage";
import Login from "./authpages/Login";
import Signup from "./authpages/Signup";
import ForgotPassword from "./authpages/ForgotPassword";
import ResetPassword from "./authpages/ResetPassword";
import Privacy from "./privacypages/Privacy";
import Terms from "./privacypages/Terms";
import Contact from "./privacypages/Contact";
import DashboardLayout from "./userpages/DashboardLayout";
import Dashboard from "./userpages/Dashboard";
import Stock from "./userpages/Stock/Stock";
import Sales from "./userpages/Sales/Sales";
import Purchases from "./userpages/Purchase/Purchases";
import Expenses from "./userpages/Expense/Expenses";
import Reports from "./userpages/Reports";
import AddStock from "./userpages/Stock/AddStock";
import EditStock from "./userpages/Stock/EditStock";
import ViewStock from "./userpages/ViewStock";
import AddSale from "./userpages/Sales/AddSale";
import ReplaceSale from "./userpages/Sales/ReplaceSale";
import EditSale from "./userpages/Sales/EditSale";
import AddPurchase from "./userpages/Purchase/AddPurchase";
import AddExpense from "./userpages/Expense/AddExpense";
import Profile from "./userpages/Profile";
import Suppliers from "./userpages/Suppliers";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landingpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="stock" element={<Stock />} />
        <Route path="stock/add" element={<AddStock />} />
        <Route path="stock/view/:id" element={<ViewStock />} />
        <Route path="stock/edit/:id" element={<EditStock />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new" element={<AddSale />} />
        <Route path="sales/replace/:id" element={<ReplaceSale />} />
        <Route path="/dashboard/sales/edit/:id" element={<EditSale />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="/dashboard/purchases/new" element={<AddPurchase />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="/dashboard/expenses/new" element={<AddExpense />} />
        <Route path="reports" element={<Reports />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/suppliers" element={<Suppliers />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
