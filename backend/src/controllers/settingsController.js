import {
  getOrCreateGlobalSettings,
  saveGlobalSettings,
} from "../services/settings.service.js";

/**
 * GET /api/settings
 */
export const getSettings = async (req, res) => {
  try {
    const setting = await getOrCreateGlobalSettings();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/settings
 */
export const updateSettings = async (req, res) => {
  try {
    const setting = await saveGlobalSettings(req.body);
    res.json({
      message: "Settings saved successfully",
      settings: setting
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
