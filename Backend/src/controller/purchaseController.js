import prisma from "../lib/prisma.js";

const createPurchase = async (req, res) => {
  try {
    const {
      supplier_id,
      invoice_number,
      purchase_date,
      items,
      paid_amount,
      notes,
      status,
    } = req.body;

    if (!supplier_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier and at least one purchase item are required.",
      });
    }

    if (!["Received", "Pending", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase status.",
      });
    }

    const paidAmount = Number(paid_amount ?? 0);

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Paid amount must be a valid non-negative number.",
      });
    }

    const normalizedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const productName = String(item.product_name ?? "").trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);

      if (
        !productName ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isFinite(unitPrice * quantity) ||
        !Number.isInteger(unitPrice * 100)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each item needs a name, a positive whole-number quantity, and a valid price with at most two decimal places.",
        });
      }

      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      totalAmount += lineTotal;

      normalizedItems.push({
        product_name: productName,
        product_id: item.product_id ? Number(item.product_id) : null,
        quantity,
        unit_price: unitPrice.toFixed(2),
        total_price: lineTotal.toFixed(2),
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    if (paidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot exceed the purchase total.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Create your store before recording purchases.",
      });
    }

    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: Number(supplier_id),
        store_id: store.id,
      },
      select: { id: true },
    });

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid supplier from your store.",
      });
    }

    const productIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.product_id)
          .filter((id) => id !== null),
      ),
    ];

    if (productIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      return res.status(400).json({
        success: false,
        message: "One or more product IDs are invalid.",
      });
    }

    if (productIds.length > 0) {
      const products = await prisma.products.findMany({
        where: {
          id: { in: productIds },
          store_id: store.id,
        },
        select: { id: true },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more products do not belong to your store.",
        });
      }
    }

    const dueAmount = Math.round((totalAmount - paidAmount) * 100) / 100;

    const paymentStatus =
      dueAmount === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";

    const result = await prisma.$transaction(async (tx) => {
      const purchaseCount = await tx.purchases.count({
        where: { store_id: store.id },
      });

      const purchaseNumber = `PUR-${String(purchaseCount + 1).padStart(6, "0")}`;

      const purchase = await tx.purchases.create({
        data: {
          store_id: store.id,
          supplier_id: supplier.id,
          purchase_number: purchaseNumber,
          invoice_number: invoice_number?.trim() || null,
          purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
          total_amount: totalAmount.toFixed(2),
          paid_amount: paidAmount.toFixed(2),
          due_amount: dueAmount.toFixed(2),
          payment_status: paymentStatus,
          status,
          notes: notes?.trim() || null,
          items: {
            create: normalizedItems.map((item) => ({
              store_id: store.id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
            })),
          },
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      // Deduct only the amount actually paid from the store balance.
      if (paidAmount > 0) {
        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: { decrement: paidAmount.toFixed(2) },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: "expense",
            amount: paidAmount.toFixed(2),
            description: `Payment for purchase ${purchaseNumber}`,
          },
        });
      }

      return purchase;
    });

    return res.status(201).json({
      success: true,
      message:
        "Purchase recorded successfully. Inventory has not been changed yet.",
      purchase: result,
    });
  } catch (error) {
    console.error("Create purchase error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase.",
    });
  }
};

const updatePurchase = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const {
      supplier_id,
      invoice_number,
      purchase_date,
      items,
      paid_amount,
      notes,
      status,
    } = req.body;

    if (!Number.isSafeInteger(purchaseId) || purchaseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase ID.",
      });
    }

    if (!supplier_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier and at least one purchase item are required.",
      });
    }

    if (!["Received", "Pending", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase status.",
      });
    }

    const supplierId = Number(supplier_id);
    const paidAmount = Number(paid_amount ?? 0);

    if (
      !Number.isSafeInteger(supplierId) ||
      supplierId <= 0 ||
      !Number.isFinite(paidAmount) ||
      paidAmount < 0 ||
      !Number.isInteger(paidAmount * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier or payment amount.",
      });
    }

    const normalizedItems = [];
    let totalCents = 0;

    for (const item of items) {
      const itemId = item.id == null || item.id === "" ? null : Number(item.id);

      const productId =
        item.product_id == null || item.product_id === ""
          ? null
          : Number(item.product_id);

      const productName = String(item.product_name ?? "").trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price);

      if (
        (itemId !== null && (!Number.isSafeInteger(itemId) || itemId <= 0)) ||
        (productId !== null &&
          (!Number.isSafeInteger(productId) || productId <= 0)) ||
        !productName ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        !Number.isInteger(unitPrice * 100)
      ) {
        return res.status(400).json({
          success: false,
          message: "One or more purchase items contain invalid data.",
        });
      }

      const unitPriceCents = Math.round(unitPrice * 100);
      const lineCents = unitPriceCents * quantity;

      if (!Number.isSafeInteger(lineCents)) {
        return res.status(400).json({
          success: false,
          message: "An item total is too large.",
        });
      }

      totalCents += lineCents;

      normalizedItems.push({
        id: itemId,
        product_id: productId,
        product_name: productName,
        quantity,
        unit_price: (unitPriceCents / 100).toFixed(2),
        total_price: (lineCents / 100).toFixed(2),
        lineCents,
      });
    }

    if (
      !Number.isSafeInteger(totalCents) ||
      Math.round(paidAmount * 100) > totalCents
    ) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot exceed the purchase total.",
      });
    }

    if (purchase_date && Number.isNaN(Date.parse(purchase_date))) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase date.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchases.findFirst({
        where: {
          id: purchaseId,
          store_id: store.id,
        },
        include: { items: true },
      });

      if (!existing) {
        const error = new Error("Purchase not found.");
        error.statusCode = 404;
        throw error;
      }

      if (existing.status === "Cancelled") {
        const error = new Error("Cancelled purchases cannot be edited.");
        error.statusCode = 409;
        throw error;
      }

      if (status === "Cancelled") {
        const error = new Error(
          "Use the Return workflow to cancel or return a purchase.",
        );
        error.statusCode = 409;
        throw error;
      }

      const supplier = await tx.suppliers.findFirst({
        where: {
          id: supplierId,
          store_id: store.id,
        },
        select: { id: true },
      });

      if (!supplier) {
        const error = new Error("Select a valid supplier.");
        error.statusCode = 400;
        throw error;
      }

      const existingById = new Map(
        existing.items.map((item) => [item.id, item]),
      );

      const retainedIds = new Set();

      for (const item of normalizedItems) {
        if (item.id !== null) {
          const oldItem = existingById.get(item.id);

          if (!oldItem || retainedIds.has(item.id)) {
            const error = new Error(
              "A purchase item is invalid or duplicated.",
            );
            error.statusCode = 400;
            throw error;
          }

          retainedIds.add(item.id);

          if (item.quantity < oldItem.quantity_added_to_stock) {
            const error = new Error(
              `Quantity for "${oldItem.product_name}" cannot be less than the ${oldItem.quantity_added_to_stock} units already added to stock.`,
            );
            error.statusCode = 409;
            throw error;
          }

          if (
            item.product_id !== oldItem.product_id &&
            oldItem.quantity_added_to_stock > 0
          ) {
            const error = new Error(
              `The product for "${oldItem.product_name}" cannot be changed because some units have already been added to stock.`,
            );
            error.statusCode = 409;
            throw error;
          }
        } else if (item.product_id !== null) {
          const error = new Error(
            "New purchase lines must not specify a product ID. Save the purchase first, then manage stock separately.",
          );
          error.statusCode = 400;
          throw error;
        }
      }

      for (const oldItem of existing.items) {
        if (
          !retainedIds.has(oldItem.id) &&
          oldItem.quantity_added_to_stock > 0
        ) {
          const error = new Error(
            `Cannot remove "${oldItem.product_name}" because ${oldItem.quantity_added_to_stock} units have already been added to stock.`,
          );
          error.statusCode = 409;
          throw error;
        }
      }

      const productIds = [
        ...new Set(
          normalizedItems
            .map((item) => item.product_id)
            .filter((id) => id !== null),
        ),
      ];

      if (productIds.length) {
        const validProducts = await tx.products.findMany({
          where: {
            id: { in: productIds },
            store_id: store.id,
          },
          select: { id: true },
        });

        if (validProducts.length !== productIds.length) {
          const error = new Error(
            "A selected product does not belong to your store.",
          );
          error.statusCode = 400;
          throw error;
        }
      }

      const totalAmount = (totalCents / 100).toFixed(2);
      const newPaidCents = Math.round(paidAmount * 100);
      const dueCents = totalCents - newPaidCents;
      const dueAmount = (dueCents / 100).toFixed(2);

      const paymentStatus =
        dueCents === 0 ? "Paid" : newPaidCents > 0 ? "Partial" : "Unpaid";

      // Restore the old payment to the balance, then deduct
      // the edited payment. Only the difference affects balance.
      const oldPaidCents = Math.round(Number(existing.paid_amount) * 100);
      const balanceDifferenceCents = oldPaidCents - newPaidCents;

      const updated = await tx.purchases.update({
        where: { id: existing.id },
        data: {
          supplier_id: supplier.id,
          invoice_number: invoice_number?.trim() || null,
          purchase_date: purchase_date
            ? new Date(purchase_date)
            : existing.purchase_date,
          total_amount: totalAmount,
          paid_amount: (newPaidCents / 100).toFixed(2),
          due_amount: dueAmount,
          payment_status: paymentStatus,
          status,
          notes: notes?.trim() || null,
        },
      });

      for (const item of normalizedItems) {
        const itemData = {
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        };

        if (item.id !== null) {
          await tx.purchase_items.update({
            where: { id: item.id },
            data: itemData,
          });
        } else {
          await tx.purchase_items.create({
            data: {
              ...itemData,
              store_id: store.id,
              purchase_id: existing.id,
              quantity_added_to_stock: 0,
            },
          });
        }
      }

      const removedItems = existing.items.filter(
        (item) => !retainedIds.has(item.id),
      );

      if (removedItems.length) {
        await tx.purchase_items.deleteMany({
          where: {
            purchase_id: existing.id,
            id: { in: removedItems.map((item) => item.id) },
          },
        });
      }

      if (balanceDifferenceCents !== 0) {
        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: {
              increment: (balanceDifferenceCents / 100).toFixed(2),
            },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: balanceDifferenceCents > 0 ? "income" : "expense",
            amount: (Math.abs(balanceDifferenceCents) / 100).toFixed(2),
            description: `Payment adjustment for purchase ${existing.purchase_number}`,
          },
        });
      }

      return tx.purchases.findUnique({
        where: { id: updated.id },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              company_name: true,
            },
          },
          items: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Purchase updated successfully.",
      purchase: result,
    });
  } catch (error) {
    console.error("Update purchase error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update purchase.",
    });
  }
};

const replacePurchaseItem = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const {
      purchase_item_id,
      name,
      sku,
      category_id,
      description,
      purchase_price,
      selling_price,
      reason,
      quantity,
    } = req.body;

    const itemId = Number(purchase_item_id);
    const categoryId = Number(category_id);
    const productName = String(name ?? "").trim();
    const productSku = String(sku ?? "").trim();
    const descriptionText = String(description ?? "").trim();
    const newPurchasePrice = Number(purchase_price);
    const newSellingPrice = Number(selling_price);
    const newQuantity = Number(quantity);

    if (!Number.isSafeInteger(newQuantity) || newQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number.",
      });
    }

    if (
      !Number.isSafeInteger(purchaseId) ||
      purchaseId <= 0 ||
      !Number.isSafeInteger(itemId) ||
      itemId <= 0 ||
      !Number.isSafeInteger(categoryId) ||
      categoryId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase, item, or category.",
      });
    }

    if (!productName || !productSku) {
      return res.status(400).json({
        success: false,
        message: "Product name and SKU are required.",
      });
    }

    if (
      !Number.isFinite(newPurchasePrice) ||
      newPurchasePrice < 0 ||
      !Number.isInteger(newPurchasePrice * 100) ||
      !Number.isFinite(newSellingPrice) ||
      newSellingPrice < 0 ||
      !Number.isInteger(newSellingPrice * 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Prices must be valid amounts with at most two decimals.",
      });
    }

    const purchasePriceCents = Math.round(newPurchasePrice * 100);
    const sellingPriceCents = Math.round(newSellingPrice * 100);

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchases.findFirst({
        where: { id: purchaseId, store_id: store.id },
        include: { items: true },
      });

      if (!purchase) {
        const error = new Error("Purchase not found.");
        error.statusCode = 404;
        throw error;
      }

      if (purchase.status === "Cancelled") {
        const error = new Error("A cancelled purchase cannot be replaced.");
        error.statusCode = 409;
        throw error;
      }

      const oldItem = purchase.items.find((item) => item.id === itemId);

      if (!oldItem) {
        const error = new Error("Purchase item not found.");
        error.statusCode = 404;
        throw error;
      }

      if (
        oldItem.product_id &&
        oldItem.product_id === Number(req.body.product_id)
      ) {
        const error = new Error("The replacement must be a new product.");
        error.statusCode = 400;
        throw error;
      }

      const category = await tx.categories.findFirst({
        where: {
          id: categoryId,
          store_id: store.id,
        },
        select: { id: true },
      });

      if (!category) {
        const error = new Error("Select a valid category from your store.");
        error.statusCode = 400;
        throw error;
      }

      const duplicateSku = await tx.products.findFirst({
        where: {
          store_id: store.id,
          sku: productSku,
        },
        select: { id: true },
      });

      if (duplicateSku) {
        const error = new Error(
          "This SKU already exists in your store. Please use a unique SKU.",
        );
        error.statusCode = 409;
        throw error;
      }

      const oldLineCents = Math.round(Number(oldItem.total_price) * 100);
      const newLineCents = purchasePriceCents * newQuantity;
      const differenceCents = newLineCents - oldLineCents;

      const oldTotalCents = Math.round(Number(purchase.total_amount) * 100);
      const oldPaidCents = Math.round(Number(purchase.paid_amount) * 100);

      const newTotalCents = oldTotalCents + differenceCents;
      const newPaidCents = oldPaidCents + differenceCents;
      const newDueCents = newTotalCents - newPaidCents;

      if (
        !Number.isSafeInteger(newLineCents) ||
        newTotalCents < 0 ||
        newPaidCents < 0 ||
        newPaidCents > newTotalCents ||
        newDueCents < 0
      ) {
        const error = new Error(
          "This replacement would create an invalid purchase balance.",
        );
        error.statusCode = 409;
        throw error;
      }

      const stockUnits = Number(oldItem.quantity_added_to_stock || 0);

      if (stockUnits > 0 && !oldItem.product_id) {
        const error = new Error(
          "The original item has stock recorded but no linked product.",
        );
        error.statusCode = 409;
        throw error;
      }

      if (stockUnits > 0) {
        const oldProduct = await tx.products.findFirst({
          where: {
            id: oldItem.product_id,
            store_id: store.id,
          },
        });

        if (!oldProduct || oldProduct.quantity < stockUnits) {
          const error = new Error(
            "There is not enough remaining stock to replace this item. Some units may have already been sold.",
          );
          error.statusCode = 409;
          throw error;
        }

        await tx.products.update({
          where: { id: oldProduct.id },
          data: { quantity: { decrement: stockUnits } },
        });
      }

      const newProduct = await tx.products.create({
        data: {
          store_id: store.id,
          category_id: category.id,
          supplier_id: purchase.supplier_id,
          name: productName,
          sku: productSku,
          description: descriptionText || null,
          purchase_price: (purchasePriceCents / 100).toFixed(2),
          selling_price: (sellingPriceCents / 100).toFixed(2),
          quantity: stockUnits > 0 ? newQuantity : 0,
        },
      });

      await tx.purchase_items.update({
        where: { id: oldItem.id },
        data: {
          product_id: newProduct.id,
          product_name: newProduct.name,
          quantity: newQuantity,
          unit_price: (purchasePriceCents / 100).toFixed(2),
          total_price: (newLineCents / 100).toFixed(2),
          quantity_added_to_stock: stockUnits,
        },
      });

      const paymentStatus =
        newDueCents === 0 ? "Paid" : newPaidCents > 0 ? "Partial" : "Unpaid";

      await tx.purchases.update({
        where: { id: purchase.id },
        data: {
          total_amount: (newTotalCents / 100).toFixed(2),
          paid_amount: (newPaidCents / 100).toFixed(2),
          due_amount: (newDueCents / 100).toFixed(2),
          payment_status: paymentStatus,
          notes: [
            purchase.notes,
            `Replaced "${oldItem.product_name}" with "${productName}" (${newQuantity} units).${reason?.trim() ? ` Reason: ${reason.trim()}` : ""}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });

      if (differenceCents !== 0) {
        const amount = (Math.abs(differenceCents) / 100).toFixed(2);

        await tx.stores.update({
          where: { id: store.id },
          data:
            differenceCents > 0
              ? { balance: { decrement: amount } }
              : { balance: { increment: amount } },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: differenceCents > 0 ? "expense" : "income",
            amount,
            description: `Replacement price adjustment for ${purchase.purchase_number}`,
          },
        });
      }

      return tx.purchases.findUnique({
        where: { id: purchase.id },
        include: {
          supplier: {
            select: { id: true, name: true, company_name: true },
          },
          items: true,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Purchase item replaced successfully.",
      purchase: result,
    });
  } catch (error) {
    console.error("Replace purchase item error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : error.code === "P2002"
          ? "This SKU already exists in your store."
          : "Failed to replace purchase item.",
    });
  }
};

const returnPurchaseItem = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const { purchase_item_id, reason } = req.body;

    if (
      !Number.isSafeInteger(purchaseId) ||
      purchaseId <= 0 ||
      !Number.isSafeInteger(Number(purchase_item_id)) ||
      Number(purchase_item_id) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase or purchase item ID.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchases.findFirst({
        where: { id: purchaseId, store_id: store.id },
        include: { items: true },
      });

      if (!purchase) {
        const error = new Error("Purchase not found.");
        error.statusCode = 404;
        throw error;
      }

      if (purchase.status === "Cancelled") {
        const error = new Error("This purchase has already been cancelled.");
        error.statusCode = 409;
        throw error;
      }

      const item = purchase.items.find(
        (entry) => entry.id === Number(purchase_item_id),
      );

      if (!item) {
        const error = new Error(
          "Purchase item not found. It may already have been returned.",
        );
        error.statusCode = 404;
        throw error;
      }

      const lineCents = Math.round(Number(item.total_price) * 100);
      const oldTotalCents = Math.round(Number(purchase.total_amount) * 100);
      const oldPaidCents = Math.round(Number(purchase.paid_amount) * 100);

      if (lineCents > oldTotalCents || oldTotalCents <= 0) {
        const error = new Error(
          "The purchase totals are invalid; the item cannot be returned safely.",
        );
        error.statusCode = 409;
        throw error;
      }

      // Allocate the already-paid amount proportionally to this item.
      // This avoids refunding money that was never paid to the supplier.
      const refundCents = Math.min(
        lineCents,
        Math.round((oldPaidCents * lineCents) / oldTotalCents),
      );

      const stockUnits = item.quantity_added_to_stock;

      if (stockUnits > 0) {
        if (!item.product_id) {
          const error = new Error(
            "This item has stock recorded but no linked product.",
          );
          error.statusCode = 409;
          throw error;
        }

        const product = await tx.products.findFirst({
          where: {
            id: item.product_id,
            store_id: store.id,
          },
        });

        if (!product || product.quantity < stockUnits) {
          const error = new Error(
            "There is not enough remaining stock to return this item safely. Check whether some units have already been sold.",
          );
          error.statusCode = 409;
          throw error;
        }

        await tx.products.update({
          where: { id: product.id },
          data: { quantity: { decrement: stockUnits } },
        });
      }

      // Remove this purchase line, not the product record itself.
      await tx.purchase_items.delete({
        where: { id: item.id },
      });

      const newTotalCents = oldTotalCents - lineCents;
      const newPaidCents = oldPaidCents - refundCents;
      const newDueCents = Math.max(0, newTotalCents - newPaidCents);

      const paymentStatus =
        newDueCents === 0 ? "Paid" : newPaidCents > 0 ? "Partial" : "Unpaid";

      await tx.purchases.update({
        where: { id: purchase.id },
        data: {
          total_amount: (newTotalCents / 100).toFixed(2),
          paid_amount: (newPaidCents / 100).toFixed(2),
          due_amount: (newDueCents / 100).toFixed(2),
          payment_status: paymentStatus,
          status: purchase.items.length === 1 ? "Cancelled" : purchase.status,
          notes: [
            purchase.notes,
            `Returned item: ${item.product_name}; quantity: ${item.quantity}; refund: ${(refundCents / 100).toFixed(2)}${reason?.trim() ? `; reason: ${reason.trim()}` : ""}`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });

      if (refundCents > 0) {
        const amount = (refundCents / 100).toFixed(2);

        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: { increment: amount },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: "income",
            amount,
            description: `Refund for returned item from ${purchase.purchase_number}`,
          },
        });
      }

      return {
        purchase: await tx.purchases.findUnique({
          where: { id: purchase.id },
          include: {
            supplier: {
              select: { id: true, name: true, company_name: true },
            },
            items: true,
          },
        }),
        refundAmount: (refundCents / 100).toFixed(2),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Purchase item returned successfully.",
      purchase: result.purchase,
      refundAmount: result.refundAmount,
    });
  } catch (error) {
    console.error("Return purchase item error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to return purchase item.",
    });
  }
};

const getPurchases = async (req, res) => {
  try {
    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const purchases = await prisma.purchases.findMany({
      where: { store_id: store.id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            company_name: true,
          },
        },
        items: true,
      },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({
      success: true,
      purchases,
    });
  } catch (error) {
    console.error("Get purchases error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve purchases.",
    });
  }
};

export {
  createPurchase,
  getPurchases,
  updatePurchase,
  replacePurchaseItem,
  returnPurchaseItem,
};
