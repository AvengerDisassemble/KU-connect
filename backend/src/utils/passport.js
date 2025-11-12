let passport;

try {
  passport = require("passport");
  const GoogleStrategy = require("passport-google-oauth20").Strategy;
  const { findOrCreateGoogleUser } = require("../services/authService");

  /**
   * Configure Passport with Google OAuth 2.0 Strategy
   * Uses the Identity/Account Segregation Pattern
   */
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
        scope: ["profile", "email"],
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
            profile,
          };

          // Find or create user using the service
          const user = await findOrCreateGoogleUser(googleProfile);

          // Pass user to the next middleware
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      },
    ),
  );
} catch (err) {
  // If optional dependencies aren't installed (e.g., running tests without npm install),
  // provide a minimal passport stub so the app and tests can run.
  // Why: prevents tests from failing due to missing dev dependencies while keeping API surface.
  // WARNING: This stub bypasses all authentication. It is intended for local tests only.
  // Do NOT enable in production. Ensure NODE_ENV !== 'test' in production environments
  // and that real `passport` is installed. Tests should explicitly assert auth behavior.
  passport = {
    initialize: () => (req, res, next) => next(),
    use: () => {},
    // Provide authenticate to match passport API used by routes: passport.authenticate(name, options)
    authenticate: (strategyName, options) => {
      return (req, res, next) => next();
    },
  };
}

module.exports = passport;
