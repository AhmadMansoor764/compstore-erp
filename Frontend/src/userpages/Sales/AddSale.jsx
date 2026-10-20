import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AddSale = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [discount, setDiscount] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [saleItems, setSaleItems] = useState([]);

  const selectedProduct = products.find(
    (product) => String(product.id) === String(selectedProductId),
  );

  const subtotal = saleItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discountAmount = Number(discount) || 0;
  const total = Math.max(subtotal - discountAmount, 0);
  const paid = Number(paidAmount) || 0;
  const remaining = Math.max(total - paid, 0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await fetch(`${API_BASE_URL}/api/products`, {
          credentials: "include",
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type");
        const data = contentType?.includes("application/json")
          ? await response.json()
          : await response.text();

        if (!response.ok) {
          throw new Error(
            typeof data === "string"
              ? data
              : data.message || t("addSale.failedLoadProducts"),
          );
        }

        const productList = Array.isArray(data) ? data : data.products;

        if (!Array.isArray(productList)) {
          throw new Error(t("addSale.unexpectedProductsResponse"));
        }

        setProducts(productList);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load products:", error);
          toast.error(error.message || t("addSale.failedLoadProducts"));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [t]);

  const addProductToSale = () => {
    if (!selectedProduct) {
      toast.error(t("addSale.selectProduct"));
      return;
    }

    const requestedQuantity = Number(quantity);
    const availableStock = Number(selectedProduct.quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      toast.error(t("addSale.positiveWholeQuantity"));
      return;
    }

    if (requestedQuantity > availableStock) {
      toast.error(t("addSale.notEnoughStock"));
      return;
    }

    const existingItem = saleItems.find(
      (item) => String(item.productId) === String(selectedProduct.id),
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + requestedQuantity;

      if (newQuantity > availableStock) {
        toast.error(t("addSale.quantityExceedsStock"));
        return;
      }

      setSaleItems((currentItems) =>
        currentItems.map((item) =>
          String(item.productId) === String(selectedProduct.id)
            ? { ...item, quantity: newQuantity }
            : item,
        ),
      );
    } else {
      setSaleItems((currentItems) => [
        ...currentItems,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          quantity: requestedQuantity,
          price: Number(selectedProduct.selling_price),
          purchasePrice: Number(selectedProduct.purchase_price),
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
  };

  const removeSaleItem = (productId) => {
    setSaleItems((currentItems) =>
      currentItems.filter(
        (item) => String(item.productId) !== String(productId),
      ),
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
      toast.error(t("addSale.quantityAtLeastOne"));
      return;
    }

    const product = products.find(
      (item) => String(item.id) === String(productId),
    );

    if (!product) {
      toast.error(t("addSale.productNotFound"));
      return;
    }

    if (newQuantity > Number(product.quantity)) {
      toast.error(t("addSale.quantityExceedsStock"));
      return;
    }

    setSaleItems((currentItems) =>
      currentItems.map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!customerName.trim()) {
      toast.error(t("addSale.customerNameRequired"));
      return;
    }

    if (!paymentMethod.trim()) {
      toast.error(t("addSale.selectPaymentMethod"));
      return;
    }

    if (saleItems.length === 0) {
      toast.error(t("addSale.addAtLeastOneProduct"));
      return;
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      toast.error(t("addSale.invalidDiscount"));
      return;
    }

    if (discountAmount > subtotal) {
      toast.error(t("addSale.discountExceedsSubtotal"));
      return;
    }

    if (!Number.isFinite(paid) || paid < 0 || paid > total) {
      toast.error(t("addSale.invalidPaidAmount"));
      return;
    }

    const invalidItem = saleItems.some(
      (item) =>
        !Number.isInteger(Number(item.productId)) ||
        !Number.isInteger(Number(item.quantity)) ||
        item.quantity < 1 ||
        !Number.isFinite(item.price) ||
        item.price < 0,
    );

    if (invalidItem) {
      toast.error(t("addSale.checkProductsQuantities"));
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/sales`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          payment_method: paymentMethod,
          discount: Number(discountAmount.toFixed(2)),
          paid_amount: Number(paid.toFixed(2)),
          items: saleItems.map((item) => ({
            product_id: Number(item.productId),
            quantity: Number(item.quantity),
            unit_price: Number(item.price.toFixed(2)),
          })),
        }),
      });

      const contentType = response.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data.message || t("addSale.failedCreateSale"),
        );
      }

      toast.success(t("addSale.saleCreated"));
      navigate("/dashboard/sales");
    } catch (error) {
      console.error("Failed to create sale:", error);
      toast.error(error.message || t("addSale.failedCreateSale"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard/sales"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              {t("addSale.backToSales")}
            </Link>

            <h1 className="text-2xl font-bold text-slate-900">
              {t("addSale.title")}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {t("addSale.description")}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <ShoppingCart size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {t("addSale.customerInformation")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t("addSale.customerName")}
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder={t("addSale.enterCustomerName")}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t("addSale.customerPhone")}
                </label>

                <input
                  type="text"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder={t("addSale.enterPhoneNumber")}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Add Products */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              {t("addSale.addProducts")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t("addSale.product")}
                </label>

                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={loadingProducts || products.length === 0}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingProducts
                      ? t("addSale.loadingProducts")
                      : products.length === 0
                        ? t("addSale.noProductsAvailable")
                        : t("addSale.selectProduct")}
                  </option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — $
                      {Number(product.selling_price).toFixed(2)} (
                      {t("addSale.stock")}: {product.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t("addSale.quantity")}
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value),
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={addProductToSale}
                disabled={loadingProducts || !selectedProduct}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={18} />
                {t("addSale.add")}
              </button>
            </div>

            {saleItems.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-3">{t("addSale.product")}</th>
                      <th className="px-3 py-3">{t("addSale.price")}</th>
                      <th className="px-3 py-3">{t("addSale.quantity")}</th>
                      <th className="px-3 py-3">{t("addSale.total")}</th>
                      <th className="px-3 py-3">{t("addSale.action")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {saleItems.map((item) => (
                      <tr
                        key={item.productId}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4 font-medium text-slate-900">
                          {item.name}
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(event) => {
                              const value = event.target.value;

                              setSaleItems((currentItems) =>
                                currentItems.map((saleItem) =>
                                  String(saleItem.productId) ===
                                  String(item.productId)
                                    ? {
                                        ...saleItem,
                                        price: value === "" ? 0 : Number(value),
                                      }
                                    : saleItem,
                                ),
                              );
                            }}
                            aria-label={`${t("addSale.price")}: ${item.name}`}
                            className="w-28 rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) => {
                              const value = event.target.value;

                              if (value === "") {
                                return;
                              }

                              updateQuantity(item.productId, Number(value));
                            }}
                            aria-label={`${t("addSale.quantity")}: ${item.name}`}
                            className="w-20 rounded-lg border border-slate-200 px-2 py-2"
                          />
                        </td>
                        <td className="px-3 py-4 font-semibold text-slate-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => removeSaleItem(item.productId)}
                            aria-label={`${t("addSale.remove")} ${item.name}`}
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Payment and Summary */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-5 text-lg font-semibold text-slate-900">
                {t("addSale.paymentInformation")}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t("addSale.paymentMethod")}
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Cash">{t("addSale.cash")}</option>
                    <option value="Bank">{t("addSale.bank")}</option>
                    <option value="Mobile Money">
                      {t("addSale.mobileMoney")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t("addSale.paidAmount")}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    {t("addSale.discount")}
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-5 text-lg font-semibold text-slate-900">
                {t("addSale.saleSummary")}
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{t("addSale.subtotal")}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>{t("addSale.discount")}</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>{t("addSale.total")}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-emerald-600">
                  <span>{t("addSale.paid")}</span>
                  <span>${paid.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-semibold text-orange-600">
                  <span>{t("addSale.remaining")}</span>
                  <span>${remaining.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingProducts}
                className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? t("addSale.creatingSale")
                  : t("addSale.createSale")}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default AddSale;
