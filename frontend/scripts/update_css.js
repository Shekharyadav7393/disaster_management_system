import fs from 'fs';

const filePath = 'd:/Disaster-Management-System/frontend/src/index.css';
let content = fs.readFileSync(filePath, 'utf-8');

const startMarker = "/* ── Auth Container (Split Layout) ── */";
const endMarker = "/* ── Password Strength Meter ── */";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found");
  process.exit(1);
}

const newCss = `/* ── Centered Auth Card ── */
.auth-card {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
  background: rgba(10, 16, 32, 0.75);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 24px;
  padding: 40px 36px;
  box-shadow: 
    0 32px 100px rgba(0,0,0,0.5),
    0 0 60px rgba(59,130,246,0.04),
    inset 0 1px 0 rgba(255,255,255,0.04);
  animation: authCardIn 0.5s ease-out;
}

@keyframes authCardIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Card Logo ── */
.auth-card-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 32px;
}

.auth-logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
}

.auth-logo-text {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, #f8fafc, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ── Tab Switcher ── */
.auth-tabs {
  display: flex;
  position: relative;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
  border: 1px solid rgba(255,255,255,0.05);
}

.auth-tab {
  flex: 1;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  background: none;
  color: #64748b;
  cursor: pointer;
  z-index: 1;
  position: relative;
  transition: all 0.3s;
  border-radius: 8px;
  font-family: inherit;
}

.auth-tab.active {
  color: #fff;
}

.auth-tab-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 8px;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(59,130,246,0.25);
}

/* ── Form Header ── */
.auth-form-header {
  margin-bottom: 24px;
  text-align: center;
}

.auth-form-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #f8fafc;
  letter-spacing: -0.02em;
  margin-bottom: 6px;
}

.auth-form-header p {
  font-size: 13px;
  color: #94a3b8;
}

/* ── Form Fields ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.auth-optional {
  text-transform: none;
  font-weight: 400;
  color: #64748b;
  letter-spacing: normal;
}

.auth-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 0 16px;
  transition: all 0.2s ease-in-out;
}

.auth-input-wrapper:focus-within {
  border-color: rgba(96,165,250,0.5);
  background: rgba(59,130,246,0.05);
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.auth-input-wrapper.error {
  border-color: rgba(248,113,113,0.5);
  background: rgba(239,68,68,0.05);
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
}

.auth-input-icon {
  font-size: 16px;
  flex-shrink: 0;
  opacity: 0.7;
  color: #94a3b8;
}

.auth-input-wrapper input {
  flex: 1;
  border: none;
  background: none;
  padding: 14px 0;
  font-size: 14px;
  color: #f8fafc;
  outline: none;
  font-family: inherit;
}

.auth-input-wrapper input::placeholder {
  color: #64748b;
}

.auth-toggle-pw {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.auth-toggle-pw:hover {
  opacity: 1;
}

.auth-field-error {
  display: block;
  font-size: 11px;
  color: #f87171;
  margin-top: 6px;
  font-weight: 500;
}

/* ── Submit Button ── */
.auth-submit-btn {
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(59,130,246,0.3);
}

.auth-submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59,130,246,0.4);
}

.auth-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.auth-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-btn-arrow {
  transition: transform 0.3s;
  font-size: 18px;
}

.auth-submit-btn:hover .auth-btn-arrow {
  transform: translateX(4px);
}

.auth-btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: authSpin 0.6s linear infinite;
}

@keyframes authSpin {
  to { transform: rotate(360deg); }
}

/* ── Switch Text ── */
.auth-switch-text {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.auth-switch-link {
  color: #60a5fa;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  transition: color 0.2s;
}

.auth-switch-link:hover {
  color: #93c5fd;
  text-decoration: underline;
}

/* ── Alert Messages ── */
.auth-alert {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  animation: authAlertIn 0.3s ease-out;
}

@keyframes authAlertIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-alert-error {
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  color: #fca5a5;
}

.auth-alert-success {
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  color: #6ee7b7;
}

/* ═══════════════════════════════════════════
   ADMIN LOGIN PAGE — Command Center Theme
   ═══════════════════════════════════════════ */

.admin-auth-page {
  background: #020617;
}

.admin-bg-gradient-1 {
  background: radial-gradient(circle, rgba(239,68,68,0.06), transparent 70%) !important;
  animation-duration: 20s !important;
}

.admin-bg-gradient-2 {
  background: radial-gradient(circle, rgba(245,158,11,0.05), transparent 70%) !important;
}

.admin-bg-gradient-3 {
  background: radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%) !important;
}

.admin-hex-pattern {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(239,68,68,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(239,68,68,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  z-index: 0;
  pointer-events: none;
}

.admin-particle {
  background: rgba(239,68,68,0.3) !important;
}

.admin-particle:nth-child(even) {
  background: rgba(245,158,11,0.2) !important;
}

.admin-login-container {
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
  animation: authCardIn 0.6s ease-out;
}

.admin-login-header {
  text-align: center;
  margin-bottom: 32px;
}

.admin-shield {
  position: relative;
  width: 84px;
  height: 84px;
  margin: 0 auto 18px;
}

.admin-shield-inner {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08));
  border: 2px solid rgba(239,68,68,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  position: relative;
  z-index: 1;
}

.admin-shield-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid rgba(239,68,68,0.1);
  animation: adminRingPulse 3s ease-in-out infinite;
}

.admin-shield-ring-2 {
  inset: -16px;
  animation-delay: 1.5s;
  border-color: rgba(239,68,68,0.05);
}

@keyframes adminRingPulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.04); }
}

.admin-login-title h1 {
  font-size: 24px;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}

.admin-login-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  background: rgba(255,255,255,0.05);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.08);
}

.admin-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulseDot 2s infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
}

.admin-login-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 32px 100px rgba(0,0,0,0.5);
}

.admin-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.admin-card-icon {
  font-size: 26px;
  width: 52px;
  height: 52px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.admin-card-header h2 {
  font-size: 19px;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 4px;
}

.admin-card-header p {
  font-size: 13px;
  color: #94a3b8;
}

.admin-input:focus-within {
  border-color: rgba(239,68,68,0.5) !important;
  background: rgba(239,68,68,0.05) !important;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
}

.admin-submit-btn {
  background: linear-gradient(135deg, #dc2626, #ef4444) !important;
  box-shadow: 0 4px 20px rgba(239,68,68,0.3) !important;
}

.admin-submit-btn:hover:not(:disabled) {
  box-shadow: 0 8px 30px rgba(239,68,68,0.4) !important;
}

.admin-card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
  text-align: center;
}

.admin-security-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.admin-security-badge svg {
  color: #22c55e;
  opacity: 0.8;
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .auth-card, .admin-login-card {
    padding: 32px 24px;
    border-radius: 20px;
  }
}

`;

content = content.substring(0, startIndex) + newCss + content.substring(endIndex);
fs.writeFileSync(filePath, content);
console.log("CSS Updated successfully.");
