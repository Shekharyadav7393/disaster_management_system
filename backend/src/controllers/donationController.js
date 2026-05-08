import Donation from "../models/Donation.js";
import axios from "axios";
import { createHmac } from "crypto";
import { getIntegrationRuntimeConfig } from "../services/settings.service.js";

const buildMockOrderId = () => `mock_order_${Date.now()}`;

const getRazorpayRuntime = async () => {
  const runtime = await getIntegrationRuntimeConfig("razorpay", {
    envApiKey: "RAZORPAY_KEY_ID",
    envApiSecret: "RAZORPAY_KEY_SECRET",
    defaultBaseUrl: "https://api.razorpay.com/v1",
    defaultConfig: { currency: "INR" },
  });

  return {
    ...runtime,
    currency: runtime.config.currency || "INR",
  };
};

/**
 * GET /api/donations
 */
export const getDonations = async (req, res) => {
  try {
    const items = await Donation.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/donations
 */
export const createDonation = async (req, res) => {
  try {
    const item = new Donation(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/donations/:id/verify
 */
export const verifyDonation = async (req, res) => {
  try {
    const item = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: "verified" },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Donation not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/donations/donors/ranking
 */
export const getDonorRanking = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const rankings = await Donation.aggregate([
      { $match: { status: "verified", donationType: "MONEY" } },
      { $group: { _id: "$donorName", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: limit }
    ]);
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/donations/donations/public
 */
export const getPublicDonations = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

    const [total, donations, totals] = await Promise.all([
      Donation.countDocuments({ status: "verified" }),
      Donation.find({ status: "verified" })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          "donorName donorType amount donationType items disaster message status date createdAt campId"
        ),
      Donation.aggregate([
        { $match: { status: "verified", donationType: "MONEY" } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      donations,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      totalAmount: totals[0]?.totalAmount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/payments/create-order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ message: "Minimum donation amount is 1 INR" });
    }

    const runtime = await getRazorpayRuntime();
    if (!runtime.enabled || !runtime.apiKey || !runtime.apiSecret) {
      return res.json({
        mode: "mock",
        orderId: buildMockOrderId(),
        amount: Math.round(amount * 100),
        currency: "INR",
        key: "",
      });
    }

    const receipt = `donation_${Date.now()}`;
    const orderResponse = await axios.post(
      `${runtime.baseUrl}/orders`,
      {
        amount: Math.round(amount * 100),
        currency: runtime.currency,
        receipt,
        notes: {
          donorName: req.body.donorName || "",
          donorPhone: req.body.donorPhone || "",
          campId: req.body.campId || "",
        },
      },
      {
        auth: {
          username: runtime.apiKey,
          password: runtime.apiSecret,
        },
      }
    );

    res.json({
      mode: "live",
      orderId: orderResponse.data.id,
      amount: orderResponse.data.amount,
      currency: orderResponse.data.currency,
      key: runtime.apiKey,
    });
  } catch (error) {
    res
      .status(502)
      .json({ message: error.response?.data?.error?.description || error.message });
  }
};

/**
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      donorName,
      donorPhone,
      amount,
      campId,
      message,
    } = req.body;

    if (!donorName || !amount) {
      return res
        .status(400)
        .json({ message: "donorName and amount are required for verification" });
    }

    const runtime = await getRazorpayRuntime();
    const isMock = String(razorpay_order_id || "").startsWith("mock_");

    if (!isMock && runtime.enabled && runtime.apiSecret) {
      const expectedSignature = createHmac("sha256", runtime.apiSecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Payment signature mismatch" });
      }
    }

    let donation = await Donation.findOne({ paymentId: razorpay_payment_id });
    if (!donation) {
      donation = new Donation({
        donorName,
        donorPhone: donorPhone || "",
        donationType: "MONEY",
        amount: Number(amount),
        campId: campId || undefined,
        message: message || "",
        status: "verified",
        paymentProvider: "razorpay",
        paymentOrderId: razorpay_order_id || "",
        paymentId: razorpay_payment_id || "",
        paymentSignature: razorpay_signature || "",
        paymentMode: isMock ? "mock" : "live",
      });
    } else {
      donation.status = "verified";
    }

    await donation.save();

    res.json({
      status: "verified",
      message: isMock
        ? "Donation recorded successfully in demo mode."
        : "Payment verified successfully.",
      donation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
