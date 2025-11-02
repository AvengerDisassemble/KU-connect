const express = require('express')
const router = express.Router()

const { validateUserId, validateJobIdInBody, handleValidationResult } = require('../validators/savedValidators')
const { getSaved, postSaved, deleteSaved } = require('../controllers/savedController')

// TODO: Enforce that req.user.id === Number(req.params.user_id) (JWT auth) — Admin override later

/**
 * GET /api/:user_id/saved
 */
router.get('/:user_id/saved', [validateUserId, handleValidationResult], getSaved)

/**
 * POST /api/:user_id/saved
 */
router.post('/:user_id/saved', [validateUserId, validateJobIdInBody, handleValidationResult], postSaved)

/**
 * DELETE /api/:user_id/saved
 */
router.delete('/:user_id/saved', [validateUserId, validateJobIdInBody, handleValidationResult], deleteSaved)

module.exports = router
