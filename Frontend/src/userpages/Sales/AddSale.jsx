import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

const AddSale = () => {
  const navigate = useNavigate();

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

  // Match the selected ID with the real database product.
  const selectedProduct = products.find(
    (product) => String(product.id) === String(selectedProductId),
  );

  // Always read the backend's snake_case product fields.
  const subtotal = saleItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discountAmount = Number(discount) || 0;
  const total = Math.max(subtotal - discountAmount, 0);
  const paid = Number(paidAmount) || 0;
  const remaining = Math.max(total - paid, 0);

  // Load products from the authenticated backend.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const response = await fetch(`${API_BASE_URL}/api/products`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load products.");
        }

        // Support either { products: [...] } or a direct array response.
        const productList = Array.isArray(data) ? data : data.products;

        if (!Array.isArray(productList)) {
          throw new Error("The products API returned an unexpected response.");
        }

        setProducts(productList);
      } catch (error) {
        toast.error(error.message || "Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const addProductToSale = () => {
    if (!selectedProduct) {
      toast.error("Please select a product.");
      return;
    }

    const requestedQuantity = Number(quantity);
    const availableStock = Number(selectedProduct.quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      toast.error("Quantity must be a positive whole number.");
      return;
    }

    if (requestedQuantity > availableStock) {
      toast.error("Not enough stock available.");
      return;
    }

    const existingItem = saleItems.find(
      (item) => String(item.productId) === String(selectedProduct.id),
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + requestedQuantity;

      if (newQuantity > availableStock) {
        toast.error("The selected quantity exceeds available stock.");
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
      toast.error("Quantity must be at least 1.");
      return;
    }

    const product = products.find(
      (item) => String(item.id) === String(productId),
    );

    if (!product) {
      toast.error("Product not found.");
      return;
    }

    if (newQuantity > Number(product.quantity)) {
      toast.error("Quantity exceeds available stock.");
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
      toast.error("Customer name is required.");
      return;
    }

    if (!paymentMethod.trim()) {
      toast.error("Please select a payment method.");
      return;
    }

    if (saleItems.length === 0) {
      toast.error("Add at least one product.");
      return;
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      toast.error("Discount must be a valid non-negative amount.");
      return;
    }

    if (discountAmount > subtotal) {
      toast.error("Discount cannot exceed the subtotal.");
      return;
    }

    if (!Number.isFinite(paid) || paid < 0 || paid > total) {
      toast.error("Paid amount must be between 0 and the sale total.");
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
      toast.error("Please check the products and quantities.");
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create sale.");
      }

      toast.success("Sale created successfully.");
      navigate("/dashboard/sales");
    } catch (error) {
      toast.error(error.message || "Failed to create sale.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard/sales"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={17} />
              Back to Sales
            </Link>

            <h1 className="text-2xl font-bold text-slate-900">
              Create New Sale
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add products and create a sale.
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <ShoppingCart size={24} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Customer Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer Name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter customer name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Customer Phone
                </label>

                <input
                  type="text"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-slate-900">
              Add Products
            </h2>

            <div className="grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Product
                </label>

                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={loadingProducts || products.length === 0}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingProducts
                      ? "Loading products..."
                      : products.length === 0
                        ? "No products available"
                        : "Select product"}
                  </option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — $
                      {Number(product.selling_price).toFixed(2)} (Stock:{" "}
                      {product.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
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
                Add
              </button>
            </div>

            {saleItems.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-3">Product</th>
                      <th className="px-3 py-3">Price</th>
                      <th className="px-3 py-3">Quantity</th>
                      <th className="px-3 py-3">Total</th>
                      <th className="px-3 py-3">Action</th>
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

                        <td className="px-3 py-4 text-slate-600">
                          ${item.price.toFixed(2)}
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(
                                item.productId,
                                Number(event.target.value),
                              )
                            }
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
                            aria-label={`Remove ${item.name}`}
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
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-5 text-lg font-semibold text-slate-900">
                Payment Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Paid Amount
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
                    Discount
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
                Sale Summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-emerald-600">
                  <span>Paid</span>
                  <span>${paid.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-semibold text-orange-600">
                  <span>Remaining</span>
                  <span>${remaining.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingProducts}
                className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Creating Sale..." : "Create Sale"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSale;
