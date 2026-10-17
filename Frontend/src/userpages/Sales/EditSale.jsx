import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Save,
  UserRound,
  CalendarDays,
  CreditCard,
  ReceiptText,
  LoaderCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getErrorMessage = async (response) => {
  const contentType = response.headers.get("content-type");
  const data = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  return typeof data === "string"
    ? data
    : data.message || data.error || "Something went wrong.";
};

const EditSale = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();

  // Supports translations containing placeholders such as {number}.
  const tx = (key, params = {}) => {
    let text = t(key);

    if (typeof text !== "string") {
      return text;
    }

    Object.entries(params).forEach(([name, value]) => {
      text = text
        .replaceAll(`{{${name}}}`, String(value))
        .replaceAll(`{${name}}`, String(value));
    });

    return text;
  };

  const [sale, setSale] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("0");
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadSale = async () => {
      if (!id || !/^\d+$/.test(id)) {
        setLoadError(t("editSale.invalidSaleId"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const response = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data = await response.json();
        const record = data.sale || data;

        if (!record || !record.id) {
          throw new Error(t("editSale.saleNotFound"));
        }

        const saleItems = Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.sale_items)
            ? record.sale_items
            : [];

        if (saleItems.length === 0) {
          throw new Error(t("editSale.noProductItems"));
        }

        setSale(record);
        setCustomerName(record.customer_name || "");
        setCustomerPhone(record.customer_phone || "");
        setSaleDate(
          record.sale_date ? String(record.sale_date).slice(0, 10) : "",
        );
        setPaymentMethod(record.payment_method || "Cash");
        setDiscount(String(Number(record.discount || 0)));
        setPaidAmount(String(Number(record.paid_amount || 0)));

        setItems(
          saleItems.map((item) => ({
            id: item.id,
            productId: item.product_id ?? item.product?.id ?? null,
            name:
              item.product_name || item.product?.name || t("editSale.product"),
            quantity: Number(item.quantity || 1),
            price: Number(item.unit_price || 0),
            purchasePrice: Number(item.purchase_price || 0),
          })),
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load sale:", error);
          setLoadError(error.message || t("editSale.failedLoadSale"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSale();

    return () => controller.abort();
  }, [id, t]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(Number(item.quantity) || 0, 0) *
            Math.max(Number(item.price) || 0, 0),
        0,
      ),
    [items],
  );

  const discountAmount = Math.max(Number(discount) || 0, 0);
  const total = Math.max(subtotal - discountAmount, 0);
  const paid = Math.max(Number(paidAmount) || 0, 0);
  const remaining = Math.max(total - paid, 0);

  const updateItem = (index, field, value) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value === "" ? "" : Math.max(Number(value) || 0, 0),
            }
          : item,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!sale) {
      toast.error(t("editSale.saleNotLoaded"));
      return;
    }

    if (!customerName.trim()) {
      toast.error(t("editSale.enterCustomerName"));
      return;
    }

    if (!paymentMethod) {
      toast.error(t("editSale.selectPaymentMethod"));
      return;
    }

    if (items.length === 0) {
      toast.error(t("editSale.atLeastOneProduct"));
      return;
    }

    if (
      items.some(
        (item) =>
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1 ||
          !Number.isFinite(Number(item.price)) ||
          Number(item.price) < 0 ||
          !Number.isInteger(Number(item.productId)) ||
          Number(item.productId) < 1,
      )
    ) {
      toast.error(t("editSale.invalidProductDetails"));
      return;
    }

    if (discountAmount > subtotal) {
      toast.error(t("editSale.discountTooHigh"));
      return;
    }

    if (paid > total) {
      toast.error(t("editSale.paidAmountTooHigh"));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        payment_method: paymentMethod,
        discount: Number(discountAmount.toFixed(2)),
        paid_amount: Number(paid.toFixed(2)),
        items: items.map((item) => ({
          product_id: Number(item.productId),
          quantity: Number(item.quantity),
          unit_price: Number(Number(item.price).toFixed(2)),
        })),
      };

      const response = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      toast.success(t("editSale.saleUpdated"));
      navigate("/dashboard/sales");
    } catch (error) {
      console.error("Failed to update sale:", error);
      toast.error(error.message || t("editSale.failedUpdateSale"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <LoaderCircle className="animate-spin" size={20} />
          {t("editSale.loadingDetails")}
        </div>
      </div>
    );
  }

  if (loadError || !sale) {
    return (
      <div className="min-h-[60vh] bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            {t("editSale.unableToLoad")}
          </h1>

          <p className="mt-2 text-sm text-red-600">
            {loadError || t("editSale.saleNotFound")}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {t("editSale.tryAgain")}
            </button>

            <Link
              to="/dashboard/sales"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {t("editSale.backToSales")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/dashboard/sales"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            {t("editSale.backToSales")}
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t("editSale.salesManagement")}
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {t("editSale.title")}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {t("editSale.description")}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                {t("editSale.saleNumber")}: {sale.sale_number || sale.id}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <Pencil size={23} />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {t("editSale.customerInformation")}
                </h2>

                <p className="text-sm text-slate-500">
                  {t("editSale.updateCustomerInformation")}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t("editSale.customerName")}
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder={t("editSale.enterCustomerName")}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t("editSale.customerPhone")}
                </label>

                <input
                  type="text"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder={t("editSale.enterCustomerPhone")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Sale Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <CalendarDays size={19} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {t("editSale.saleInformation")}
                </h2>

                <p className="text-sm text-slate-500">
                  {t("editSale.reviewDatePayment")}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t("editSale.saleDate")}
                </label>

                <input
                  type="date"
                  value={saleDate}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                />

                <p className="mt-1 text-xs text-slate-400">
                  {t("editSale.dateReferenceOnly")}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {t("editSale.paymentMethod")}
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Cash">{t("editSale.cash")}</option>
                  <option value="Card">{t("editSale.card")}</option>
                  <option value="Bank">{t("editSale.bank")}</option>
                  <option value="Credit">{t("editSale.credit")}</option>
                  <option value="Mobile Money">
                    {t("editSale.mobileMoney")}
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Products */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ReceiptText size={19} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {t("editSale.soldProducts")}
                </h2>

                <p className="text-sm text-slate-500">
                  {t("editSale.correctProductDetails")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id ?? `${item.productId}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4">
                    <p className="text-sm font-bold text-slate-950">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {tx("editSale.productNumber", {
                        number: index + 1,
                      })}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        {t("editSale.quantity")}
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(index, "quantity", event.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        {t("editSale.sellingPrice")}
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(event) =>
                          updateItem(index, "price", event.target.value)
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                    <span className="text-sm text-slate-500">
                      {t("editSale.productTotal")}
                    </span>

                    <span className="text-base font-bold text-slate-950">
                      ${formatMoney(Number(item.price) * Number(item.quantity))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment and Summary */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <CreditCard size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    {t("editSale.paymentDetails")}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {t("editSale.correctPaymentDetails")}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t("editSale.discount")}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {t("editSale.paidAmount")}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-5 text-lg font-bold text-slate-950">
                {t("editSale.updatedSummary")}
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    {t("editSale.subtotal")}
                  </span>

                  <span className="font-semibold text-slate-950">
                    ${formatMoney(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    {t("editSale.discount")}
                  </span>

                  <span className="font-semibold text-red-600">
                    -${formatMoney(discountAmount)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-bold text-slate-950">
                      {t("editSale.total")}
                    </span>

                    <span className="text-xl font-bold text-slate-950">
                      ${formatMoney(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{t("editSale.paid")}</span>

                  <span className="font-semibold text-emerald-700">
                    ${formatMoney(paid)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    {t("editSale.remaining")}
                  </span>

                  <span className="font-bold text-red-600">
                    ${formatMoney(remaining)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <span className="text-slate-500">
                    {t("editSale.paymentStatus")}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      remaining === 0
                        ? "bg-emerald-100 text-emerald-700"
                        : paid > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {remaining === 0
                      ? t("editSale.paidStatus")
                      : paid > 0
                        ? t("editSale.partialStatus")
                        : t("editSale.unpaidStatus")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/dashboard/sales"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              {t("editSale.cancel")}
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  {t("editSale.saving")}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t("editSale.saveChanges")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSale;
