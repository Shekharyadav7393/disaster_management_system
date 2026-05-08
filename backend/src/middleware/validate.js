import Joi from 'joi';

/**
 * Generic validation middleware
 */
export const validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const details = error.details.map(d => d.message);
    return res.status(400).json({ message: "Validation error", errors: details });
  }
  next();
};

/**
 * SOS Validation Schema
 */
export const sosSchema = Joi.object({
  message: Joi.string().required().min(5),
  lat: Joi.number().required(),
  lng: Joi.number().required(),
  address: Joi.string().allow(''),
  peopleCount: Joi.number().integer().min(1).default(1),
  emergencyType: Joi.string().allow('')
});

/**
 * Auth Registration Schema
 */
export const registerSchema = Joi.object({
  name: Joi.string().required().min(2),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required().min(6),
  phone: Joi.string().required(),
  role: Joi.string().valid('citizen', 'admin', 'volunteer', 'rescue').default('citizen')
});

/**
 * Team Create/Update Validation Schema
 */
export const teamCreateSchema = Joi.object({
  name: Joi.string().required().min(2).max(100).trim(),
  capacity: Joi.number().integer().min(1).max(50).required(),
  status: Joi.string().valid('AVAILABLE', 'DISPATCHED', 'INACTIVE').default('AVAILABLE'),
  specialization: Joi.string().valid('general', 'flood', 'fire', 'medical', 'earthquake', 'urban_search', 'hazmat').default('general'),
  memberNames: Joi.array().items(Joi.string().trim().max(100)).default([]),
  memberPhones: Joi.array().items(Joi.string().trim().max(20)).default([]),
  leadName: Joi.string().allow('').max(100).default(''),
  leadPhone: Joi.string().allow('').max(20).default(''),
  currentLocation: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }).required(),
});

export const teamUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim(),
  capacity: Joi.number().integer().min(1).max(50),
  status: Joi.string().valid('AVAILABLE', 'DISPATCHED', 'INACTIVE'),
  specialization: Joi.string().valid('general', 'flood', 'fire', 'medical', 'earthquake', 'urban_search', 'hazmat'),
  memberNames: Joi.array().items(Joi.string().trim().max(100)),
  memberPhones: Joi.array().items(Joi.string().trim().max(20)),
  leadName: Joi.string().allow('').max(100),
  leadPhone: Joi.string().allow('').max(20),
  currentLocation: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).required()
  }),
}).min(1);

export const bulkStatusSchema = Joi.object({
  teamIds: Joi.array().items(Joi.string().length(24)).min(1).required(),
  status: Joi.string().valid('AVAILABLE', 'DISPATCHED', 'INACTIVE').required()
});
