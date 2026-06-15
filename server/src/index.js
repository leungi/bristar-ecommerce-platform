// server/src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

const productsRoutes = require("./routes/productsRoute");

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// 如果前端和后端不同端口，本地需要允许带 cookie
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bristar-ecommerce-platform-mfoqwfdxq.vercel.app",
      "https://bristar-ecommerce-platform.vercel.app",
    ],
    credentials: true,
  }),
);

const adminAuthRoute = require("./routes/adminAuthRoute");
app.use("/api/admin/auth", adminAuthRoute);

const adminProductsRoute = require("./routes/adminProductsRoute");
app.use("/api/admin/products", adminProductsRoute);

const adminUsersRoute = require("./routes/adminUsersRoute");
app.use("/api/admin/users", adminUsersRoute);

app.use("/api/brands", require("./routes/brandsRoute"));

app.use("/api/admin/brands", require("./routes/adminBrandsRoute"));

const s3Route = require("./routes/s3Route");
app.use("/api/admin/s3", s3Route);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/products", productsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
    app.listen(PORT, "0.0.0.0", () => console.log(`Server running on ${PORT}`));
  } catch (e) {
    console.error("Failed to start server", e);
    process.exit(1);
  }
})();
