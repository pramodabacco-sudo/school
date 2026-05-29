import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "../config/db.js";
import { sendInvoiceEmail } from "../utils/invoiceMailer.js";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CREATE UPGRADE ORDER  (logged-in superAdmin only)
// ─────────────────────────────────────────────────────────────────────────────
export const createUpgradeOrder = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const universityId = req.user.universityId;

    const {
      fullName,
      schoolName,
      email,
      phone,
      address,
      planName,
      studentCount = 0,
      teacherCount = 0,
      amount, // ✅ frontend sends rupees (e.g. 5600), NOT paise
    } = req.body;

    // ── Basic validation ────────────────────────────────────────────────────
    if (!fullName || !schoolName || !email || !phone || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount. Please add at least 1 user." });
    }

    const amountInRupees = Math.round(Number(amount)); // always treat as rupees
    const userCount      = Number(studentCount) + Number(teacherCount);

    // ── Resolve plan from DB ────────────────────────────────────────────────
    const selectedPlan = await prisma.plan.findFirst({
      where: { name: { equals: planName, mode: "insensitive" } },
    });
    if (!selectedPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // ── Create Razorpay order  (amount * 100 = paise) ──────────────────────
    console.log(`💰 createUpgradeOrder: amountInRupees=${amountInRupees}, paise=${amountInRupees * 100}`);
    if (amountInRupees * 100 > 50000000) {
      return res.status(400).json({ error: `Amount ₹${amountInRupees} exceeds Razorpay max limit of ₹5,00,000. Please contact support.` });
    }
    const order = await Promise.race([
      razorpay.orders.create({
        amount:   amountInRupees * 100, // ✅ only multiply here, once
        currency: "INR",
        receipt:  `upgrade_${Date.now()}`,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Razorpay timeout")), 10000)
      ),
    ]);

    // ── Smart date: new plan starts AFTER current plan expires ──────────
    const activeSubscription = await prisma.subscription.findFirst({
      where:   { universityId, status: "ACTIVE" },
      orderBy: { endDate: "desc" },
    });
    const _now = new Date();
    const currentPlanEnd = activeSubscription?.endDate
      ? new Date(activeSubscription.endDate)
      : null;
    // startDate = when current plan ends (or now if no active plan)
    const startDate = currentPlanEnd && currentPlanEnd > _now ? currentPlanEnd : _now;
    const endDate   = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    // ── Upsert Payment row (handles returning users whose email is unique) ──
    // If the superAdmin has paid before, update that row instead of failing
    const paymentData = {
      fullName,
      schoolName,
      phone,
      address,

      // 📦 Plan snapshot
      planId:          selectedPlan.id,
      planName:        selectedPlan.name,
      planPrice:       selectedPlan.price,
      maxSchools:      selectedPlan.maxSchools,
      maxStudents:     selectedPlan.maxStudents,
      maxTeachers:     selectedPlan.maxTeachers,
      maxSchoolAdmins: selectedPlan.maxSchoolAdmins,

      // 👥 Users
      userCount,
      studentCount: Number(studentCount),
      teacherCount: Number(teacherCount),

      // 💰 Amount (in rupees)
      amount: amountInRupees,

      // 📅 Dates
      planStartDate: startDate,
      planEndDate:   endDate,

      // 🔗 Razorpay
      razorpayOrderId: order.id,

      // 🔗 Relations (known immediately — user is logged in)
      superAdminId,
      universityId,

      // Reset status for new order
      status:            "PENDING",
      razorpayPaymentId: null,
      razorpaySignature: null,
    };

    // ── Upsert via findFirst + update/create ──────────────────────────────
    // We avoid prisma.upsert() because razorpayOrderId is @unique and changes
    // every new order — a plain upsert update would hit a unique constraint.
    const existingPayment = await prisma.payment.findFirst({
      where: { email },
    });

    let payment;
    if (existingPayment) {
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data:  { email, ...paymentData },
      });
    } else {
      payment = await prisma.payment.create({
        data: { email, ...paymentData },
      });
    }

    return res.json({
      orderId:   order.id,
      amount:    order.amount,   // paise — Razorpay uses this
      paymentId: payment.id,
    });

  } catch (err) {
    console.error("❌ createUpgradeOrder error:", err);
    return res.status(500).json({ error: "Failed to create upgrade order" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ VERIFY UPGRADE PAYMENT  — marks Payment SUCCESS + creates Subscription
// ─────────────────────────────────────────────────────────────────────────────
export const verifyUpgradePayment = async (req, res) => {
  try {
    const superAdminId = req.user.id;
    const universityId = req.user.universityId;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
      failed = false,
    } = req.body;

    // ── Handle explicit failure from Razorpay SDK ───────────────────────────
    if (failed) {
      await prisma.payment.update({
        where: { id: paymentId },
        data:  { status: "FAILED" },
      });
      return res.status(400).json({ status: "FAILED" });
    }

    // ── Signature verification ──────────────────────────────────────────────
    const body              = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await prisma.payment.update({
        where: { id: paymentId },
        data:  { status: "FAILED" },
      });
      return res.status(400).json({ status: "FAILED" });
    }

    // ── Mark Payment as SUCCESS ─────────────────────────────────────────────
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:            "SUCCESS",
        superAdminId,
        universityId,
      },
    });

    const startDate = updatedPayment.planStartDate || new Date();
    const endDate   = updatedPayment.planEndDate   || (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d;
    })();

    // ── Expire old ACTIVE subscriptions for this university ─────────────────
    await prisma.subscription.updateMany({
      where: { universityId, status: "ACTIVE" },
      data:  { status: "EXPIRED" },
    });

    // ── Create new Subscription record ──────────────────────────────────────
    const subscription = await prisma.subscription.create({
      data: {
        universityId,
        planId:          updatedPayment.planId,
        paymentId:       updatedPayment.id,
        startDate,
        endDate,
        status:          "ACTIVE",
        maxSchools:      updatedPayment.maxSchools,
        maxStudents:     updatedPayment.maxStudents,
        maxTeachers:     updatedPayment.maxTeachers,
        maxSchoolAdmins: updatedPayment.maxSchoolAdmins,

        // 👥 User counts snapshot
        userCount:    updatedPayment.userCount,
        studentCount: updatedPayment.studentCount,
        teacherCount: updatedPayment.teacherCount,

        // 👤 Buyer details snapshot
        fullName:   updatedPayment.fullName,
        schoolName: updatedPayment.schoolName,
        email:      updatedPayment.email,
        phone:      updatedPayment.phone,
        address:    updatedPayment.address,
        amount:     updatedPayment.amount,
        planName:   updatedPayment.planName,
        planPrice:  updatedPayment.planPrice,
      },
    });

    // ── Send invoice email (non-blocking) ────────────────────────────────────
    sendInvoiceEmail({
      email:             updatedPayment.email,
      fullName:          updatedPayment.fullName,
      schoolName:        updatedPayment.schoolName,
      phone:             updatedPayment.phone,
      address:           updatedPayment.address,
      planName:          updatedPayment.planName,
      studentCount:      updatedPayment.studentCount,
      teacherCount:      updatedPayment.teacherCount,
      userCount:         updatedPayment.userCount,
      amount:            updatedPayment.amount,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId:   razorpay_order_id,
    }).catch((err) => console.error("❌ Upgrade invoice email failed:", err));

    return res.json({ status: "verified", subscription });

  } catch (err) {
    console.error("❌ verifyUpgradePayment error:", err);
    return res.status(500).json({ error: "Verification failed" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET MY SUBSCRIPTION  (current active — reads from Subscription table)
// ─────────────────────────────────────────────────────────────────────────────
export const getMySubscription = async (req, res) => {
  try {
    const universityId = req.user.universityId;

    const subscription = await prisma.subscription.findFirst({
      where:   { universityId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    return res.json({ subscription: subscription || null });

  } catch (err) {
    console.error("❌ getMySubscription error:", err);
    return res.status(500).json({ error: "Failed to fetch subscription" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET SUBSCRIPTION TIMELINE  (reads from Subscription table)
// ─────────────────────────────────────────────────────────────────────────────
export const getSubscriptionTimeline = async (req, res) => {
  try {
    const universityId = req.user.universityId;

    const subscriptions = await prisma.subscription.findMany({
      where:   { universityId },
      orderBy: { createdAt: "desc" },
      include: { plan: true, payment: true },
    });

    return res.json({ subscriptions: formatSubscriptions(subscriptions) });

  } catch (err) {
    console.error("❌ getSubscriptionTimeline error:", err);
    return res.status(500).json({ error: "Failed to fetch timeline" });
  }
};

function formatSubscriptions(subscriptions) {
  return subscriptions.map((s, index) => ({
    id:               s.id,
    planId:           s.planId,
    // ✅ Read directly from Subscription snapshot fields (stored on verify)
    planName:         s.planName  || s.plan?.name  || s.payment?.planName  || "—",
    userCount:        s.userCount ?? s.payment?.userCount  ?? 0,
    studentCount:     s.studentCount ?? s.payment?.studentCount ?? 0,
    teacherCount:     s.teacherCount ?? s.payment?.teacherCount ?? 0,
    // ✅ Buyer details
    fullName:         s.fullName   || s.payment?.fullName   || "",
    schoolName:       s.schoolName || s.payment?.schoolName || "",
    email:            s.email      || s.payment?.email      || "",
    phone:            s.phone      || s.payment?.phone      || "",
    address:          s.address    || s.payment?.address    || "",
    // ✅ Payment info
    razorpayPaymentId: s.payment?.razorpayPaymentId || null,
    amount:           s.amount    ?? s.payment?.amount ?? 0,
    planPrice:        s.planPrice ?? s.payment?.planPrice ?? 0,
    startDate:        s.startDate,
    endDate:          s.endDate,
    status:           index === 0 && new Date(s.endDate) > new Date()
                        ? "ACTIVE"
                        : "EXPIRED",
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ GET LATEST PAYMENT DETAILS  (pre-fill for upgrade form)
// ─────────────────────────────────────────────────────────────────────────────
export const getLatestUpgradeDetails = async (req, res) => {
  try {
    const superAdminId = req.user.id;

    const payment = await prisma.payment.findFirst({
      where:   { superAdminId, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });

    if (payment) return res.json(payment);

    // Fallback to superAdmin profile
    const user = await prisma.superAdmin.findUnique({
      where: { id: superAdminId },
    });

    return res.json({
      fullName:   user?.name  || "",
      email:      user?.email || "",
      phone:      user?.phone || "",
      schoolName: "",
      address:    "",
    });

  } catch (err) {
    console.error("❌ getLatestUpgradeDetails error:", err);
    return res.status(500).json({ error: "Failed to fetch details" });
  }
};