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

const API_BASE_URL = "http://localhost:3000";

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
        setLoadError("Invalid sale ID.");
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
          throw new Error("The requested sale could not be found.");
        }

        const saleItems = Array.isArray(record.items)
          ? record.items
          : Array.isArray(record.sale_items)
            ? record.sale_items
            : [];

        if (saleItems.length === 0) {
          throw new Error("This sale has no product items to edit.");
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
            name: item.product_name || item.product?.name || "Product",
            quantity: Number(item.quantity || 1),
            price: Number(item.unit_price || 0),
            purchasePrice: Number(item.purchase_price || 0),
          })),
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load sale:", error);
          setLoadError(error.message || "Failed to load sale.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSale();

    return () => controller.abort();
  }, [id]);

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
      toast.error("Sale data has not loaded.");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please enter the customer name.");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    if (items.length === 0) {
      toast.error("This sale must contain at least one product.");
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
      toast.error("Each item must have a valid product, quantity, and price.");
      return;
    }

    if (discountAmount > subtotal) {
      toast.error("Discount cannot be greater than the subtotal.");
      return;
    }

    if (paid > total) {
      toast.error("Paid amount cannot be greater than the total.");
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

      toast.success("Sale updated successfully.");
      navigate("/dashboard/sales");
    } catch (error) {
      console.error("Failed to update sale:", error);
      toast.error(error.message || "Failed to update sale.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <LoaderCircle className="animate-spin" size={20} />
          Loading sale details...
        </div>
      </div>
    );
  }

  if (loadError || !sale) {
    return (
      <div className="min-h-[60vh] bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Unable to load sale
          </h1>
          <p className="mt-2 text-sm text-red-600">
            {loadError || "The requested sale was not found."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/dashboard/sales"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Sales
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
            Back to Sales
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Sales Management
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Edit Sale
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Correct customer, payment, and sold product information.
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Sale number: {sale.sale_number || sale.id}
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
                  Customer Information
                </h2>
                <p className="text-sm text-slate-500">
                  Update the customer's information.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter customer name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Enter customer phone"
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
                  Sale Information
                </h2>
                <p className="text-sm text-slate-500">
                  Review the date and payment method.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">
                  The date is displayed for reference and is not changed by this
                  form.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank">Bank</option>
                  <option value="Credit">Credit</option>
                  <option value="Mobile Money">Mobile Money</option>
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
                  Sold Products
                </h2>
                <p className="text-sm text-slate-500">
                  Correct product quantities and prices.
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
                      Product {index + 1}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-slate-600">
                        Quantity
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
                        Selling Price
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
                      Product Total
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
                    Payment Details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Correct discount and paid amount.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Discount
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
                    Paid Amount
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
                Updated Summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-semibold text-slate-950">
                    ${formatMoney(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-semibold text-red-600">
                    -${formatMoney(discountAmount)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-bold text-slate-950">
                      Total
                    </span>
                    <span className="text-xl font-bold text-slate-950">
                      ${formatMoney(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-semibold text-emerald-700">
                    ${formatMoney(paid)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Remaining</span>
                  <span className="font-bold text-red-600">
                    ${formatMoney(remaining)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <span className="text-slate-500">Payment Status</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      remaining === 0
                        ? "bg-emerald-100 text-emerald-700"
                        : paid > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {remaining === 0 ? "Paid" : paid > 0 ? "Partial" : "Unpaid"}
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
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
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
