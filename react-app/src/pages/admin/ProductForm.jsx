import { useEffect, useMemo, useState } from "react";
import { adminProducts, adminS3, productsApi } from "../../services/adminApi";

const emptyProduct = {
  slug: "",
  code: "",
  category: "",
  isNewItem: false,
  imageKey: "",
  name: { en: "", zh: "" },
  desc: { en: "", zh: "" },
  imageUrl: "",
};

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function normalizeProduct(p) {
  const base = p || {};
  return {
    slug: base.slug || "",
    code: base.code || "",
    category: base.category || "",
    isNewItem: !!base.isNewItem,
    imageKey: base.imageKey || "",
    name: {
      en: base.name?.en || "",
      zh: base.name?.zh || "",
    },
    desc: {
      en: base.desc?.en || "",
      zh: base.desc?.zh || "",
    },
    imageUrl: base.imageUrl || "",
  };
}

export default function ProductForm({
  mode, // "create" | "edit"
  initialProduct,
  onCancel,
  onSaved,
}) {
  const [form, setForm] = useState(() =>
    mode === "edit" ? normalizeProduct(initialProduct) : emptyProduct,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    productsApi
      .categories()
      .then((res) => setCategories(res.categories || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (mode === "edit") setForm(normalizeProduct(initialProduct));
    else setForm(emptyProduct);
  }, [mode, initialProduct]);

  const title = useMemo(
    () => (mode === "edit" ? "Edit Product" : "Create Product"),
    [mode],
  );

  const update = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const validate = () => {
    if (!form.slug.trim()) return "Slug is required.";
    if (!form.category.trim()) return "Category is required.";
    if (!form.name.en.trim() && !form.name.zh.trim()) {
      return "At least one product name is required.";
    }
    return "";
  };

  const uploadToS3 = async (file) => {
    const presign = await adminS3.presignPut(
      file.name,
      file.type || "application/octet-stream",
    );

    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!putRes.ok) throw new Error("S3 upload failed");
    return { publicUrl: presign.publicUrl, key: presign.key };
  };

  const handlePickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErr("");
      setUploading(true);

      const oldKey = form.imageKey;
      const { publicUrl, key } = await uploadToS3(file);

      update("imageUrl", publicUrl);
      update("imageKey", key);

      if (oldKey) {
        try {
          await adminS3.deleteObject(oldKey);
        } catch (e2) {
          console.warn("Failed to delete old S3 object:", oldKey, e2?.message);
        }
      }
    } catch (e2) {
      console.error(e2);
      setErr("Upload failed. Please check S3 settings and permissions.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }

    try {
      setErr("");
      setSaving(true);

      // 1. If we are in "create" mode, check if the item already exists in the backend database
      let finalMode = mode;
      if (mode === "create") {
        try {
          // Attempt to find if the slug exists by querying the list or a single endpoint
          const checkRes = await adminProducts.list(form.slug);
          const exactMatch = checkRes?.products?.find((p) => p.slug === form.slug);
          
          if (exactMatch) {
            const confirmOverwrite = window.confirm(
              `A product with the slug "${form.slug}" already exists. Do you want to overwrite it?`
            );
            if (!confirmOverwrite) {
              setSaving(false);
              return; // Cancel execution if user changes their mind
            }
            finalMode = "edit"; // Switch logic to update/overwrite
          }
        } catch (e) {
          console.warn("Could not verify duplicate slug, proceeding with creation.", e);
        }
      }

      // 2. Route the save request to the correct API endpoint based on finalMode
      if (finalMode === "create") {
        await adminProducts.create(form);
      } else {
        await adminProducts.update(form.slug, form);
      }

      onSaved?.();
    } catch (e) {
      console.error(e);
      setErr("Save failed. Please check the console/network tab.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "create"
              ? "Add a new product to your catalog."
              : "Update product details and media."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={saving || uploading}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {/* Form */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Field label="Slug" required>
          <input
            value={form.slug}
            disabled
            placeholder="Auto-generated from Name (EN)"
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none"
          />
        </Field>

        <Field label="Code">
          <input
            value={form.code}
            onChange={(e) => update("code", e.target.value)}
            placeholder="e.g. AGTH101"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </Field>

        <Field label="Category" required>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="New Item">
          <label className="flex h-[42px] items-center gap-2 rounded-xl border border-gray-300 px-3">
            <input
              type="checkbox"
              checked={form.isNewItem}
              onChange={(e) => update("isNewItem", e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              {form.isNewItem ? "Yes" : "No"}
            </span>
          </label>
        </Field>

        <Field label="Name (EN)" required>
          <input
            value={form.name.en}
            onChange={(e) => {
              const val = e.target.value;

              setForm((prev) => ({
                ...prev,
                name: {
                  ...prev.name,
                  en: val,
                },
                ...(mode === "create" ? { slug: slugify(val) } : {}),
              }));
            }}
            placeholder="English product name"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </Field>

        <Field label="Name (ZH)">
          <input
            value={form.name.zh}
            onChange={(e) => update("name.zh", e.target.value)}
            placeholder="中文名称"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </Field>

        <Field label="Desc (EN)">
          <input
            value={form.desc.en}
            onChange={(e) => update("desc.en", e.target.value)}
            placeholder="e.g. 24can / 320ml"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </Field>

        <Field label="Desc (ZH)">
          <input
            value={form.desc.zh}
            onChange={(e) => update("desc.zh", e.target.value)}
            placeholder="例如：24罐 / 320毫升"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </Field>

        <Field label="Image URL">
          <input
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="S3 public URL"
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-gray-900"
          />
        </Field>

        <Field label="Image Key (S3)">
          <input
            value={form.imageKey}
            onChange={(e) => update("imageKey", e.target.value)}
            placeholder="products/..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none"
          />
        </Field>

        <div className="lg:col-span-2">
          <Field label="Upload Image to S3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePickFile}
                disabled={uploading}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-black disabled:opacity-60"
              />
              {uploading ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Uploading will automatically fill the Image URL and Image Key.
            </p>
          </Field>
        </div>
      </div>

      {/* Preview */}
      {form.imageUrl ? (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 text-sm font-medium text-gray-700">
            Image Preview
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex h-40 w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <img
                src={form.imageUrl}
                alt="preview"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Public URL
              </div>
              <div className="break-all rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                {form.imageUrl}
              </div>

              {form.imageKey ? (
                <>
                  <div className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Image Key
                  </div>
                  <div className="break-all rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
                    {form.imageKey}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}
