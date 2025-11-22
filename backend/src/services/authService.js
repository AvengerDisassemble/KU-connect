const prisma = require('../models/prisma')
const { hashPassword, comparePassword } = require('../utils/passwordUtils')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateJwtId, getRefreshTokenExpiry } = require('../utils/tokenUtils')
const mfaService = require('./mfaService')
const sessionService = require('./sessionService')
const jwt = require('jsonwebtoken')


/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's first name
 * @param {string} userData.surname - User's last name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.role - User's role (STUDENT, PROFESSOR, EMPLOYER, ADMIN)
 * @param {Object} [roleSpecificData] - Additional data specific to the role
 * @returns {Promise<Object>} The created user (without password)
 */
async function registerUser(userData, roleSpecificData = {}) {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  // Create user with transaction to ensure consistency
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        status: userData.role === 'ADMIN' ? 'APPROVED' : 'PENDING', // Admins auto-approved, others pending
        verified: userData.role === 'ADMIN' // Admins are pre-verified
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
      },
    });

    // Create role-specific data
    if (
      userData.role === "STUDENT" &&
      roleSpecificData.degreeTypeId &&
      roleSpecificData.address
    ) {
      await tx.student.create({
        data: {
          userId: newUser.id,
          degreeTypeId: roleSpecificData.degreeTypeId,
          address: roleSpecificData.address,
          gpa: roleSpecificData.gpa || null,
          expectedGraduationYear:
            roleSpecificData.expectedGraduationYear || null,
        },
      });
    } else if (userData.role === "PROFESSOR" && roleSpecificData.department) {
      await tx.professor.create({
        data: {
          userId: newUser.id,
          department: roleSpecificData.department,
        },
      });
    } else if (
      userData.role === "EMPLOYER" &&
      roleSpecificData.companyName &&
      roleSpecificData.address
    ) {
      await tx.hR.create({
        data: {
          userId: newUser.id,
          companyName: roleSpecificData.companyName,
          address: roleSpecificData.address,
          industry: roleSpecificData.industry || "OTHER",
          companySize: roleSpecificData.companySize || "ONE_TO_TEN",
          website: roleSpecificData.website || null,
          phoneNumber: roleSpecificData.phoneNumber,
          description: roleSpecificData.description || null,
        },
      });
    } else if (userData.role === "ADMIN") {
      await tx.admin.create({
        data: {
          userId: newUser.id,
        },
      });
    }

    return newUser;
  });

  return user;
}

/**
 * Authenticate user login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User data and tokens
 */
async function loginUser(email, password, req = null) {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      password: true,
      role: true,
      status: true,
      verified: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      mfaEnabled: true,
      mfaSecret: true
    }
  })

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new Error(`Account locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`);
  }

  // Reset lock if expired
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
  }

  // Block SUSPENDED users from logging in
  if (user.status === 'SUSPENDED') {
    throw new Error('Account suspended. Please contact administrator.')
  }

  // Check if user has a password (local auth)
  if (!user.password) {
    throw new Error(
      "This account uses OAuth authentication. Please sign in with Google.",
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    // Increment failed login attempts
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const maxAttempts = 5;
    const lockDurationMinutes = 15;

    if (newFailedAttempts >= maxAttempts) {
      // Lock account for 15 minutes
      const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60000);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil: lockedUntil
        }
      });
      throw new Error(`Too many failed login attempts. Account locked for ${lockDurationMinutes} minutes.`);
    } else {
      // Update failed attempts count
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts
        }
      });
      const attemptsRemaining = maxAttempts - newFailedAttempts;
      throw new Error(`Invalid credentials. ${attemptsRemaining} attempt(s) remaining before account lock.`);
    }
  }

  // Successful login - reset failed attempts
  if (user.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
  }

  // Check if MFA is enabled for this user
  if (user.mfaEnabled && user.mfaSecret) {
    // Generate temporary token for MFA verification (expires in 5 minutes)
    const tempToken = jwt.sign(
      {
        id: user.id,
        type: 'mfa_temp',
        timestamp: Date.now()
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Remove sensitive data from response
    const { password: _, failedLoginAttempts: __, lockedUntil: ___, mfaSecret: ____, ...userWithoutPassword } = user;

    return {
      mfaRequired: true,
      tempToken,
      userId: user.id,
      message: 'MFA verification required',
    };
  }

  // Generate tokens for non-MFA users
  const jwtId = generateJwtId();
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user.id,
    jti: jwtId,
  });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  // Create session for non-MFA users
  let sessionId = null;
  if (req) {
    try {
      const session = await sessionService.createSession(user.id, req);
      sessionId = session.id;
    } catch (error) {
      console.error('Failed to create session:', error.message);
    }
  }

  // Remove password from response
  const { password: _, failedLoginAttempts: __, lockedUntil: ___, mfaEnabled: ____, mfaSecret: _____, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    sessionId,
  };
}

/**
 * Verify MFA code and complete login
 * @param {string} tempToken - Temporary token from initial login
 * @param {string} mfaCode - 6-digit TOTP code or recovery code
 * @param {Object} req - Express request object for session tracking
 * @returns {Promise<Object>} User data and tokens
 */
async function verifyMfaLogin(tempToken, mfaCode, req = null) {
  // Verify temporary token
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.type !== 'mfa_temp') {
      throw new Error('Invalid token type');
    }
  } catch (error) {
    throw new Error('Invalid or expired temporary token');
  }

  // Get user with MFA details
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      verified: true,
      mfaEnabled: true,
      mfaSecret: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.mfaEnabled || !user.mfaSecret) {
    throw new Error('MFA not enabled for this user');
  }

  // Check if account is suspended
  if (user.status === 'SUSPENDED') {
    throw new Error('Account suspended. Please contact administrator.');
  }

  // Try to verify as TOTP code first
  let isValid = false;
  let usedRecoveryCode = false;

  if (mfaCode.length === 6 && /^\d{6}$/.test(mfaCode)) {
    // 6-digit code - verify as TOTP
    isValid = mfaService.verifyMfaToken(user.mfaSecret, mfaCode);
  } else if (mfaCode.length === 8) {
    // 8-character code - verify as recovery code
    isValid = await mfaService.verifyRecoveryCode(user.id, mfaCode);
    usedRecoveryCode = isValid;
  }

  if (!isValid) {
    throw new Error('Invalid MFA code');
  }

  // Generate tokens
  const jwtId = generateJwtId();
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user.id,
    jti: jwtId,
  });

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  // Create session
  let sessionId = null;
  let isNewDevice = false;
  if (req) {
    try {
      const session = await sessionService.createSession(user.id, req);
      sessionId = session.id;
      
      // Check if this is a new device
      const deviceId = sessionService.generateDeviceFingerprint(req);
      isNewDevice = await sessionService.isNewDevice(user.id, deviceId);
    } catch (error) {
      console.error('Failed to create session:', error.message);
    }
  }

  // Get remaining recovery codes count
  const remainingRecoveryCodes = await mfaService.getRemainingRecoveryCodesCount(user.id);

  // Remove sensitive data from response
  const { mfaSecret: _, ...userWithoutSensitiveData } = user;

  return {
    user: userWithoutSensitiveData,
    accessToken,
    refreshToken,
    sessionId,
    usedRecoveryCode,
    remainingRecoveryCodes,
    isNewDevice,
  };
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<Object>} New access token and optionally new refresh token
 */
async function refreshAccessToken(refreshToken) {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new Error("Invalid refresh token");
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          role: true,
          verified: true,
        },
      },
    },
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new Error("Refresh token expired or invalid");
  }
  // Generate new access token
  const newAccessToken = generateAccessToken({
    id: storedToken.user.id,
    role: storedToken.user.role,
  });

  return {
    accessToken: newAccessToken,
    user: storedToken.user,
  };
}

/**
 * Logout user by removing refresh token
 * @param {string} refreshToken - The refresh token to revoke
 * @returns {Promise<void>}
 */
async function logoutUser(refreshToken) {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data without password
 */
async function getUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      role: true,
      status: true,
      verified: true,
      createdAt: true,
      updatedAt: true,
      student: true,
      professor: true,
      hr: true,
      admin: true,
    },
  });
}

/**
 * Find or create a user from Google OAuth profile
 * Implements the Identity/Account Segregation Pattern
 * @param {Object} googleProfile - Google profile data
 * @param {string} googleProfile.providerAccountId - Google account ID
 * @param {string} googleProfile.email - User's email
 * @param {string} googleProfile.name - User's first name
 * @param {string} googleProfile.surname - User's last name
 * @param {string} [googleProfile.accessToken] - Google access token
 * @param {string} [googleProfile.refreshToken] - Google refresh token
 * @returns {Promise<Object>} The user object
 */
async function findOrCreateGoogleUser(googleProfile) {
  const {
    providerAccountId,
    email,
    name,
    surname,
    accessToken,
    refreshToken,
    profile,
  } = googleProfile;

  // Try to find existing account by provider and providerAccountId
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          role: true,
          status: true,
          verified: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (existingAccount) {
    // User already exists with this Google account
    // Return user with status field included
    return {
      id: existingAccount.user.id,
      name: existingAccount.user.name,
      surname: existingAccount.user.surname,
      email: existingAccount.user.email,
      role: existingAccount.user.role,
      status: existingAccount.user.status,
      verified: existingAccount.user.verified,
      createdAt: existingAccount.user.createdAt,
      updatedAt: existingAccount.user.updatedAt,
    };
  }

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // User exists but hasn't linked Google account yet
    // Create a new Account linked to the existing User
    await prisma.account.create({
      data: {
        userId: existingUser.id,
        type: "oauth",
        provider: "google",
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        scope: "profile email",
      },
    });

    return {
      id: existingUser.id,
      name: existingUser.name,
      surname: existingUser.surname,
      email: existingUser.email,
      role: existingUser.role,
      status: existingUser.status,
      verified: existingUser.verified,
      createdAt: existingUser.createdAt,
      updatedAt: existingUser.updatedAt,
    };
  }

  // Create new user, account, and student record in a transaction
  const newUser = await prisma.$transaction(async (tx) => {
    // Ensure at least one degree type exists, or create a default one
    let degreeType = await tx.degreeType.findFirst();
    if (!degreeType) {
      degreeType = await tx.degreeType.create({
        data: {
          name: "Bachelor of Science",
        },
      });
    }

    // Create new user (no password for OAuth users)
    const user = await tx.user.create({
      data: {
        name,
        surname,
        email,
        password: null, // OAuth users don't have passwords
        role: "STUDENT", // Default role
        status: "APPROVED", // OAuth users are pre-approved (KU students verified by Google OAuth)
        verified: true, // OAuth users are pre-verified
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create associated Account
    await tx.account.create({
      data: {
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        scope: "profile email",
      },
    });

    // Create associated Student record with placeholder data
    await tx.student.create({
      data: {
        userId: user.id,
        degreeTypeId: degreeType.id, // Use existing or newly created degree type
        address: "To be updated", // Placeholder address
        gpa: null,
        expectedGraduationYear: null,
      },
    });

    return user;
  });

  return newUser;
}

module.exports = {
  registerUser,
  loginUser,
  verifyMfaLogin,
  refreshAccessToken,
  logoutUser,
  getUserById,
  findOrCreateGoogleUser,
};
