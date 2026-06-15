const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.getPresignedPutUrl = async (req, res, next) => {
  try {
    const { filename, contentType, folder = "products" } = req.body || {};
    if (!filename || !contentType)
      return res.status(400).json({ error: "Missing filename/contentType" });

    // A stable key
    const safeName = String(filename).replace(/[^\w.\-]+/g, "_");

    const key = `${folder}/${Date.now()}-${safeName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, publicUrl, key });
  } catch (e) {
    next(e);
  }
};

exports.deleteObject = async (req, res, next) => {
  try {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: "Missing key" });

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }),
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
