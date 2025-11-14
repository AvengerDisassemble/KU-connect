/**
 * Example route for demonstration purposes
 * @module routes/example
 */

const express = require("express");
const router = express.Router();

// Why: Demonstrates a simple GET endpoint for testing route setup
router.get("/", (req, res) => {
  res.json({ message: "This is an example route!" });
});

module.exports = router;
