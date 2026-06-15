const express = require("express");
const router = express.Router();

const requireAdmin = require("../middlewares/requireAdmin");
const adminBrandsController = require("../controllers/adminBrandsController");

router.use(requireAdmin);

router.get("/", adminBrandsController.listBrands);
router.post("/", adminBrandsController.createBrand);
router.put("/:id", adminBrandsController.updateBrand);
router.delete("/:id", adminBrandsController.deleteBrand);

module.exports = router;
