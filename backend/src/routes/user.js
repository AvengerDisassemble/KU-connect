/**
 * @file user.js
 * @description User account management routes (PDPA-related operations)
 */

const express = require('express');
const { deleteUserAccount } = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @route DELETE /api/user/:id
 * @desc Delete user account and all associated personal data (PDPA Right to Erasure)
 * @access Private - User can delete their own account, Admin can delete any account
 */
router.delete('/:id', authMiddleware, deleteUserAccount);

module.exports = router;
