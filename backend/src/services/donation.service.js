import Donor from "../models/Donor.js";
import Donation from "../models/Donation.js";
import Inventory from "../models/Inventory.js";
import ReliefCamp from "../models/ReliefCamp.js";

const RANKS = [
  { name: "BRONZE", min: 0 },
  { name: "SILVER", min: 10000 },
  { name: "GOLD", min: 50000 },
  { name: "PLATINUM", min: 200000 },
];

const getRecognitionRank = (total) => {
  const sorted = [...RANKS].sort((a, b) => b.min - a.min);
  const match = sorted.find((r) => total >= r.min);
  return match ? match.name : "BRONZE";
};

const itemKey = (item) => {
  const category = String(item.category || "OTHER").trim().toUpperCase();
  const name = String(item.name || "ITEM").trim().toUpperCase();
  return `${category}:${name}`;
};

const calculateItemTotal = (items = []) =>
  items.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const value = Number(item.estimatedValue || 0);
    return sum + qty * value;
  }, 0);

const upsertDonor = async ({ type, name, email, phone }) => {
  const query = {};
  if (email) query.email = email.toLowerCase();
  if (!email && phone) query.phone = phone;

  let donor = Object.keys(query).length
    ? await Donor.findOne(query)
    : null;

  if (!donor) {
    donor = await Donor.create({ type, name, email, phone });
  }

  return donor;
};

const updateInventoryForDonation = async (donation) => {
  if (donation.type !== "ITEM") return;
  if (donation.status !== "RECEIVED") return;
  if (!donation.assignedCampId) return;

  const camp = await ReliefCamp.findById(donation.assignedCampId);
  if (!camp) return;

  for (const item of donation.items) {
    const qty = Number(item.quantity || 0);
    if (!qty) continue;

    await Inventory.findOneAndUpdate(
      { campId: camp._id, itemKey: itemKey(item) },
      {
        $inc: { quantity: qty },
        $set: {
          unit: item.unit || "unit",
          lastUpdatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
};

export const createDonationWithDonor = async (payload) => {
  const {
    donor,
    type,
    amount,
    currency,
    items,
    assignedCampId,
    status,
    transactionRef,
    idempotencyKey,
  } = payload;

  const donorDoc = await upsertDonor(donor);

  const donation = await Donation.create({
    donorId: donorDoc._id,
    type,
    amount,
    currency,
    items,
    assignedCampId,
    status,
    transactionRef,
    idempotencyKey,
  });

  // Update donor totals (money or estimated item value)
  const itemTotal = calculateItemTotal(items);
  const increment = type === "MONEY" ? Number(amount || 0) : itemTotal;

  donorDoc.totalDonatedAmount += increment;
  donorDoc.totalDonationsCount += 1;
  donorDoc.lastDonationAt = new Date();
  donorDoc.recognitionRank = getRecognitionRank(donorDoc.totalDonatedAmount);
  await donorDoc.save();

  // Update inventory for item donations once received
  await updateInventoryForDonation(donation);

  return { donation, donor: donorDoc };
};

export const listDonorsWithRanking = async (limit = 50) =>
  Donor.find().sort({ totalDonatedAmount: -1 }).limit(limit);
