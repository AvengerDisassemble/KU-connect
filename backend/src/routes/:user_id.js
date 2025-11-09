const express = require('express')
const router = express.Router()
const { getSaved, postSaved, deleteSaved } = require('../controllers/savedController')
const { userIdParam, jobIdBody, handleValidationResult } = require('../validators/savedValidators')
const { asyncErrorHandler } = require('../middlewares/errorHandler')

// Mounted at '/:user_id' by routes index.js, so paths below become '/api/:user_id/...'
router.get('/saved', userIdParam, handleValidationResult, asyncErrorHandler(getSaved))
router.post('/saved', userIdParam, jobIdBody, handleValidationResult, asyncErrorHandler(postSaved))
router.delete('/saved', userIdParam, jobIdBody, handleValidationResult, asyncErrorHandler(deleteSaved))

module.exports = router
