import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Pencil,
  RefreshCw,
  Undo2,
  X,
  Package,
  CalendarDays,
  UserRound,
  Wallet,
  Truck,
  ChevronDown,
  CheckCircle2,
  Clock3,
  XCircle,
  ReceiptText,
  ArrowDownToLine,
} from "lucide-react";
import { Link } from "react-router-dom";

const formatMoney = (amount) => {
  return `${Number(amount).toLocaleString()} AFN`;
};

const formatDate = (date) => {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const normalizeDate = (value) => {
  if (!value) return "";

  // HTML date input already uses YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Handle API dates such as ISO strings.
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  // Use the local calendar date instead of UTC conversion.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const paymentStatusStyles = {
  Paid: "bg-emerald-100 text-emerald-700",
  Partial: "bg-amber-100 text-amber-700",
  Unpaid: "bg-rose-100 text-rose-700",
};

const purchaseStatusStyles = {
  Received: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-rose-100 text-rose-700",
};

const getPaymentIcon = (status) => {
  if (status === "Paid") return <CheckCircle2 size={14} />;
  if (status === "Partial") return <Clock3 size={14} />;
  return <XCircle size={14} />;
};

const getPurchaseIcon = (status) => {
  if (status === "Received") return <CheckCircle2 size={14} />;
  if (status === "Pending") return <Clock3 size={14} />;
  return <XCircle size={14} />;
};

const Purchases = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const API_URL = `${import.meta.env.VITE_API_URL}/api`;

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingPurchase, setEditingPurchase] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const [actionType, setActionType] = useState(null);
  const [actionPurchase, setActionPurchase] = useState(null);
  const [actionItemId, setActionItemId] = useState("");
  const [categories, setCategories] = useState([]);
  const [savingAction, setSavingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionReason, setActionReason] = useState("");

  const selectedItemSafe = (purchase, itemId) =>
    purchase?.products?.find((item) => String(item.id) === String(itemId));

  const emptyReplacement = {
    name: "",
    sku: "",
    category_id: "",
    description: "",
    quantity: "1",
    purchase_price: "",
    selling_price: "",
  };

  const [replacement, setReplacement] = useState(emptyReplacement);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/purchases`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load purchases.");
      }

      const formattedPurchases = (data.purchases || []).map((purchase) => {
        const products = (purchase.items || []).map((item) => ({
          id: item.id,
          productId: item.product_id,
          name: item.product_name,
          quantity: Number(item.quantity),
          price: Number(item.unit_price),
          total: Number(item.total_price),
          quantityAddedToStock: Number(item.quantity_added_to_stock || 0),
        }));

        return {
          id: purchase.purchase_number,
          databaseId: purchase.id,
          supplier: purchase.supplier?.name || "Unknown supplier",
          supplierId: purchase.supplier_id,
          invoiceNumber: purchase.invoice_number || "—",
          purchaseDate: normalizeDate(purchase.purchase_date),
          items: products.reduce((sum, item) => sum + item.quantity, 0),
          itemTypes: products.length,
          totalAmount: Number(purchase.total_amount),
          paidAmount: Number(purchase.paid_amount),
          dueAmount: Number(purchase.due_amount),
          paymentStatus: purchase.payment_status,
          status: purchase.status,
          products,
          notes: purchase.notes || "",
        };
      });

      setPurchases(formattedPurchases);
    } catch (err) {
      console.error("Fetch purchases error:", err);
      setError(err.message || "Unable to load purchases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      const productSearchText = purchase.products
        .map((product) => product.name)
        .join(" ");

      const searchableText = `
        ${purchase.id}
        ${purchase.supplier}
        ${purchase.invoiceNumber}
        ${purchase.purchaseDate}
        ${productSearchText}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

      const matchesDate =
        !selectedDate ||
        normalizeDate(purchase.purchaseDate) === normalizeDate(selectedDate);

      const matchesStatus =
        statusFilter === "All" || purchase.status === statusFilter;

      const matchesPayment =
        paymentFilter === "All" || purchase.paymentStatus === paymentFilter;

      return matchesSearch && matchesDate && matchesStatus && matchesPayment;
    });
  }, [purchases, searchTerm, selectedDate, statusFilter, paymentFilter]);

  const totalPurchases = filteredPurchases.reduce(
    (total, purchase) => total + purchase.totalAmount,
    0,
  );

  const totalPaid = filteredPurchases.reduce(
    (total, purchase) => total + purchase.paidAmount,
    0,
  );

  const totalDue = filteredPurchases.reduce(
    (total, purchase) => total + purchase.dueAmount,
    0,
  );

  const receivedPurchases = filteredPurchases.filter(
    (purchase) => purchase.status === "Received",
  ).length;

  const handleEditPurchase = async (purchase) => {
    try {
      setEditError("");

      const response = await fetch(`${API_URL}/suppliers`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load suppliers.");
      }

      const supplierList = Array.isArray(data) ? data : data.suppliers || [];

      setSuppliers(supplierList);

      setEditingPurchase({
        ...purchase,
        invoiceNumber:
          purchase.invoiceNumber === "—" ? "" : purchase.invoiceNumber,
        products: purchase.products.map((product) => ({
          ...product,
          name: product.name || "",
          quantity: String(product.quantity),
          price: String(product.price),
        })),
        paidAmount: String(purchase.paidAmount),
        notes: purchase.notes || "",
      });
    } catch (err) {
      setEditError(err.message || "Could not open the edit form.");
    }
  };

  const updateEditField = (field, value) => {
    setEditingPurchase((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateEditItem = (index, field, value) => {
    setEditingPurchase((current) => ({
      ...current,
      products: current.products.map((product, itemIndex) =>
        itemIndex === index ? { ...product, [field]: value } : product,
      ),
    }));
  };

  const addEditItem = () => {
    setEditingPurchase((current) => ({
      ...current,
      products: [
        ...current.products,
        {
          id: null,
          productId: null,
          name: "",
          quantity: "1",
          price: "0",
          total: 0,
          quantityAddedToStock: 0,
        },
      ],
    }));
  };

  const removeEditItem = (index) => {
    const item = editingPurchase.products[index];

    if (item.id && item.quantityAddedToStock > 0) {
      setEditError(
        "This item has stock recorded against it. You cannot remove it here.",
      );
      return;
    }

    setEditingPurchase((current) => ({
      ...current,
      products: current.products.filter((_, itemIndex) => itemIndex !== index),
    }));

    setEditError("");
  };

  const editTotal = (editingPurchase?.products || []).reduce((sum, item) => {
    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return sum;
    }

    return sum + quantity * price;
  }, 0);

  const editDue = Math.max(
    0,
    editTotal - Number(editingPurchase?.paidAmount || 0),
  );

  const savePurchaseEdit = async (event) => {
    event.preventDefault();

    if (!editingPurchase || savingEdit) return;

    setEditError("");

    const paid = Number(editingPurchase.paidAmount);

    if (!Number.isFinite(paid) || paid < 0 || paid > editTotal) {
      setEditError(
        "The paid amount must be between zero and the purchase total.",
      );
      return;
    }

    if (!editingPurchase.supplierId) {
      setEditError("Please select a supplier.");
      return;
    }

    if (!editingPurchase.products.length) {
      setEditError("A purchase must contain at least one item.");
      return;
    }

    for (const item of editingPurchase.products) {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (!item.name.trim()) {
        setEditError("Every purchase item must have a name.");
        return;
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        setEditError("Item quantities must be positive whole numbers.");
        return;
      }

      if (!Number.isFinite(price) || price < 0) {
        setEditError("Item prices cannot be negative.");
        return;
      }

      if (quantity < item.quantityAddedToStock) {
        setEditError(
          `Quantity for "${item.name}" cannot be less than the quantity already added to stock (${item.quantityAddedToStock}).`,
        );
        return;
      }
    }

    const paymentStatus =
      paid === editTotal ? "Paid" : paid > 0 ? "Partial" : "Unpaid";

    const payload = {
      supplier_id: Number(editingPurchase.supplierId),
      invoice_number: editingPurchase.invoiceNumber.trim() || null,
      purchase_date: editingPurchase.purchaseDate,
      paid_amount: paid,
      status: editingPurchase.status,
      notes: editingPurchase.notes.trim() || null,
      items: editingPurchase.products.map((item) => ({
        id: item.id || undefined,
        product_id: item.productId || null,
        product_name: item.name.trim(),
        quantity: Number(item.quantity),
        unit_price: Number(item.price),
      })),
    };

    try {
      setSavingEdit(true);

      const response = await fetch(
        `${API_URL}/purchases/${editingPurchase.databaseId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update purchase.");
      }

      setEditingPurchase(null);
      setSelectedPurchase(null);
      await fetchPurchases();
    } catch (err) {
      setEditError(err.message || "Failed to save purchase changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReplacePurchase = async (purchase) => {
    setActionError("");
    setActionReason("");
    setReplacement(emptyReplacement);
    setActionItemId(String(purchase.products[0]?.id || ""));
    setActionPurchase(purchase);
    setActionType("replace");

    try {
      const response = await fetch(`${API_URL}/categories`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load categories.");
      }

      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) {
      setActionError(
        `${err.message} Check that your categories endpoint is /api/categories.`,
      );
    }
  };

  const handleReturnPurchase = (purchase) => {
    setActionError("");
    setActionReason("");
    setActionItemId(String(purchase.products[0]?.id || ""));
    setActionPurchase(purchase);
    setActionType("return");
  };

  const closeActionModal = () => {
    if (savingAction) return;

    setActionType(null);
    setActionPurchase(null);
    setActionItemId("");
    setActionError("");
    setActionReason("");
  };

  const submitPurchaseAction = async (event) => {
    event.preventDefault();

    if (!actionPurchase || !actionItemId || savingAction) return;

    setActionError("");

    const selectedItem = actionPurchase.products.find(
      (item) => String(item.id) === String(actionItemId),
    );

    if (!selectedItem) {
      setActionError("Select a valid purchase item.");
      return;
    }

    let endpoint;
    let payload;

    if (actionType === "replace") {
      const quantity = Number(replacement.quantity);
      const purchasePrice = Number(replacement.purchase_price);
      const sellingPrice = Number(replacement.selling_price);
      const categoryId = Number(replacement.category_id);

      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        setActionError("Quantity must be a positive whole number.");
        return;
      }

      if (!replacement.name.trim() || !replacement.sku.trim()) {
        setActionError("Product name and SKU are required.");
        return;
      }

      if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
        setActionError("Please select a category.");
        return;
      }

      if (
        !Number.isFinite(purchasePrice) ||
        purchasePrice < 0 ||
        !Number.isInteger(purchasePrice * 100) ||
        !Number.isFinite(sellingPrice) ||
        sellingPrice < 0 ||
        !Number.isInteger(sellingPrice * 100)
      ) {
        setActionError(
          "Enter valid prices with no more than two decimal places.",
        );
        return;
      }

      endpoint = `${API_URL}/purchases/${actionPurchase.databaseId}/replace`;

      payload = {
        purchase_item_id: selectedItem.id,
        name: replacement.name.trim(),
        sku: replacement.sku.trim(),
        category_id: categoryId,
        description: replacement.description.trim(),
        quantity,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        reason: actionReason.trim(),
      };
    } else {
      if (
        !window.confirm(
          `Return all ${selectedItem.quantity} units of "${selectedItem.name}" from purchase ${actionPurchase.id}? The purchase item will be removed.`,
        )
      ) {
        return;
      }

      endpoint = `${API_URL}/purchases/${actionPurchase.databaseId}/return`;

      payload = {
        purchase_item_id: selectedItem.id,
        reason: actionReason.trim(),
      };
    }

    try {
      setSavingAction(true);

      const response = await fetch(endpoint, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "The purchase action failed.");
      }

      setActionType(null);
      setActionPurchase(null);
      setActionItemId("");
      setActionError("");
      setActionReason("");
      setSelectedPurchase(null);
      await fetchPurchases();

      window.alert(
        actionType === "return"
          ? `Item returned. Refund credited: ${formatMoney(data.refundAmount || 0)}`
          : "Purchase item replaced successfully.",
      );
    } catch (err) {
      setActionError(err.message || "Unable to complete the action.");
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading purchases...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchPurchases}
            className="mt-3 rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      )}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Package size={16} />
            <span>Inventory Management</span>
            <span>/</span>
            <span className="text-slate-700">Purchases</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Purchases
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Manage supplier purchases and track your purchase payments.
          </p>
        </div>

        <Link
          to="/dashboard/purchases/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          New Purchase
        </Link>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Purchases"
          value={formatMoney(totalPurchases)}
          description={
            selectedDate
              ? `Purchases on ${formatDate(selectedDate)}`
              : "All purchase records"
          }
          icon={<ReceiptText size={21} />}
          iconBackground="bg-blue-100"
          iconColor="text-blue-600"
        />

        <SummaryCard
          title="Paid Amount"
          value={formatMoney(totalPaid)}
          description="Amount paid to suppliers"
          icon={<Wallet size={21} />}
          iconBackground="bg-emerald-100"
          iconColor="text-emerald-600"
        />

        <SummaryCard
          title="Total Due"
          value={formatMoney(totalDue)}
          description="Outstanding supplier payments"
          icon={<Truck size={21} />}
          iconBackground="bg-amber-100"
          iconColor="text-amber-600"
        />

        <SummaryCard
          title="Received Purchases"
          value={receivedPurchases}
          description="Purchases successfully received"
          icon={<ArrowDownToLine size={21} />}
          iconBackground="bg-violet-100"
          iconColor="text-violet-600"
        />
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-blue-600" />
          <h2 className="font-bold text-slate-900">Purchase Filters</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search purchase or product..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pl-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Purchase Date
            </label>

            <div className="relative">
              <CalendarDays
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pl-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Purchase Status */}
          <FilterSelect
            label="Purchase Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={["All", "Received", "Pending", "Cancelled"]}
          />

          {/* Payment Status */}
          <FilterSelect
            label="Payment Status"
            value={paymentFilter}
            onChange={setPaymentFilter}
            options={["All", "Paid", "Partial", "Unpaid"]}
          />
        </div>
      </motion.div>

      {/* Desktop Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Purchase Records</h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredPurchases.length} purchase
              {filteredPurchases.length !== 1 ? "s" : ""} found.
            </p>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <EmptyPurchases />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Purchase</th>

                  {/* NEW: Product */}
                  <th className="px-5 py-4 font-semibold">Purchased Product</th>

                  {/* NEW: Unit Price */}
                  <th className="px-5 py-4 font-semibold">Unit Price</th>

                  <th className="px-5 py-4 font-semibold">Date</th>

                  <th className="px-5 py-4 font-semibold">Total Units</th>

                  <th className="px-5 py-4 font-semibold">Payment</th>

                  <th className="px-5 py-4 font-semibold">Status</th>

                  <th className="px-5 py-4 text-right font-semibold">Total</th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* Purchase */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-slate-900">
                        {purchase.id}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {purchase.invoiceNumber}
                      </p>
                    </td>

                    {/* Purchased Products */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        {purchase.products.map((product, index) => (
                          <div
                            key={`${product.name}-${index}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                              <Package size={13} />
                            </span>

                            <div className="min-w-0">
                              <p className="max-w-[220px] text-sm font-semibold text-slate-800">
                                {product.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                Qty: {product.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Unit Prices */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        {purchase.products.map((product, index) => (
                          <div
                            key={`${product.name}-price-${index}`}
                            className="min-h-[32px] flex items-center"
                          >
                            <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                              {formatMoney(product.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-slate-600 align-top">
                      {formatDate(purchase.purchaseDate)}
                    </td>

                    {/* Items */}
                    <td className="px-5 py-4 text-sm text-slate-600 align-top">
                      {purchase.items}
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-4 align-top">
                      <div className="text-sm font-semibold text-slate-700">
                        {formatMoney(purchase.paidAmount)}
                      </div>

                      {purchase.dueAmount > 0 && (
                        <div className="mt-1 text-xs text-rose-600">
                          Due: {formatMoney(purchase.dueAmount)}
                        </div>
                      )}

                      <div className="mt-2">
                        <StatusBadge
                          value={purchase.paymentStatus}
                          styles={paymentStatusStyles}
                          icon={getPaymentIcon(purchase.paymentStatus)}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 align-top">
                      <StatusBadge
                        value={purchase.status}
                        styles={purchaseStatusStyles}
                        icon={getPurchaseIcon(purchase.status)}
                      />
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 text-right align-top font-bold text-slate-900">
                      {formatMoney(purchase.totalAmount)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          title="View purchase"
                          onClick={() => setSelectedPurchase(purchase)}
                        >
                          <Eye size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Edit purchase"
                          onClick={() => handleEditPurchase(purchase)}
                        >
                          <Pencil size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Replace purchase products"
                          onClick={() => handleReplacePurchase(purchase)}
                        >
                          <RefreshCw size={16} />
                        </ActionButton>

                        <ActionButton
                          title="Return purchase products"
                          onClick={() => handleReturnPurchase(purchase)}
                        >
                          <Undo2 size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Mobile Cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 lg:hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Purchase Records</h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredPurchases.length} purchase
              {filteredPurchases.length !== 1 ? "s" : ""} found.
            </p>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyPurchases />
          </div>
        ) : (
          filteredPurchases.map((purchase) => (
            <motion.div
              key={purchase.id}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{purchase.id}</p>

                  <p className="mt-1 text-xs text-slate-500">
                    Invoice: {purchase.invoiceNumber}
                  </p>
                </div>

                <StatusBadge
                  value={purchase.status}
                  styles={purchaseStatusStyles}
                  icon={getPurchaseIcon(purchase.status)}
                />
              </div>

              {/* Products */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Purchased Products
                </p>

                <div className="space-y-3">
                  {purchase.products.map((product, index) => (
                    <div
                      key={`${product.name}-mobile-${index}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Quantity: {product.quantity}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {formatMoney(product.price)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">per unit</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MobileInfo
                  label="Date"
                  value={formatDate(purchase.purchaseDate)}
                />

                <MobileInfo label="Items" value={purchase.items} />

                <MobileInfo
                  label="Total"
                  value={formatMoney(purchase.totalAmount)}
                />

                <MobileInfo
                  label="Paid"
                  value={formatMoney(purchase.paidAmount)}
                />

                <MobileInfo
                  label="Due"
                  value={formatMoney(purchase.dueAmount)}
                />
              </div>

              <div className="mt-4">
                <StatusBadge
                  value={purchase.paymentStatus}
                  styles={paymentStatusStyles}
                  icon={getPaymentIcon(purchase.paymentStatus)}
                />
              </div>

              {/* Mobile Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(purchase)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Eye size={16} />
                  View
                </button>

                <button
                  type="button"
                  onClick={() => handleEditPurchase(purchase)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleReplacePurchase(purchase)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 py-2.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                >
                  <RefreshCw size={16} />
                  Replace
                </button>

                <button
                  type="button"
                  onClick={() => handleReturnPurchase(purchase)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <Undo2 size={16} />
                  Return
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedPurchase && (
          <ModalOverlay onClose={() => setSelectedPurchase(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Purchase Details
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {selectedPurchase.id}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Invoice: {selectedPurchase.invoiceNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Supplier"
                    value={selectedPurchase.supplier}
                  />

                  <DetailItem
                    label="Purchase Date"
                    value={formatDate(selectedPurchase.purchaseDate)}
                  />

                  <DetailItem
                    label="Payment Status"
                    value={selectedPurchase.paymentStatus}
                  />

                  <DetailItem
                    label="Purchase Status"
                    value={selectedPurchase.status}
                  />
                </div>

                {/* Purchased Products */}
                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Purchased Products
                  </h3>

                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Product</th>

                            <th className="px-4 py-3 font-semibold">
                              Quantity
                            </th>

                            <th className="px-4 py-3 font-semibold">
                              Unit Price
                            </th>

                            <th className="px-4 py-3 text-right font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {selectedPurchase.products.map((product, index) => (
                            <tr key={`${product.name}-${index}`}>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {product.name}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {product.quantity}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {formatMoney(product.price)}
                              </td>

                              <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                {formatMoney(product.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <AmountBox
                    label="Total"
                    value={selectedPurchase.totalAmount}
                  />

                  <AmountBox label="Paid" value={selectedPurchase.paidAmount} />

                  <AmountBox label="Due" value={selectedPurchase.dueAmount} />
                </div>

                {/* Modal Actions */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPurchase(null);
                      handleEditPurchase(selectedPurchase);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                  >
                    <Pencil size={17} />
                    Edit Purchase
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPurchase(null);
                      handleReplacePurchase(selectedPurchase);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                  >
                    <RefreshCw size={17} />
                    Replace
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPurchase(null);
                      handleReturnPurchase(selectedPurchase);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Undo2 size={17} />
                    Return
                  </button>
                </div>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingPurchase && (
          <ModalOverlay onClose={() => !savingEdit && setEditingPurchase(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Edit Purchase
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editingPurchase.id}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingPurchase(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={savePurchaseEdit}>
                <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
                  {editError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {editError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Supplier
                      </label>
                      <select
                        required
                        value={editingPurchase.supplierId}
                        onChange={(e) =>
                          updateEditField("supplierId", Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Select supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Invoice Number
                      </label>
                      <input
                        value={editingPurchase.invoiceNumber}
                        onChange={(e) =>
                          updateEditField("invoiceNumber", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                        placeholder="Invoice number"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        required
                        value={editingPurchase.purchaseDate}
                        onChange={(e) =>
                          updateEditField("purchaseDate", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Purchase Status
                      </label>
                      <select
                        value={editingPurchase.status}
                        onChange={(e) =>
                          updateEditField("status", e.target.value)
                        }
                        disabled={editingPurchase.status === "Cancelled"}
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        {editingPurchase.status === "Cancelled" && (
                          <option value="Cancelled">Cancelled</option>
                        )}
                      </select>
                      <p className="mt-1 text-xs text-slate-500">
                        Cancelled purchases must use the return workflow.
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-900">
                        Purchase Items
                      </h3>
                      <button
                        type="button"
                        onClick={addEditItem}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        <Plus size={16} />
                        Add item
                      </button>
                    </div>

                    <div className="space-y-3">
                      {editingPurchase.products.map((item, index) => (
                        <div
                          key={item.id ?? `new-${index}`}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                            <div className="sm:col-span-5">
                              <label className="mb-1 block text-xs font-semibold text-slate-600">
                                Item Name
                              </label>
                              <input
                                required
                                value={item.name}
                                onChange={(e) =>
                                  updateEditItem(index, "name", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                              />
                              {item.quantityAddedToStock > 0 && (
                                <p className="mt-1 text-xs text-amber-700">
                                  {item.quantityAddedToStock} already added to
                                  stock
                                </p>
                              )}
                            </div>

                            <div className="sm:col-span-2">
                              <label className="mb-1 block text-xs font-semibold text-slate-600">
                                Quantity
                              </label>
                              <input
                                required
                                type="number"
                                min={Math.max(1, item.quantityAddedToStock)}
                                step="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateEditItem(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="mb-1 block text-xs font-semibold text-slate-600">
                                Unit Price (AFN)
                              </label>
                              <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) =>
                                  updateEditItem(index, "price", e.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                              />
                            </div>

                            <div className="flex items-end sm:col-span-2">
                              <button
                                type="button"
                                onClick={() => removeEditItem(index)}
                                className="w-full rounded-lg border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <p className="mt-3 text-right text-sm font-semibold text-slate-700">
                            Line total:{" "}
                            {formatMoney(
                              Math.max(0, Number(item.quantity) || 0) *
                                Math.max(0, Number(item.price) || 0),
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Amount Paid (AFN)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max={editTotal}
                        step="0.01"
                        value={editingPurchase.paidAmount}
                        onChange={(e) =>
                          updateEditField("paidAmount", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-600">Purchase total</span>
                        <span className="font-bold text-slate-900">
                          {formatMoney(editTotal)}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between gap-3 text-sm">
                        <span className="text-slate-600">Remaining due</span>
                        <span className="font-bold text-rose-600">
                          {formatMoney(editDue)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Payment status:{" "}
                        {Number(editingPurchase.paidAmount) === editTotal
                          ? "Paid"
                          : Number(editingPurchase.paidAmount) > 0
                            ? "Partial"
                            : "Unpaid"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={editingPurchase.notes}
                      onChange={(e) => updateEditField("notes", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
                      placeholder="Optional purchase notes"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => setEditingPurchase(null)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {actionType && actionPurchase && (
          <ModalOverlay onClose={closeActionModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {actionType === "replace"
                      ? "Replace Purchase Item"
                      : "Return Purchase Item"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Purchase {actionPurchase.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={savingAction}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitPurchaseAction}>
                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
                  {actionError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {actionError}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Purchase item
                    </label>
                    <select
                      required
                      value={actionItemId}
                      onChange={(event) => setActionItemId(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                    >
                      {actionPurchase.products.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — Qty {item.quantity} —{" "}
                          {formatMoney(item.price)} per unit
                        </option>
                      ))}
                    </select>
                  </div>

                  {actionType === "replace" && (
                    <>
                      <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                        This replaces the entire selected purchase line. The new
                        product will be created in your store, and its inventory
                        quantity will be transferred from the old product if
                        stock was previously recorded.
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          New computer / product name
                        </label>
                        <input
                          required
                          value={replacement.name}
                          onChange={(event) =>
                            setReplacement((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="e.g. Dell Latitude 5420"
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          New quantity
                        </label>
                        <input
                          required
                          type="number"
                          min="1"
                          step="1"
                          value={replacement.quantity}
                          onChange={(event) =>
                            setReplacement((current) => ({
                              ...current,
                              quantity: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                          Enter how many units of the new product you are
                          receiving.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">
                            SKU / product code
                          </label>
                          <input
                            required
                            value={replacement.sku}
                            onChange={(event) =>
                              setReplacement((current) => ({
                                ...current,
                                sku: event.target.value,
                              }))
                            }
                            placeholder="e.g. DELL-LAT-5420"
                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Category
                          </label>
                          <select
                            required
                            value={replacement.category_id}
                            onChange={(event) =>
                              setReplacement((current) => ({
                                ...current,
                                category_id: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                          >
                            <option value="">Select category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          {categories.length === 0 && (
                            <p className="mt-1 text-xs text-amber-700">
                              No categories loaded. Check the categories API
                              endpoint.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">
                            New purchase price (AFN per unit)
                          </label>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={replacement.purchase_price}
                            onChange={(event) =>
                              setReplacement((current) => ({
                                ...current,
                                purchase_price: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-semibold text-slate-700">
                            Selling price (AFN per unit)
                          </label>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={replacement.selling_price}
                            onChange={(event) =>
                              setReplacement((current) => ({
                                ...current,
                                selling_price: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-semibold text-slate-700">
                          Description / specifications
                        </label>
                        <textarea
                          rows={3}
                          value={replacement.description}
                          onChange={(event) =>
                            setReplacement((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          placeholder="CPU, RAM, storage, condition, serial details..."
                          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                        />
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm text-slate-600">
                          Original line total:{" "}
                          <strong>
                            {formatMoney(
                              (Number(
                                selectedItemSafe(actionPurchase, actionItemId)
                                  ?.price,
                              ) || 0) *
                                (Number(
                                  selectedItemSafe(actionPurchase, actionItemId)
                                    ?.quantity,
                                ) || 0),
                            )}
                          </strong>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Replacement line total:{" "}
                          <strong>
                            {formatMoney(
                              (Number(replacement.purchase_price) || 0) *
                                (Number(replacement.quantity) || 0),
                            )}
                          </strong>
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          Price difference:{" "}
                          {formatMoney(
                            (Number(replacement.purchase_price) || 0) *
                              (Number(replacement.quantity) || 0) -
                              (Number(
                                selectedItemSafe(actionPurchase, actionItemId)
                                  ?.price,
                              ) || 0) *
                                (Number(
                                  selectedItemSafe(actionPurchase, actionItemId)
                                    ?.quantity,
                                ) || 0),
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          A positive difference reduces store balance; a
                          negative difference credits it.
                        </p>
                      </div>
                    </>
                  )}

                  {actionType === "return" && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="font-semibold text-rose-800">
                        Confirm return
                      </p>
                      <p className="mt-1 text-sm text-rose-700">
                        The selected purchase line will be deleted. The product
                        record itself will remain in your store. If inventory
                        was recorded, the returned units will be removed from
                        stock, provided enough units remain.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                      Reason (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(event) => setActionReason(event.target.value)}
                      placeholder="Describe why the item is being replaced or returned"
                      className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    disabled={savingAction}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      savingAction ||
                      !actionItemId ||
                      (actionType === "replace" && categories.length === 0)
                    }
                    className={`rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                      actionType === "replace"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {savingAction
                      ? "Processing..."
                      : actionType === "replace"
                        ? "Confirm Replacement"
                        : "Confirm Return"}
                  </button>
                </div>
              </form>
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

const StatusBadge = ({ value, styles, icon }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value]}`}
    >
      {icon}
      {value}
    </span>
  );
};

const ActionButton = ({ children, onClick, title }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
    >
      {children}
    </button>
  );
};

const FilterSelect = ({ label, value, onChange, options }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
};

const MobileInfo = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
};

const DetailItem = ({ label, value }) => {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
};

const AmountBox = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {formatMoney(value)}
      </p>
    </div>
  );
};

const EmptyPurchases = () => {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Package size={25} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-900">No purchases found</h3>

      <p className="mt-1 text-sm text-slate-500">
        There are no purchase records matching your filters.
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
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[95vh] w-full justify-center"
      >
        {children}
      </div>
    </motion.div>
  );
};

export default Purchases;
