const { registerUser, loginUser, refreshAccessToken, logoutUser } = require('../services/authService')
const { asyncErrorHandler } = require('../middlewares/errorHandler')

/**
 * Login controller
 * POST /login
 */
const login = asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    })
  }

  // Authenticate user
  const result = await loginUser(email, password)

  // Set tokens in HTTP-only cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  })

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  })

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user
    }
  })
})

/**
 * Register alumni controller
 * POST /register/alumni
 */
const registerAlumni = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password, degreeTypeId, address } = req.body

  // Validate input
  if (!name || !surname || !email || !password || !degreeTypeId || !address) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: name, surname, email, password, degreeTypeId, address'
    })
  }

  // Register alumni as STUDENT
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: 'STUDENT'
    },
    {
      degreeTypeId, // Keep as string (cuid)
      address
    }
  )

  res.status(201).json({
    success: true,
    message: 'Alumni registration successful',
    data: {
      user
    }
  })
})

/**
 * Register enterprise/company controller
 * POST /register/enterprise
 */
const registerEnterprise = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password, companyName, address, phoneNumber } = req.body

  // Validate input
  if (!name || !surname || !email || !password || !companyName || !address || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: name, surname, email, password, companyName, address, phoneNumber'
    })
  }

  // Register enterprise as EMPLOYER
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: 'EMPLOYER'
    },
    {
      companyName,
      address,
      phoneNumber
    }
  )

  res.status(201).json({
    success: true,
    message: 'Enterprise registration successful',
    data: {
      user
    }
  })
})

/**
 * Register university staff controller
 * POST /register/staff
 */
const registerStaff = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password, department } = req.body

  // Register staff as PROFESSOR
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: 'PROFESSOR'
    },
    {
      department
    }
  )

  res.status(201).json({
    success: true,
    message: 'University staff registration successful',
    data: {
      user
    }
  })
})

/**
 * Register admin controller
 * POST /register/admin
 */
const registerAdmin = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password } = req.body

  // Register admin as ADMIN
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: 'ADMIN'
    }
  )

  res.status(201).json({
    success: true,
    message: 'Admin registration successful',
    data: {
      user
    }
  })
})

/**
 * Refresh token controller
 * POST /auth/refresh
 */
const refreshToken = asyncErrorHandler(async (req, res) => {
  // Accept refresh token from either cookies or request body
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    })
  }

  const result = await refreshAccessToken(refreshToken)

  // Set new access token in cookie
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  })

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user: result.user,
      accessToken: result.accessToken  // Include token in response for clients that can't use cookies
    }
  })
})

/**
 * Logout controller
 * POST /auth/logout
 */
const logout = asyncErrorHandler(async (req, res) => {
  // Accept refresh token from either cookies or request body
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken

  if (refreshToken) {
    await logoutUser(refreshToken)
  }

  // Clear cookies
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')

  res.json({
    success: true,
    message: 'Logout successful'
  })
})

/**
 * Get current user profile
 * GET /auth/me
 */
const getProfile = asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  })
})

module.exports = {
  login,
  registerAlumni,
  registerEnterprise,
  registerStaff,
  registerAdmin,
  refreshToken,
  logout,
  getProfile
}