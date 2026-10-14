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
} from "lucide-react";
const API_URL = "http://localhost:3000/api";

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const formatMoney = (amount) => {
  return `$${Number(amount || 0).toLocaleString()}`;
};

const getStockStatus = (product) => {
  if (product.quantity === 0) {
    return "Out of Stock";
  }

  if (product.quantity <= product.minStock) {
    return "Low Stock";
  }

  return "In Stock";
};

const getStatusClasses = (status) => {
  if (status === "Out of Stock") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Low Stock") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
};

const formatSelectedDate = (date) => {
  if (!date) {
    return "All dates";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
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
}) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-[#c8cce0] bg-white p-5 shadow-sm"
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
            <p className="mt-2 text-xs font-medium text-slate-500">
              {subtitle}
            </p>
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
};

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [openMenuId, setOpenMenuId] = useState(null);

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
    (product) => product.quantity === 0,
  ).length;

  const totalStockValue = dateFilteredProducts.reduce(
    (total, product) => total + product.quantity * product.purchasePrice,
    0,
  );

  const filteredProducts = dateFilteredProducts.filter((product) => {
    const searchValue = searchTerm.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(searchValue) ||
      product.sku.toLowerCase().includes(searchValue) ||
      product.category.toLowerCase().includes(searchValue);

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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(`${API_URL}/products`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load products.");
        }

        const databaseProducts = Array.isArray(data)
          ? data
          : data.products || [];

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
        setLoadError(error.message || "Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-stock-action-menu]")) {
        setOpenMenuId(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    clearFilters();
  };

  const handleDelete = async (productId) => {
    const product = products.find((item) => item.id === productId);

    if (!product) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${product.name}?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }

      setProducts((current) => current.filter((item) => item.id !== productId));

      setOpenMenuId(null);
      toast.success(data.message || "Product deleted successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to delete product.");
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{
        staggerChildren: 0.08,
      }}
      className="space-y-6"
    >
      {isLoading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          Loading products from your database...
        </div>
      )}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}
      {/* Page Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">
            Inventory Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Stock
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your products, monitor stock levels, and keep your inventory
            organized.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          {/* Date Filter */}
          <div className="relative">
            <CalendarDays
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="h-11 rounded-xl border border-[#c8cce0] bg-white pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <Link
            to="/dashboard/stock/add"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            <Plus size={19} />
            Add Stock
          </Link>
        </div>
      </motion.div>

      {/* Selected Date Information */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
          <CalendarDays size={18} />

          <span>
            {selectedDate
              ? `Showing products added on ${formatSelectedDate(selectedDate)}`
              : "Showing all products in your inventory"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedDate("");
            clearFilters();
          }}
          className="w-fit rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
        >
          Today
        </button>
      </motion.div>

      {/* Statistics */}
      <motion.section
        variants={itemVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Total Products"
          value={totalProducts.toLocaleString()}
          subtitle="Products in selected date"
          icon={Package}
          iconColor="text-blue-700"
          iconBackground="bg-blue-100"
        />

        <StatCard
          title="Low Stock"
          value={lowStockProducts.toLocaleString()}
          subtitle="Products need attention"
          icon={AlertTriangle}
          iconColor="text-amber-700"
          iconBackground="bg-amber-100"
        />

        <StatCard
          title="Out of Stock"
          value={outOfStockProducts.toLocaleString()}
          subtitle="Products unavailable"
          icon={XCircle}
          iconColor="text-red-700"
          iconBackground="bg-red-100"
        />

        <StatCard
          title="Stock Value"
          value={formatMoney(totalStockValue)}
          subtitle="Based on purchase prices"
          icon={DollarSign}
          iconColor="text-emerald-700"
          iconBackground="bg-emerald-100"
        />
      </motion.section>

      {/* Main Stock Card */}
      <motion.section
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#c8cce0] bg-white shadow-sm"
      >
        {/* Card Header */}
        <div className="border-b border-[#c8cce0] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950 sm:text-xl">
                All Products
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your inventory products.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Boxes size={18} />
              <span>{filteredProducts.length} products found</span>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_210px_170px]">
            {/* Search */}
            <div className="relative">
              <Search
                size={19}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by product name, SKU, or category..."
                className="h-11 w-full rounded-xl border border-[#c8cce0] bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-[#c8cce0] bg-white pl-10 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-[#c8cce0] bg-white px-4 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="All Status">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#f8f8ff] text-left">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Product
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Category
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Quantity
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Purchase Price
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Stock Value
                </th>

                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const status = getStockStatus(product);

                return (
                  <tr
                    key={product.id}
                    className="border-t border-[#e2e5f0] transition hover:bg-[#fafbff]"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {product.sku}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {product.category}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-950">
                        {product.quantity}
                      </span>

                      <span className="ml-1 text-xs text-slate-500">units</span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {formatMoney(product.purchasePrice)}
                    </td>

                    <td className="px-6 py-4 text-sm font-bold text-slate-950">
                      {formatMoney(product.quantity * product.purchasePrice)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                          status,
                        )}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td
                      data-stock-action-menu
                      className="relative px-6 py-4 text-right"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === product.id ? null : product.id,
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        <MoreVertical size={19} />
                      </button>

                      <AnimatePresence>
                        {openMenuId === product.id && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              scale: 0.95,
                              y: -5,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.95,
                              y: -5,
                            }}
                            className="absolute right-5 top-14 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl"
                          >
                            <Link
                              to={`/dashboard/stock/view/${product.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                            >
                              <Eye size={16} />
                              View
                            </Link>

                            <Link
                              to={`/dashboard/stock/edit/${product.id}`}
                              onClick={() => setOpenMenuId(null)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                            >
                              <Pencil size={16} />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
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
          {filteredProducts.map((product) => {
            const status = getStockStatus(product);

            return (
              <div
                data-stock-action-menu
                key={product.id}
                className="p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef0fb] text-blue-700">
                      <Package size={21} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-slate-950 sm:text-base">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {product.sku}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {product.category}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === product.id ? null : product.id,
                      )
                    }
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                  >
                    <MoreVertical size={19} />
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Quantity
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {product.quantity} units
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Purchase Price
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatMoney(product.purchasePrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Stock Value
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {formatMoney(product.quantity * product.purchasePrice)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Status</p>

                    <span
                      className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusClasses(
                        status,
                      )}`}
                    >
                      {status}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {openMenuId === product.id && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                      }}
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        <Link
                          to={`/dashboard/stock/view/${product.id}`}
                          onClick={() => setOpenMenuId(null)}
                          className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                        >
                          <Eye size={16} />
                          View
                        </Link>

                        <Link
                          to={`/dashboard/stock/edit/${product.id}`}
                          onClick={() => setOpenMenuId(null)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200"
                        >
                          <Pencil size={16} />
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {!isLoading && !loadError && filteredProducts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Package size={27} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              No products found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are no products for this date or your selected filter
              options.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default Stock;
