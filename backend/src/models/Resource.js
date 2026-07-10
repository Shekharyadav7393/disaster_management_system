import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: ['food', 'water', 'shelter', 'medical', 'clothing', 'equipment'],
        message: '{VALUE} is not a valid resource type',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
    },
    location: {
      longitude: { type: Number },
      latitude: { type: Number },
      address: { type: String },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    ownerModel: {
      type: String,
      enum: ['User', 'Organization'],
      default: 'User',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'ownerModel',
    },
    status: {
      type: String,
      enum: {
        values: ['available', 'allocated', 'depleted'],
        message: '{VALUE} is not a valid status',
      },
      default: 'available',
    },
    expiryDate: {
      type: Date,
    },
    allocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Disaster',
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
resourceSchema.index({ type: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ location: '2dsphere' });

// ── Pre-save hook: sync coordinates inside location ─────────────────────────
resourceSchema.pre('save', function (next) {
  if (
    this.location &&
    typeof this.location.latitude === 'number' &&
    typeof this.location.longitude === 'number'
  ) {
    this.location.type = 'Point';
    this.location.coordinates = [this.location.longitude, this.location.latitude];
  }
  next();
});

// ── Instance Methods ────────────────────────────────────────────────────────
resourceSchema.methods.allocate = async function (disasterId) {
  this.allocatedTo = disasterId;
  this.status = 'allocated';
  await this.save();
  return this;
};

resourceSchema.methods.deallocate = async function () {
  this.allocatedTo = undefined;
  this.status = 'available';
  await this.save();
  return this;
};

resourceSchema.methods.isExpired = function () {
  if (!this.expiryDate) return false;
  return this.expiryDate < new Date();
};

export default mongoose.model('Resource', resourceSchema);