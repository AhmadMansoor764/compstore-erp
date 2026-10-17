import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Filter,
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  Boxes,
  CalendarDays,
  RefreshCw,
  Warehouse,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  X,
  SearchX,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const formatMoney = (amount) =>
  `$${Number(amount || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

const getStockStatus = (product) => {
  if (product.quantity <= 0) return "Out of Stock";
  if (product.quantity <= product.minStock) return "Low Stock";
  return "In Stock";
};

const getStatusClasses = (status) => {
  if (status === "Out of Stock") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "Low Stock") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
};

const StatusBadge = ({ status, t }) => {
  const Icon =
    status === "Out of Stock"
      ? XCircle
      : status === "Low Stock"
        ? AlertTriangle
        : CheckCircle2;

  const statusLabels = {
    "Out of Stock": t("stock.status.outOfStock"),
    "Low Stock": t("stock.status.lowStock"),
    "In Stock": t("stock.status.inStock"),
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(status)}`}
    >
      <Icon size={13} />
      {statusLabels[status] || status}
    </span>
  );
};

const formatSelectedDate = (date, language) => {
  if (!date) return "";

  const locale =
    language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBackground,
  accent,
}) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -3 }}
    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6"
  >
    <div
      className={`absolute inset-x-0 top-0 h-1 ${accent}`}
      aria-hidden="true"
    />

    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {title}
        </p>

        <h2 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </h2>

        <p className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</p>
      </div>

      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${iconBackground}`}
      >
        <Icon size={22} className={iconColor} strokeWidth={2} />
      </div>
    </div>
  </motion.div>
);

const ProductActions = ({ product, onDelete, onNavigate, t, direction }) => (
  <div
    data-stock-action-menu
    className="relative flex shrink-0 items-center justify-end"
  >
    <button
      type="button"
      aria-label={`${t("stock.actions.actionsFor")} ${product.name}`}
      aria-expanded={onNavigate.open}
      onClick={onNavigate.toggle}
      className={`rounded-xl border p-2.5 transition ${
        onNavigate.open
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-transparent text-slate-400 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      <MoreVertical size={19} />
    </button>

    <AnimatePresence>
      {onNavigate.open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -5 }}
          transition={{ duration: 0.15 }}
          className={`absolute top-12 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ${
            direction === "rtl" ? "left-0 text-right" : "right-0 text-left"
          }`}
        >
          <Link
            to={`/dashboard/stock/view/${product.id}`}
            onClick={onNavigate.close}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
          >
            <Eye size={16} />
            {t("stock.actions.view")}
          </Link>

          <Link
            to={`/dashboard/stock/edit/${product.id}`}
            onClick={onNavigate.close}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-blue-700"
          >
            <Pencil size={16} />
            {t("stock.actions.edit")}
          </Link>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} />
            {t("stock.actions.delete")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const Stock = () => {
  const { t, language, direction } = useLanguage();

  const [products, setProducts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [openMenuId, setOpenMenuId] = useState(null);

  const numberLocale =
    language === "fa" ? "fa-AF" : language === "ps" ? "ps-AF" : "en-US";

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setLoadError("");

      const response = await fetch(`${API_URL}/products`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("stock.errors.loadFailed"));
      }

      const databaseProducts = Array.isArray(data) ? data : data.products || [];

      const normalizedProducts = databaseProducts.map((product) => ({
        ...product,
        category: product.category?.name || "Uncategorized",
        supplier: product.supplier?.name || "No supplier",
        quantity: Number(product.quantity || 0),
        minStock: Number(product.low_stock_threshold ?? 5),
        purchasePrice: Number(product.purchase_price || 0),
        sellingPrice: Number(product.selling_price || 0),
        addedDate: product.created_at
          ? new Date(product.created_at).toLocaleDateString("en-CA")
          : "",
      }));

      setProducts(normalizedProducts);
    } catch (error) {
      setLoadError(error.message || t("stock.errors.loadFailed"));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-stock-action-menu]")) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const dateFilteredProducts = useMemo(() => {
    if (!selectedDate) return products;

    return products.filter((product) => product.addedDate === selectedDate);
  }, [products, selectedDate]);

  const categories = useMemo(
    () => [
      "All Categories",
      ...new Set(dateFilteredProducts.map((product) => product.category)),
    ],
    [dateFilteredProducts],
  );

  const totalProducts = dateFilteredProducts.length;

  const lowStockProducts = dateFilteredProducts.filter(
    (product) => product.quantity > 0 && product.quantity <= product.minStock,
  ).length;

  const outOfStockProducts = dateFilteredProducts.filter(
    (product) => product.quantity <= 0,
  ).length;

  const totalStockValue = dateFilteredProducts.reduce(
    (total, product) => total + product.quantity * product.purchasePrice,
    0,
  );

  const filteredProducts = dateFilteredProducts.filter((product) => {
    const searchValue = searchTerm.trim().toLowerCase();

    const matchesSearch =
      String(product.name || "")
        .toLowerCase()
        .includes(searchValue) ||
      String(product.sku || "")
        .toLowerCase()
        .includes(searchValue) ||
      String(product.category || "")
        .toLowerCase()
        .includes(searchValue);

    const matchesCategory =
      categoryFilter === "All Categories" ||
      product.category === categoryFilter;

    const productStatus = getStockStatus(product);

    const matchesStatus =
      statusFilter === "All Status" || productStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Status");
    setOpenMenuId(null);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    clearFilters();
  };

  const handleDelete = async (productId) => {
    const product = products.find((item) => item.id === productId);

    if (!product) return;

    const confirmed = window.confirm(
      `${t("stock.confirmDelete")} ${product.name}?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("stock.errors.deleteFailed"));
      }

      setProducts((current) => current.filter((item) => item.id !== productId));

      setOpenMenuId(null);
      toast.success(data.message || t("stock.success.deleted"));
    } catch (error) {
      toast.error(error.message || t("stock.errors.deleteFailed"));
    }
  };

  const activeFilterCount = [
    searchTerm.trim() !== "",
    categoryFilter !== "All Categories",
    statusFilter !== "All Status",
  ].filter(Boolean).length;

  const categoryLabels = {
    "All Categories": t("stock.filters.allCategories"),
  };

  const statusLabels = {
    "All Status": t("stock.filters.allStatuses"),
    "In Stock": t("stock.status.inStock"),
    "Low Stock": t("stock.status.lowStock"),
    "Out of Stock": t("stock.status.outOfStock"),
  };

  return (
    <motion.div
      dir={direction}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-w-0 space-y-6 pb-8 sm:space-y-8"
    >
      {/* Page heading */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
            <Warehouse size={17} />
            <span>{t("stock.eyebrow")}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {t("stock.title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            {t("stock.description")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => loadProducts(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {t("stock.refresh")}
          </button>

          <Link
            to="/dashboard/stock/add"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={19} />
            {t("stock.addProduct")}
          </Link>
        </div>
      </motion.section>

      {/* Loading and error states */}
      {isLoading && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"
        >
          <RefreshCw size={18} className="animate-spin" />
          {t("stock.loading")}
        </motion.div>
      )}

      {loadError && (
        <motion.div
          variants={itemVariants}
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">
                {t("stock.errors.loadTitle")}
              </p>
              <p className="mt-1 text-sm text-red-700">{loadError}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadProducts()}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RefreshCw size={15} />
            {t("stock.tryAgain")}
          </button>
        </motion.div>
      )}

      {/* Date selector */}
      <motion.section
        variants={itemVariants}
        className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarDays size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {t("stock.dateFilter.title")}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {selectedDate
                ? `${t("stock.dateFilter.addedOn")} ${formatSelectedDate(selectedDate, language)}`
                : t("stock.dateFilter.allDates")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            aria-label={t("stock.dateFilter.ariaLabel")}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={() => {
              setSelectedDate("");
              clearFilters();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <RotateCcw size={15} />
            {t("stock.dateFilter.clearDate")}
          </button>
        </div>
      </motion.section>

      {/* Statistics */}
      <motion.section
        variants={containerVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        <StatCard
          title={t("stock.stats.totalProducts")}
          value={totalProducts.toLocaleString(numberLocale)}
          subtitle={t("stock.stats.productsInDateRange")}
          icon={Package}
          iconColor="text-blue-700"
          iconBackground="bg-blue-50"
          accent="bg-blue-500"
        />

        <StatCard
          title={t("stock.stats.lowStock")}
          value={lowStockProducts.toLocaleString(numberLocale)}
          subtitle={t("stock.stats.approachingMinimum")}
          icon={AlertTriangle}
          iconColor="text-amber-700"
          iconBackground="bg-amber-50"
          accent="bg-amber-400"
        />

        <StatCard
          title={t("stock.stats.outOfStock")}
          value={outOfStockProducts.toLocaleString(numberLocale)}
          subtitle={t("stock.stats.noAvailableUnits")}
          icon={XCircle}
          iconColor="text-red-700"
          iconBackground="bg-red-50"
          accent="bg-red-500"
        />

        <StatCard
          title={t("stock.stats.stockValue")}
          value={formatMoney(totalStockValue)}
          subtitle={t("stock.stats.stockValueFormula")}
          icon={DollarSign}
          iconColor="text-emerald-700"
          iconBackground="bg-emerald-50"
          accent="bg-emerald-500"
        />
      </motion.section>

      {/* Inventory table and filters */}
      <motion.section
        variants={itemVariants}
        className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {t("stock.inventory.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("stock.inventory.description")}
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              <Boxes size={17} className="text-blue-600" />
              <span>
                {filteredProducts.length.toLocaleString(numberLocale)}{" "}
                {filteredProducts.length === 1
                  ? t("stock.inventory.product")
                  : t("stock.inventory.products")}
              </span>
            </div>
          </div>

          {/* Search and filters */}
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <div className="relative">
              <Search
                size={18}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  direction === "rtl" ? "right-3.5" : "left-3.5"
                }`}
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("stock.search.placeholder")}
                aria-label={t("stock.search.ariaLabel")}
                className={`h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
                  direction === "rtl" ? "pl-10 pr-10" : "pl-10 pr-10"
                }`}
              />

              {searchTerm && (
                <button
                  type="button"
                  aria-label={t("stock.search.clear")}
                  onClick={() => setSearchTerm("")}
                  className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ${
                    direction === "rtl" ? "left-3" : "right-3"
                  }`}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="relative">
              <Filter
                size={17}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  direction === "rtl" ? "right-3.5" : "left-3.5"
                }`}
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label={t("stock.filters.categoryAriaLabel")}
                className={`h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
                  direction === "rtl" ? "pl-9 pr-10" : "pl-9 pr-9"
                }`}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category] || category}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  direction === "rtl" ? "left-3.5" : "right-3.5"
                }`}
              />
            </div>

            <div className="relative">
              <SlidersHorizontal
                size={16}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  direction === "rtl" ? "right-3.5" : "left-3.5"
                }`}
              />

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label={t("stock.filters.statusAriaLabel")}
                className={`h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 ${
                  direction === "rtl" ? "pl-9 pr-10" : "pl-9 pr-9"
                }`}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                  direction === "rtl" ? "left-3.5" : "right-3.5"
                }`}
              />
            </div>
          </div>

          {/* Active filters */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                {t("stock.activeFilters")}
              </span>

              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {t("stock.search.label")}: {searchTerm.trim()}
                  <button
                    type="button"
                    aria-label={t("stock.search.removeFilter")}
                    onClick={() => setSearchTerm("")}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {categoryFilter !== "All Categories" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {categoryFilter}
                  <button
                    type="button"
                    aria-label={t("stock.filters.removeCategory")}
                    onClick={() => setCategoryFilter("All Categories")}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {statusFilter !== "All Status" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {statusLabels[statusFilter] || statusFilter}
                  <button
                    type="button"
                    aria-label={t("stock.filters.removeStatus")}
                    onClick={() => setStatusFilter("All Status")}
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-700"
              >
                {t("stock.clearFilters")}
              </button>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table
            className={`w-full min-w-[960px] border-collapse ${
              direction === "rtl" ? "text-right" : "text-left"
            }`}
          >
            <thead>
              <tr className="bg-slate-50/80">
                {[
                  t("stock.table.product"),
                  t("stock.table.category"),
                  t("stock.table.quantity"),
                  t("stock.table.purchasePrice"),
                  t("stock.table.stockValue"),
                  t("stock.table.status"),
                  "",
                ].map((heading, index) => (
                  <th
                    key={`${heading}-${index}`}
                    className={`whitespace-nowrap px-5 py-4 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 ${
                      index === 6
                        ? direction === "rtl"
                          ? "text-left"
                          : "text-right"
                        : ""
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);
                const stockValue = product.quantity * product.purchasePrice;

                return (
                  <tr
                    key={product.id}
                    className="border-t border-slate-100 transition-colors hover:bg-blue-50/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Package size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {t("stock.table.sku")}: {product.sku || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                        {product.category === "Uncategorized"
                          ? t("stock.uncategorized")
                          : product.category}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {product.quantity.toLocaleString(numberLocale)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t("stock.table.minimum")}{" "}
                        {product.minStock.toLocaleString(numberLocale)}{" "}
                        {t("stock.table.units")}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                      {formatMoney(product.purchasePrice)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatMoney(stockValue)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={status} t={t} />
                    </td>

                    <td className="px-5 py-4">
                      <ProductActions
                        product={product}
                        onDelete={handleDelete}
                        t={t}
                        direction={direction}
                        onNavigate={{
                          open: openMenuId === product.id,
                          toggle: () =>
                            setOpenMenuId(
                              openMenuId === product.id ? null : product.id,
                            ),
                          close: () => setOpenMenuId(null),
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile and tablet product cards */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {filteredProducts.map((product) => {
            const status = getStockStatus(product);
            const stockValue = product.quantity * product.purchasePrice;

            return (
              <article key={product.id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Package size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {t("stock.table.sku")}: {product.sku || "—"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.category === "Uncategorized"
                          ? t("stock.uncategorized")
                          : product.category}
                      </p>
                    </div>
                  </div>

                  <ProductActions
                    product={product}
                    onDelete={handleDelete}
                    t={t}
                    direction={direction}
                    onNavigate={{
                      open: openMenuId === product.id,
                      toggle: () =>
                        setOpenMenuId(
                          openMenuId === product.id ? null : product.id,
                        ),
                      close: () => setOpenMenuId(null),
                    }}
                  />
                </div>

                <div className="mt-4">
                  <StatusBadge status={status} t={t} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      {t("stock.table.quantity")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {product.quantity.toLocaleString(numberLocale)}{" "}
                      {t("stock.table.units")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      {t("stock.table.minimumStock")}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {product.minStock.toLocaleString(numberLocale)}{" "}
                      {t("stock.table.units")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      {t("stock.table.purchasePrice")}
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-900">
                      {formatMoney(product.purchasePrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      {t("stock.table.stockValue")}
                    </p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-900">
                      {formatMoney(stockValue)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Empty state */}
        {!isLoading && !loadError && filteredProducts.length === 0 && (
          <div className="px-5 py-16 text-center sm:px-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              {searchTerm || activeFilterCount > 0 ? (
                <SearchX size={28} />
              ) : (
                <Package size={28} />
              )}
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              {activeFilterCount > 0
                ? t("stock.empty.noMatches")
                : t("stock.empty.title")}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {activeFilterCount > 0
                ? t("stock.empty.changeFilters")
                : t("stock.empty.description")}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw size={15} />
                  {t("stock.clearFilters")}
                </button>
              )}

              {!searchTerm &&
                categoryFilter === "All Categories" &&
                statusFilter === "All Status" &&
                !selectedDate && (
                  <Link
                    to="/dashboard/stock/add"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    {t("stock.empty.addFirstProduct")}
                  </Link>
                )}
            </div>
          </div>
        )}

        {/* Footer */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              {t("stock.footer.showing")}{" "}
              <span className="font-semibold text-slate-700">
                {filteredProducts.length.toLocaleString(numberLocale)}
              </span>{" "}
              {t("stock.footer.of")}{" "}
              <span className="font-semibold text-slate-700">
                {dateFilteredProducts.length.toLocaleString(numberLocale)}
              </span>{" "}
              {t("stock.inventory.products")}
            </p>

            <p className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              {t("stock.footer.purchasePriceNote")}
            </p>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default Stock;
