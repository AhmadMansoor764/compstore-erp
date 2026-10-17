import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Download,
  FileText,
  Filter,
  Printer,
  RefreshCcw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useLanguage } from "../context/LanguageContext";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const getToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const getFirstDayOfMonth = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-01`;
};

const toNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const normalizeStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase();

const getDateKey = (date) => {
  if (!date) return "";

  if (typeof date === "string") {
    return date.slice(0, 10);
  }

  return new Date(date).toISOString().slice(0, 10);
};

const getRecords = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return null;
};

const fetchReportData = async (endpoint, key) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || `Request failed: ${endpoint}`;

    throw new Error(message);
  }

  if (data?.success === false) {
    throw new Error(data.message || `Could not load ${key}.`);
  }

  const records = getRecords(data, key);

  if (!records) {
    throw new Error(`Invalid records returned by ${endpoint}.`);
  }

  return records;
};

const normalizeSales = (sales, tr) =>
  sales.map((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];
    const quantity = items.reduce(
      (total, item) => total + toNumber(item.quantity),
      0,
    );

    const names = [
      ...new Set(
        items
          .map((item) => item.product_name || item.product?.name)
          .filter(Boolean),
      ),
    ];

    return {
      id: sale.id,
      number: sale.sale_number || `#${sale.id}`,
      customer: sale.customer_name || tr("walkInCustomer"),
      product: names.length
        ? names.join(", ")
        : items.length
          ? tr("productFallback")
          : tr("noItems"),
      quantity,
      amount: toNumber(sale.total_amount),
      paidAmount: toNumber(sale.paid_amount),
      pendingAmount: toNumber(sale.due_amount),
      date: getDateKey(sale.sale_date || sale.created_at),
      paymentMethod: sale.payment_method || "-",
      paymentStatus: sale.payment_status || "Unpaid",
      status: sale.status || "Unknown",
      items,
    };
  });

const normalizePurchases = (purchases, tr) =>
  purchases.map((purchase) => {
    const items = Array.isArray(purchase.items) ? purchase.items : [];
    const quantity = items.reduce(
      (total, item) => total + toNumber(item.quantity),
      0,
    );

    const names = [
      ...new Set(
        items
          .map((item) => item.product_name || item.product?.name)
          .filter(Boolean),
      ),
    ];

    return {
      id: purchase.id,
      number: purchase.purchase_number || `#${purchase.id}`,
      supplier:
        purchase.supplier?.name ||
        purchase.supplier?.company_name ||
        tr("unknownSupplier"),
      product: names.length
        ? names.join(", ")
        : items.length
          ? tr("productFallback")
          : tr("noItems"),
      quantity,
      amount: toNumber(purchase.total_amount),
      paidAmount: toNumber(purchase.paid_amount),
      pendingAmount: toNumber(purchase.due_amount),
      date: getDateKey(purchase.purchase_date || purchase.created_at),
      paymentMethod: purchase.payment_method || "-",
      paymentStatus: purchase.payment_status || "Unpaid",
      status: purchase.status || "Unknown",
      items,
    };
  });

const normalizeExpenses = (expenses, tr) =>
  expenses.map((expense) => {
    const status = expense.status || "Pending";
    const normalizedStatus = normalizeStatus(status);
    const amount = toNumber(expense.amount);

    return {
      id: expense.id,
      number: expense.expense_number || `#${expense.id}`,
      title: expense.title || tr("untitledExpense"),
      category: expense.category || "Other",
      description: expense.description || "-",
      amount,
      paidAmount: normalizedStatus === "paid" ? amount : 0,
      pendingAmount: normalizedStatus === "pending" ? amount : 0,
      date: getDateKey(expense.expense_date || expense.created_at),
      paymentMethod: expense.payment_method || "-",
      status,
    };
  });

const getStatusColor = (status) => {
  switch (normalizeStatus(status)) {
    case "paid":
    case "completed":
    case "received":
      return "bg-green-100 text-green-700";

    case "pending":
    case "unpaid":
    case "partially paid":
    case "partial":
      return "bg-yellow-100 text-yellow-700";

    case "cancelled":
    case "canceled":
    case "returned":
    case "failed":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

const reportOptions = [
  {
    value: "sales",
    label: "salesReport",
    description: "salesDescription",
    icon: TrendingUp,
  },
  {
    value: "purchases",
    label: "purchaseReport",
    description: "purchasesDescription",
    icon: ShoppingCart,
  },
  {
    value: "expenses",
    label: "expenseReport",
    description: "expensesDescription",
    icon: TrendingDown,
  },
];

const Reports = () => {
  const { language, isRTL, t } = useLanguage();

  const tr = useCallback((key) => t(`reports.${key}`), [t]);

  const formatMoney = useCallback(
    (amount = 0) => {
      const locale =
        language === "ps" ? "ps-AF" : language === "fa" ? "fa-AF" : "en-US";

      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(toNumber(amount));
    },
    [language],
  );

  const formatDate = useCallback(
    (date) => {
      if (!date) return "-";

      const dateString = getDateKey(date);
      const [year, month, day] = dateString.split("-").map(Number);

      if (!year || !month || !day) return "-";

      const locale =
        language === "ps" ? "ps-AF" : language === "fa" ? "fa-AF" : "en-US";

      return new Date(year, month - 1, day).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    [language],
  );

  const translateStatus = useCallback(
    (status) => {
      const normalized = normalizeStatus(status);

      const statusKeys = {
        paid: "paid",
        completed: "completed",
        received: "received",
        pending: "pending",
        unpaid: "unpaid",
        "partially paid": "partiallyPaid",
        partial: "partial",
        cancelled: "cancelled",
        canceled: "canceled",
        returned: "returned",
        failed: "failed",
        unknown: "unknown",
      };

      const key = statusKeys[normalized];

      if (!key) return status || tr("unknown");

      const translated = t(`reports.statuses.${key}`);

      return translated === `reports.statuses.${key}` ? status : translated;
    },
    [t, tr],
  );

  const translateCategory = useCallback(
    (category) => {
      const key = String(category || "Other");
      const translated = t(`expenses.categories.${key.toLowerCase()}`);

      return translated === `expenses.categories.${key.toLowerCase()}`
        ? key
        : translated;
    },
    [t],
  );

  const [reportType, setReportType] = useState("sales");

  const [startDate, setStartDate] = useState(getFirstDayOfMonth);
  const [endDate, setEndDate] = useState(getToday);

  const [appliedStartDate, setAppliedStartDate] = useState(getFirstDayOfMonth);
  const [appliedEndDate, setAppliedEndDate] = useState(getToday);

  const [showFilters, setShowFilters] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      fetchReportData("/api/sales", "sales"),
      fetchReportData("/api/purchases", "purchases"),
      fetchReportData("/api/expenses", "expenses"),
    ]);

    const [salesResult, purchasesResult, expensesResult] = results;
    const errors = [];

    if (salesResult.status === "fulfilled") {
      setSalesData(normalizeSales(salesResult.value, tr));
    } else {
      setSalesData([]);
      errors.push(
        `${tr("salesReport")}: ${salesResult.reason?.message || tr("errors.requestFailed")}`,
      );
    }

    if (purchasesResult.status === "fulfilled") {
      setPurchaseData(normalizePurchases(purchasesResult.value, tr));
    } else {
      setPurchaseData([]);
      errors.push(
        `${tr("purchaseReport")}: ${purchasesResult.reason?.message || tr("errors.requestFailed")}`,
      );
    }

    if (expensesResult.status === "fulfilled") {
      setExpenseData(normalizeExpenses(expensesResult.value, tr));
    } else {
      setExpenseData([]);
      errors.push(
        `${tr("expenseReport")}: ${expensesResult.reason?.message || tr("errors.requestFailed")}`,
      );
    }

    if (errors.length) setError(errors.join(" "));

    setLoading(false);
  }, [tr, refreshKey]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const activeReport = useMemo(() => {
    if (reportType === "expenses") return expenseData;
    if (reportType === "purchases") return purchaseData;
    return salesData;
  }, [reportType, salesData, purchaseData, expenseData]);

  const filteredData = useMemo(
    () =>
      activeReport.filter(
        (item) =>
          item.date &&
          item.date >= appliedStartDate &&
          item.date <= appliedEndDate,
      ),
    [activeReport, appliedStartDate, appliedEndDate],
  );

  const reportableData = useMemo(
    () =>
      filteredData.filter((item) => {
        const status = normalizeStatus(item.status);

        if (reportType === "sales") return status === "completed";

        return status !== "cancelled" && status !== "canceled";
      }),
    [filteredData, reportType],
  );

  const reportSummary = useMemo(() => {
    return reportableData.reduce(
      (summary, item) => ({
        totalAmount: summary.totalAmount + toNumber(item.amount),
        paidAmount: summary.paidAmount + toNumber(item.paidAmount),
        pendingAmount: summary.pendingAmount + toNumber(item.pendingAmount),
        totalQuantity: summary.totalQuantity + toNumber(item.quantity),
        totalRecords: summary.totalRecords + 1,
      }),
      {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        totalQuantity: 0,
        totalRecords: 0,
      },
    );
  }, [reportableData]);

  const categoryChartData = useMemo(() => {
    const grouped = {};

    reportableData.forEach((item) => {
      if (reportType === "expenses") {
        const category = translateCategory(item.category);

        grouped[category] = (grouped[category] || 0) + toNumber(item.amount);

        return;
      }

      const items = Array.isArray(item.items) ? item.items : [];

      if (!items.length) {
        const name = item.product || tr("other");

        grouped[name] = (grouped[name] || 0) + toNumber(item.amount);
        return;
      }

      items.forEach((product) => {
        const name =
          product.product_name || product.product?.name || tr("other");

        const amount = toNumber(product.total_price);

        grouped[name] = (grouped[name] || 0) + amount;
      });
    });

    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [reportableData, reportType, translateCategory, tr]);

  const paymentChartData = useMemo(
    () => [
      { name: tr("paid"), value: reportSummary.paidAmount },
      { name: tr("pendingAmount"), value: reportSummary.pendingAmount },
    ],
    [reportSummary, tr],
  );

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setError(tr("errors.selectBothDates"));
      return;
    }

    if (startDate > endDate) {
      setError(tr("errors.invalidDateRange"));
      return;
    }

    setError("");
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setShowFilters(false);
  };

  const resetDateFilter = () => {
    const firstDay = getFirstDayOfMonth();
    const today = getToday();

    setStartDate(firstDay);
    setEndDate(today);
    setAppliedStartDate(firstDay);
    setAppliedEndDate(today);
    setError("");
    setShowFilters(false);
  };

  const handlePrint = () => window.print();

  const reportTitle =
    reportType === "sales"
      ? tr("salesReport")
      : reportType === "purchases"
        ? tr("purchaseReport")
        : tr("expenseReport");

  const tableTitle =
    reportType === "sales"
      ? tr("salesTransactions")
      : reportType === "purchases"
        ? tr("purchaseTransactions")
        : tr("expenseTransactions");

  const totalTitle =
    reportType === "sales"
      ? tr("totalSales")
      : reportType === "purchases"
        ? tr("totalPurchases")
        : tr("totalExpenses");

  const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#ef4444"];

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen min-w-0 bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 print:bg-white"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {tr("title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{tr("subtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <Filter size={17} />
              {showFilters ? tr("closeFilter") : tr("filterDates")}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Printer size={17} />
              {tr("printReport")}
            </button>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw size={17} className={loading ? "animate-spin" : ""} />
              {tr("refresh")}
            </button>
          </div>
        </div>

        {/* Report type selector */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {reportOptions.map((option) => {
            const Icon = option.icon;
            const isActive = reportType === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setReportType(option.value);
                  setError("");
                }}
                className={`rounded-2xl border p-5 text-start transition ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"
                    : "border-slate-200 bg-white text-slate-900 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      isActive ? "bg-white/20" : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon size={22} />
                  </div>

                  {isActive && (
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                      {tr("selected")}
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-bold">{tr(option.label)}</h2>

                <p
                  className={`mt-1 text-sm ${
                    isActive ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {tr(option.description)}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Errors */}
        {error && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="shrink-0 font-semibold underline"
            >
              {tr("tryAgain")}
            </button>
          </div>
        )}

        {/* Date filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <CalendarDays size={20} className="text-blue-600" />
                  {tr("filterByDate")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {tr("selectDateRange")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                aria-label={tr("closeFilter")}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={19} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="startDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {tr("startDate")}
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {tr("endDate")}
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={applyDateFilter}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Filter size={17} />
                {tr("applyFilter")}
              </button>

              <button
                type="button"
                onClick={resetDateFilter}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw size={17} />
                {tr("reset")}
              </button>
            </div>
          </motion.div>
        )}

        {/* Active date range */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center print:border-slate-200 print:bg-white">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <CalendarDays size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {tr("activeDateRange")}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {formatDate(appliedStartDate)} - {formatDate(appliedEndDate)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDateFilter}
            className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:self-auto print:hidden"
          >
            <RefreshCcw size={14} />
            {tr("resetDates")}
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500 shadow-sm">
            {tr("loadingReports")}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title={totalTitle}
            value={formatMoney(reportSummary.totalAmount)}
            icon={Wallet}
            color="blue"
          />
          <SummaryCard
            title={tr("paidAmount")}
            value={formatMoney(reportSummary.paidAmount)}
            icon={TrendingUp}
            color="green"
          />
          <SummaryCard
            title={tr("pendingAmount")}
            value={formatMoney(reportSummary.pendingAmount)}
            icon={TrendingDown}
            color="orange"
          />
          <SummaryCard
            title={
              reportType === "expenses"
                ? tr("totalRecords")
                : tr("totalQuantity")
            }
            value={
              reportType === "expenses"
                ? reportSummary.totalRecords
                : formatMoney(reportSummary.totalQuantity)
            }
            icon={FileText}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {reportType === "expenses"
                  ? tr("expensesByCategory")
                  : tr("amountByProduct")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tr("amountsOverview")}
              </p>
            </div>

            {loading ? (
              <ChartLoading />
            ) : categoryChartData.length === 0 ? (
              <EmptyChart tr={tr} />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatMoney}
                    />
                    <Tooltip
                      formatter={(value) => [formatMoney(value), tr("amount")]}
                    />
                    <Bar dataKey="amount" fill="#2563eb" radius={[8, 8, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {tr("paymentOverview")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {tr("paidAndPending")}
              </p>
            </div>

            {loading ? (
              <ChartLoading />
            ) : reportSummary.paidAmount + reportSummary.pendingAmount === 0 ? (
              <EmptyChart tr={tr} />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData.filter((item) => item.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      paddingAngle={4}
                    >
                      {paymentChartData
                        .filter((item) => item.value > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === tr("paid") ? "#16a34a" : "#f59e0b"
                            }
                          />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatMoney(value), tr("amount")]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Report table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{tableTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? tr("loadingRecords")
                  : `${filteredData.length} ${
                      filteredData.length === 1 ? tr("record") : tr("records")
                    } ${tr("found")}`}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 print:hidden"
            >
              <Download size={16} />
              {tr("printTable")}
            </button>
          </div>

          {loading ? (
            <TableLoading />
          ) : (
            <ReportTable
              type={reportType}
              data={filteredData}
              tr={tr}
              formatMoney={formatMoney}
              formatDate={formatDate}
              translateStatus={translateStatus}
              translateCategory={translateCategory}
            />
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
          }

          .print\\\\:hidden {
            display: none !important;
          }

          .recharts-responsive-container {
            break-inside: avoid;
          }

          table {
            width: 100%;
            font-size: 10px;
          }

          th, td {
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: {
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-700",
    },
    green: {
      icon: "bg-green-100 text-green-600",
      value: "text-green-700",
    },
    orange: {
      icon: "bg-orange-100 text-orange-600",
      value: "text-orange-700",
    },
    purple: {
      icon: "bg-purple-100 text-purple-600",
      value: "text-purple-700",
    },
  };

  const selected = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <div className={`rounded-xl p-3 ${selected.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      <h3 className={`mt-4 text-2xl font-bold ${selected.value}`}>{value}</h3>
    </motion.div>
  );
};

const ReportTable = ({
  type,
  data,
  tr,
  formatMoney,
  formatDate,
  translateStatus,
  translateCategory,
}) => {
  const columns =
    type === "sales"
      ? [
          ["number", "saleNumber"],
          ["customer", "customer"],
          ["product", "product"],
          ["quantity", "quantity"],
          ["amount", "amount"],
          ["paidAmount", "paid"],
          ["pendingAmount", "due"],
          ["paymentMethod", "paymentMethod"],
          ["date", "date"],
          ["status", "status"],
        ]
      : type === "purchases"
        ? [
            ["number", "purchaseNumber"],
            ["supplier", "supplier"],
            ["product", "product"],
            ["quantity", "quantity"],
            ["amount", "amount"],
            ["paidAmount", "paid"],
            ["pendingAmount", "due"],
            ["paymentStatus", "payment"],
            ["date", "date"],
            ["status", "status"],
          ]
        : [
            ["number", "expenseNumber"],
            ["title", "titleLabel"],
            ["category", "category"],
            ["description", "description"],
            ["amount", "amount"],
            ["paymentMethod", "paymentMethod"],
            ["date", "date"],
            ["status", "status"],
          ];

  const renderValue = (item, key) => {
    if (key === "amount" || key === "paidAmount" || key === "pendingAmount") {
      return formatMoney(item[key]);
    }

    if (key === "date") return formatDate(item.date);

    if (key === "status") return translateStatus(item.status);

    if (key === "paymentStatus") {
      return translateStatus(item.paymentStatus);
    }

    if (key === "category") return translateCategory(item.category);

    if (key === "quantity") return formatMoney(item.quantity);

    return item[key] ?? "-";
  };

  if (!data.length) return <EmptyTable tr={tr} />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-start text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map(([, label]) => (
              <th
                key={label}
                className="whitespace-nowrap px-5 py-4 text-start font-semibold"
              >
                {tr(label)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
            <tr
              key={item.id ?? `${item.number}-${index}`}
              className="transition hover:bg-slate-50"
            >
              {columns.map(([key]) => (
                <td
                  key={key}
                  className={`px-5 py-4 ${
                    ["number", "customer", "supplier", "title"].includes(key)
                      ? "whitespace-nowrap font-semibold text-slate-900"
                      : "text-slate-600"
                  } ${
                    ["amount"].includes(key)
                      ? "whitespace-nowrap font-bold text-slate-900"
                      : ""
                  }`}
                >
                  {key === "status" ? (
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                        item.status,
                      )}`}
                    >
                      {renderValue(item, key)}
                    </span>
                  ) : (
                    renderValue(item, key)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ChartLoading = () => (
  <div className="flex h-72 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
  </div>
);

const TableLoading = () => (
  <div className="space-y-4 p-5">
    {[1, 2, 3, 4].map((item) => (
      <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-100" />
    ))}
  </div>
);

const EmptyChart = ({ tr }) => (
  <div className="flex h-72 flex-col items-center justify-center text-center">
    <div className="rounded-full bg-slate-100 p-4 text-slate-400">
      <FileText size={28} />
    </div>
    <h3 className="mt-4 font-semibold text-slate-700">{tr("noChartData")}</h3>
    <p className="mt-1 text-sm text-slate-500">{tr("noChartDataHint")}</p>
  </div>
);

const EmptyTable = ({ tr }) => (
  <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
    <div className="rounded-full bg-slate-100 p-4 text-slate-400">
      <FileText size={30} />
    </div>
    <h3 className="mt-4 text-lg font-bold text-slate-800">{tr("noRecords")}</h3>
    <p className="mt-1 max-w-md text-sm text-slate-500">
      {tr("noRecordsHint")}
    </p>
  </div>
);

export default Reports;
