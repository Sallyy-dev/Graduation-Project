require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const path = require("path");
const passport = require("../config/passport");
const socialRoutes = require("../routes/socialAuth.routes");


const connectDB = require("../config/db");
const { globalErrorHandler } = require("../middlewares/errorHandeling");

const app = express();

/* ================== Middleware ================== */
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin:"http://localhost:5173",
    credentials: true
  })
);

app.use(passport.initialize());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
/* ================== DB Connection ================== */
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
/* ================== DB Connection ================== */
// connectDB();

/* ================== Routes ================== */
app.use("/api/user", require("../routes/user.routes"));
app.use("/api/categories", require("../routes/category.routes"));
app.use("/api/cateItems", require("../routes/cateItem.routes"));
app.use("/api/orders", require("../routes/order.routes"));
app.use("/api/cart", require("../routes/cart.routes"));
app.use("/api/coupons", require("../routes/coupon.routes"));
app.use("/api/slides", require("../routes/slide.routes"));
app.use("/api/contact", require("../routes/contact.routes"))
app.use("/api/user", socialRoutes);
app.use("/api/auth", require("../routes/otp.routes"));
/* ================== Test Route ================== */
app.get("/", (req, res) => {
  res.json({ message: "API is working on Vercel" });
});

/* ================== Error Handler ================== */
app.use(globalErrorHandler);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/* ================== Export for Vercel ================== */
module.exports = (req, res) => app(req, res);
