const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const Brand = require("../models/brand");

const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.listBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({
      isMainBrand: -1,
      order: 1,
      createdAt: 1,
    });

    res.json({ ok: true, brands });
  } catch (err) {
    next(err);
  }
};

exports.createBrand = async (req, res, next) => {
  try {
    const { name, imageUrl, imageKey, isMainBrand, order, isActive } = req.body;

    if (isMainBrand) {
      await Brand.updateMany({}, { isMainBrand: false });
    }

    const brand = await Brand.create({
      name: {
        en: name?.en || "",
        zh: name?.zh || "",
      },
      imageUrl: imageUrl || "",
      imageKey: imageKey || "",
      isMainBrand: !!isMainBrand,
      order: Number(order) || 0,
      isActive: isActive !== false,
    });

    res.status(201).json({ ok: true, brand });
  } catch (err) {
    next(err);
  }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const { name, imageUrl, imageKey, isMainBrand, order, isActive } = req.body;

    if (isMainBrand) {
      await Brand.updateMany(
        { _id: { $ne: req.params.id } },
        { isMainBrand: false },
      );
    }

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name: {
          en: name?.en || "",
          zh: name?.zh || "",
        },
        imageUrl: imageUrl || "",
        imageKey: imageKey || "",
        isMainBrand: !!isMainBrand,
        order: Number(order) || 0,
        isActive: isActive !== false,
      },
      { new: true },
    );

    if (!brand) return res.status(404).json({ error: "Brand not found" });

    res.json({ ok: true, brand });
  } catch (err) {
    next(err);
  }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    if (brand.imageKey) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: brand.imageKey,
          }),
        );
      } catch (s3Err) {
        console.warn("Failed to delete brand image from S3:", s3Err.message);
      }
    }

    await Brand.findByIdAndDelete(req.params.id);

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
