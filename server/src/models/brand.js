const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, trim: true, default: "" },
      zh: { type: String, trim: true, default: "" },
    },

    imageUrl: { type: String, default: "" },
    imageKey: { type: String, default: "" },

    isMainBrand: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Brand", brandSchema, "brands");
