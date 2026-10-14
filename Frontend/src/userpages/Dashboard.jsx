import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  WalletCards,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  PiggyBank,
  CalendarDays,
} from "lucide-react";

import SalesTrendCard from "./dashboard/SalesTrendCard";
import IncomeExpenseCard from "./dashboard/IncomeExpenseCard";
import SalesCategoryCard from "./dashboard/SalesCategoryCard";
import QuickActions from "./dashboard/QuickActions";
import LowStockAlerts from "./dashboard/LowStockAlerts";

const API_BASE_URL = "http://localhost:3000";

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const getLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const getDateKey = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

const formatMoney = (value) =>
  `$${toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const StatCard = ({
  title,
  amount,
  icon: Icon,
  iconColor = "text-slate-400",
  iconBackground = "bg-slate-100",
  subtitle,
  subtitleColor = "text-emerald-700",
  danger = false,
  success = false,
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4 }}
    className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${
      success
        ? "border-emerald-300 bg-emerald-300"
        : "border-[#c8cce0] bg-white"
    }`}
  >
    {!success && (
      <div className="pointer-events-none absolute -bottom-10 -right-7 h-32 w-32 rounded-full bg-[#f4f5fb]" />
    )}

    <div className="relative z-10 flex items-start justify-between gap-3">
      <p
        className={`text-xs font-bold uppercase tracking-[0.08em] ${
          success ? "text-emerald-950" : "text-slate-700"
        }`}
      >
        {title}
      </p>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          success ? "bg-emerald-400/50" : iconBackground
        }`}
      >
        <Icon size={21} className={success ? "text-emerald-950" : iconColor} />
      </div>
    </div>

    <div className="relative z-10 mt-6">
      <h2
        className={`break-words text-3xl font-bold tracking-tight sm:text-4xl ${
          success ? "text-emerald-950" : "text-slate-950"
        }`}
      >
        {amount}
      </h2>

      {subtitle && (
        <p
          className={`mt-2 text-xs font-semibold ${
            danger
              ? "text-red-600"
              : success
                ? "text-emerald-950"
                : subtitleColor
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [store, setStore] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        "/api/stores/me",
        "/api/sales",
        "/api/purchases",
        "/api/expenses",
        "/api/products",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetch(`${API_BASE_URL}${endpoint}`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          }),
        ),
      );

      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        if (failedResponse.status === 401 || failedResponse.status === 403) {
          throw new Error(
            "Your session may have expired. Please log in again.",
          );
        }
        throw new Error(
          `Could not load dashboard data (HTTP ${failedResponse.status}).`,
        );
      }

      const [
        storeResult,
        salesResult,
        purchasesResult,
        expensesResult,
        productsResult,
      ] = await Promise.all(responses.map((response) => response.json()));

      if (
        storeResult.success === false ||
        salesResult.success === false ||
        purchasesResult.success === false ||
        expensesResult.success === false ||
        productsResult.success === false
      ) {
        throw new Error("The server could not load all dashboard data.");
      }

      setStore(storeResult.store ?? null);
      setSales(Array.isArray(salesResult.sales) ? salesResult.sales : []);
      setPurchases(
        Array.isArray(purchasesResult.purchases)
          ? purchasesResult.purchases
          : [],
      );
      setExpenses(
        Array.isArray(expensesResult.expenses) ? expensesResult.expenses : [],
      );
      setProducts(
        Array.isArray(productsResult.products) ? productsResult.products : [],
      );
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "All dates";

    return new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const dashboardData = useMemo(() => {
    const dailySales = sales.filter(
      (sale) =>
        getDateKey(sale.sale_date ?? sale.created_at) === selectedDate &&
        sale.status === "Completed",
    );

    const dailyPurchases = purchases.filter(
      (purchase) =>
        getDateKey(purchase.purchase_date ?? purchase.created_at) ===
          selectedDate && purchase.status !== "Cancelled",
    );

    const dailyExpenses = expenses.filter(
      (expense) =>
        getDateKey(expense.expense_date ?? expense.created_at) ===
          selectedDate && expense.status === "Paid",
    );

    const revenue = dailySales.reduce(
      (total, sale) => total + toNumber(sale.total_amount),
      0,
    );

    const purchaseTotal = dailyPurchases.reduce(
      (total, purchase) => total + toNumber(purchase.total_amount),
      0,
    );

    const expenseTotal = dailyExpenses.reduce(
      (total, expense) => total + toNumber(expense.amount),
      0,
    );

    const grossProfit = dailySales.reduce((total, sale) => {
      const items = Array.isArray(sale.items) ? sale.items : [];

      const itemProfit = items.reduce((sum, item) => {
        const quantity = toNumber(item.quantity);
        const itemRevenue = toNumber(item.total_price);
        const itemCost = toNumber(item.purchase_price) * quantity;

        return sum + itemRevenue - itemCost;
      }, 0);

      // Account for sale-level discounts proportionally.
      const subtotal = toNumber(sale.subtotal);
      const discount = toNumber(sale.discount);
      const discountRatio =
        subtotal > 0 ? Math.max(0, (subtotal - discount) / subtotal) : 1;

      return total + itemProfit * discountRatio;
    }, 0);

    return {
      availableCash: toNumber(store?.balance),
      revenue,
      purchases: purchaseTotal,
      expenses: expenseTotal,
      netProfit: grossProfit - expenseTotal,
    };
  }, [sales, purchases, expenses, store, selectedDate]);

  const stockValue = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total + toNumber(product.quantity) * toNumber(product.purchase_price),
        0,
      ),
    [products],
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Showing data for {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-[#c8cce0] bg-white px-3 py-2 shadow-sm">
          <CalendarDays size={20} className="text-[#2563eb]" />
          <label
            htmlFor="dashboard-date"
            className="text-sm font-semibold text-slate-700"
          >
            Date:
          </label>
          <input
            id="dashboard-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="min-w-0 rounded-lg border border-[#c8cce0] bg-[#f8f9ff] px-2 py-1.5 text-sm font-medium text-slate-800 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="shrink-0 rounded-lg border border-red-300 px-3 py-2 font-semibold hover:bg-red-100"
          >
            Try again
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Available Cash"
          amount={loading ? "…" : formatMoney(dashboardData.availableCash)}
          icon={WalletCards}
          iconBackground="bg-[#eef0fb]"
          subtitle="Current store balance"
        />

        <StatCard
          title="Revenue"
          amount={loading ? "…" : formatMoney(dashboardData.revenue)}
          icon={TrendingUp}
          iconColor="text-emerald-700"
          iconBackground="bg-transparent"
          subtitle="Completed sales on selected date"
        />

        <StatCard
          title="Purchases"
          amount={loading ? "…" : formatMoney(dashboardData.purchases)}
          icon={ShoppingCart}
          iconColor="text-slate-300"
          iconBackground="bg-transparent"
          subtitle="Non-cancelled purchases on selected date"
        />

        <StatCard
          title="Expenses"
          amount={loading ? "…" : formatMoney(dashboardData.expenses)}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBackground="bg-transparent"
          subtitle="Paid expenses on selected date"
          danger
        />

        <StatCard
          title="Net Profit"
          amount={loading ? "…" : formatMoney(dashboardData.netProfit)}
          icon={PiggyBank}
          success
          subtitle="Estimated gross profit minus paid expenses"
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_318px]">
        <div className="min-w-0 space-y-6">
          <SalesTrendCard sales={sales} selectedDate={selectedDate} />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <IncomeExpenseCard
              sales={sales}
              expenses={expenses}
              selectedDate={selectedDate}
            />

            <SalesCategoryCard
              sales={sales}
              products={products}
              selectedDate={selectedDate}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#c8cce0] bg-[#eef0fb]">
            <div className="border-r border-[#c8cce0] px-4 py-5 sm:px-5">
              <p className="text-xs font-semibold tracking-wide text-slate-700">
                Total Products
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {loading ? "…" : products.length.toLocaleString("en-US")}
              </p>
            </div>

            <div className="px-4 py-5 sm:px-5">
              <p className="text-xs font-semibold tracking-wide text-slate-700">
                Stock Value
              </p>
              <p className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                {loading ? "…" : formatMoney(stockValue)}
              </p>
            </div>
          </div>

          <QuickActions />

          <LowStockAlerts products={products} loading={loading} />
        </aside>
      </section>
    </div>
  );
};

export default Dashboard;
