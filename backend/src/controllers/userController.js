/**
 * @file userController.js
 * @description User management controller for PDPA-related operations
 */

const { deleteAccount } = require('../services/userService');
const { asyncErrorHandler } = require('../middlewares/errorHandler');

/**
 * Delete user account (PDPA Right to Erasure)
 * DELETE /api/user/:id
 */
const deleteUserAccount = asyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id; // From auth middleware

  // Validate user ID format (cuid)
  if (!id || typeof id !== 'string' || id.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID'
    });
  }

  await deleteAccount(id, requesterId);

  res.status(204).send(); // No content
});

module.exports = {
  deleteUserAccount
};
