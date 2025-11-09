/**
 * Controller for saved jobs endpoints
 */
const savedService = require('../services/savedService')

/**
 * GET /api/:user_id/saved
 * @param {*} req
 * @param {*} res
 */
async function getSaved (req, res) {
  // Why: Keep controller thin - delegate business logic to service
  const userId = req.params.user_id
  const page = parseInt(req.query.page) || 1
  const pageSize = parseInt(req.query.pageSize) || 20

  const data = await savedService.listSavedJobs(userId, { page, pageSize })
  res.status(200).json({ success: true, data })
}

/**
 * POST /api/:user_id/saved
 * @param {*} req
 * @param {*} res
 */
async function postSaved (req, res, next) {
  const userId = req.params.user_id
  const { jobId } = req.body
  try {
    const saved = await savedService.addSavedJob(userId, jobId)
    return res.status(201).json({ success: true, data: saved })
  } catch (err) {
    if (err.code === 'ALREADY_SAVED') {
      return res.status(409).json({ success: false, error: { code: 'ALREADY_SAVED', message: 'Job already saved' } })
    }
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } })
    }
    next(err)
  }
}

/**
 * DELETE /api/:user_id/saved
 */
async function deleteSaved (req, res, next) {
  const userId = req.params.user_id
  const { jobId } = req.body
  try {
    await savedService.removeSavedJob(userId, jobId)
    return res.status(204).send()
  } catch (err) {
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Saved job not found' } })
    }
    next(err)
  }
}

module.exports = {
  getSaved,
  postSaved,
  deleteSaved
}
