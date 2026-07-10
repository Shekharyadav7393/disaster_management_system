import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['ngo', 'government', 'private', 'medical', 'other'],
        message: '{VALUE} is not a valid organization type',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^\S+@\S+\.\S+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
    },
    location: {
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
      },
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
      },
      address: {
        type: String,
      },
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    contactPerson: {
      type: String,
    },
    volunteers: {
      type: Number,
      default: 0,
    },
    certifications: {
      type: [String],
      default: [],
    },
    resourcesManaged: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
      default: [],
    },
    teamsManaged: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResponseTeam' }],
      default: [],
    },
    activeSince: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
organizationSchema.index({ type: 1 });
organizationSchema.index({ location: '2dsphere' });

// ── Pre-save hook: sync coordinates inside location ─────────────────────────
organizationSchema.pre('save', function (next) {
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
organizationSchema.methods.getTotalResources = async function () {
  return mongoose
    .model('Resource')
    .countDocuments({ _id: { $in: this.resourcesManaged } });
};

organizationSchema.methods.getTotalTeams = async function () {
  return mongoose
    .model('ResponseTeam')
    .countDocuments({ _id: { $in: this.teamsManaged } });
};

export default mongoose.model('Organization', organizationSchema);
