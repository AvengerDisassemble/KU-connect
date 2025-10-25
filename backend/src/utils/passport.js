const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { findOrCreateGoogleUser } = require('../services/authService')

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 * Uses the Identity/Account Segregation Pattern
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const googleProfile = {
          providerAccountId: profile.id,
          email: profile.emails[0].value,
          name: profile.name.givenName,
          surname: profile.name.familyName,
          accessToken,
          refreshToken,
          profile
        }

        // Find or create user using the service
        const user = await findOrCreateGoogleUser(googleProfile)

        // Pass user to the next middleware
        done(null, user)
      } catch (error) {
        done(error, null)
      }
    }
  )
)

module.exports = passport
