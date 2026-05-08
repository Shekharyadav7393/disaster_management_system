import { useEffect, useState } from "react";
import PublicLayout from "../../modules/public/PublicLayout.jsx";
import api from "../../api/axios.js";

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000];

const EMPTY_FORM = {
  donorName: "",
  donorPhone: "",
  donationType: "MONEY",
  amount: "",
  itemName: "",
  itemQuantity: "",
  itemUnit: "kg",
  campId: "",
  message: "",
};

const PublicDonate = () => {
  const [camps, setCamps] = useState([]);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [paymentId, setPaymentId] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/relief-camps").catch(() => ({ data: [] })),
      api.get("/public/settings").catch(() => ({ data: null })),
    ]).then(([campRes, settingsRes]) => {
      setCamps(campRes.data || []);
      setSettings(settingsRes.data || null);
    });
  }, []);

  useEffect(() => {
    if (!settings?.paymentAccount?.razorpayEnabled) return;
    if (document.getElementById("razorpay-script")) return;

    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, [settings?.paymentAccount?.razorpayEnabled]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
  };

  const handlePayment = async () => {
    if (!form.donorName) {
      setError("Please enter your name.");
      return;
    }
    if (!form.amount || Number(form.amount) < 1) {
      setError("Please enter a valid donation amount (minimum INR 1).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data: orderData } = await api.post("/payments/create-order", {
        amount: Number(form.amount),
        donorName: form.donorName,
        donorPhone: form.donorPhone,
        campId: form.campId,
        message: form.message,
      });

      const verifyPayload = {
        donorName: form.donorName,
        donorPhone: form.donorPhone,
        amount: Number(form.amount),
        campId: form.campId,
        message: form.message,
      };

      if (orderData.mode === "mock" || !window.Razorpay) {
        const mockPaymentId = `mockpay_${Date.now()}`;
        const { data: verifyData } = await api.post("/payments/verify", {
          ...verifyPayload,
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: "mock-signature",
        });

        setSuccess(verifyData?.message || "Donation recorded successfully.");
        setPaymentId(mockPaymentId);
        resetForm();
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderData.key || settings?.paymentAccount?.razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: settings?.paymentAccount?.orgName || "DisasterMS",
        description: "Disaster Relief Donation",
        order_id: orderData.orderId,
        prefill: {
          name: form.donorName,
          contact: form.donorPhone,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async (response) => {
          try {
            const { data: verifyData } = await api.post("/payments/verify", {
              ...verifyPayload,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setSuccess(
              verifyData?.message ||
                "Payment successful! Thank you for your generous donation."
            );
            setPaymentId(response.razorpay_payment_id);
            resetForm();
          } catch (_verifyError) {
            setError(
              "Payment received but verification failed. Please contact support with your payment ID."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError("Payment was cancelled. No amount has been charged.");
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      razorpay.open();
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError.message ||
        "Failed to initiate payment. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemDonation = async () => {
    if (!form.donorName || !form.itemName || !form.itemQuantity) {
      setError("Please fill in all required item donation fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/donations", {
        donorName: form.donorName,
        donorPhone: form.donorPhone,
        donationType: "ITEM",
        items: [
          {
            name: form.itemName,
            quantity: Number(form.itemQuantity),
            unit: form.itemUnit,
          },
        ],
        campId: form.campId || undefined,
        message: form.message,
      });

      setSuccess(
        "Item donation submitted successfully. Our team will coordinate pickup or delivery."
      );
      resetForm();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError.message ||
          "Failed to submit donation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (form.donationType === "MONEY") {
      handlePayment();
      return;
    }
    handleItemDonation();
  };

  const paymentSettings = settings?.paymentAccount || {};

  return (
    <PublicLayout>
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Make a Donation</h1>
          <p style={{ color: "var(--text-2)", marginTop: 6, fontSize: 15 }}>
            {paymentSettings.orgDescription ||
              "Support verified disaster relief operations with money or essential supplies."}
          </p>
        </div>

        {success && (
          <div
            className="alert alert-success"
            style={{ flexDirection: "column", alignItems: "flex-start" }}
          >
            <div>{success}</div>
            {paymentId && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                Payment ID: <strong>{paymentId}</strong>
              </div>
            )}
          </div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-title">Your Information</div>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="input"
                  name="donorName"
                  value={form.donorName}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="input"
                  name="donorPhone"
                  value={form.donorPhone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Donation Details</div>
            <div className="form-group">
              <label className="form-label">Donation Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={`btn ${form.donationType === "MONEY" ? "btn-primary" : ""}`}
                  onClick={() =>
                    setForm((current) => ({ ...current, donationType: "MONEY" }))
                  }
                >
                  Money
                </button>
                <button
                  type="button"
                  className={`btn ${form.donationType === "ITEM" ? "btn-primary" : ""}`}
                  onClick={() =>
                    setForm((current) => ({ ...current, donationType: "ITEM" }))
                  }
                >
                  Items
                </button>
              </div>
            </div>

            {form.donationType === "MONEY" ? (
              <>
                {!paymentSettings.razorpayEnabled && (
                  <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                    Online payment gateway is not configured yet. Submitting now will record a
                    demo donation, or you can use the direct UPI / bank details below.
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Select Amount</label>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    {PRESET_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        className={`btn ${Number(form.amount) === amount ? "btn-primary" : ""}`}
                        onClick={() =>
                          setForm((current) => ({ ...current, amount: String(amount) }))
                        }
                        style={{ minWidth: 80 }}
                      >
                        INR {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <label className="form-label" style={{ marginTop: 8 }}>
                    Or enter custom amount
                  </label>
                  <input
                    className="input"
                    name="amount"
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="Enter amount in Rupees"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-3">
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    className="input"
                    name="itemName"
                    value={form.itemName}
                    onChange={handleChange}
                    placeholder="Rice"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    className="input"
                    name="itemQuantity"
                    type="number"
                    min="1"
                    value={form.itemQuantity}
                    onChange={handleChange}
                    placeholder="10"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    className="select"
                    name="itemUnit"
                    value={form.itemUnit}
                    onChange={handleChange}
                  >
                    {["kg", "litre", "piece", "box", "bag", "packet"].map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Assign to Relief Camp (optional)</label>
              <select
                className="select"
                name="campId"
                value={form.campId}
                onChange={handleChange}
              >
                <option value="">Any camp</option>
                {camps.map((camp) => (
                  <option key={camp._id} value={camp._id}>
                    {camp.name}
                    {camp.location?.city ? ` - ${camp.location.city}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message (optional)</label>
              <textarea
                className="textarea"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Your message of support..."
                style={{ minHeight: 70 }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading
              ? "Processing..."
              : form.donationType === "MONEY"
                ? `Pay INR ${Number(form.amount || 0).toLocaleString()}`
                : "Submit Item Donation"}
          </button>
        </form>

        {(paymentSettings.upiEnabled || paymentSettings.bankEnabled) && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              Alternative Donation Details
            </div>

            {paymentSettings.upiEnabled && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>UPI</div>
                <div className="muted">
                  {paymentSettings.upiName || paymentSettings.orgName}
                </div>
                <div style={{ fontFamily: "monospace", marginTop: 4 }}>
                  {paymentSettings.upiId}
                </div>
              </div>
            )}

            {paymentSettings.bankEnabled && (
              <div>
                <div style={{ fontWeight: 700 }}>Bank Transfer</div>
                <div className="muted">{paymentSettings.accountHolderName}</div>
                <div>{paymentSettings.bankName}</div>
                <div style={{ fontFamily: "monospace", marginTop: 4 }}>
                  A/C: {paymentSettings.accountNumber}
                </div>
                <div style={{ fontFamily: "monospace" }}>
                  IFSC: {paymentSettings.ifscCode}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            Want to see where donations go?{" "}
            <a href="/transparency" style={{ color: "var(--primary)" }}>
              {"View Donation Transparency ->"}
            </a>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicDonate;
