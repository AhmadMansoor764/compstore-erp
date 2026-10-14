import prisma from "../lib/prisma.js";

export const getProductFormOptions = async (req, res) => {
  try {
    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    const [categories, suppliers] = await Promise.all([
      prisma.categories.findMany({
        where: { store_id: store.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),

      prisma.suppliers.findMany({
        where: { store_id: store.id },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          company_name: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      categories,
      suppliers,
    });
  } catch (error) {
    console.error("Get product form options error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load categories and suppliers.",
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category_id,
      supplier_id,
      quantity,
      low_stock_threshold,
      purchase_price,
      selling_price,
      description,
    } = req.body;

    // Validate required fields.
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (
      category_id === undefined ||
      category_id === null ||
      String(category_id).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a category.",
      });
    }

    // Convert and validate numeric values.
    const categoryId = Number(category_id);
    const quantityValue = Number(quantity);
    const thresholdValue = Number(low_stock_threshold);
    const purchaseValue = Number(purchase_price);
    const sellingValue = Number(selling_price);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      quantity === "" ||
      quantity === undefined ||
      !Number.isInteger(quantityValue) ||
      quantityValue < 0 ||
      low_stock_threshold === "" ||
      low_stock_threshold === undefined ||
      !Number.isInteger(thresholdValue) ||
      thresholdValue < 0 ||
      purchase_price === "" ||
      purchase_price === undefined ||
      !Number.isFinite(purchaseValue) ||
      purchaseValue < 0 ||
      selling_price === "" ||
      selling_price === undefined ||
      !Number.isFinite(sellingValue) ||
      sellingValue < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Check the category, quantity, minimum stock, and prices.",
      });
    }

    // Decimal(12,2) supports at most 2 decimal places.
    const hasTooManyDecimals = (value) =>
      !/^\d+(\.\d{1,2})?$/.test(String(value).trim());

    if (
      hasTooManyDecimals(purchase_price) ||
      hasTooManyDecimals(selling_price)
    ) {
      return res.status(400).json({
        success: false,
        message: "Prices can have at most 2 decimal places.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    // Ensure the category belongs to this store.
    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        store_id: store.id,
      },
      select: { id: true },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "The selected category is invalid.",
      });
    }

    // Supplier is optional, but must belong to this store if selected.
    let supplierId = null;

    if (
      supplier_id !== undefined &&
      supplier_id !== null &&
      String(supplier_id).trim() !== ""
    ) {
      supplierId = Number(supplier_id);

      if (!Number.isInteger(supplierId) || supplierId <= 0) {
        return res.status(400).json({
          success: false,
          message: "The selected supplier is invalid.",
        });
      }

      const supplier = await prisma.suppliers.findFirst({
        where: {
          id: supplierId,
          store_id: store.id,
        },
        select: { id: true },
      });

      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: "The selected supplier is invalid.",
        });
      }
    }

    // SKU is optional in the form. Generate one if it is omitted.
    const normalizedSku = typeof sku === "string" ? sku.trim() : "";

    const finalSku =
      normalizedSku ||
      `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    if (finalSku.length > 100) {
      return res.status(400).json({
        success: false,
        message: "SKU cannot exceed 100 characters.",
      });
    }

    const duplicateSku = await prisma.products.findFirst({
      where: {
        store_id: store.id,
        sku: finalSku,
      },
      select: { id: true },
    });

    if (duplicateSku) {
      return res.status(409).json({
        success: false,
        message: "This SKU already exists in your store.",
      });
    }

    const product = await prisma.products.create({
      data: {
        store_id: store.id,
        category_id: categoryId,
        supplier_id: supplierId,
        name: name.trim(),
        sku: finalSku,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        quantity: quantityValue,
        low_stock_threshold: thresholdValue,
        purchase_price: purchaseValue.toFixed(2),
        selling_price: sellingValue.toFixed(2),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, name: true, company_name: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This SKU already exists in your store.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add product.",
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const normalizedName = name.trim();

    // Find the store belonging to the logged-in user.
    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    // Reuse an existing category instead of creating a duplicate.
    const existingCategory = await prisma.categories.findFirst({
      where: {
        store_id: store.id,
        name: {
          equals: normalizedName,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return res.status(200).json({
        success: true,
        message: "Category already exists.",
        category: existingCategory,
      });
    }

    // Create a new category for this store.
    const category = await prisma.categories.create({
      data: {
        store_id: store.id,
        name: normalizedName,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This category already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};

// GET /api/products
export const getProducts = async (req, res) => {
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

    const products = await prisma.products.findMany({
      where: { store_id: store.id },
      include: {
        category: { select: { id: true, name: true } },
        supplier: {
          select: { id: true, name: true, company_name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve products.",
    });
  }
};

// GET /api/products/:id

export const getProductById = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
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

    const product = await prisma.products.findFirst({
      where: {
        id: productId,
        store_id: store.id,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, name: true, company_name: true },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const purchaseItem = await prisma.purchase_items.findFirst({
      where: {
        product_id: productId,
        store_id: store.id,
      },
      select: { id: true },
    });

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        isPurchaseLinked: Boolean(purchaseItem),
      },
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product.",
    });
  }
};

// PUT /api/products/:id

export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
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

    const existingProduct = await prisma.products.findFirst({
      where: {
        id: productId,
        store_id: store.id,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Purchase-linked products cannot be edited through this endpoint.
    const purchaseItem = await prisma.purchase_items.findFirst({
      where: {
        product_id: productId,
        store_id: store.id,
      },
      select: { id: true },
    });

    if (purchaseItem) {
      return res.status(409).json({
        success: false,
        isPurchaseLinked: true,
        message:
          "This product is linked to a purchase record and cannot be edited here.",
      });
    }

    const {
      name,
      sku,
      category_id,
      supplier_id,
      quantity,
      low_stock_threshold,
      purchase_price,
      selling_price,
      description,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    const categoryId = Number(category_id);
    const quantityValue = Number(quantity);
    const thresholdValue = Number(low_stock_threshold);
    const purchaseValue = Number(purchase_price);
    const sellingValue = Number(selling_price);
    const normalizedSku = typeof sku === "string" ? sku.trim() : "";

    const validPrice = (value) =>
      value !== "" &&
      value !== undefined &&
      value !== null &&
      Number.isFinite(Number(value)) &&
      Number(value) >= 0 &&
      /^\d+(\.\d{1,2})?$/.test(String(value).trim());

    if (
      !Number.isSafeInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isSafeInteger(quantityValue) ||
      quantityValue < 0 ||
      !Number.isSafeInteger(thresholdValue) ||
      thresholdValue < 0 ||
      !validPrice(purchase_price) ||
      !validPrice(selling_price) ||
      !normalizedSku ||
      normalizedSku.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please check the product details, quantity, SKU, and prices.",
      });
    }

    const category = await prisma.categories.findFirst({
      where: {
        id: categoryId,
        store_id: store.id,
      },
      select: { id: true },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "The selected category is invalid.",
      });
    }

    let supplierId = null;

    if (
      supplier_id !== undefined &&
      supplier_id !== null &&
      supplier_id !== ""
    ) {
      supplierId = Number(supplier_id);

      if (!Number.isSafeInteger(supplierId) || supplierId <= 0) {
        return res.status(400).json({
          success: false,
          message: "The selected supplier is invalid.",
        });
      }

      const supplier = await prisma.suppliers.findFirst({
        where: {
          id: supplierId,
          store_id: store.id,
        },
        select: { id: true },
      });

      if (!supplier) {
        return res.status(400).json({
          success: false,
          message: "The selected supplier is invalid.",
        });
      }
    }

    const duplicateSku = await prisma.products.findFirst({
      where: {
        store_id: store.id,
        sku: normalizedSku,
        NOT: { id: productId },
      },
      select: { id: true },
    });

    if (duplicateSku) {
      return res.status(409).json({
        success: false,
        message: "This SKU already exists in your store.",
      });
    }

    const product = await prisma.products.update({
      where: { id: productId },
      data: {
        name: name.trim(),
        sku: normalizedSku,
        category_id: categoryId,
        supplier_id: supplierId,
        quantity: quantityValue,
        low_stock_threshold: thresholdValue,
        purchase_price: purchaseValue.toFixed(2),
        selling_price: sellingValue.toFixed(2),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, name: true, company_name: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: {
        ...product,
        isPurchaseLinked: false,
      },
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This SKU already exists in your store.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product.",
    });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
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

    const product = await prisma.products.findFirst({
      where: { id: productId, store_id: store.id },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Keep historical purchase records intact.
    const linkedPurchaseItems = await prisma.purchase_items.count({
      where: {
        product_id: productId,
        store_id: store.id,
      },
    });

    if (linkedPurchaseItems > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This product is linked to purchase records and cannot be deleted. Use the appropriate inventory adjustment workflow to manage its remaining stock.",
      });
    }

    await prisma.products.delete({
      where: { id: productId },
    });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.code === "P2003" || error.code === "P2014") {
      return res.status(409).json({
        success: false,
        message:
          "This product is referenced by other records and cannot be deleted.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete product.",
    });
  }
};

export const addPurchaseItemToStock = async (req, res) => {
  try {
    const purchaseItemId = Number(req.body.purchase_item_id);

    const {
      category_id,
      sku,
      low_stock_threshold,
      selling_price,
      description,
    } = req.body;

    if (!Number.isSafeInteger(purchaseItemId) || purchaseItemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Select a valid purchase item.",
      });
    }

    const categoryId = Number(category_id);
    const threshold = Number(low_stock_threshold);
    const sellingPrice = Number(selling_price);

    if (
      !Number.isSafeInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isSafeInteger(threshold) ||
      threshold < 0 ||
      selling_price === "" ||
      selling_price === undefined ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice < 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(selling_price).trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid category, minimum stock, and selling price.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    const category = await prisma.categories.findFirst({
      where: { id: categoryId, store_id: store.id },
      select: { id: true },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "The selected category is invalid.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.purchase_items.findFirst({
        where: {
          id: purchaseItemId,
          store_id: store.id,
          purchase: { store_id: store.id },
        },
        include: {
          purchase: {
            select: {
              id: true,
              supplier_id: true,
              status: true,
            },
          },
          product: true,
        },
      });

      if (!item) {
        throw new Error("PURCHASE_ITEM_NOT_FOUND");
      }

      const remaining = item.quantity - item.quantity_added_to_stock;

      if (remaining <= 0) {
        throw new Error("NO_REMAINING_QUANTITY");
      }

      // If already linked, add only the unprocessed quantity.
      if (item.product_id && item.product) {
        const product = await tx.products.update({
          where: { id: item.product_id },
          data: {
            quantity: { increment: remaining },
          },
          include: {
            category: { select: { id: true, name: true } },
            supplier: {
              select: { id: true, name: true, company_name: true },
            },
          },
        });

        await tx.purchase_items.update({
          where: { id: item.id },
          data: { quantity_added_to_stock: item.quantity },
        });

        return { product, quantityAdded: remaining };
      }

      // Create a product for an unlinked purchase item.
      const normalizedSku =
        typeof sku === "string" && sku.trim()
          ? sku.trim()
          : `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (normalizedSku.length > 100) {
        throw new Error("INVALID_SKU");
      }

      const duplicate = await tx.products.findFirst({
        where: {
          store_id: store.id,
          sku: normalizedSku,
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new Error("DUPLICATE_SKU");
      }

      const product = await tx.products.create({
        data: {
          store_id: store.id,
          category_id: categoryId,
          supplier_id: item.purchase.supplier_id,
          name: item.product_name.trim(),
          sku: normalizedSku,
          description:
            typeof description === "string" && description.trim()
              ? description.trim()
              : null,
          quantity: remaining,
          low_stock_threshold: threshold,
          purchase_price: Number(item.unit_price).toFixed(2),
          selling_price: sellingPrice.toFixed(2),
        },
        include: {
          category: { select: { id: true, name: true } },
          supplier: {
            select: { id: true, name: true, company_name: true },
          },
        },
      });

      await tx.purchase_items.update({
        where: { id: item.id },
        data: {
          product_id: product.id,
          quantity_added_to_stock: item.quantity,
        },
      });

      return { product, quantityAdded: remaining };
    });

    return res.status(200).json({
      success: true,
      message: `${result.quantityAdded} unit(s) added to stock successfully.`,
      product: result.product,
      quantityAdded: result.quantityAdded,
    });
  } catch (error) {
    console.error("Add purchase item to stock error:", error);

    const errors = {
      PURCHASE_ITEM_NOT_FOUND: [404, "Purchase item not found."],
      NO_REMAINING_QUANTITY: [
        409,
        "This purchase item has no quantity remaining to add to stock.",
      ],
      INVALID_SKU: [400, "SKU cannot exceed 100 characters."],
      DUPLICATE_SKU: [409, "This SKU already exists in your store."],
    };

    if (errors[error.message]) {
      const [status, message] = errors[error.message];

      return res.status(status).json({
        success: false,
        message,
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This SKU already exists in your store.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add the purchase item to stock.",
    });
  }
};
