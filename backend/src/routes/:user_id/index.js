const express = require('express')
// Enable merging params from parent router so :user_id is available
const router = express.Router({ mergeParams: true })

// Mount the shared saved.routes.js router at /saved
const savedRouter = require('../saved.routes')
router.use('/saved', savedRouter)
module.exports = router
