const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());

// --------- CORS CONFIGURATION ----------
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      
      // Allow localhost for development
      if (origin.includes("localhost")) {
        console.log("✅ Accepted localhost origin:", origin);
        return callback(null, true);
      }
      
      // Allow all Vercel deployments for your project
      if (origin.includes("hoverhouse-frontend") && origin.includes("vercel.app")) {
        console.log("✅ Accepted Vercel origin:", origin);
        return callback(null, true);
      }
      
      console.log("❌ Blocked CORS origin:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// --------- CONNECT TO MONGODB ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connection error:", err));

// --------- ROUTES ----------
const userRoutes = require("./routes/users");
const propertyRoutes = require("./routes/properties");

app.use("/api", userRoutes);
app.use("/api/properties", propertyRoutes);

// --------- START SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));