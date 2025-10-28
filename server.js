const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());

// --------- CORS CONFIGURATION ----------
const allowedOrigins = [
  "http://localhost:5173",
  "https://hoverhouse-frontend-two.vercel.app",
  "https://hoverhouse-frontend-three.vercel.app",
  "https://hoverhouse-frontend-palu.vercel.app",
  "https://hoverhouse-frontend-palu.vercel.app/"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        console.log(" Accepted CORS origin:", origin);
        callback(null, true);
      } else {
        console.log(" Blocked CORS origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// --------- CONNECT TO MONGODB ----------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error("DB connection error:", err));

// --------- ROUTES ----------
const userRoutes = require("./routes/users");
const propertyRoutes = require("./routes/properties");

app.use("/api", userRoutes);
app.use("/api/properties", propertyRoutes);

// --------- START SERVER ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
