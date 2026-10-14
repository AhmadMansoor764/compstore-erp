import prisma from "../lib/prisma.js";

// Get the logged-in member's store
export const getMyStore = async (req, res) => {
  try {
    const store = await prisma.stores.findUnique({
      where: {
        owner_id: req.user.id,
      },
    });

    return res.status(200).json({
      success: true,
      store,
      hasStore: Boolean(store),
    });
  } catch (error) {
    console.error("Get store error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve store.",
    });
  }
};

// Create a store for the logged-in member
export const createStore = async (req, res) => {
  try {
    const { name, email, phone, address, balance = 0 } = req.body;

    // Validate store name
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Store name is required.",
      });
    }

    // Validate starting balance
    const startingBalance = Number(balance);

    if (
      balance === null ||
      balance === "" ||
      !Number.isFinite(startingBalance) ||
      startingBalance < 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(balance))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Starting balance must be a non-negative amount with at most two decimal places.",
      });
    }

    // Check whether this member already owns a store
    const existingStore = await prisma.stores.findUnique({
      where: {
        owner_id: req.user.id,
      },
    });

    if (existingStore) {
      return res.status(409).json({
        success: false,
        message: "You already have a store.",
        store: existingStore,
      });
    }

    // Create the store and save its starting balance
    const store = await prisma.stores.create({
      data: {
        name: name.trim(),
        email:
          typeof email === "string" && email.trim()
            ? email.trim().toLowerCase()
            : null,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        address:
          typeof address === "string" && address.trim() ? address.trim() : null,
        balance: startingBalance.toFixed(2),
        owner_id: req.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Store created successfully.",
      store,
    });
  } catch (error) {
    console.error("Create store error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create store.",
    });
  }
};

// Update the logged-in member's store
export const updateMyStore = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const existingStore = await prisma.stores.findUnique({
      where: {
        owner_id: req.user.id,
      },
    });

    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: "Please create your store first.",
      });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        success: false,
        message: "Store name cannot be empty.",
      });
    }

    for (const [field, value] of Object.entries({
      email,
      phone,
      address,
    })) {
      if (value !== undefined && value !== null && typeof value !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be text.`,
        });
      }
    }

    const store = await prisma.stores.update({
      where: {
        owner_id: req.user.id,
      },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && {
          email: email?.trim().toLowerCase() || null,
        }),
        ...(phone !== undefined && {
          phone: phone?.trim() || null,
        }),
        ...(address !== undefined && {
          address: address?.trim() || null,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Store updated successfully.",
      store,
    });
  } catch (error) {
    console.error("Update store error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update store.",
    });
  }
};

export const depositToStore = async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    const amount = Number(req.body.amount);
    const description = req.body.description?.trim() || "Store deposit";

    if (!Number.isSafeInteger(storeId) || storeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID.",
      });
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(req.body.amount))
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be positive and have at most two decimal places.",
      });
    }

    const amountDecimal = amount.toFixed(2);

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.stores.findFirst({
        where: {
          id: storeId,
          owner_id: req.user.id,
        },
        select: { id: true },
      });

      if (!store) {
        const error = new Error("Store not found.");
        error.statusCode = 404;
        throw error;
      }

      const updatedStore = await tx.stores.update({
        where: { id: storeId },
        data: {
          balance: { increment: amountDecimal },
        },
      });

      const transaction = await tx.store_transactions.create({
        data: {
          store_id: storeId,
          type: "deposit",
          amount: amountDecimal,
          description,
        },
      });

      return { store: updatedStore, transaction };
    });

    return res.status(201).json({
      success: true,
      message: "Deposit recorded successfully.",
      ...result,
    });
  } catch (error) {
    console.error("Store deposit error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to record deposit.",
    });
  }
};
