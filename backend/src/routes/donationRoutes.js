import express from "express";
import {
  getDonorRanking,
  getPublicDonations,
  createDonation,
  createPaymentOrder,
  verifyPayment,
} from "../controllers/donationController.js";

const router = express.Router();

// Donations
router.get("/donors/ranking", getDonorRanking);
router.get("/donations/public", getPublicDonations);
router.post("/donations", createDonation);

// Payments
router.post("/payments/create-order", createPaymentOrder);
router.post("/payments/verify", verifyPayment);

export default router;
