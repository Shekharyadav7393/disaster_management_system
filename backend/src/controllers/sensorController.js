import Sensor from "../models/Sensor.js";
import SensorReading from "../models/SensorReading.js";
import { processAutomaticDetection } from "../services/autonomousEngine.js";

/**
 * GET /api/sensors
 */
export const getSensors = async (req, res) => {
  try {
    const items = await Sensor.find().populate("zoneId");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/sensors/:id
 */
export const getSensorById = async (req, res) => {
  try {
    const item = await Sensor.findById(req.params.id).populate("zoneId");
    if (!item) return res.status(404).json({ message: "Sensor not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/sensors
 */
export const createSensor = async (req, res) => {
  try {
    const item = new Sensor(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/sensors/:id
 */
export const updateSensor = async (req, res) => {
  try {
    const item = await Sensor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: "Sensor not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/sensors/:id
 */
export const deleteSensor = async (req, res) => {
  try {
    const item = await Sensor.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Sensor not found" });
    res.json({ message: "Sensor deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/sensors/simulate
 */
export const simulateDisaster = async (req, res) => {
  try {
    const io = req.app.get("io");

    let sensor = await Sensor.findOne();
    if (!sensor) {
      sensor = await Sensor.create({
        deviceId: "sensor-sim-01",
        name: "Simulation Sensor",
        location: {
          type: "Point",
          coordinates: [77.209, 28.6139],
          address: "Simulation Control Zone",
          city: "Delhi",
          state: "Delhi",
        },
      });
    }

    const reading = new SensorReading({
      deviceId: sensor.deviceId,
      zoneId: sensor.zoneId,
      metrics: {
        waterLevel: 92,
        rainfall: 18,
        temperature: 31,
        gasLevel: 24,
      },
    });

    await reading.save();
    sensor.metrics = reading.metrics;
    await sensor.save();

    const generatedAlert = await processAutomaticDetection(io, reading);

    res.json({
      message: generatedAlert
        ? "Disaster simulation started and alert generated."
        : "Disaster simulation started.",
      sensorId: sensor._id,
      readingId: reading._id,
      alertId: generatedAlert?._id || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
