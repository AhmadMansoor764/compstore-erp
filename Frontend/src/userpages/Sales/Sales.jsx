import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

import {
  Search,
  Plus,
  ShoppingCart,
  DollarSign,
  Clock3,
  CheckCircle2,
  MoreVertical,
  Pencil,
  CalendarDays,
  ReceiptText,
  ChevronDown,
  FileText,
  RotateCcw,
  RefreshCw,
  X,
  Monitor,
  Eye,
  Phone,
  Package,
  Wallet,
} from "lucide-react";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const formatMoney = (amount) =>
  `$${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(`${String(date).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusClasses = (status) => {
  if (status === "Paid") return "bg-emerald-100 text-emerald-700";
  if (status === "Partial") return "bg-amber-100 text-amber-700";
  if (status === "Returned") return "bg-slate-100 text-slate-700";
  return "bg-red-100 text-red-700";
};

const getStatusIcon = (status) => {
  if (status === "Paid") return CheckCircle2;
  if (status === "Returned") return RotateCcw;
  return Clock3;
};

const getTranslatedStatus = (status, t) => {
  const keys = {
    Paid: "sales.paid",
    Partial: "sales.partial",
    Pending: "sales.pending",
    Returned: "sales.returned",
  };

  return keys[status] ? t(keys[status]) : status;
};

/* -------------------------------------------------------------------------- */
/* SMALL REUSABLE COMPONENTS                                                  */
/* -------------------------------------------------------------------------- */

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBackground,
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4 }}
    className="rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-600">
          {title}
        </p>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {value}
        </h2>

        {subtitle && (
          <p className="mt-2 text-xs font-medium text-slate-500">{subtitle}</p>
        )}
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground}`}
      >
        <Icon size={22} className={iconColor} />
      </div>
    </div>
  </motion.div>
);

const DetailRow = ({ label, value, valueClass = "" }) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <span className="text-sm text-slate-500">{label}</span>
    <span
      className={`break-words text-right text-sm font-semibold text-slate-800 ${valueClass}`}
    >
      {value ?? "—"}
    </span>
  </div>
);

/* -------------------------------------------------------------------------- */
/* SALES PAGE                                                                 */
/* -------------------------------------------------------------------------- */

const Sales = () => {
  const { t } = useLanguage();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [returningSaleId, setReturningSaleId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [dateFilter, setDateFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const [saleToReturn, setSaleToReturn] = useState(null);
  const [saleToView, setSaleToView] = useState(null);

  /* ------------------------------------------------------------------------ */
  /* FETCH SALES                                                              */
  /* ------------------------------------------------------------------------ */

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: "GET",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || t("sales.failedLoad"),
        );
      }

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data.sales)
          ? data.sales
          : [];

      const mappedSales = records.map((sale) => {
        const total = Number(sale.total_amount ?? 0);
        const paid = Number(sale.paid_amount ?? 0);
        const due = Number(sale.due_amount ?? Math.max(0, total - paid));

        const backendStatus = String(sale.payment_status || "").toLowerCase();

        let paymentStatus;

        if (backendStatus === "paid" || due <= 0) {
          paymentStatus = "Paid";
        } else if (backendStatus === "partial" || paid > 0) {
          paymentStatus = "Partial";
        } else {
          paymentStatus = "Pending";
        }

        const saleStatus = String(sale.status || "Completed");

        return {
          id: sale.id,
          saleNumber: sale.sale_number || `SALE-${sale.id}`,
          customer: sale.customer_name || "",
          customerPhone: sale.customer_phone || "",
          date: String(sale.sale_date || sale.created_at || "").slice(0, 10),

          items: (sale.items || []).map((item) => ({
            id: item.id,
            productId: item.product_id,
            name: item.product_name || t("sales.unnamedProduct"),
            quantity: Number(item.quantity || 0),
            price: Number(item.unit_price || 0),
            purchasePrice:
              item.purchase_price == null ? null : Number(item.purchase_price),
            totalPrice: Number(
              item.total_price ??
                Number(item.quantity || 0) * Number(item.unit_price || 0),
            ),
          })),

          subtotal: Number(sale.subtotal || 0),
          discount: Number(sale.discount || 0),
          total,
          paid,
          due: Math.max(0, due),
          paymentMethod: sale.payment_method || "—",
          paymentStatus,
          status:
            saleStatus.toLowerCase() === "returned"
              ? "Returned"
              : paymentStatus,
          saleStatus,
          createdAt: sale.created_at,
        };
      });

      setSales(mappedSales);
    } catch (err) {
      const message = err.message || t("sales.unableLoad");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  /* ------------------------------------------------------------------------ */
  /* STATISTICS                                                               */
  /* ------------------------------------------------------------------------ */

  const activeSales = sales.filter(
    (sale) => sale.saleStatus.toLowerCase() !== "returned",
  );

  const totalSales = activeSales.length;

  const totalRevenue = activeSales.reduce(
    (total, sale) => total + sale.total,
    0,
  );

  const totalPaid = activeSales.reduce((total, sale) => total + sale.paid, 0);

  const totalPending = activeSales.reduce((total, sale) => total + sale.due, 0);

  /* ------------------------------------------------------------------------ */
  /* SEARCH AND FILTER                                                        */
  /* ------------------------------------------------------------------------ */

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const searchValue = searchTerm.trim().toLowerCase();

      const matchesSearch =
        String(sale.saleNumber || sale.id)
          .toLowerCase()
          .includes(searchValue) ||
        String(sale.customer || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(sale.customerPhone || "")
          .toLowerCase()
          .includes(searchValue) ||
        sale.items.some((item) =>
          String(item.name || "")
            .toLowerCase()
            .includes(searchValue),
        );

      const matchesStatus =
        statusFilter === "All Status" || sale.status === statusFilter;

      const matchesDate = !dateFilter || sale.date === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [sales, searchTerm, statusFilter, dateFilter]);

  /* ------------------------------------------------------------------------ */
  /* VIEW SALE DETAILS                                                        */
  /* ------------------------------------------------------------------------ */

  const handleViewDetails = async (sale) => {
    setOpenMenuId(null);
    setSaleToView(sale);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/${sale.id}`, {
        method: "GET",
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || t("sales.additionalDetailsError"),
        );
      }

      const record = data.sale || data;

      setSaleToView((current) => {
        if (!current || String(current.id) !== String(sale.id)) {
          return current;
        }

        const total = Number(record.total_amount ?? current.total);
        const paid = Number(record.paid_amount ?? current.paid);
        const due = Number(record.due_amount ?? Math.max(0, total - paid));

        const recordStatus = String(record.status ?? current.saleStatus);

        return {
          ...current,
          customer: record.customer_name ?? current.customer,
          customerPhone: record.customer_phone ?? current.customerPhone,
          date: String(
            record.sale_date || record.created_at || current.date,
          ).slice(0, 10),
          subtotal: Number(record.subtotal ?? current.subtotal),
          discount: Number(record.discount ?? current.discount),
          total,
          paid,
          due: Math.max(0, due),
          paymentMethod: record.payment_method ?? current.paymentMethod,
          saleStatus: recordStatus,
          status:
            recordStatus.toLowerCase() === "returned"
              ? "Returned"
              : current.status,
          items: Array.isArray(record.items)
            ? record.items.map((item) => ({
                id: item.id,
                productId: item.product_id,
                name: item.product_name || t("sales.unnamedProduct"),
                quantity: Number(item.quantity || 0),
                price: Number(item.unit_price || 0),
                purchasePrice:
                  item.purchase_price == null
                    ? null
                    : Number(item.purchase_price),
                totalPrice: Number(
                  item.total_price ??
                    Number(item.quantity || 0) * Number(item.unit_price || 0),
                ),
              }))
            : current.items,
        };
      });
    } catch (err) {
      console.error("Failed to load full sale details:", err);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RETURN SALE                                                              */
  /* ------------------------------------------------------------------------ */

  const handleReturn = (saleId) => {
    const sale = sales.find((item) => String(item.id) === String(saleId));

    if (!sale) return;

    if (sale.saleStatus.toLowerCase() === "returned") {
      toast.error(t("sales.alreadyReturned"));
      setOpenMenuId(null);
      return;
    }

    setSaleToReturn(sale);
    setOpenMenuId(null);
  };

  const confirmReturn = async () => {
    if (!saleToReturn || returningSaleId !== null) return;

    const sale = saleToReturn;

    try {
      setReturningSaleId(sale.id);

      const response = await fetch(
        `${API_BASE_URL}/api/sales/${sale.id}/return`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || t("sales.failedReturn"),
        );
      }

      toast.success(
        typeof data === "object" && data.message
          ? data.message
          : t("sales.returnedSuccess"),
      );

      setSaleToReturn(null);
      setSaleToView(null);
      await fetchSales();
    } catch (err) {
      toast.error(err.message || t("sales.failedReturn"));
    } finally {
      setReturningSaleId(null);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* CLEAR FILTERS                                                            */
  /* ------------------------------------------------------------------------ */

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All Status");
    setDateFilter("");
  };

  /* ------------------------------------------------------------------------ */
  /* SALE ACTIONS                                                             */
  /* ------------------------------------------------------------------------ */

  const renderSaleActions = (sale, mobile = false) => {
    const baseClass = mobile
      ? "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
      : "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition";

    return (
      <>
        <button
          type="button"
          onClick={() => handleViewDetails(sale)}
          className={`${baseClass} ${
            mobile
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Eye size={16} />
          {t("sales.viewDetailsAction")}
        </button>

        <Link
          to={`/dashboard/sales/replace/${sale.id}`}
          onClick={() => setOpenMenuId(null)}
          className={`${baseClass} ${
            mobile
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "text-blue-700 hover:bg-blue-50"
          }`}
        >
          <RefreshCw size={16} />
          {t("sales.replace")}
        </Link>

        <button
          type="button"
          disabled={
            returningSaleId === sale.id ||
            sale.saleStatus.toLowerCase() === "returned"
          }
          onClick={() => handleReturn(sale.id)}
          className={`${baseClass} ${
            mobile
              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
              : "text-orange-700 hover:bg-orange-50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <RotateCcw size={16} />
          {returningSaleId === sale.id
            ? t("sales.returning")
            : sale.saleStatus.toLowerCase() === "returned"
              ? t("sales.returned")
              : t("sales.return")}
        </button>

        <Link
          to={`/dashboard/sales/edit/${sale.id}`}
          onClick={() => setOpenMenuId(null)}
          className={`${baseClass} ${
            mobile
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Pencil size={16} />
          {t("sales.edit")}
        </Link>
      </>
    );
  };

  /* ------------------------------------------------------------------------ */
  /* PAGE                                                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">
            {t("sales.management")}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {t("sales.title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {t("sales.description")}
          </p>
        </div>

        <Link
          to="/dashboard/sales/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          <Plus size={19} />
          {t("sales.newSale")}
        </Link>
      </motion.div>

      {/* Statistics */}
      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title={t("sales.totalSales")}
          value={totalSales.toLocaleString()}
          subtitle={t("sales.salesExcludingReturns")}
          icon={ShoppingCart}
          iconColor="text-blue-700"
          iconBackground="bg-blue-100"
        />

        <StatCard
          title={t("sales.totalRevenue")}
          value={formatMoney(totalRevenue)}
          subtitle={t("sales.totalSalesAmount")}
          icon={DollarSign}
          iconColor="text-emerald-700"
          iconBackground="bg-emerald-100"
        />

        <StatCard
          title={t("sales.paidAmount")}
          value={formatMoney(totalPaid)}
          subtitle={t("sales.amountReceived")}
          icon={CheckCircle2}
          iconColor="text-blue-700"
          iconBackground="bg-blue-100"
        />

        <StatCard
          title={t("sales.pendingAmount")}
          value={formatMoney(totalPending)}
          subtitle={t("sales.amountRemaining")}
          icon={Clock3}
          iconColor="text-red-700"
          iconBackground="bg-red-100"
        />
      </motion.section>

      {/* Sales Table */}
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm"
      >
        <div className="border-b border-[#c8cce0] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
                {t("sales.transactions")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("sales.reviewTransactions")}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ReceiptText size={18} />
              <span>
                {filteredSales.length} {t("sales.transactionsFound")}
              </span>

              <button
                type="button"
                onClick={fetchSales}
                disabled={loading}
                className="ml-2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                title={t("sales.refreshSales")}
                aria-label={t("sales.refreshSales")}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="relative">
              <Search
                size={19}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("sales.searchPlaceholder")}
                className="h-11 w-full rounded-xl border border-[#c8cce0] bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-[#c8cce0] bg-white px-4 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All Status">{t("sales.allStatus")}</option>
                <option value="Paid">{t("sales.paid")}</option>
                <option value="Partial">{t("sales.partial")}</option>
                <option value="Pending">{t("sales.pending")}</option>
                <option value="Returned">{t("sales.returned")}</option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#c8cce0] bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            {t("sales.loading")}
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <FileText size={27} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              {t("sales.loadErrorTitle")}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchSales}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t("sales.tryAgain")}
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr className="bg-[#f8f8ff] text-left">
                    {[
                      ["saleId", "Sale ID"],
                      ["customer", "Customer"],
                      ["product", "Computer / Product"],
                      ["date", "Date"],
                      ["total", "Total"],
                      ["paidShort", "Paid"],
                      ["remaining", "Remaining"],
                      ["status", "Status"],
                      ["action", "Action"],
                    ].map(([key, fallback]) => (
                      <th
                        key={key}
                        className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600 ${
                          key === "action" ? "text-right" : ""
                        }`}
                      >
                        {t(`sales.${key}`) || fallback}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => {
                    const StatusIcon = getStatusIcon(sale.status);

                    return (
                      <tr
                        key={sale.id}
                        className="border-t border-[#e2e5f0] transition hover:bg-[#fafbff]"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-blue-700">
                            {sale.saleNumber}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-950">
                            {sale.customer}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {sale.customerPhone || t("sales.noPhone")}
                          </p>
                        </td>

                        <td className="max-w-[250px] px-6 py-4">
                          <div className="space-y-2">
                            {sale.items.slice(0, 2).map((item, index) => (
                              <div
                                key={`${item.id || item.productId}-${index}`}
                              >
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {t("sales.qty")}: {item.quantity} ·{" "}
                                  {formatMoney(item.price)} {t("sales.each")}
                                </p>
                              </div>
                            ))}

                            {sale.items.length > 2 && (
                              <p className="text-xs font-semibold text-blue-700">
                                +{sale.items.length - 2} {t("sales.moreItems")}
                              </p>
                            )}

                            {sale.items.length === 0 && (
                              <span className="text-sm text-slate-400">
                                {t("sales.noItems")}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleViewDetails(sale)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            <Eye size={14} />
                            {t("sales.viewDetails")}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {formatDate(sale.date)}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold text-slate-950">
                          {formatMoney(sale.total)}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                          {formatMoney(sale.paid)}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-red-600">
                          {formatMoney(sale.due)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                              sale.status,
                            )}`}
                          >
                            <StatusIcon size={14} />
                            {getTranslatedStatus(sale.status, t)}
                          </span>
                        </td>

                        <td className="relative px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === sale.id ? null : sale.id,
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            aria-label={`${t("sales.actionsFor")} ${sale.saleNumber}`}
                          >
                            <MoreVertical size={19} />
                          </button>

                          <AnimatePresence>
                            {openMenuId === sale.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-5 top-14 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl"
                              >
                                {renderSaleActions(sale)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile and Tablet Cards */}
            <div className="divide-y divide-[#e2e5f0] lg:hidden">
              {filteredSales.map((sale) => {
                const StatusIcon = getStatusIcon(sale.status);

                return (
                  <div key={sale.id} className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef0fb] text-blue-700">
                          <ShoppingCart size={21} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-blue-700 sm:text-base">
                            {sale.saleNumber}
                          </p>
                          <h3 className="mt-1 truncate text-sm font-bold text-slate-950 sm:text-base">
                            {sale.customer}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDate(sale.date)}
                          </p>
                          {sale.customerPhone && (
                            <p className="mt-1 text-xs text-slate-500">
                              {sale.customerPhone}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(openMenuId === sale.id ? null : sale.id)
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                        aria-label={`${t("sales.actionsFor")} ${sale.saleNumber}`}
                      >
                        <MoreVertical size={19} />
                      </button>
                    </div>

                    {/* Sold products */}
                    <div className="mt-4 space-y-2">
                      {sale.items.length > 0 ? (
                        sale.items.map((item, index) => (
                          <div
                            key={`${item.id || item.productId}-${index}`}
                            className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                              <Monitor size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-semibold text-slate-900">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {t("sales.quantity")}: {item.quantity} ·{" "}
                                {formatMoney(item.price)} {t("sales.each")}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">
                          {t("sales.noItems")}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {t("sales.total")}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-950">
                          {formatMoney(sale.total)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {t("sales.paidShort")}
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          {formatMoney(sale.paid)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {t("sales.remaining")}
                        </p>
                        <p className="mt-1 text-sm font-bold text-red-600">
                          {formatMoney(sale.due)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {t("sales.status")}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                            sale.status,
                          )}`}
                        >
                          <StatusIcon size={13} />
                          {getTranslatedStatus(sale.status, t)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewDetails(sale)}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Eye size={16} />
                      {t("sales.viewSaleDetails")}
                    </button>

                    <AnimatePresence>
                      {openMenuId === sale.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                            {renderSaleActions(sale, true)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredSales.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <FileText size={27} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  {t("sales.noSales")}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {sales.length === 0
                    ? t("sales.createFirstSale")
                    : t("sales.changeFilters")}
                </p>

                {sales.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    {t("sales.clearFilters")}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </motion.section>

      {/* ------------------------------------------------------------------ */}
      {/* VIEW SALE DETAILS MODAL                                             */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence>
        {saleToView && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSaleToView(null);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sale-details-title"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white p-5 sm:p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <ReceiptText size={22} />
                  </div>

                  <div className="min-w-0">
                    <h2
                      id="sale-details-title"
                      className="text-lg font-bold text-slate-950 sm:text-xl"
                    >
                      {t("sales.saleDetails")}
                    </h2>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {saleToView.saleNumber}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSaleToView(null)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={t("sales.closeSaleDetails")}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {/* Customer Details */}
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Phone size={17} className="text-blue-600" />
                    {t("sales.customerInfo")}
                  </h3>

                  <div className="rounded-xl border border-slate-200 px-4">
                    <DetailRow
                      label={t("sales.customer")}
                      value={saleToView.customer}
                    />
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.phone")}
                        value={
                          saleToView.customerPhone || t("sales.notProvided")
                        }
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.saleDate")}
                        value={formatDate(saleToView.date)}
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.saleStatus")}
                        value={
                          saleToView.saleStatus.toLowerCase() === "returned"
                            ? t("sales.returned")
                            : saleToView.saleStatus
                        }
                        valueClass={
                          saleToView.saleStatus.toLowerCase() === "returned"
                            ? "text-slate-500"
                            : "text-emerald-700"
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* Sold Products */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Package size={17} className="text-blue-600" />
                    {t("sales.soldProducts")}
                  </h3>

                  {saleToView.items.length > 0 ? (
                    <div className="space-y-3">
                      {saleToView.items.map((item, index) => (
                        <div
                          key={`${item.id || item.productId}-${index}`}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                              <Monitor size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-words font-bold text-slate-950">
                                {item.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {t("sales.productId")}:{" "}
                                {item.productId ?? t("sales.notLinked")}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                            <div>
                              <p className="text-xs text-slate-500">
                                {t("sales.quantity")}
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {item.quantity}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                {t("sales.unitSellingPrice")}
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {formatMoney(item.price)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-500">
                                {t("sales.itemTotal")}
                              </p>
                              <p className="mt-1 text-sm font-bold text-blue-700">
                                {formatMoney(item.totalPrice)}
                              </p>
                            </div>

                            {item.purchasePrice !== null && (
                              <div className="col-span-2 sm:col-span-3">
                                <p className="text-xs text-slate-500">
                                  {t("sales.purchaseCostPerUnit")}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                  {formatMoney(item.purchasePrice)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                      {t("sales.noSaleItems")}
                    </div>
                  )}
                </section>

                {/* Payment Information */}
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Wallet size={17} className="text-blue-600" />
                    {t("sales.paymentInfo")}
                  </h3>

                  <div className="rounded-xl border border-slate-200 px-4">
                    <DetailRow
                      label={t("sales.subtotal")}
                      value={formatMoney(saleToView.subtotal)}
                    />
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.discount")}
                        value={formatMoney(saleToView.discount)}
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.totalAmount")}
                        value={formatMoney(saleToView.total)}
                        valueClass="text-slate-950"
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.amountPaid")}
                        value={formatMoney(saleToView.paid)}
                        valueClass="text-emerald-700"
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.remainingDue")}
                        value={formatMoney(saleToView.due)}
                        valueClass={
                          saleToView.due > 0
                            ? "text-red-600"
                            : "text-emerald-700"
                        }
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.paymentMethod")}
                        value={saleToView.paymentMethod}
                      />
                    </div>
                    <div className="border-t border-slate-100">
                      <DetailRow
                        label={t("sales.paymentStatus")}
                        value={getTranslatedStatus(saleToView.status, t)}
                        valueClass={
                          saleToView.status === "Paid"
                            ? "text-emerald-700"
                            : saleToView.status === "Returned"
                              ? "text-slate-500"
                              : "text-amber-700"
                        }
                      />
                    </div>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-between sm:p-6">
                <button
                  type="button"
                  onClick={() => setSaleToView(null)}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("sales.close")}
                </button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  {saleToView.saleStatus.toLowerCase() !== "returned" && (
                    <Link
                      to={`/dashboard/sales/replace/${saleToView.id}`}
                      onClick={() => setSaleToView(null)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <RefreshCw size={16} />
                      {t("sales.replaceItem")}
                    </Link>
                  )}

                  {saleToView.saleStatus.toLowerCase() !== "returned" && (
                    <button
                      type="button"
                      onClick={() => {
                        const sale = saleToView;
                        setSaleToView(null);
                        setSaleToReturn(sale);
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      <RotateCcw size={16} />
                      {t("sales.returnSale")}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* RETURN CONFIRMATION MODAL                                           */}
      {/* ------------------------------------------------------------------ */}

      <AnimatePresence>
        {saleToReturn && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                returningSaleId === null
              ) {
                setSaleToReturn(null);
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="return-sale-title"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-100 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    <RotateCcw size={22} />
                  </div>

                  <div>
                    <h2
                      id="return-sale-title"
                      className="text-lg font-bold text-slate-950"
                    >
                      {t("sales.confirmReturnTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {t("sales.reviewBeforeReturn")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={returningSaleId !== null}
                  onClick={() => setSaleToReturn(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label={t("sales.close")}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4 p-5">
                <p className="text-sm leading-6 text-slate-600">
                  {t("sales.confirmReturnQuestion")}
                </p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm">
                      <Monitor size={22} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">
                        {saleToReturn.items.length === 1
                          ? saleToReturn.items[0].name || t("sales.computer")
                          : `${saleToReturn.items.length} ${t("sales.saleItems")}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t("sales.saleId")}: {saleToReturn.saleNumber}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        {t("sales.customer")}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {saleToReturn.customer || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        {t("sales.saleDate")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(saleToReturn.date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        {t("sales.quantity")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {saleToReturn.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        {t("sales.amountPaid")}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {formatMoney(saleToReturn.paid)}
                      </p>
                    </div>
                  </div>

                  {saleToReturn.items.length > 1 && (
                    <div className="mt-3 space-y-1 border-t border-slate-200 pt-3">
                      {saleToReturn.items.map((item, index) => (
                        <p
                          key={`${item.productId}-${index}`}
                          className="text-xs text-slate-600"
                        >
                          {item.name} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">
                  {t("sales.returnWarning")}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={returningSaleId !== null}
                  onClick={() => setSaleToReturn(null)}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("sales.cancel")}
                </button>

                <button
                  type="button"
                  disabled={returningSaleId !== null}
                  onClick={confirmReturn}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {returningSaleId !== null ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      {t("sales.returning")}
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} />
                      {t("sales.confirmReturn")}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Sales;
