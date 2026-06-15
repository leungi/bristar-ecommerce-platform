import { useEffect, useState } from "react";
import { adminBrands, adminS3 } from "../../services/adminApi";

export default function AdminBrands() {
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    name: { en: "", zh: "" },
    imageUrl: "",
    imageKey: "",
    isMainBrand: false,
    order: 0,
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("create");
  const [editing, setEditing] = useState(null);

  const mainBrand = brands.find((brand) => brand.isMainBrand);
  const otherBrands = brands.filter((brand) => !brand.isMainBrand);

  const [oldImageKeyToDelete, setOldImageKeyToDelete] = useState("");

  const resetForm = () => {
    setForm({
      name: { en: "", zh: "" },
      imageUrl: "",
      imageKey: "",
      isMainBrand: false,
      order: 0,
      isActive: true,
    });
    setMode("create");
    setEditing(null);
    setOldImageKeyToDelete("");
  };

  async function loadBrands() {
    const data = await adminBrands.list();
    setBrands(data.brands || []);
  }

  useEffect(() => {
    loadBrands();
  }, []);

  const uploadToS3 = async (file) => {
    const presign = await adminS3.presignPut(
      file.name,
      file.type || "application/octet-stream",
      "brands",
    );

    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!putRes.ok) throw new Error("S3 upload failed");

    return {
      publicUrl: presign.publicUrl,
      key: presign.key,
    };
  };

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      if (mode === "create" && form.imageKey) {
        try {
          await adminS3.deleteObject(form.imageKey);
        } catch (deleteErr) {
          console.warn("Failed to delete previous temp image:", deleteErr);
        }
      }

      if (mode === "edit" && form.imageKey) {
        setOldImageKeyToDelete(form.imageKey);
      }

      const { publicUrl, key } = await uploadToS3(file);

      setForm((prev) => ({
        ...prev,
        imageUrl: publicUrl,
        imageKey: key,
      }));
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.en && !form.name.zh) {
      alert("Please enter a brand name.");
      return;
    }

    if (!form.imageUrl) {
      alert("Please upload a brand image.");
      return;
    }

    if (mode === "edit" && editing) {
      await adminBrands.update(editing._id, form);
      if (oldImageKeyToDelete) {
        try {
          await adminS3.deleteObject(oldImageKeyToDelete);
        } catch (deleteErr) {
          console.warn("Failed to delete old image after save:", deleteErr);
        }
      }
    } else {
      await adminBrands.create(form);
    }

    resetForm();
    await loadBrands();
  }

  async function handleDelete(id) {
    if (!confirm("Delete this brand?")) return;
    await adminBrands.remove(id);
    await loadBrands();
  }

  function handleEdit(brand) {
    setMode("edit");
    setEditing(brand);

    setForm({
      name: {
        en: brand.name?.en || "",
        zh: brand.name?.zh || "",
      },
      imageUrl: brand.imageUrl || "",
      imageKey: brand.imageKey || "",
      isMainBrand: !!brand.isMainBrand,
      order: brand.order || 0,
      isActive: brand.isActive !== false,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSetMain(brand) {
    await adminBrands.update(brand._id, {
      name: brand.name,
      imageUrl: brand.imageUrl,
      imageKey: brand.imageKey,
      isMainBrand: true,
      order: brand.order,
      isActive: brand.isActive,
    });

    await loadBrands();
  }

  const BrandCard = ({ brand }) => (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="h-48 bg-gray-50 flex items-center justify-center">
        {brand.imageUrl ? (
          <img
            src={brand.imageUrl}
            alt={brand.name?.en || "brand"}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-lg">
            {brand.name?.en || "Unnamed Brand"}
          </h3>

          {brand.isMainBrand && (
            <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-medium text-white">
              Main
            </span>
          )}
        </div>

        <p className="text-gray-500 mt-1">{brand.name?.zh || "—"}</p>

        <p className="text-sm text-gray-500 mt-3">Order: {brand.order}</p>

        <div className="mt-4 space-y-2">
          {!brand.isMainBrand && (
            <button
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              onClick={() => handleSetMain(brand)}
            >
              Set as Main
            </button>
          )}

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              onClick={() => handleEdit(brand)}
            >
              Edit
            </button>

            <button
              className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={() => handleDelete(brand._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Brands
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Create, edit, delete, and manage brand images for the storefront.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          {mode === "edit" ? "Edit Brand" : "Add Brand"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add a new brand logo and choose whether it is the main brand.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <input
              className="input input-bordered w-full"
              placeholder="Brand Name (EN)"
              value={form.name.en}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: { ...form.name, en: e.target.value },
                })
              }
            />

            <input
              className="input input-bordered w-full"
              placeholder="Brand Name (ZH)"
              value={form.name.zh}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: { ...form.name, zh: e.target.value },
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <input
              className="file-input file-input-bordered w-full"
              type="file"
              accept="image/*"
              onChange={handlePickFile}
            />

            <input
              className="input input-bordered w-full"
              type="number"
              placeholder="Display Order"
              value={form.order}
              onChange={(e) =>
                setForm({
                  ...form,
                  order: Number(e.target.value),
                })
              }
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="loading loading-spinner loading-sm" />
              Uploading image...
            </div>
          )}

          {form.imageUrl && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 w-48">
              <img
                src={form.imageUrl}
                alt="preview"
                className="h-32 w-full object-contain"
              />
            </div>
          )}

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              className="checkbox"
              checked={form.isMainBrand}
              onChange={(e) =>
                setForm({
                  ...form,
                  isMainBrand: e.target.checked,
                })
              }
            />
            <span>Set as Main Brand</span>
          </label>

          <div className="flex justify-end gap-3">
            {mode === "edit" && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50"
            >
              {mode === "edit" ? "Save Changes" : "+ Add Brand"}
            </button>
          </div>
        </form>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">Main Brand</h2>
          <p className="mt-1 text-sm text-gray-500">
            This brand is displayed at the top of the public Brands page.
          </p>
        </div>

        <div className="p-6">
          {mainBrand ? (
            <div className="max-w-md">
              <BrandCard brand={mainBrand} />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No main brand selected yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Existing Brands
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage your current brand catalog.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-4">
          {otherBrands.map((brand) => (
            <BrandCard key={brand._id} brand={brand} />
          ))}

          {otherBrands.length === 0 && (
            <p className="col-span-full text-sm text-gray-500">
              No other brands yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
