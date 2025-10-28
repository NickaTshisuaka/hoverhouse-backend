const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  // Store full image URL (Google Images or any external URL)
  image: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        // Validate that it's a proper URL
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/.test(v);
      },
      message: props => `${props.value} is not a valid image URL!`
    }
  },
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

module.exports = mongoose.model("Property", propertySchema, "properties");