import prisma from "../lib/prisma.js";

const getStore = async (userId) => {
  const store = await prisma.stores.findUnique({
    where: { owner_id: userId },
    select: { id: true },
  });

  if (!store) {
    const error = new Error("Store not found.");
    error.statusCode = 404;
    throw error;
  }

  return store;
};

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const toCents = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    fail(`${fieldName} must be a valid non-negative amount.`);
  }

  return Math.round((number + Number.EPSILON) * 100);
};

const fromCents = (cents) => Number((cents / 100).toFixed(2));

const getPaymentStatus = (paidCents, totalCents) => {
  if (paidCents === 0) return "Unpaid";
  if (paidCents >= totalCents) return "Paid";
  return "Partial";
};

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    fail("Add at least one product to the sale.");
  }

  return items.map((item) => {
    const productId = Number(item.product_id ?? item.productId);
    const quantity = Number(item.quantity);
    const unitPrice = toCents(
      item.unit_price ?? item.unitPrice ?? item.price,
      "Unit price",
    );

    if (!Number.isInteger(productId) || productId <= 0) {
      fail("Each sale item must have a valid product ID.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      fail("Product quantities must be positive whole numbers.");
    }

    return {
      productId,
      quantity,
      unitPrice,
    };
  });
};

const prepareSale = async (tx, storeId, body, existingItems = []) => {
  const items = validateItems(body.items);

  const productIds = [...new Set(items.map((item) => item.productId))];

  const products = await tx.products.findMany({
    where: {
      store_id: storeId,
      id: { in: productIds },
    },
  });

  if (products.length !== productIds.length) {
    fail("One or more products were not found in your store.");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  // Restore quantities from the previous sale before checking new stock.
  const oldQuantities = new Map();

  for (const item of existingItems) {
    if (item.product_id !== null) {
      oldQuantities.set(
        item.product_id,
        (oldQuantities.get(item.product_id) || 0) + item.quantity,
      );
    }
  }

  const newQuantities = new Map();

  for (const item of items) {
    newQuantities.set(
      item.productId,
      (newQuantities.get(item.productId) || 0) + item.quantity,
    );
  }

  for (const product of products) {
    const restoredQuantity = oldQuantities.get(product.id) || 0;
    const requestedQuantity = newQuantities.get(product.id) || 0;
    const availableQuantity = product.quantity + restoredQuantity;

    if (requestedQuantity > availableQuantity) {
      fail(
        `Insufficient stock for ${product.name}. Available: ${availableQuantity}.`,
      );
    }
  }

  const saleItems = items.map((item) => {
    const product = productMap.get(item.productId);

    return {
      store_id: storeId,
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: fromCents(item.unitPrice),
      purchase_price: product.purchase_price,
      total_price: fromCents(item.unitPrice * item.quantity),
    };
  });

  const subtotalCents = saleItems.reduce(
    (sum, item) => sum + toCents(item.total_price, "Item total"),
    0,
  );

  const discountCents = toCents(body.discount ?? 0, "Discount");
  const paidCents = toCents(
    body.paid_amount ?? body.paidAmount ?? 0,
    "Paid amount",
  );

  if (discountCents > subtotalCents) {
    fail("Discount cannot exceed the subtotal.");
  }

  const totalCents = subtotalCents - discountCents;

  if (paidCents > totalCents) {
    fail("Paid amount cannot exceed the sale total.");
  }

  return {
    items: saleItems,
    subtotalCents,
    discountCents,
    totalCents,
    paidCents,
    dueCents: totalCents - paidCents,
    paymentStatus: getPaymentStatus(paidCents, totalCents),
  };
};

const changeStoreBalance = async (tx, storeId, amountCents, description) => {
  if (amountCents === 0) return;

  await tx.stores.update({
    where: { id: storeId },
    data: {
      balance: {
        increment: fromCents(amountCents),
      },
    },
  });

  await tx.store_transactions.create({
    data: {
      store_id: storeId,
      type: "income",
      amount: fromCents(amountCents),
      description,
    },
  });
};

// GET /api/sales
export const getSales = async (req, res) => {
  try {
    const store = await getStore(req.user.id);

    const sales = await prisma.sales.findMany({
      where: { store_id: store.id },
      include: {
        items: true,
      },
      orderBy: [{ sale_date: "desc" }, { id: "desc" }],
    });

    res.json({
      success: true,
      sales,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch sales.",
    });
  }
};

// GET /api/sales/:id
export const getSaleById = async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      fail("Invalid sale ID.");
    }

    const sale = await prisma.sales.findFirst({
      where: {
        id,
        store_id: store.id,
      },
      include: {
        items: true,
      },
    });

    if (!sale) fail("Sale not found.", 404);

    res.json({
      success: true,
      sale,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch sale.",
    });
  }
};

// POST /api/sales
export const createSale = async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    const customerName = String(
      req.body.customer_name ?? req.body.customerName ?? "",
    ).trim();

    const customerPhone = String(
      req.body.customer_phone ?? req.body.customerPhone ?? "",
    ).trim();

    const paymentMethod = String(
      req.body.payment_method ?? req.body.paymentMethod ?? "",
    ).trim();

    if (!customerName) fail("Customer name is required.");
    if (!paymentMethod) fail("Payment method is required.");

    const sale = await prisma.$transaction(async (tx) => {
      const prepared = await prepareSale(tx, store.id, req.body);

      // Use a store-specific sequence matching the existing sale-number style.
      const count = await tx.sales.count({
        where: { store_id: store.id },
      });

      const saleNumber = `SAL-${String(count + 1).padStart(6, "0")}`;

      // Reserve the stock by decrementing each product's quantity.
      const quantities = new Map();

      for (const item of prepared.items) {
        if (item.product_id !== null) {
          quantities.set(
            item.product_id,
            (quantities.get(item.product_id) || 0) + item.quantity,
          );
        }
      }

      for (const [productId, quantity] of quantities) {
        const result = await tx.products.updateMany({
          where: {
            id: productId,
            store_id: store.id,
            quantity: { gte: quantity },
          },
          data: {
            quantity: { decrement: quantity },
          },
        });

        if (result.count !== 1) {
          fail("Stock changed while creating the sale. Please try again.");
        }
      }

      const createdSale = await tx.sales.create({
        data: {
          store_id: store.id,
          sale_number: saleNumber,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          sale_date: req.body.sale_date
            ? new Date(req.body.sale_date)
            : new Date(),
          subtotal: fromCents(prepared.subtotalCents),
          discount: fromCents(prepared.discountCents),
          total_amount: fromCents(prepared.totalCents),
          paid_amount: fromCents(prepared.paidCents),
          due_amount: fromCents(prepared.dueCents),
          payment_method: paymentMethod,
          payment_status: prepared.paymentStatus,
          status: "Completed",
          items: {
            create: prepared.items,
          },
        },
        include: {
          items: true,
        },
      });

      await changeStoreBalance(
        tx,
        store.id,
        prepared.paidCents,
        `Payment received for sale ${saleNumber}`,
      );

      return createdSale;
    });

    res.status(201).json({
      success: true,
      message: "Sale created successfully.",
      sale,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create sale.",
    });
  }
};

// PUT /api/sales/:id
export const updateSale = async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      fail("Invalid sale ID.");
    }

    const customerName = String(
      req.body.customer_name ?? req.body.customerName ?? "",
    ).trim();

    const customerPhone = String(
      req.body.customer_phone ?? req.body.customerPhone ?? "",
    ).trim();

    const paymentMethod = String(
      req.body.payment_method ?? req.body.paymentMethod ?? "",
    ).trim();

    if (!customerName) fail("Customer name is required.");
    if (!paymentMethod) fail("Payment method is required.");

    const sale = await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sales.findFirst({
        where: { id, store_id: store.id },
        include: { items: true },
      });

      if (!existingSale) fail("Sale not found.", 404);
      if (existingSale.status === "Returned") {
        fail("A returned sale cannot be edited.");
      }

      const prepared = await prepareSale(
        tx,
        store.id,
        req.body,
        existingSale.items,
      );

      const quantities = new Map();

      for (const item of prepared.items) {
        quantities.set(
          item.product_id,
          (quantities.get(item.product_id) || 0) + item.quantity,
        );
      }

      // Restore stock from the old sale first.
      const restored = new Map();

      for (const item of existingSale.items) {
        if (item.product_id !== null) {
          restored.set(
            item.product_id,
            (restored.get(item.product_id) || 0) + item.quantity,
          );
        }
      }

      for (const [productId, quantity] of restored) {
        await tx.products.updateMany({
          where: { id: productId, store_id: store.id },
          data: { quantity: { increment: quantity } },
        });
      }

      // Deduct the updated sale quantities.
      for (const [productId, quantity] of quantities) {
        const result = await tx.products.updateMany({
          where: {
            id: productId,
            store_id: store.id,
            quantity: { gte: quantity },
          },
          data: { quantity: { decrement: quantity } },
        });

        if (result.count !== 1) {
          fail("Insufficient stock while updating the sale.");
        }
      }

      await tx.sale_items.deleteMany({
        where: {
          sale_id: id,
          store_id: store.id,
        },
      });

      const updatedSale = await tx.sales.update({
        where: { id },
        data: {
          customer_name: customerName,
          customer_phone: customerPhone || null,
          sale_date: req.body.sale_date
            ? new Date(req.body.sale_date)
            : existingSale.sale_date,
          subtotal: fromCents(prepared.subtotalCents),
          discount: fromCents(prepared.discountCents),
          total_amount: fromCents(prepared.totalCents),
          paid_amount: fromCents(prepared.paidCents),
          due_amount: fromCents(prepared.dueCents),
          payment_method: paymentMethod,
          payment_status: prepared.paymentStatus,
          items: {
            create: prepared.items,
          },
        },
        include: { items: true },
      });

      const oldPaidCents = toCents(
        existingSale.paid_amount,
        "Previous paid amount",
      );
      const paymentDifference = prepared.paidCents - oldPaidCents;

      if (paymentDifference !== 0) {
        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: {
              increment: fromCents(paymentDifference),
            },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: paymentDifference > 0 ? "income" : "expense",
            amount: fromCents(Math.abs(paymentDifference)),
            description: `Payment adjustment for sale ${existingSale.sale_number}`,
          },
        });
      }

      return updatedSale;
    });

    res.json({
      success: true,
      message: "Sale updated successfully.",
      sale,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update sale.",
    });
  }
};

// PUT /api/sales/:id/return
export const returnSale = async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      fail("Invalid sale ID.");
    }

    const sale = await prisma.$transaction(async (tx) => {
      const existingSale = await tx.sales.findFirst({
        where: { id, store_id: store.id },
        include: { items: true },
      });

      if (!existingSale) fail("Sale not found.", 404);
      if (existingSale.status === "Returned") {
        fail("This sale has already been returned.");
      }

      // Put sold products back into inventory.
      const quantities = new Map();

      for (const item of existingSale.items) {
        if (item.product_id !== null) {
          quantities.set(
            item.product_id,
            (quantities.get(item.product_id) || 0) + item.quantity,
          );
        }
      }

      for (const [productId, quantity] of quantities) {
        await tx.products.updateMany({
          where: { id: productId, store_id: store.id },
          data: { quantity: { increment: quantity } },
        });
      }

      const refundCents = toCents(existingSale.paid_amount, "Paid amount");

      if (refundCents > 0) {
        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: {
              decrement: fromCents(refundCents),
            },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: "expense",
            amount: fromCents(refundCents),
            description: `Refund for returned sale ${existingSale.sale_number}`,
          },
        });
      }

      return tx.sales.update({
        where: { id },
        data: {
          status: "Returned",
        },
        include: { items: true },
      });
    });

    res.json({
      success: true,
      message: "Sale returned successfully.",
      sale,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to return sale.",
    });
  }
};

// PUT /api/sales/:id/replace
export const replaceSale = async (req, res) => {
  try {
    const store = await getStore(req.user.id);
    const saleId = Number(req.params.id);
    const saleItemId = Number(req.body.sale_item_id);
    const replacementProductId = Number(req.body.replacement_product_id);
    const reason = String(req.body.reason || "").trim();

    if (!Number.isInteger(saleId) || saleId <= 0) {
      fail("Invalid sale ID.");
    }

    if (!Number.isInteger(saleItemId) || saleItemId <= 0) {
      fail("Select a valid sold item.");
    }

    if (!Number.isInteger(replacementProductId) || replacementProductId <= 0) {
      fail("Select a valid replacement product.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sales.findFirst({
        where: {
          id: saleId,
          store_id: store.id,
        },
        include: {
          items: true,
        },
      });

      if (!sale) fail("Sale not found.", 404);

      if (sale.status === "Returned") {
        fail("A returned sale cannot be replaced.");
      }

      const oldItem = sale.items.find((item) => item.id === saleItemId);

      if (!oldItem) {
        fail("The selected item does not belong to this sale.", 404);
      }

      if (oldItem.product_id === replacementProductId) {
        fail("Choose a different replacement product.");
      }

      const newProduct = await tx.products.findFirst({
        where: {
          id: replacementProductId,
          store_id: store.id,
        },
      });

      if (!newProduct) {
        fail("Replacement product not found in your store.", 404);
      }

      const quantity = oldItem.quantity;

      if (newProduct.quantity < quantity) {
        fail(
          `Insufficient stock for ${newProduct.name}. Available: ${newProduct.quantity}.`,
        );
      }

      // Return all units of the old item to inventory.
      if (oldItem.product_id !== null) {
        await tx.products.updateMany({
          where: {
            id: oldItem.product_id,
            store_id: store.id,
          },
          data: {
            quantity: { increment: quantity },
          },
        });
      }

      // Deduct all replacement units atomically.
      const stockUpdate = await tx.products.updateMany({
        where: {
          id: replacementProductId,
          store_id: store.id,
          quantity: { gte: quantity },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });

      if (stockUpdate.count !== 1) {
        fail("Stock changed during replacement. Please try again.");
      }

      const oldItemTotalCents = toCents(
        oldItem.total_price,
        "Original item total",
      );

      const newUnitPriceCents = toCents(
        newProduct.selling_price,
        "Replacement selling price",
      );

      const newItemTotalCents = newUnitPriceCents * quantity;

      // Keep other sale items unchanged.
      const subtotalCents =
        toCents(sale.subtotal, "Sale subtotal") -
        oldItemTotalCents +
        newItemTotalCents;

      const discountCents = toCents(sale.discount, "Sale discount");

      if (discountCents > subtotalCents) {
        fail("The sale discount exceeds the updated subtotal.");
      }

      const totalCents = subtotalCents - discountCents;
      const oldPaidCents = toCents(sale.paid_amount, "Paid amount");

      // If the replacement makes the sale cheaper than the amount
      // already paid, refund the excess. Otherwise, retain the payment
      // and increase the amount still due.
      const refundCents = Math.max(0, oldPaidCents - totalCents);
      const paidCents = oldPaidCents - refundCents;
      const dueCents = totalCents - paidCents;

      const updatedItem = await tx.sale_items.update({
        where: {
          id: oldItem.id,
        },
        data: {
          product_id: newProduct.id,
          product_name: newProduct.name,
          quantity,
          unit_price: fromCents(newUnitPriceCents),
          purchase_price: newProduct.purchase_price,
          total_price: fromCents(newItemTotalCents),
        },
      });

      const updatedSale = await tx.sales.update({
        where: {
          id: sale.id,
        },
        data: {
          subtotal: fromCents(subtotalCents),
          total_amount: fromCents(totalCents),
          paid_amount: fromCents(paidCents),
          due_amount: fromCents(dueCents),
          payment_status: getPaymentStatus(paidCents, totalCents),
        },
        include: {
          items: true,
        },
      });

      if (refundCents > 0) {
        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: {
              decrement: fromCents(refundCents),
            },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: "expense",
            amount: fromCents(refundCents),
            description: `Replacement refund for sale ${sale.sale_number}`,
          },
        });
      }

      // Record the replacement event for basic financial/audit tracking.
      await tx.store_transactions.create({
        data: {
          store_id: store.id,
          type: "expense",
          amount: 0,
          description: `Product replacement for sale ${sale.sale_number}: ${oldItem.product_name} -> ${newProduct.name}${reason ? `; Reason: ${reason}` : ""}`,
        },
      });

      return {
        sale: updatedSale,
        item: updatedItem,
        refundAmount: fromCents(refundCents),
        additionalDue: fromCents(Math.max(0, totalCents - oldPaidCents)),
      };
    });

    res.json({
      success: true,
      message: "Product replaced successfully.",
      ...result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to replace sale item.",
    });
  }
};
