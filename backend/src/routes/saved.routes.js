/**
 * Saved jobs routes
 */
const express = require('express')
const router = express.Router()
const { getSaved, postSaved, deleteSaved } = require('../controllers/savedController')
const { userIdParam, jobIdBody, handleValidationResult } = require('../validators/savedValidators')
const { asyncErrorHandler } = require('../middlewares/errorHandler')

/**
 * TODO: Enforce JWT check: only allow req.user.id === user_id (admins may override)
 */

/**
 * @openapi
 * /api/{user_id}/saved:
 *   get:
 *     summary: List saved jobs for a user
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         example: 'user_123'
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:user_id/saved', userIdParam, handleValidationResult, asyncErrorHandler(getSaved))

/**
 * @openapi
 * /api/{user_id}/saved:
 *   post:
 *     summary: Save a job for a user
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *             required:
 *               - jobId
 *     responses:
 *       201:
 *         description: Created
 *       409:
 *         description: Already saved
 */
router.post('/:user_id/saved', userIdParam, jobIdBody, handleValidationResult, asyncErrorHandler(postSaved))

/**
 * @openapi
 * /api/{user_id}/saved:
 *   delete:
 *     summary: Remove a saved job
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobId:
 *                 type: string
 *             required:
 *               - jobId
 *     responses:
 *       204:
 *         description: No Content
 *       404:
 *         description: Not Found
 */
router.delete('/:user_id/saved', userIdParam, jobIdBody, handleValidationResult, asyncErrorHandler(deleteSaved))

module.exports = router
