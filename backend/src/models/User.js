import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/authMiddleware.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    password: {
      type: String,
      required: [function() { return this.authProvider === 'local'; }, 'Password is required for local authentication'],
    },
    phone: {
      type: String,
      required: [function() { return this.authProvider === 'local'; }, 'Phone number is required'],
      validate: {
        validator: function(v) {
          if (this.authProvider !== 'local' && !v) return true;
          return /^[0-9]{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid 10-digit phone number`,
      },
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    },
    googleId: { type: String },
    githubId: { type: String },
    emailVerificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    refreshTokens: [{ type: String }],
    fcmToken: { type: String },
    loginHistory: [
      {
        device: { type: String },
        ip: { type: String },
        time: { type: Date, default: Date.now }
      }
    ],
    role: {
      type: String,
      enum: {
        values: ['citizen', 'admin', 'super_admin', 'emergency_admin', 'volunteer', 'rescue', 'rescue_team', 'user', 'USER', 'RESPONDER', 'ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'citizen',
    },
    location: {
      longitude: { type: Number },
      latitude: { type: Number },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    address: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    emergencyContacts: [
      {
        name: { type: String },
        phone: { type: String },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenBlacklist: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ phone: 1 });
userSchema.index({ location: '2dsphere' });

// ── Pre-save hooks ──────────────────────────────────────────────────────────
userSchema.pre('save', async function () {
  // 1. Password complexity check (only when modified and not already hashed)
  if (this.isModified('password') && this.password) {
    const raw = this.password;
    const isAlreadyHashed = /^\$2[ab]\$/.test(raw);

    if (!isAlreadyHashed) {
      const hasUppercase = /[A-Z]/.test(raw);
      const hasNumber = /[0-9]/.test(raw);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(raw);
      const hasMinLength = raw.length >= 8;

      if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecial) {
        const err = new mongoose.Error.ValidationError(this);
        err.addError(
          'password',
          new mongoose.Error.ValidatorError({
            message:
              'Password must be at least 8 characters and contain at least one uppercase letter, one number, and one special character',
            path: 'password',
            value: raw,
          })
        );
        throw err;
      }

      // 2. Hash the password
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(raw, salt);
    }
  }

  // 3. Sync coordinates inside location
  if (
    this.location &&
    typeof this.location.latitude === 'number' &&
    typeof this.location.longitude === 'number'
  ) {
    this.location.type = 'Point';
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
});

// ── Instance Methods ────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateToken = function () {
  return signToken(this);
};

export default mongoose.model('User', userSchema);
