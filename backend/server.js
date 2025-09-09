/**
 * Server entry point
 * @module server
 */
require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  // Use console.info for startup logs (StandardJS allows)
  console.info(`Server running on port ${PORT}`)
})
