import prisma from "../lib/prisma.js";

const VALID_STATUSES = ["Paid", "Pending", "Cancelled"];

const toCents = (value) => {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isInteger(amount * 100)
  ) {
    return null;
  }

  return Math.round(amount * 100);
};

const formatAmount = (cents) => (cents / 100).toFixed(2);

// Create an expense
const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      expenseDate,
      paymentMethod,
      status,
      paidBy,
      reference,
      description,
    } = req.body;

    const cleanTitle = String(title ?? "").trim();
    const cleanCategory = String(category ?? "").trim();
    const cleanPaymentMethod = String(paymentMethod ?? "").trim();
    const cleanPaidBy = String(paidBy ?? "").trim();
    const cleanReference = String(reference ?? "").trim();
    const cleanDescription = String(description ?? "").trim();

    const amountCents = toCents(amount);

    if (!cleanTitle || !cleanCategory || !cleanPaidBy) {
      return res.status(400).json({
        success: false,
        message: "Title, category, and paid-by name are required.",
      });
    }

    if (cleanTitle.length > 150 || cleanCategory.length > 100) {
      return res.status(400).json({
        success: false,
        message: "The title or category is too long.",
      });
    }

    if (amountCents === null) {
      return res.status(400).json({
        success: false,
        message:
          "Expense amount must be greater than zero and have at most two decimal places.",
      });
    }

    if (
      !["Cash", "Bank Transfer", "Mobile Money", "Card", "Other"].includes(
        cleanPaymentMethod,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense status.",
      });
    }

    let parsedDate;

    if (expenseDate) {
      if (
        typeof expenseDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Expense date must use YYYY-MM-DD format.",
        });
      }

      parsedDate = new Date(`${expenseDate}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== expenseDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid expense date.",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Expense date is required.",
      });
    }

    if (
      cleanPaymentMethod.length > 50 ||
      cleanPaidBy.length > 150 ||
      cleanReference.length > 100 ||
      cleanDescription.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more expense fields are too long.",
      });
    }

    const store = await prisma.stores.findUnique({
      where: { owner_id: req.user.id },
      select: { id: true },
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Create your store before recording expenses.",
      });
    }

    const expense = await prisma.$transaction(async (tx) => {
      // Use a timestamp-based reference to avoid relying on a count
      // that could produce duplicate numbers during simultaneous requests.
      const expenseNumber = `EXP-${Date.now()}-${Math.floor(
        Math.random() * 100000,
      )}`;

      const createdExpense = await tx.expenses.create({
        data: {
          store_id: store.id,
          expense_number: expenseNumber,
          title: cleanTitle,
          category: cleanCategory,
          amount: formatAmount(amountCents),
          expense_date: parsedDate,
          payment_method: cleanPaymentMethod,
          status,
          paid_by: cleanPaidBy,
          reference: cleanReference || null,
          description: cleanDescription || null,
        },
      });

      // Only paid expenses reduce the store balance.
      if (status === "Paid") {
        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: {
              decrement: formatAmount(amountCents),
            },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: "expense",
            amount: formatAmount(amountCents),
            description: `Expense ${expenseNumber}: ${cleanTitle}`,
          },
        });
      }

      return createdExpense;
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create expense.",
    });
  }
};

// Get all expenses belonging to the logged-in user's store
const getExpenses = async (req, res) => {
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

    const expenses = await prisma.expenses.findMany({
      where: {
        store_id: store.id,
      },
      orderBy: [{ expense_date: "desc" }, { created_at: "desc" }],
    });

    return res.status(200).json({
      success: true,
      expenses,
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve expenses.",
    });
  }
};

// Delete an expense and reverse its balance effect if it was paid
const deleteExpense = async (req, res) => {
  try {
    const expenseId = Number(req.params.id);

    if (!Number.isSafeInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
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

    await prisma.$transaction(async (tx) => {
      const expense = await tx.expenses.findFirst({
        where: {
          id: expenseId,
          store_id: store.id,
        },
      });

      if (!expense) {
        const error = new Error("Expense not found.");
        error.statusCode = 404;
        throw error;
      }

      // Restore money only if this expense previously deducted it.
      if (expense.status === "Paid") {
        const amount = Number(expense.amount).toFixed(2);

        await tx.stores.update({
          where: { id: store.id },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        await tx.store_transactions.create({
          data: {
            store_id: store.id,
            type: "income",
            amount,
            description: `Reversal of deleted expense ${expense.expense_number}: ${expense.title}`,
          },
        });
      }

      await tx.expenses.delete({
        where: { id: expense.id },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("Delete expense error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to delete expense.",
    });
  }
};

export { createExpense, getExpenses, deleteExpense };
