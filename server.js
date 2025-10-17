const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(express.json());

// --------- CORS CONFIGURATION (Updated Safe Version) ----------
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://hoverhouse-frontend-two.vercel.app" // your deployed frontend (no slash at end)
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    console.log(`✅ Accepted CORS origin: ${origin}`);
  } else if (origin) {
    console.log(`❌ Blocked CORS origin: ${origin}`);
  }

  // Allow headers & methods
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// --------- Connect to MongoDB ---------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("DB error:", err));

// --------- User Schema & Model ---------
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// --------- Property Schema & Model ---------
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  features: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  details: {
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    garages: { type: Number, default: 0 },
    livingRooms: { type: Number, default: 0 },
    kitchen: { type: String, default: "Standard kitchen" },
    floorSize: { type: String, default: "" },
    erfSize: { type: String, default: "" },
    yearBuilt: { type: Number, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

// explicitly use the 'properties' collection in Atlas
const Property = mongoose.model("Property", propertySchema, "properties");

// --------- Middleware to verify token ---------
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// --------- Auth Routes ---------
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashed });
    await newUser.save();

    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------- Property Routes ---------

// GET all properties (public)
app.get("/api/properties", async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET property by ID (public)
app.get("/api/properties/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property)
      return res.status(404).json({ message: "Property not found" });
    res.json(property);
  } catch (err) {
    console.error(err);
    // Handle invalid Mongoose ID format
    if (err.name === "CastError" && err.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Property not found (Invalid ID format)" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// POST new property (protected)
app.post("/api/properties", verifyToken, async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    await newProperty.save();
    res
      .status(201)
      .json({ message: "Property created", property: newProperty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update property (protected)
app.put("/api/properties/:id", verifyToken, async (req, res) => {
  try {
    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Property not found" });
    res.json({ message: "Property updated", property: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE property (protected)
app.delete("/api/properties/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Property.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Property not found" });
    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------- Start Server ---------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
