import Setting from "../models/Setting.js";

const trimString = (value = "") => String(value ?? "").trim();
const trimUrl = (value = "") => trimString(value).replace(/\/+$/, "");
const toBoolean = (value, defaultValue = false) =>
  typeof value === "boolean" ? value : defaultValue;

const DEFAULT_PAYMENT_ACCOUNT = {
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayEnabled: false,
  paymentLink: "",
  upiId: "",
  upiName: "",
  upiEnabled: false,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  accountType: "savings",
  bankEnabled: false,
  orgName: "Disaster Management Support Fund",
  orgDescription:
    "Support verified disaster relief, rescue, and rehabilitation operations.",
};

export const DEFAULT_INTEGRATIONS = [
  {
    key: "openweather",
    name: "OpenWeather",
    baseUrl: "https://api.openweathermap.org/data/2.5",
    module: "weather",
    enabled: false,
    notes: "Live weather and rainfall enrichment for sensor sync.",
    config: { defaultCity: "Delhi" },
  },
  {
    key: "gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    module: "prediction",
    enabled: false,
    notes: "AI-assisted alert generation, validation, and prediction.",
    config: { model: "gemini-2.0-flash" },
  },
  {
    key: "google-maps",
    name: "Google Maps",
    baseUrl: "https://maps.googleapis.com/maps/api",
    module: "general",
    enabled: false,
    notes: "Optional geocoding and map integrations.",
    config: {},
  },
  {
    key: "cloudinary",
    name: "Cloudinary",
    baseUrl: "https://api.cloudinary.com/v1_1",
    module: "general",
    enabled: false,
    notes: "Stores uploaded report and SOS media in Cloudinary when credentials are configured.",
    config: {},
  },
  {
    key: "razorpay",
    name: "Razorpay",
    baseUrl: "https://api.razorpay.com/v1",
    module: "payment",
    enabled: false,
    notes: "Online donation gateway and payment verification.",
    config: { currency: "INR" },
  },
];

const DEFAULT_FRONTEND_SETTINGS = {
  apiBaseUrl: "",
};

const DEFAULT_BY_KEY = new Map(
  DEFAULT_INTEGRATIONS.map((integration) => [integration.key, integration])
);

const normalizePaymentAccount = (value = {}) => ({
  ...DEFAULT_PAYMENT_ACCOUNT,
  razorpayKeyId: trimString(value.razorpayKeyId),
  razorpayKeySecret: trimString(value.razorpayKeySecret),
  razorpayEnabled: toBoolean(value.razorpayEnabled, false),
  paymentLink: trimUrl(value.paymentLink),
  upiId: trimString(value.upiId),
  upiName: trimString(value.upiName),
  upiEnabled: toBoolean(value.upiEnabled, false),
  accountHolderName: trimString(value.accountHolderName),
  bankName: trimString(value.bankName),
  accountNumber: trimString(value.accountNumber),
  ifscCode: trimString(value.ifscCode).toUpperCase(),
  accountType: trimString(value.accountType || "savings").toLowerCase() || "savings",
  bankEnabled: toBoolean(value.bankEnabled, false),
  orgName: trimString(value.orgName) || DEFAULT_PAYMENT_ACCOUNT.orgName,
  orgDescription:
    trimString(value.orgDescription) || DEFAULT_PAYMENT_ACCOUNT.orgDescription,
});

const legacyIntegrationsToArray = (value = {}) => {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return [];
  }

  return [
    {
      key: "google-maps",
      name: "Google Maps",
      module: "general",
      apiKey: trimString(value.googleMapsKey),
    },
    {
      key: "openweather",
      name: "OpenWeather",
      module: "weather",
      apiKey: trimString(value.openWeatherKey),
      baseUrl: "https://api.openweathermap.org/data/2.5",
    },
    {
      key: "gemini",
      name: "Google Gemini",
      module: "prediction",
      apiKey: trimString(value.geminiKey),
      baseUrl: "https://generativelanguage.googleapis.com",
    },
  ].filter((item) => item.apiKey);
};

const normalizeIntegration = (value = {}) => {
  const defaultRecord = DEFAULT_BY_KEY.get(trimString(value.key).toLowerCase()) || {};
  const config =
    value.config && typeof value.config === "object" && !Array.isArray(value.config)
      ? value.config
      : {};

  const key = trimString(value.key || defaultRecord.key).toLowerCase();

  return {
    key,
    name: trimString(value.name || defaultRecord.name || key),
    baseUrl: trimUrl(value.baseUrl || defaultRecord.baseUrl || ""),
    apiKey: trimString(value.apiKey),
    apiSecret: trimString(value.apiSecret),
    enabled:
      typeof value.enabled === "boolean"
        ? value.enabled
        : toBoolean(defaultRecord.enabled, true),
    notes: trimString(value.notes || defaultRecord.notes || ""),
    module: trimString(value.module || defaultRecord.module || "general").toLowerCase(),
    config: {
      ...(defaultRecord.config || {}),
      ...config,
    },
  };
};

const mergeIntegrations = (inputIntegrations, paymentAccount) => {
  const providedIntegrations = Array.isArray(inputIntegrations)
    ? inputIntegrations
    : legacyIntegrationsToArray(inputIntegrations);

  const normalizedList = [
    ...DEFAULT_INTEGRATIONS,
    ...providedIntegrations,
  ]
    .flat()
    .filter(Boolean)
    .map(normalizeIntegration)
    .filter((item) => item.key);

  const byKey = new Map();
  normalizedList.forEach((item) => {
    const existing = byKey.get(item.key);
    byKey.set(item.key, {
      ...(existing || {}),
      ...item,
      config: {
        ...(existing?.config || {}),
        ...(item.config || {}),
      },
    });
  });

  const razorpayRecord = byKey.get("razorpay") || normalizeIntegration({ key: "razorpay" });
  byKey.set("razorpay", {
    ...razorpayRecord,
    enabled: paymentAccount.razorpayEnabled || razorpayRecord.enabled,
    apiKey: paymentAccount.razorpayKeyId || razorpayRecord.apiKey,
    apiSecret: paymentAccount.razorpayKeySecret || razorpayRecord.apiSecret,
  });

  return Array.from(byKey.values());
};

export const normalizeSettingsPayload = (value = {}) => {
  const paymentAccount = normalizePaymentAccount(value.paymentAccount);

  return {
    key: "global",
    frontend: {
      apiBaseUrl: trimUrl(
        value.frontend?.apiBaseUrl ?? DEFAULT_FRONTEND_SETTINGS.apiBaseUrl
      ),
    },
    integrations: mergeIntegrations(value.integrations || [], paymentAccount),
    paymentAccount,
    updatedAt: new Date(),
  };
};

export const getOrCreateGlobalSettings = async () => {
  const existing = await Setting.findOne({ key: "global" }).lean();

  if (!existing) {
    const created = await Setting.create(normalizeSettingsPayload({}));
    return created.toObject();
  }

  return {
    _id: existing._id,
    ...normalizeSettingsPayload(existing),
    updatedAt: existing.updatedAt || new Date(),
  };
};

export const saveGlobalSettings = async (value = {}) => {
  const payload = normalizeSettingsPayload(value);
  return Setting.findOneAndUpdate({ key: "global" }, payload, {
    returnDocument: "after",
    upsert: true,
    setDefaultsOnInsert: true,
  });
};

export const getIntegrationRuntimeConfig = async (
  key,
  {
    envApiKey = "",
    envApiSecret = "",
    envBaseUrl = "",
    defaultBaseUrl = "",
    defaultConfig = {},
  } = {}
) => {
  const settings = await getOrCreateGlobalSettings();
  const integration = settings.integrations.find((item) => item.key === key);
  const paymentAccount = settings.paymentAccount || DEFAULT_PAYMENT_ACCOUNT;

  const apiKey =
    (key === "razorpay" ? paymentAccount.razorpayKeyId : "") ||
    integration?.apiKey ||
    (envApiKey ? trimString(process.env[envApiKey]) : "");
  const apiSecret =
    (key === "razorpay" ? paymentAccount.razorpayKeySecret : "") ||
    integration?.apiSecret ||
    (envApiSecret ? trimString(process.env[envApiSecret]) : "");
  const baseUrl =
    integration?.baseUrl ||
    (envBaseUrl ? trimUrl(process.env[envBaseUrl]) : "") ||
    trimUrl(defaultBaseUrl);

  const explicitDisable = integration ? integration.enabled === false : false;
  const enabled =
    key === "razorpay"
      ? !explicitDisable && (paymentAccount.razorpayEnabled || Boolean(apiKey && apiSecret))
      : !explicitDisable && Boolean(apiKey || apiSecret || baseUrl);

  return {
    settings,
    paymentAccount,
    integration,
    enabled,
    apiKey,
    apiSecret,
    baseUrl,
    config: {
      ...defaultConfig,
      ...(integration?.config || {}),
    },
  };
};

export const getPublicSettingsSnapshot = async () => {
  const settings = await getOrCreateGlobalSettings();
  const payment = settings.paymentAccount || DEFAULT_PAYMENT_ACCOUNT;

  return {
    paymentAccount: {
      orgName: payment.orgName,
      orgDescription: payment.orgDescription,
      razorpayEnabled: Boolean(payment.razorpayEnabled && payment.razorpayKeyId),
      razorpayKeyId: payment.razorpayKeyId,
      paymentLink: payment.paymentLink,
      upiEnabled: payment.upiEnabled,
      upiId: payment.upiId,
      upiName: payment.upiName,
      bankEnabled: payment.bankEnabled,
      accountHolderName: payment.accountHolderName,
      bankName: payment.bankName,
      accountNumber: payment.accountNumber,
      ifscCode: payment.ifscCode,
      accountType: payment.accountType,
    },
    integrations: settings.integrations
      .filter((item) => item.key === "google-maps")
      .map((item) => ({
        key: item.key,
        name: item.name,
        enabled: item.enabled,
        apiKey: item.apiKey,
      })),
    updatedAt: settings.updatedAt,
  };
};
