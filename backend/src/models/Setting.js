import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, default: "", trim: true },
    baseUrl: { type: String, default: "", trim: true },
    apiKey: { type: String, default: "" },
    apiSecret: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    module: { type: String, default: "general" },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "global" },
  frontend: {
    apiBaseUrl: { type: String, default: "" },
  },
  integrations: {
    type: [integrationSchema],
    default: [],
  },
  paymentAccount: {
    razorpayKeyId: { type: String, default: "" },
    razorpayKeySecret: { type: String, default: "" },
    razorpayEnabled: { type: Boolean, default: false },
    upiEnabled: { type: Boolean, default: false },
    upiId: { type: String, default: "" },
    upiName: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    accountType: { type: String, default: "savings" },
    bankEnabled: { type: Boolean, default: false },
    orgName: { type: String, default: "" },
    orgDescription: { type: String, default: "" },
  },
  updatedAt: { type: Date, default: Date.now },
});

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
