const Brand = require("../models/brand");

exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({
      isMainBrand: -1,
      order: 1,
      createdAt: 1,
    });

    res.json({ ok: true, brands });
  } catch (err) {
    next(err);
  }
};
