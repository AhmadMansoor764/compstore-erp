import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Package,
  CheckCircle,
  AlertCircle,
  Monitor,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";

const API_BASE_URL = "http://localhost:3000";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const ReplaceSale = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [replacementProductId, setReplacementProductId] = useState("");
  const [replacementQuantity, setReplacementQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [saleResponse, productsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/sales/${id}`, {
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/api/products`, {
            credentials: "include",
          }),
        ]);

        const saleData = await saleResponse.json();
        const productsData = await productsResponse.json();

        if (!saleResponse.ok) {
          throw new Error(saleData.message || "Failed to load sale details.");
        }

        if (!productsResponse.ok) {
          throw new Error(productsData.message || "Failed to load products.");
        }

        const saleRecord = saleData.sale || saleData;
        const saleItems = Array.isArray(saleRecord.items)
          ? saleRecord.items
          : [];

        const productList = Array.isArray(productsData)
          ? productsData
          : Array.isArray(productsData.products)
            ? productsData.products
            : Array.isArray(productsData.data)
              ? productsData.data
              : [];

        setSale({
          ...saleRecord,
          items: saleItems,
        });

        setProducts(productList);

        if (saleItems.length > 0) {
          setSelectedItemId(String(saleItems[0].id));
        }
      } catch (err) {
        setError(err.message || "Failed to load replacement information.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const selectedItem = useMemo(
    () =>
      sale?.items?.find((item) => String(item.id) === String(selectedItemId)) ||
      null,
    [sale, selectedItemId],
  );

  const availableProducts = useMemo(
    () => products.filter((product) => Number(product.quantity) > 0),
    [products],
  );

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) => String(product.id) === String(replacementProductId),
      ) || null,
    [products, replacementProductId],
  );

  const originalQuantity = Number(selectedItem?.quantity || 0);
  const oldUnitPrice = Number(selectedItem?.unit_price || 0);
  const oldItemTotal = Number(
    selectedItem?.total_price ?? oldUnitPrice * originalQuantity,
  );

  const newUnitPrice = Number(selectedProduct?.selling_price || 0);
  const availableStock = Number(selectedProduct?.quantity || 0);

  const quantity = Number(replacementQuantity || 0);
  const newItemTotal = newUnitPrice * quantity;
  const priceDifference = newItemTotal - oldItemTotal;

  const maximumReplacementQuantity = selectedProduct
    ? Math.min(originalQuantity, availableStock)
    : originalQuantity;

  const handleSelectItem = (itemId) => {
    setSelectedItemId(itemId);
  };

  const handleSelectProduct = (productId) => {
    setReplacementProductId(productId);
    setReplacementQuantity("1");
  };

  const decreaseQuantity = () => {
    setReplacementQuantity((current) =>
      String(Math.max(1, Number(current || 1) - 1)),
    );
  };

  const increaseQuantity = () => {
    if (!selectedProduct) return;

    setReplacementQuantity((current) =>
      String(Math.min(maximumReplacementQuantity, Number(current || 1) + 1)),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!sale || !selectedItem) {
      toast.error("Please select the sold item to replace.");
      return;
    }

    if (!selectedProduct) {
      toast.error("Please select a replacement product.");
      return;
    }

    if (Number(selectedProduct.id) === Number(selectedItem.product_id)) {
      toast.error("Please choose a different product.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > originalQuantity
    ) {
      toast.error(
        `Replacement quantity must be between 1 and ${originalQuantity}.`,
      );
      return;
    }

    if (quantity > availableStock) {
      toast.error(
        `Only ${availableStock} units of ${selectedProduct.name} are available.`,
      );
      return;
    }

    if (sale.status === "Returned") {
      toast.error("A returned sale cannot be replaced.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/sales/${id}/replace`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sale_item_id: Number(selectedItem.id),
          replacement_product_id: Number(selectedProduct.id),
          replacement_quantity: quantity,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to replace the product.");
      }

      toast.success(data.message || "Product replaced successfully.");

      if (Number(data.refundAmount) > 0) {
        toast.info(`Refund amount: ${formatMoney(data.refundAmount)}`);
      }

      if (Number(data.additionalDue) > 0) {
        toast.info(`Additional amount due: ${formatMoney(data.additionalDue)}`);
      }

      navigate("/dashboard/sales");
    } catch (err) {
      toast.error(err.message || "Failed to replace the product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading sale details...</span>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-800">
              Unable to load replacement
            </h2>
            <p className="mt-1 text-sm text-red-700">
              {error || "Sale not found."}
            </p>
            <Link
              to="/dashboard/sales"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sales
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard/sales"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Replace Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Select the sold item, choose a replacement product, and set the
            quantity to give the customer.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-blue-600">Sale Number</p>
            <p className="font-bold text-blue-900">
              {sale.sale_number || sale.saleNumber || `#${sale.id}`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Original sale information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-gray-100 p-2.5">
              <Package className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Original Sale</h2>
              <p className="text-sm text-gray-500">
                Choose which sold item is being replaced.
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">Customer</p>
              <p className="mt-1 break-words font-semibold text-gray-900">
                {sale.customer_name || sale.customerName || "Walk-in Customer"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">Sale Date</p>
              <p className="mt-1 font-semibold text-gray-900">
                {sale.sale_date
                  ? new Date(sale.sale_date).toLocaleDateString()
                  : sale.saleDate
                    ? new Date(sale.saleDate).toLocaleDateString()
                    : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">Sale Total</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatMoney(sale.total_amount ?? sale.totalAmount)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sale.items?.length ? (
              sale.items.map((item) => {
                const isSelected = String(item.id) === String(selectedItemId);
                const itemQuantity = Number(item.quantity || 0);
                const unitPrice = Number(item.unit_price || 0);
                const itemTotal = Number(
                  item.total_price ?? unitPrice * itemQuantity,
                );

                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="soldItem"
                      value={item.id}
                      checked={isSelected}
                      onChange={() => handleSelectItem(String(item.id))}
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.product_name ||
                                item.productName ||
                                item.name ||
                                "Product"}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Quantity sold: {itemQuantity}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            Selected
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                        <span className="text-gray-500">
                          Unit price:{" "}
                          <span className="font-medium text-gray-800">
                            {formatMoney(unitPrice)}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          Item total:{" "}
                          <span className="font-semibold text-gray-900">
                            {formatMoney(itemTotal)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })
            ) : (
              <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                No items were found in this sale.
              </p>
            )}
          </div>
        </section>

        {/* Replacement product */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-2.5">
              <RefreshCw className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Replacement Product
              </h2>
              <p className="text-sm text-gray-500">
                Select the new product and how many units to give the customer.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="replacementProduct"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Choose Product <span className="text-red-500">*</span>
            </label>

            <select
              id="replacementProduct"
              value={replacementProductId}
              onChange={(event) => handleSelectProduct(event.target.value)}
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a replacement product</option>

              {availableProducts.map((product) => {
                const isOriginal =
                  Number(product.id) === Number(selectedItem?.product_id);

                return (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={isOriginal}
                  >
                    {product.name} — Stock: {product.quantity} — Price:{" "}
                    {formatMoney(product.selling_price)}
                    {isOriginal ? " (Original product)" : ""}
                  </option>
                );
              })}
            </select>

            {availableProducts.length === 0 && (
              <p className="mt-2 text-sm text-amber-700">
                No products currently have available stock.
              </p>
            )}
          </div>

          {/* Replacement quantity */}
          <div className="mt-5">
            <label
              htmlFor="replacementQuantity"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Replacement Quantity <span className="text-red-500">*</span>
            </label>

            <div className="flex max-w-sm items-center gap-3">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={!selectedProduct || quantity <= 1}
                aria-label="Decrease replacement quantity"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                id="replacementQuantity"
                type="number"
                inputMode="numeric"
                min="1"
                max={maximumReplacementQuantity}
                step="1"
                value={replacementQuantity}
                onChange={(event) => setReplacementQuantity(event.target.value)}
                disabled={!selectedProduct}
                required
                className="h-11 min-w-0 flex-1 rounded-xl border border-gray-300 px-4 text-center font-semibold text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  !selectedProduct || quantity >= maximumReplacementQuantity
                }
                aria-label="Increase replacement quantity"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-300 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {selectedProduct
                ? `Available stock: ${availableStock}. You can give 1 to ${maximumReplacementQuantity} unit(s).`
                : "Select a replacement product to choose its quantity."}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Original quantity sold: {originalQuantity} unit(s).
            </p>

            {selectedProduct && maximumReplacementQuantity === 0 && (
              <p className="mt-2 text-sm text-red-600">
                No units of this product are available for replacement.
              </p>
            )}
          </div>

          {/* Price summary */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="font-semibold text-gray-900">Replacement Summary</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500">Original product</span>
                <span className="text-right font-medium text-gray-900">
                  {selectedItem?.product_name ||
                    selectedItem?.productName ||
                    selectedItem?.name ||
                    "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Original quantity</span>
                <span className="font-medium text-gray-900">
                  {originalQuantity}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Original item total</span>
                <span className="font-medium text-gray-900">
                  {formatMoney(oldItemTotal)}
                </span>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex items-start justify-between gap-4">
                <span className="text-gray-500">Replacement product</span>
                <span className="text-right font-medium text-gray-900">
                  {selectedProduct?.name || "Not selected"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Replacement unit price</span>
                <span className="font-medium text-gray-900">
                  {formatMoney(newUnitPrice)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Replacement quantity</span>
                <span className="font-semibold text-gray-900">
                  {selectedProduct ? quantity || 0 : "—"}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Replacement item total</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(newItemTotal)}
                </span>
              </div>

              <div className="border-t border-gray-200" />

              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-gray-700">
                  Price difference
                </span>
                <span
                  className={`text-lg font-bold ${
                    priceDifference > 0
                      ? "text-red-600"
                      : priceDifference < 0
                        ? "text-green-600"
                        : "text-gray-900"
                  }`}
                >
                  {priceDifference > 0 ? "+" : ""}
                  {formatMoney(priceDifference)}
                </span>
              </div>

              {priceDifference > 0 && (
                <p className="text-xs leading-5 text-red-600">
                  The replacement item total is higher than the original item
                  total. The additional amount may become due.
                </p>
              )}

              {priceDifference < 0 && (
                <p className="text-xs leading-5 text-green-700">
                  The replacement item total is lower than the original item
                  total. Any refund depends on the amount already paid.
                </p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="mt-6">
            <label
              htmlFor="replacementReason"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Reason for Replacement{" "}
              <span className="text-gray-400">(optional)</span>
            </label>

            <textarea
              id="replacementReason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example: customer requested a different model..."
              className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </section>

        {/* Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Please review before confirming</p>
            <p className="mt-1 leading-5">
              The replacement updates inventory and the sale's item totals.
              Confirm the quantity and price difference before submitting.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/dashboard/sales"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              !selectedItem ||
              !selectedProduct ||
              quantity < 1 ||
              quantity > maximumReplacementQuantity
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Processing Replacement...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirm Replacement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReplaceSale;
