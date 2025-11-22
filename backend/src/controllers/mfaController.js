const mfaService = require('../services/mfaService');
const prisma = require('../models/prisma');
const { comparePassword } = require('../utils/passwordUtils');

/**
 * Generate MFA secret and QR code for enrollment
 * @route POST /api/auth/mfa/enroll
 * @access Private (authenticated users)
 */
async function enrollMfa(req, res) {
  try {
    const userId = req.user.id;

    // Check if MFA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true, email: true, name: true },
    });

    if (user.mfaEnabled) {
      return res.status(400).json({
        error: 'MFA is already enabled for this account',
      });
    }

    // Generate MFA secret and QR code
    const { secret, qrCode } = await mfaService.generateMfaSecret({
      email: user.email,
      name: user.name,
    });

    res.json({
      message: 'MFA enrollment initiated. Scan the QR code with your authenticator app.',
      secret,
      qrCode,
    });
  } catch (error) {
    console.error('MFA enrollment error:', error);
    res.status(500).json({
      error: 'Failed to initiate MFA enrollment',
    });
  }
}

/**
 * Verify TOTP code and enable MFA
 * @route POST /api/auth/mfa/verify
 * @access Private (authenticated users)
 */
async function verifyAndEnableMfa(req, res) {
  try {
    const userId = req.user.id;
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({
        error: 'Secret and verification token are required',
      });
    }

    // Verify the TOTP token
    const isValid = mfaService.verifyMfaToken(secret, token);
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid verification code',
      });
    }

    // Enable MFA and generate recovery codes
    const { recoveryCodes } = await mfaService.enableMfa(userId, secret);

    res.json({
      message: 'MFA enabled successfully',
      recoveryCodes,
      warning: 'Save these recovery codes in a secure location. They will not be shown again.',
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({
      error: 'Failed to enable MFA',
    });
  }
}

/**
 * Disable MFA (requires password and current TOTP)
 * @route POST /api/auth/mfa/disable
 * @access Private (authenticated users)
 */
async function disableMfa(req, res) {
  try {
    const userId = req.user.id;
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({
        error: 'Password and TOTP token are required',
      });
    }

    // Get user with password and MFA details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        password: true,
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        error: 'MFA is not enabled for this account',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Verify TOTP token
    const isTotpValid = mfaService.verifyMfaToken(user.mfaSecret, token);
    if (!isTotpValid) {
      return res.status(400).json({
        error: 'Invalid MFA code',
      });
    }

    // Disable MFA
    await mfaService.disableMfa(userId);

    res.json({
      message: 'MFA disabled successfully',
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({
      error: 'Failed to disable MFA',
    });
  }
}

/**
 * Get MFA status for current user
 * @route GET /api/auth/mfa/status
 * @access Private (authenticated users)
 */
async function getMfaStatus(req, res) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaEnrolledAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get remaining recovery codes count
    let remainingRecoveryCodes = 0;
    if (user.mfaEnabled) {
      remainingRecoveryCodes = await mfaService.getRemainingRecoveryCodesCount(userId);
    }

    res.json({
      mfaEnabled: user.mfaEnabled,
      mfaEnrolledAt: user.mfaEnrolledAt,
      remainingRecoveryCodes,
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({
      error: 'Failed to retrieve MFA status',
    });
  }
}

/**
 * Regenerate recovery codes (requires current TOTP)
 * @route POST /api/auth/mfa/regenerate-codes
 * @access Private (authenticated users)
 */
async function regenerateRecoveryCodes(req, res) {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'TOTP token is required',
      });
    }

    // Get user MFA details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaSecret: true,
      },
    });

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({
        error: 'MFA is not enabled for this account',
      });
    }

    // Verify TOTP token
    const isValid = mfaService.verifyMfaToken(user.mfaSecret, token);
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid MFA code',
      });
    }

    // Delete old recovery codes
    await prisma.recoveryCode.deleteMany({
      where: { userId },
    });

    // Generate new recovery codes
    const recoveryCodes = await mfaService.generateRecoveryCodes(userId);

    res.json({
      message: 'Recovery codes regenerated successfully',
      recoveryCodes,
      warning: 'Save these recovery codes in a secure location. They will not be shown again.',
    });
  } catch (error) {
    console.error('Recovery code regeneration error:', error);
    res.status(500).json({
      error: 'Failed to regenerate recovery codes',
    });
  }
}

module.exports = {
  enrollMfa,
  verifyAndEnableMfa,
  disableMfa,
  getMfaStatus,
  regenerateRecoveryCodes,
};
