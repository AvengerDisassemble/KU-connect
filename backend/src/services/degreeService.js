/**
 * DegreeType service
 * Why: frontend needs string IDs + names for dropdown options
 * @module services/degreeService
 */
const prisma = require('../models/prisma')

/**
 * Lists all degree types (id, name)
 * Why: provide degree options for student registration and filtering
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
async function listDegreeTypes () {
  return prisma.degreeType.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })
}

module.exports = { listDegreeTypes }
