import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  X,
  Wallet,
  ReceiptText,
  CalendarDays,
  UserRound,
  Building2,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronDown,
  CircleDollarSign,
  TrendingDown,
  FileText,
} from "lucide-react";

const formatMoney = (amount) => {
  return `${Number(amount).toLocaleString()} AFN`;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const paymentStatusStyles = {
  Paid: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

const paymentStatusIcon = (status) => {
  if (status === "Paid") return <CheckCircle2 size={14} />;
  if (status === "Pending") return <Clock3 size={14} />;
  return <XCircle size={14} />;
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch("http://localhost:3000/api/expenses", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "The request failed");
      }

      // Supports an API response containing either { expenses: [...] }
      // or a direct array of expenses.
      const records = Array.isArray(data) ? data : data.expenses;

      if (!Array.isArray(records)) {
        throw new Error("The server returned an unexpected expenses response");
      }

      const formattedExpenses = records.map((expense) => ({
        ...expense,
        // Keep the numeric database ID for deletion.
        id: expense.id,
        // Keep the readable expense number for display.
        expenseNumber: expense.expense_number ?? expense.expenseNumber ?? "",
        amount: Number(expense.amount),
        expenseDate: String(
          expense.expense_date ?? expense.expenseDate ?? "",
        ).slice(0, 10),
        paymentMethod: expense.payment_method ?? expense.paymentMethod ?? "",
        paidBy: expense.paid_by ?? expense.paidBy ?? "",
        reference: expense.reference ?? "",
        description: expense.description ?? "",
      }));

      setExpenses(formattedExpenses);
    } catch (error) {
      console.error("Fetch expenses error:", error);
      setLoadError(error.message || "Could not load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // New date filter
  const [selectedDate, setSelectedDate] = useState("");

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const searchableText = `
        ${expense.id}
        ${expense.expenseNumber}
        ${expense.title}
        ${expense.category}
        ${expense.paymentMethod}
        ${expense.reference}
        ${expense.expenseDate}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || expense.status === statusFilter;

      const matchesDate =
        selectedDate === "" || expense.expenseDate === selectedDate;

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter, selectedDate]);

  // Summary values now use filtered expenses
  const totalExpenses = filteredExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );

  const paidExpenses = filteredExpenses
    .filter((expense) => expense.status === "Paid")
    .reduce((total, expense) => total + expense.amount, 0);

  const pendingExpenses = filteredExpenses
    .filter((expense) => expense.status === "Pending")
    .reduce((total, expense) => total + expense.amount, 0);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const currentMonthExpenses = filteredExpenses.filter((expense) =>
    expense.expenseDate.startsWith(currentMonth),
  ).length;

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All");
    setStatusFilter("All");
    setSelectedDate("");
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete || deleting) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `http://localhost:3000/api/expenses/${expenseToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "The request failed");
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== expenseToDelete.id),
      );

      setSelectedExpense((current) =>
        current?.id === expenseToDelete.id ? null : current,
      );

      setExpenseToDelete(null);
      toast.success(data.message || "Expense deleted successfully");
    } catch (error) {
      console.error("Delete expense error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Wallet size={16} />
            <span>Financial Management</span>
            <span>/</span>
            <span className="text-slate-700">Expenses</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Expenses
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Track shop expenses, payments and business costs.
          </p>
        </div>

        <Link
          to="/dashboard/expenses/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Expense
        </Link>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Expenses"
          value={formatMoney(totalExpenses)}
          description={
            selectedDate
              ? `Expenses on ${formatDate(selectedDate)}`
              : "All matching expenses"
          }
          icon={<ReceiptText size={21} />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
        />

        <SummaryCard
          title="Paid Expenses"
          value={formatMoney(paidExpenses)}
          description="Expenses already paid"
          icon={<CheckCircle2 size={21} />}
          iconBackground="bg-emerald-100"
          iconColor="text-emerald-600"
        />

        <SummaryCard
          title="Pending Expenses"
          value={formatMoney(pendingExpenses)}
          description="Expenses waiting for payment"
          icon={<Clock3 size={21} />}
          iconBackground="bg-amber-100"
          iconColor="text-amber-600"
        />

        <SummaryCard
          title="Expense Records"
          value={currentMonthExpenses}
          description="Records in the current month"
          icon={<TrendingDown size={21} />}
          iconBackground="bg-violet-100"
          iconColor="text-violet-600"
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {/* Search */}
            <div className="relative w-full xl:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search expense or reference..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category and Status Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Filter
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-48"
                >
                  <option value="All">All Categories</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salary">Salary</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <CircleDollarSign
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="expense-date-filter"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <CalendarDays size={16} className="text-slate-500" />
                Filter by Date
              </label>

              <input
                id="expense-date-filter"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading expenses...
        </div>
      )}

      {!loading && loadError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={fetchExpenses}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <>
          {/* Desktop Table */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Expense Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredExpenses.length} expense
                  {filteredExpenses.length !== 1 ? "s" : ""} found
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                Showing {filteredExpenses.length} of {expenses.length}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Expense</th>
                    <th className="px-5 py-4 font-semibold">Category</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Payment Method</th>
                    <th className="px-5 py-4 font-semibold">Amount</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((expense, index) => (
                    <motion.tr
                      key={expense.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {expense.title}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {expense.expenseNumber || `EXP-${expense.id}`} ·{" "}
                          {expense.reference}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {expense.category}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(expense.expenseDate)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {expense.paymentMethod}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {formatMoney(expense.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            paymentStatusStyles[expense.status]
                          }`}
                        >
                          {paymentStatusIcon(expense.status)}
                          {expense.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedExpense(expense)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            title="View expense"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(expense)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            title="Delete expense"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length === 0 && <EmptyState />}
          </motion.div>

          {/* Mobile Cards */}
          <div className="space-y-4 lg:hidden">
            {filteredExpenses.length === 0 ? (
              <EmptyState />
            ) : (
              filteredExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">
                        {expense.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {expense.expenseNumber || `EXP-${expense.id}`} ·{" "}
                        {expense.reference}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        paymentStatusStyles[expense.status]
                      }`}
                    >
                      {paymentStatusIcon(expense.status)}
                      {expense.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Category</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {expense.category}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Amount</p>

                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatMoney(expense.amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Date</p>

                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                        <CalendarDays size={14} className="text-slate-400" />
                        {formatDate(expense.expenseDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Payment Method</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {expense.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedExpense(expense)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(expense)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2.5 text-rose-600 transition hover:bg-rose-50"
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedExpense && (
          <ModalOverlay onClose={() => setSelectedExpense(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Expense Details
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {selectedExpense.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedExpense.expenseNumber ||
                      `EXP-${selectedExpense.id}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    icon={<ReceiptText size={16} />}
                    label="Reference"
                    value={selectedExpense.reference}
                  />

                  <DetailItem
                    icon={<Building2 size={16} />}
                    label="Category"
                    value={selectedExpense.category}
                  />

                  <DetailItem
                    icon={<CalendarDays size={16} />}
                    label="Expense Date"
                    value={formatDate(selectedExpense.expenseDate)}
                  />

                  <DetailItem
                    icon={<Wallet size={16} />}
                    label="Payment Method"
                    value={selectedExpense.paymentMethod}
                  />

                  <DetailItem
                    icon={<UserRound size={16} />}
                    label="Paid By"
                    value={selectedExpense.paidBy}
                  />

                  <DetailItem
                    icon={<CircleDollarSign size={16} />}
                    label="Status"
                    value={selectedExpense.status}
                  />
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-700">
                    Expense Amount
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {formatMoney(selectedExpense.amount)}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText size={17} className="text-slate-500" />

                    <h3 className="font-semibold text-slate-900">
                      Description
                    </h3>
                  </div>

                  <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {selectedExpense.description || "No description available."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {expenseToDelete && (
          <ModalOverlay onClose={() => setExpenseToDelete(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Trash2 size={22} />
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                Delete Expense?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-700">
                  {expenseToDelete.title}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteExpense}
                  disabled={deleting}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Expense"}
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  description,
  icon,
  iconBackground,
  iconColor,
}) => {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 break-words text-xl font-bold text-slate-900 sm:text-2xl">
            {value}
          </h3>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground} ${iconColor}`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

const DetailItem = ({ icon, label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>

      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
};

const EmptyState = () => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Wallet size={25} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">No expenses found</h3>

      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or filter options.
      </p>
    </div>
  );
};

const ModalOverlay = ({ children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className="flex w-full justify-center"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default Expenses;
