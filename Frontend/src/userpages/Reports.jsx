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

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

// Change this URL if your backend uses a different port.
const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

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

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toNumber(amount));

const formatDate = (date) => {
  if (!date) return "-";

  // Handles both date-only strings and ISO timestamps without
  // accidentally shifting a date-only value to the previous day.
  const dateString =
    typeof date === "string"
      ? date.slice(0, 10)
      : new Date(date).toISOString().slice(0, 10);

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) return "-";

  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusColor = (status) => {
  switch (String(status || "").toLowerCase()) {
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

const getRecords = (responseData, key) => {
  if (Array.isArray(responseData)) return responseData;

  if (Array.isArray(responseData?.[key])) {
    return responseData[key];
  }

  return null;
};

const fetchReportData = async (endpoint, key) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
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
    throw new Error(
      `The ${endpoint} endpoint did not return a valid "${key}" array.`,
    );
  }

  return records;
};

/* -------------------------------------------------------------------------- */
/*                            DATA NORMALIZATION                              */
/* -------------------------------------------------------------------------- */

const normalizeSales = (sales) =>
  sales.map((sale) => {
    const items = Array.isArray(sale.items) ? sale.items : [];

    const quantity = items.reduce(
      (total, item) => total + toNumber(item.quantity),
      0,
    );

    const productNames = [
      ...new Set(
        items
          .map((item) => item.product_name || item.product?.name)
          .filter(Boolean),
      ),
    ];

    return {
      id: sale.id,
      number: sale.sale_number || `#${sale.id}`,
      customer: sale.customer_name || "Walk-in Customer",
      product: productNames.length
        ? productNames.join(", ")
        : items.length
          ? "Product"
          : "No items",
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

const normalizePurchases = (purchases) =>
  purchases.map((purchase) => {
    const items = Array.isArray(purchase.items) ? purchase.items : [];

    const quantity = items.reduce(
      (total, item) => total + toNumber(item.quantity),
      0,
    );

    const productNames = [
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
        "Unknown Supplier",
      product: productNames.length
        ? productNames.join(", ")
        : items.length
          ? "Product"
          : "No items",
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

const normalizeExpenses = (expenses) =>
  expenses.map((expense) => {
    const status = expense.status || "Pending";
    const normalizedStatus = normalizeStatus(status);
    const amount = toNumber(expense.amount);

    return {
      id: expense.id,
      number: expense.expense_number || `#${expense.id}`,
      title: expense.title || "Untitled Expense",
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

/* -------------------------------------------------------------------------- */
/*                                REPORT TYPES                                */
/* -------------------------------------------------------------------------- */

const reportOptions = [
  {
    value: "sales",
    label: "Sales Report",
    description: "View your sales and customer payments",
    icon: TrendingUp,
  },
  {
    value: "purchases",
    label: "Purchase Report",
    description: "View purchases from suppliers",
    icon: ShoppingCart,
  },
  {
    value: "expenses",
    label: "Expense Report",
    description: "View your business expenses",
    icon: TrendingDown,
  },
];

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const Reports = () => {
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

  /* ------------------------------------------------------------------------ */
  /*                              FETCH REPORTS                               */
  /* ------------------------------------------------------------------------ */

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch independently so one failed endpoint does not hide
      // successful data from the other reports.
      const results = await Promise.allSettled([
        fetchReportData("/api/sales", "sales"),
        fetchReportData("/api/purchases", "purchases"),
        fetchReportData("/api/expenses", "expenses"),
      ]);

      const [salesResult, purchasesResult, expensesResult] = results;

      const errors = [];

      if (salesResult.status === "fulfilled") {
        setSalesData(normalizeSales(salesResult.value));
      } else {
        setSalesData([]);
        errors.push(
          `Sales: ${salesResult.reason?.message || "Failed to load"}`,
        );
      }

      if (purchasesResult.status === "fulfilled") {
        setPurchaseData(normalizePurchases(purchasesResult.value));
      } else {
        setPurchaseData([]);
        errors.push(
          `Purchases: ${purchasesResult.reason?.message || "Failed to load"}`,
        );
      }

      if (expensesResult.status === "fulfilled") {
        setExpenseData(normalizeExpenses(expensesResult.value));
      } else {
        setExpenseData([]);
        errors.push(
          `Expenses: ${expensesResult.reason?.message || "Failed to load"}`,
        );
      }

      if (errors.length) {
        setError(errors.join(" "));
      }
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports, refreshKey]);

  /* ------------------------------------------------------------------------ */
  /*                              ACTIVE REPORT                               */
  /* ------------------------------------------------------------------------ */

  const activeReport = useMemo(() => {
    switch (reportType) {
      case "expenses":
        return expenseData;

      case "purchases":
        return purchaseData;

      default:
        return salesData;
    }
  }, [reportType, salesData, purchaseData, expenseData]);

  /* ------------------------------------------------------------------------ */
  /*                              FILTERED DATA                               */
  /* ------------------------------------------------------------------------ */

  const filteredData = useMemo(() => {
    return activeReport.filter((item) => {
      if (!item.date) return false;

      return item.date >= appliedStartDate && item.date <= appliedEndDate;
    });
  }, [activeReport, appliedStartDate, appliedEndDate]);

  /*
   * Cancelled purchases/expenses and returned sales remain visible
   * in the table but do not count toward active business totals.
   */
  const reportableData = useMemo(() => {
    return filteredData.filter((item) => {
      const status = normalizeStatus(item.status);

      if (reportType === "sales") {
        return status === "completed";
      }

      if (reportType === "purchases") {
        return status !== "cancelled" && status !== "canceled";
      }

      return status !== "cancelled" && status !== "canceled";
    });
  }, [filteredData, reportType]);

  /* ------------------------------------------------------------------------ */
  /*                                SUMMARY                                   */
  /* ------------------------------------------------------------------------ */

  const reportSummary = useMemo(() => {
    const totalAmount = reportableData.reduce(
      (total, item) => total + toNumber(item.amount),
      0,
    );

    const paidAmount = reportableData.reduce(
      (total, item) => total + toNumber(item.paidAmount),
      0,
    );

    const pendingAmount = reportableData.reduce(
      (total, item) => total + toNumber(item.pendingAmount),
      0,
    );

    const totalQuantity = reportableData.reduce(
      (total, item) => total + toNumber(item.quantity),
      0,
    );

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      totalQuantity,
      totalRecords: reportableData.length,
    };
  }, [reportableData]);

  /* ------------------------------------------------------------------------ */
  /*                              CHART DATA                                  */
  /* ------------------------------------------------------------------------ */

  const categoryChartData = useMemo(() => {
    const groupedData = {};

    reportableData.forEach((item) => {
      if (reportType === "expenses") {
        const category = item.category || "Other";
        groupedData[category] =
          (groupedData[category] || 0) + toNumber(item.amount);

        return;
      }

      // Group sales and purchases by individual product instead
      // of combining all products under a single transaction total.
      const items = Array.isArray(item.items) ? item.items : [];

      if (!items.length) {
        const fallbackName = item.product || "Other";
        groupedData[fallbackName] =
          (groupedData[fallbackName] || 0) + toNumber(item.amount);

        return;
      }

      items.forEach((product) => {
        const name = product.product_name || product.product?.name || "Other";
        const amount = toNumber(product.total_price);

        groupedData[name] = (groupedData[name] || 0) + amount;
      });
    });

    return Object.entries(groupedData)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [reportableData, reportType]);

  const paymentChartData = useMemo(
    () => [
      { name: "Paid", value: reportSummary.paidAmount },
      { name: "Pending", value: reportSummary.pendingAmount },
    ],
    [reportSummary],
  );

  const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#9333ea", "#ef4444"];

  /* ------------------------------------------------------------------------ */
  /*                              FILTER ACTIONS                              */
  /* ------------------------------------------------------------------------ */

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      setError("Please select both start date and end date.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after the end date.");
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

  const handlePrint = () => {
    window.print();
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    setError("");
  };

  /* ------------------------------------------------------------------------ */
  /*                                  RENDER                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 print:bg-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Reports
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Analyze your business performance and financial activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <Filter size={17} />
              {showFilters ? "Close Filter" : "Filter Dates"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Printer size={17} />
              Print Report
            </button>

            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
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
                onClick={() => handleReportTypeChange(option.value)}
                className={`rounded-2xl border p-5 text-left transition ${
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
                      Selected
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-lg font-bold">{option.label}</h2>

                <p
                  className={`mt-1 text-sm ${
                    isActive ? "text-blue-100" : "text-slate-500"
                  }`}
                >
                  {option.description}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* API Error */}
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
              Try again
            </button>
          </div>
        )}

        {/* Filter Panel */}
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
                  Filter Report by Date
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select the date range for the report.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
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
                  Start Date
                </label>

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  End Date
                </label>

                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                Apply Filter
              </button>

              <button
                type="button"
                onClick={resetDateFilter}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw size={17} />
                Reset
              </button>
            </div>
          </motion.div>
        )}

        {/* Active Date Range */}
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center print:border-slate-200 print:bg-white">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <CalendarDays size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Active Date Range
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
            Reset Dates
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-500 shadow-sm">
            Loading reports from your store...
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title={
              reportType === "sales"
                ? "Total Sales"
                : reportType === "purchases"
                  ? "Total Purchases"
                  : "Total Expenses"
            }
            value={formatMoney(reportSummary.totalAmount)}
            icon={Wallet}
            color="blue"
          />

          <SummaryCard
            title="Paid Amount"
            value={formatMoney(reportSummary.paidAmount)}
            icon={TrendingUp}
            color="green"
          />

          <SummaryCard
            title="Pending Amount"
            value={formatMoney(reportSummary.pendingAmount)}
            icon={TrendingDown}
            color="orange"
          />

          <SummaryCard
            title={
              reportType === "expenses" ? "Total Records" : "Total Quantity"
            }
            value={
              reportType === "expenses"
                ? reportSummary.totalRecords
                : reportSummary.totalQuantity
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
                  ? "Expenses by Category"
                  : "Amount by Product"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Overview of amounts in the selected date range.
              </p>
            </div>

            {loading ? (
              <ChartLoading />
            ) : categoryChartData.length === 0 ? (
              <EmptyChart />
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
                      tickFormatter={(value) => formatMoney(value)}
                    />

                    <Tooltip
                      formatter={(value) => [formatMoney(value), "Amount"]}
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
                Payment Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Paid and pending amounts.
              </p>
            </div>

            {loading ? (
              <ChartLoading />
            ) : reportSummary.paidAmount + reportSummary.pendingAmount === 0 ? (
              <EmptyChart />
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
                            fill={entry.name === "Paid" ? "#16a34a" : "#f59e0b"}
                          />
                        ))}
                    </Pie>

                    <Tooltip
                      formatter={(value) => [formatMoney(value), "Amount"]}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {reportType === "sales"
                  ? "Sales Transactions"
                  : reportType === "purchases"
                    ? "Purchase Transactions"
                    : "Expense Transactions"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "Loading records..."
                  : `${filteredData.length} record${filteredData.length !== 1 ? "s" : ""} found.`}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 print:hidden"
            >
              <Download size={16} />
              Print Table
            </button>
          </div>

          {loading ? (
            <TableLoading />
          ) : reportType === "sales" ? (
            <SalesTable data={filteredData} />
          ) : reportType === "purchases" ? (
            <PurchasesTable data={filteredData} />
          ) : (
            <ExpensesTable data={filteredData} />
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

/* -------------------------------------------------------------------------- */
/*                               SUMMARY CARD                                 */
/* -------------------------------------------------------------------------- */

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

  const selectedColor = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{title}</p>

        <div className={`rounded-xl p-3 ${selectedColor.icon}`}>
          <Icon size={20} />
        </div>
      </div>

      <h3 className={`mt-4 text-2xl font-bold ${selectedColor.value}`}>
        {value}
      </h3>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                SALES TABLE                                 */
/* -------------------------------------------------------------------------- */

const SalesTable = ({ data }) => {
  if (!data.length) return <EmptyTable />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4 font-semibold">Sale Number</th>
            <th className="px-5 py-4 font-semibold">Customer</th>
            <th className="px-5 py-4 font-semibold">Product</th>
            <th className="px-5 py-4 font-semibold">Quantity</th>
            <th className="px-5 py-4 font-semibold">Amount</th>
            <th className="px-5 py-4 font-semibold">Paid</th>
            <th className="px-5 py-4 font-semibold">Due</th>
            <th className="px-5 py-4 font-semibold">Payment</th>
            <th className="px-5 py-4 font-semibold">Date</th>
            <th className="px-5 py-4 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="transition hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                {item.number}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                {item.customer}
              </td>

              <td className="min-w-[200px] px-5 py-4 text-slate-600">
                {item.product}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {item.quantity}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                {formatMoney(item.amount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-green-700">
                {formatMoney(item.paidAmount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-orange-700">
                {formatMoney(item.pendingAmount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {item.paymentMethod}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {formatDate(item.date)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              PURCHASES TABLE                               */
/* -------------------------------------------------------------------------- */

const PurchasesTable = ({ data }) => {
  if (!data.length) return <EmptyTable />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4 font-semibold">Purchase Number</th>
            <th className="px-5 py-4 font-semibold">Supplier</th>
            <th className="px-5 py-4 font-semibold">Product</th>
            <th className="px-5 py-4 font-semibold">Quantity</th>
            <th className="px-5 py-4 font-semibold">Amount</th>
            <th className="px-5 py-4 font-semibold">Paid</th>
            <th className="px-5 py-4 font-semibold">Due</th>
            <th className="px-5 py-4 font-semibold">Payment</th>
            <th className="px-5 py-4 font-semibold">Date</th>
            <th className="px-5 py-4 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="transition hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                {item.number}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                {item.supplier}
              </td>

              <td className="min-w-[200px] px-5 py-4 text-slate-600">
                {item.product}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {item.quantity}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                {formatMoney(item.amount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-green-700">
                {formatMoney(item.paidAmount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-orange-700">
                {formatMoney(item.pendingAmount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {item.paymentStatus}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {formatDate(item.date)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               EXPENSES TABLE                               */
/* -------------------------------------------------------------------------- */

const ExpensesTable = ({ data }) => {
  if (!data.length) return <EmptyTable />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4 font-semibold">Expense Number</th>
            <th className="px-5 py-4 font-semibold">Title</th>
            <th className="px-5 py-4 font-semibold">Category</th>
            <th className="px-5 py-4 font-semibold">Description</th>
            <th className="px-5 py-4 font-semibold">Amount</th>
            <th className="px-5 py-4 font-semibold">Payment</th>
            <th className="px-5 py-4 font-semibold">Date</th>
            <th className="px-5 py-4 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="transition hover:bg-slate-50">
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                {item.number}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                {item.title}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {item.category}
              </td>

              <td className="min-w-[220px] px-5 py-4 text-slate-600">
                {item.description}
              </td>

              <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                {formatMoney(item.amount)}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {item.paymentMethod}
              </td>

              <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                {formatDate(item.date)}
              </td>

              <td className="whitespace-nowrap px-5 py-4">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               STATUS BADGE                                 */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
      status,
    )}`}
  >
    {status || "Unknown"}
  </span>
);

/* -------------------------------------------------------------------------- */
/*                               LOADING STATES                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                EMPTY STATES                                */
/* -------------------------------------------------------------------------- */

const EmptyChart = () => (
  <div className="flex h-72 flex-col items-center justify-center text-center">
    <div className="rounded-full bg-slate-100 p-4 text-slate-400">
      <FileText size={28} />
    </div>

    <h3 className="mt-4 font-semibold text-slate-700">No chart data</h3>

    <p className="mt-1 text-sm text-slate-500">
      There is no data for the selected date range.
    </p>
  </div>
);

const EmptyTable = () => (
  <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
    <div className="rounded-full bg-slate-100 p-4 text-slate-400">
      <FileText size={30} />
    </div>

    <h3 className="mt-4 text-lg font-bold text-slate-800">No records found</h3>

    <p className="mt-1 max-w-md text-sm text-slate-500">
      There are no records available for the selected date range. Try changing
      the start date or end date.
    </p>
  </div>
);

export default Reports;
