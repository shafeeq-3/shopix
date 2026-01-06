const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - Always register it
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

console.log('🔍 Checking Google OAuth credentials...');
console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ Missing');

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  try {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: '/api/auth/google/callback',
          proxy: true,
          // Professional OAuth settings
          accessType: 'offline',
          prompt: 'consent', // Always show consent screen
          state: true
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log('🔐 Google OAuth callback received for:', profile.emails[0].value);
            
            // Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

            if (user) {
              // User exists - update Google ID if not set
              if (!user.googleId) {
                user.googleId = profile.id;
                user.isEmailVerified = true; // Google emails are verified
                await user.save();
              }
              console.log('✅ Existing user logged in:', user.email);
              return done(null, user);
            }

            // Create new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value.toLowerCase(),
              password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random password (won't be used)
              isEmailVerified: true, // Google emails are pre-verified
              role: 'user'
            });

            console.log('✅ New user created via Google:', user.email);
            
            // Send welcome email for new Google users
            try {
              const { emailTemplates, sendEmail } = require('../services/emailService');
              const logger = require('../utils/logger');
              
              const welcomeEmail = emailTemplates.welcome(user);
              await sendEmail(user.email, 'Welcome to SHOPIX! 🎉', welcomeEmail);
              logger.info(`Welcome email sent to Google user: ${user.email}`);
            } catch (emailError) {
              console.error('Failed to send welcome email to Google user:', emailError);
              // Don't fail OAuth if email fails
            }
            
            done(null, user);
          } catch (error) {
            console.error('❌ Google OAuth error:', error);
            done(error, null);
          }
        }
      )
    );
    console.log('✅ Google OAuth strategy registered successfully');
  } catch (error) {
    console.error('❌ Failed to register Google OAuth strategy:', error);
  }
} else {
  console.log('⚠️  Google OAuth disabled (credentials not configured)');
  console.log('💡 To enable: Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
}

module.exports = passport;
