const express = require("express");
const router = express.Router();
const { getPolicy, updatePolicy } = require("../services/policyService");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

// Public route: Get current policy settings
router.get("/", async (req, res) => {
  try {
    const policy = await getPolicy();
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch lab policy", error: error.message });
  }
});

// Admin-only route: Update policy settings
router.put("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const updatedPolicy = await updatePolicy(req.body, req.user._id);
    res.json({ message: "Lab policy updated successfully", policy: updatedPolicy });
  } catch (error) {
    res.status(500).json({ message: "Failed to update lab policy", error: error.message });
  }
});

module.exports = router;
