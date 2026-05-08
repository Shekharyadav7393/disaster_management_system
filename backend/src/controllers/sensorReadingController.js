import SensorReading from "../models/SensorReading.js";

/**
 * GET /api/sensors/readings
 */
export const getReadings = async (req, res) => {
  try {
    const { deviceId, limit = 50 } = req.query;
    const query = deviceId ? { deviceId } : {};
    const items = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/sensors/:deviceId/readings
 */
export const ingestReading = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { waterLevel, temperature, gasLevel, rainfall, zoneId } = req.body;
    const io = req.app.get("io");

    const reading = new SensorReading({
      deviceId,
      zoneId: zoneId || null,
      metrics: {
        waterLevel: waterLevel || 0,
        temperature: temperature || 0,
        gasLevel: gasLevel || 0,
        rainfall: rainfall || 0
      }
    });

    await reading.save();

    // Socket Optimization: Only emit to all if critical, or to admin_room for every reading
    if (io) {
      const data = { deviceId, metrics: reading.metrics, timestamp: reading.timestamp };
      
      // Always notify admins
      io.to('admin_room').emit('sensor_update', data);

      // Notify everyone only if critical thresholds are met
      if (waterLevel > 80 || gasLevel > 100) {
        io.emit('CRITICAL_SENSOR_ALERT', data);
      }
    }

    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/sensors/:deviceId/readings
 */
export const getReadingsByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;
    const items = await SensorReading.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

