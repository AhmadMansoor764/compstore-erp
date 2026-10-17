import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  WalletCards,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  PiggyBank,
  CalendarDays,
  LayoutDashboard,
  Package,
  Boxes,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";

import SalesTrendCard from "./dashboard/SalesTrendCard";
import IncomeExpenseCard from "./dashboard/IncomeExpenseCard";
import SalesCategoryCard from "./dashboard/SalesCategoryCard";
import QuickActions from "./dashboard/QuickActions";
import LowStockAlerts from "./dashboard/LowStockAlerts";

const API_BASE_URL = import.meta.env.VITE_API_URL;

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

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const formatMoney = (value) =>
  `$${toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const DASHBOARD_CSS = `
.smd {
  --smd-border: #e5e9f2;
  --smd-muted: #6f7c91;
  container: smd / inline-size;
  min-width: 0;
  padding: 28px;
  border-radius: 28px;
  background: #f5f7fb;
  color: #182338;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
  color-scheme: light;
}

.smd, .smd * { box-sizing: border-box; }
:where(.smd h1, .smd h2, .smd h3, .smd p) { margin: 0; }

.smd-body {
  max-width: 1550px;
  margin: 0 auto;
}

.smd-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
}

.smd-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: #747d91;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.3px;
  text-transform: uppercase;
}

.smd-eyebrow svg { color: #6366e8; }

.smd-header h1 {
  color: #121c30;
  font-size: 32px;
  font-weight: 750;
  letter-spacing: -1.2px;
  line-height: 1.2;
}

.smd-header-description {
  margin-top: 8px;
  color: var(--smd-muted);
  font-size: 13px;
}

.smd-date-control {
  flex-shrink: 0;
  min-width: 230px;
}

.smd-date-label {
  display: block;
  margin-bottom: 7px;
  color: var(--smd-muted);
  font-size: 11px;
  font-weight: 650;
}

.smd-date-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border: 1px solid var(--smd-border);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(18, 28, 48, .025);
  transition: border-color .2s, box-shadow .2s;
}

.smd-date-input > svg {
  flex-shrink: 0;
  color: #6366e8;
}

.smd-date-input:focus-within {
  border-color: #7779ee;
  box-shadow: 0 0 0 4px rgba(99, 102, 232, .1);
}

.smd-date-input input {
  width: 100%;
  min-width: 0;
  padding: 12px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #26334b;
  font: inherit;
  font-size: 13px;
  font-weight: 650;
}

.smd-overview {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.95fr);
  align-items: stretch;
  gap: 20px;
}

.smd-balance {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 26px;
  overflow: hidden;
  border: 1px solid #253149;
  border-radius: 24px;
  background: linear-gradient(135deg, #101a2e, #1b2944 65%, #292952);
  box-shadow: 0 12px 26px rgba(16, 26, 46, .12);
  color: #fff;
}

.smd-balance::before {
  position: absolute;
  top: -110px;
  right: -100px;
  width: 300px;
  height: 300px;
  border: 1px solid rgba(180, 184, 255, .09);
  border-radius: 50%;
  box-shadow:
    0 0 0 38px rgba(180, 184, 255, .025),
    0 0 0 76px rgba(180, 184, 255, .018);
  content: "";
  pointer-events: none;
}

.smd-balance-top,
.smd-balance-value,
.smd-balance-caption,
.smd-inventory {
  position: relative;
  z-index: 1;
}

.smd-balance-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.smd-balance-top h2 {
  color: #cbd5ea;
  font-size: 13px;
  font-weight: 550;
}

.smd-balance-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 13px;
  background: rgba(255, 255, 255, .06);
  color: #d5d9ff;
}

.smd-balance-value {
  margin-top: 22px;
  font-size: 44px;
  font-weight: 700;
  letter-spacing: -1.8px;
  line-height: 1.12;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.smd-balance-caption {
  margin-top: 10px;
  margin-bottom: 28px;
  color: #a8b6d0;
  font-size: 12px;
}

.smd-inventory {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, .12);
}

.smd-inventory > div { min-width: 0; }

.smd-inventory-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #a8b6d0;
  font-size: 11px;
}

.smd-inventory-label svg {
  flex-shrink: 0;
  color: #b8c3ef;
}

.smd-inventory-value {
  margin-top: 7px;
  color: #f0f4ff;
  font-size: 18px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.smd-metrics {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.smd-region-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.smd-region-title h2 {
  color: #27344c;
  font-size: 13px;
  font-weight: 700;
}

.smd-region-title > span {
  color: #7b879b;
  font-size: 11px;
}

.smd-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  flex: 1;
  gap: 12px;
}

.smd-stat {
  --stat-color: #6366e8;
  --stat-surface: #f0efff;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 144px;
  padding: 18px 20px;
  border: 1px solid var(--smd-border);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(18, 28, 48, .02);
  transition: transform .2s, box-shadow .2s, border-color .2s;
}

.smd-stat:hover {
  transform: translateY(-2px);
  border-color: #d3d9e8;
  box-shadow: 0 10px 24px rgba(18, 28, 48, .06);
}

.smd-stat--emerald {
  --stat-color: #079c75;
  --stat-surface: #e9faf2;
}

.smd-stat--violet {
  --stat-color: #7b5ce1;
  --stat-surface: #f3edff;
}

.smd-stat--rose {
  --stat-color: #df5a78;
  --stat-surface: #fff0f4;
}

.smd-stat--blue {
  --stat-color: #4079db;
  --stat-surface: #e9f1ff;
}

.smd-stat--highlight {
  border-color: #d5dff7;
  background: linear-gradient(135deg, #f0f6ff, #f5f3ff);
}

.smd-stat-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.smd-stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--stat-surface);
  color: var(--stat-color);
}

.smd-stat-top h3 {
  color: #556278;
  font-size: 12px;
  font-weight: 650;
}

.smd-stat-value {
  margin-top: 13px;
  color: #182338;
  font-size: 28px;
  font-weight: 750;
  letter-spacing: -.9px;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}

.smd-stat-caption {
  margin-top: 9px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.6;
}

.smd-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 310px);
  align-items: start;
  gap: 20px;
  margin-top: 28px;
}

.smd-main, .smd-aside { min-width: 0; }

.smd-section-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
  color: #27344c;
  font-size: 13px;
  font-weight: 700;
}

.smd-section-heading::before {
  width: 4px;
  height: 14px;
  border-radius: 4px;
  background: #7875eb;
  content: "";
}

.smd-chart-stack, .smd-sidebar-stack {
  display: grid;
  gap: 20px;
}

.smd-chart-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;
}

.smd-widget { min-width: 0; }

.smd .smd-widget > :is(div, section, article) {
  border: 1px solid var(--smd-border);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 4px 18px rgba(18, 28, 48, .025);
}

.smd-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding: 15px 18px;
  border: 1px solid #f3d1d8;
  border-radius: 16px;
  background: #fff3f5;
  color: #a4334b;
  font-size: 13px;
}

.smd-error-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.smd-error-message svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.smd-error button {
  flex-shrink: 0;
  padding: 8px 13px;
  border: 1px solid #ecc2cc;
  border-radius: 10px;
  background: #fff;
  color: #a4334b;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.smd-error button:hover { background: #ffe7ec; }

.smd-error button:focus-visible {
  outline: 3px solid #e8a5b5;
  outline-offset: 3px;
}

.smd-skeleton {
  width: 120px;
  height: 32px;
  margin-top: 13px;
  border-radius: 8px;
  background: #e9edf5;
  animation: smd-pulse 1.4s ease-in-out infinite;
}

.smd-skeleton--dark {
  position: relative;
  width: 190px;
  height: 48px;
  margin-top: 22px;
  background: rgba(255, 255, 255, .13);
}

@keyframes smd-pulse {
  50% { opacity: .45; }
}

@container smd (max-width: 1040px) {
  .smd-overview { grid-template-columns: minmax(0, 1fr); }
  .smd-balance { padding: 24px; }
  .smd-metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .smd-stat { padding: 16px; }
  .smd-content { grid-template-columns: minmax(0, 1fr); }
  .smd-sidebar-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}

@container smd (max-width: 800px) {
  .smd-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@container smd (max-width: 620px) {
  .smd-header {
    align-items: stretch;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 22px;
  }
  .smd-date-control { width: 100%; min-width: 0; }
  .smd-chart-pair, .smd-sidebar-stack { grid-template-columns: minmax(0, 1fr); }
  .smd-region-title > span { font-size: 10px; }
  .smd-error { align-items: stretch; flex-direction: column; }
}

@container smd (max-width: 380px) {
  .smd-metric-grid { grid-template-columns: minmax(0, 1fr); }
  .smd-balance { padding: 20px; }
  .smd-balance-value { font-size: 36px; }
  .smd-inventory { gap: 12px; }
  .smd-inventory-value { font-size: 16px; }
  .smd-header h1 { font-size: 28px; }
}

@media (max-width: 600px) {
  .smd { padding: 16px; border-radius: 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .smd-stat { transition: none; }
  .smd-stat:hover { transform: none; }
  .smd-skeleton { animation: none; }
}
`;

const StatCard = ({
  title,
  amount,
  icon: Icon,
  subtitle,
  tone = "blue",
  highlight = false,
  loading = false,
  loadingText = "Loading",
}) => (
  <article
    className={
      "smd-stat smd-stat--" + tone + (highlight ? " smd-stat--highlight" : "")
    }
  >
    <div className="smd-stat-top">
      <span className="smd-stat-icon">
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
    </div>

    {loading ? (
      <div
        className="smd-skeleton"
        role="status"
        aria-label={`${loadingText} ${title}`}
      />
    ) : (
      <p className="smd-stat-value">{amount}</p>
    )}

    <p className="smd-stat-caption">{subtitle}</p>
  </article>
);

const DashboardWidget = ({ children }) => (
  <div className="smd-widget">{children}</div>
);

const Dashboard = () => {
  const reduceMotion = useReducedMotion();
  const { t, language } = useLanguage();

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
      if (!API_BASE_URL) {
        throw new Error(t("dashboard.errors.apiUrlMissing"));
      }

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
          throw new Error(t("dashboard.errors.sessionExpired"));
        }

        throw new Error(
          t("dashboard.errors.httpError").replace(
            "{status}",
            String(failedResponse.status),
          ),
        );
      }

      const results = await Promise.all(
        responses.map(async (response) => {
          const contentType = response.headers.get("content-type") || "";

          if (!contentType.includes("application/json")) {
            throw new Error(t("dashboard.errors.invalidResponse"));
          }

          return response.json();
        }),
      );

      const [
        storeResult,
        salesResult,
        purchasesResult,
        expensesResult,
        productsResult,
      ] = results;

      if (
        storeResult?.success === false ||
        salesResult?.success === false ||
        purchasesResult?.success === false ||
        expensesResult?.success === false ||
        productsResult?.success === false
      ) {
        throw new Error(t("dashboard.errors.loadAll"));
      }

      setStore(storeResult?.store ?? null);

      setSales(Array.isArray(salesResult?.sales) ? salesResult.sales : []);

      setPurchases(
        Array.isArray(purchasesResult?.purchases)
          ? purchasesResult.purchases
          : [],
      );

      setExpenses(
        Array.isArray(expensesResult?.expenses) ? expensesResult.expenses : [],
      );

      setProducts(
        Array.isArray(productsResult?.products) ? productsResult.products : [],
      );
    } catch (err) {
      setError(err.message || t("dashboard.errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return t("dashboard.allDates");

    const locale =
      language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

    return new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate, language, t]);

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
    <div className="smd" dir={language === "en" ? "ltr" : "rtl"}>
      <style>{DASHBOARD_CSS}</style>

      <motion.div
        className="smd-body"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <header className="smd-header">
          <div>
            <span className="smd-eyebrow">
              <LayoutDashboard size={14} aria-hidden="true" />
              {t("dashboard.storeWorkspace")}
            </span>

            <h1>{t("dashboard.title")}</h1>

            <p className="smd-header-description">
              {t("dashboard.description")}
            </p>
          </div>

          <div className="smd-date-control">
            <label className="smd-date-label" htmlFor="dashboard-date">
              {t("dashboard.reportingDate")}
            </label>

            <div className="smd-date-input">
              <CalendarDays size={18} aria-hidden="true" />
              <input
                id="dashboard-date"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
          </div>
        </header>

        {error && (
          <div className="smd-error" role="alert">
            <div className="smd-error-message">
              <AlertTriangle size={18} aria-hidden="true" />
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              {loading ? t("dashboard.loading") : t("dashboard.tryAgain")}
            </button>
          </div>
        )}

        <div className="smd-overview">
          <section
            className="smd-balance"
            aria-labelledby="balance-heading"
            aria-busy={loading}
          >
            <div className="smd-balance-top">
              <h2 id="balance-heading">{t("dashboard.availableCash")}</h2>

              <span className="smd-balance-icon">
                <WalletCards size={21} strokeWidth={1.6} aria-hidden="true" />
              </span>
            </div>

            {loading ? (
              <div
                className="smd-skeleton smd-skeleton--dark"
                role="status"
                aria-label={t("dashboard.loadingAvailableCash")}
              />
            ) : (
              <p className="smd-balance-value">
                {formatMoney(dashboardData.availableCash)}
              </p>
            )}

            <p className="smd-balance-caption">
              {t("dashboard.currentStoreBalance")}
            </p>

            <div className="smd-inventory">
              <div>
                <div className="smd-inventory-label">
                  <Package size={14} aria-hidden="true" />
                  <span>{t("dashboard.totalProducts")}</span>
                </div>

                <p className="smd-inventory-value">
                  {loading
                    ? "…"
                    : products.length.toLocaleString(
                        language === "fa"
                          ? "fa-AF"
                          : language === "ps"
                            ? "ps-AF"
                            : "en-US",
                      )}
                </p>
              </div>

              <div>
                <div className="smd-inventory-label">
                  <Boxes size={14} aria-hidden="true" />
                  <span>{t("dashboard.stockValue")}</span>
                </div>

                <p className="smd-inventory-value">
                  {loading ? "…" : formatMoney(stockValue)}
                </p>
              </div>
            </div>
          </section>

          <section
            className="smd-metrics"
            aria-labelledby="daily-heading"
            aria-busy={loading}
          >
            <div className="smd-region-title">
              <h2 id="daily-heading">{t("dashboard.dailyPerformance")}</h2>
              <span>{formattedDate}</span>
            </div>

            <div className="smd-metric-grid">
              <StatCard
                title={t("dashboard.revenue")}
                amount={formatMoney(dashboardData.revenue)}
                icon={TrendingUp}
                tone="emerald"
                subtitle={t("dashboard.revenueSubtitle")}
                loading={loading}
                loadingText={t("dashboard.loading")}
              />

              <StatCard
                title={t("dashboard.purchases")}
                amount={formatMoney(dashboardData.purchases)}
                icon={ShoppingCart}
                tone="violet"
                subtitle={t("dashboard.purchasesSubtitle")}
                loading={loading}
                loadingText={t("dashboard.loading")}
              />

              <StatCard
                title={t("dashboard.expenses")}
                amount={formatMoney(dashboardData.expenses)}
                icon={AlertTriangle}
                tone="rose"
                subtitle={t("dashboard.expensesSubtitle")}
                loading={loading}
                loadingText={t("dashboard.loading")}
              />

              <StatCard
                title={t("dashboard.netProfit")}
                amount={formatMoney(dashboardData.netProfit)}
                icon={PiggyBank}
                tone="blue"
                subtitle={t("dashboard.netProfitSubtitle")}
                loading={loading}
                loadingText={t("dashboard.loading")}
                highlight
              />
            </div>
          </section>
        </div>

        <div className="smd-content">
          <section className="smd-main" aria-labelledby="analytics-heading">
            <h2 className="smd-section-heading" id="analytics-heading">
              {t("dashboard.performanceAnalytics")}
            </h2>

            <div className="smd-chart-stack">
              <DashboardWidget>
                <SalesTrendCard sales={sales} selectedDate={selectedDate} />
              </DashboardWidget>

              <div className="smd-chart-pair">
                <DashboardWidget>
                  <IncomeExpenseCard
                    sales={sales}
                    expenses={expenses}
                    selectedDate={selectedDate}
                  />
                </DashboardWidget>

                <DashboardWidget>
                  <SalesCategoryCard
                    sales={sales}
                    products={products}
                    selectedDate={selectedDate}
                  />
                </DashboardWidget>
              </div>
            </div>
          </section>

          <aside className="smd-aside" aria-labelledby="operations-heading">
            <h2 className="smd-section-heading" id="operations-heading">
              {t("dashboard.storeOperations")}
            </h2>

            <div className="smd-sidebar-stack">
              <DashboardWidget>
                <QuickActions />
              </DashboardWidget>

              <DashboardWidget>
                <LowStockAlerts products={products} loading={loading} />
              </DashboardWidget>
            </div>
          </aside>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
