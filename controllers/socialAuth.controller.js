const { generateTokens } = require("../utils/user");

// ─── Helper: بعد ما Passport يعمل authenticate يبعت JWT ────────────────────
const handleSocialCallback = (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    const { accessToken, refreshToken } = generateTokens(user);

    // بعت الـ refreshToken في cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // redirect للفرونت مع الـ accessToken في الـ URL
    // الفرونت هياخده ويحطه في الـ localStorage/state
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`
    );
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=${err.message}`);
  }
};

module.exports = { handleSocialCallback };
