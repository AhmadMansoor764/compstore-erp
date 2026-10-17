import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  Plus,
  Trash2,
  Truck,
  Wallet,
  Save,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const formatMoney = (amount) => `${Number(amount || 0).toLocaleString()} AFN`;

const createEmptyProduct = () => ({
  id: Date.now() + Math.random(),
  name: "",
  quantity: 1,
  price: "",
});

const AddPurchase = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [supplierId, setSupplierId] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("Pending");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState([createEmptyProduct()]);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoadingSuppliers(true);

        const response = await fetch(`${API_URL}/api/products/form-options`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || t("purchases.add.errors.loadSuppliers"),
          );
        }

        setSuppliers(data.suppliers || []);
      } catch (error) {
        console.error("Fetch suppliers error:", error);
        toast.error(
          error.message || t("purchases.add.errors.unableLoadSuppliers"),
        );
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, [API_URL, t]);

  const subtotal = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total +
          (Number(product.quantity) || 0) * (Number(product.price) || 0),
        0,
      ),
    [products],
  );

  const totalItems = useMemo(
    () =>
      products.reduce(
        (total, product) => total + (Number(product.quantity) || 0),
        0,
      ),
    [products],
  );

  const paid = Number(paidAmount) || 0;
  const dueAmount = Math.max(subtotal - paid, 0);

  const paymentStatus =
    subtotal === 0
      ? "Unpaid"
      : paid === 0
        ? "Unpaid"
        : paid >= subtotal
          ? "Paid"
          : "Partial";

  const paymentStatusLabel = {
    Paid: t("purchases.add.status.paid"),
    Partial: t("purchases.add.status.partial"),
    Unpaid: t("purchases.add.status.unpaid"),
  };

  const purchaseStatusLabel = {
    Received: t("purchases.add.status.received"),
    Pending: t("purchases.add.status.pending"),
    Cancelled: t("purchases.add.status.cancelled"),
  };

  const updateProduct = (id, field, value) => {
    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
  };

  const addProduct = () => {
    setProducts((currentProducts) => [
      ...currentProducts,
      createEmptyProduct(),
    ]);
  };

  const removeProduct = (id) => {
    setProducts((currentProducts) => {
      if (currentProducts.length === 1) return currentProducts;

      return currentProducts.filter((product) => product.id !== id);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!supplierId) {
      toast.error(t("purchases.add.errors.selectSupplier"));
      return;
    }

    if (!purchaseDate || Number.isNaN(Date.parse(purchaseDate))) {
      toast.error(t("purchases.add.errors.validDate"));
      return;
    }

    if (!["Received", "Pending", "Cancelled"].includes(status)) {
      toast.error(t("purchases.add.errors.validStatus"));
      return;
    }

    if (products.length === 0) {
      toast.error(t("purchases.add.errors.addProduct"));
      return;
    }

    const invalidProduct = products.some((product) => {
      const quantity = Number(product.quantity);
      const price = Number(product.price);

      return (
        !product.name.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        product.price === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(price * 100)
      );
    });

    if (invalidProduct) {
      toast.error(t("purchases.add.errors.invalidProduct"));
      return;
    }

    const paidValue = Number(paidAmount);

    if (
      paidAmount === "" ||
      !Number.isFinite(paidValue) ||
      paidValue < 0 ||
      !Number.isInteger(paidValue * 100)
    ) {
      toast.error(t("purchases.add.errors.invalidPaidAmount"));
      return;
    }

    const calculatedTotal =
      Math.round(
        products.reduce(
          (total, product) =>
            total + Number(product.quantity) * Number(product.price),
          0,
        ) * 100,
      ) / 100;

    if (paidValue > calculatedTotal) {
      toast.error(t("purchases.add.errors.paidExceedsTotal"));
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/purchases`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_id: Number(supplierId),
          invoice_number: invoiceNumber.trim() || null,
          purchase_date: purchaseDate,
          status,
          paid_amount: paidValue,
          notes: notes.trim() || null,
          items: products.map((product) => ({
            product_name: product.name.trim(),
            quantity: Number(product.quantity),
            unit_price: Number(product.price),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || t("purchases.add.errors.createPurchase"),
        );
      }

      toast.success(t("purchases.add.success"));
      navigate("/dashboard/purchases");
    } catch (error) {
      console.error("Create purchase error:", error);
      toast.error(
        error.message || t("purchases.add.errors.unableSavePurchase"),
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  const selectClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

  const labelClass = "mb-2 block text-sm font-medium text-slate-700";

  const sectionClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

  const directionClass = isRTL ? "text-right" : "text-left";

  return (
    <div
      className={`min-w-0 space-y-6 ${directionClass}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Package size={16} />
            <span>{t("purchases.add.inventory")}</span>
            <span>/</span>
            <span>{t("purchases.add.purchases")}</span>
            <span>/</span>
            <span className="text-slate-700">
              {t("purchases.add.newPurchase")}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {t("purchases.add.title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            {t("purchases.add.description")}
          </p>
        </div>

        <Link
          to="/dashboard/purchases"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          {t("purchases.add.backToPurchases")}
        </Link>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Information */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={sectionClass}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Truck size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                {t("purchases.add.supplierInformation")}
              </h2>
              <p className="text-sm text-slate-500">
                {t("purchases.add.supplierDescription")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                {t("purchases.add.supplierName")}{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                required
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                disabled={loadingSuppliers || suppliers.length === 0}
                className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="">
                  {loadingSuppliers
                    ? t("purchases.add.loadingSuppliers")
                    : suppliers.length === 0
                      ? t("purchases.add.noSuppliers")
                      : t("purchases.add.selectSupplier")}
                </option>

                {suppliers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.company_name ? ` — ${item.company_name}` : ""}
                  </option>
                ))}
              </select>

              {!loadingSuppliers && suppliers.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  {t("purchases.add.noSuppliersHint")}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                {t("purchases.add.invoiceNumber")}{" "}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({t("purchases.add.optional")})
                </span>
              </label>

              <input
                type="text"
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                placeholder="e.g. TW-45821"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("purchases.add.purchaseDate")}{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <CalendarDays
                  size={17}
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                    isRTL ? "right-3" : "left-3"
                  }`}
                />

                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  className={`${inputClass} ${
                    isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {t("purchases.add.purchaseStatus")}{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className={selectClass}
              >
                {["Received", "Pending", "Cancelled"].map((value) => (
                  <option key={value} value={value}>
                    {purchaseStatusLabel[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.section>

        {/* Products */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={sectionClass}
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                {t("purchases.add.purchasedProducts")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("purchases.add.productsDescription")}
              </p>
            </div>

            <button
              type="button"
              onClick={addProduct}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              {t("purchases.add.addProduct")}
            </button>
          </div>

          <div className="space-y-4">
            {products.map((product, index) => {
              const productTotal =
                (Number(product.quantity) || 0) * (Number(product.price) || 0);

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {t("purchases.add.product")} {index + 1}
                    </h3>

                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      disabled={products.length === 1}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      {t("purchases.add.remove")}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        {t("purchases.add.productName")}{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        required
                        type="text"
                        value={product.name}
                        onChange={(event) =>
                          updateProduct(product.id, "name", event.target.value)
                        }
                        placeholder="e.g. Dell Latitude 5420"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        {t("purchases.add.quantity")}{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={product.quantity}
                        onChange={(event) =>
                          updateProduct(
                            product.id,
                            "quantity",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        {t("purchases.add.unitPrice")}{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={product.price}
                        onChange={(event) =>
                          updateProduct(product.id, "price", event.target.value)
                        }
                        placeholder="0"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <span className="text-sm text-slate-500">
                      {t("purchases.add.productTotal")}
                    </span>

                    <span className="text-sm font-bold text-slate-900">
                      {formatMoney(productTotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Payment Information */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={sectionClass}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Wallet size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                {t("purchases.add.paymentInformation")}
              </h2>
              <p className="text-sm text-slate-500">
                {t("purchases.add.paymentDescription")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>
                {t("purchases.add.paidAmount")}{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{t("purchases.add.notes")}</label>

              <input
                type="text"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("purchases.add.notesPlaceholder")}
                className={inputClass}
              />
            </div>
          </div>
        </motion.section>

        {/* Summary */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={sectionClass}
        >
          <h2 className="mb-5 font-semibold text-slate-900">
            {t("purchases.add.purchaseSummary")}
          </h2>

          <div className="space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">
                {t("purchases.add.totalItems")}
              </span>
              <span className="font-semibold text-slate-800">{totalItems}</span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">
                {t("purchases.add.totalAmount")}
              </span>
              <span className="font-bold text-slate-900">
                {formatMoney(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-500">
                {t("purchases.add.paidAmount")}
              </span>
              <span className="font-semibold text-emerald-600">
                {formatMoney(paid)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-sm">
              <span className="font-medium text-slate-600">
                {t("purchases.add.dueAmount")}
              </span>
              <span className="font-bold text-rose-600">
                {formatMoney(dueAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-600">
                {t("purchases.add.paymentStatus")}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  paymentStatus === "Paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : paymentStatus === "Partial"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                }`}
              >
                {paymentStatusLabel[paymentStatus]}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard/purchases"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("purchases.add.cancel")}
            </Link>

            <button
              type="submit"
              disabled={saving || loadingSuppliers || suppliers.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving
                ? t("purchases.add.saving")
                : t("purchases.add.savePurchase")}
            </button>
          </div>
        </motion.section>
      </form>
    </div>
  );
};

export default AddPurchase;
