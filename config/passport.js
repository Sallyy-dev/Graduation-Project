const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const FacebookStrategy = require("passport-facebook").Strategy;

const User = require("../models/user");

// ─── Google ───────────────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/user/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            user.googleId = profile.id;
            if (!user.profilePhoto && profile.photos[0]?.value) {
              user.profilePhoto = profile.photos[0].value;
            }
            await user.save();
          } else {
            user = await User.create({
              userName: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              profilePhoto: profile.photos[0]?.value || null,
              password: Math.random().toString(36).slice(-10), // password وهمي
              role: "user",
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// ─── Facebook ─────────────────────────────────────────────────────────────────
// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: process.env.FACEBOOK_APP_ID,
//       clientSecret: process.env.FACEBOOK_APP_SECRET,
//       callbackURL: "/api/user/auth/facebook/callback",
//       profileFields: ["id", "displayName", "emails", "photos"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ facebookId: profile.id });

//         if (!user) {
//           const email = profile.emails?.[0]?.value || `fb_${profile.id}@noemail.com`;
//           user = await User.findOne({ email });

//           if (user) {
//             user.facebookId = profile.id;
//             if (!user.profilePhoto && profile.photos?.[0]?.value) {
//               user.profilePhoto = profile.photos[0].value;
//             }
//             await user.save();
//           } else {
//             user = await User.create({
//               userName: profile.displayName,
//               email,
//               facebookId: profile.id,
//               profilePhoto: profile.photos?.[0]?.value || null,
//               password: Math.random().toString(36).slice(-10),
//               role: "user",
//             });
//           }
//         }

//         return done(null, user);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );



module.exports = passport;
