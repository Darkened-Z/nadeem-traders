import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { UploadCloud, Image as ImageIcon, X, RefreshCw, FolderOpen, Link as LinkIcon, Check, Loader2 } from "lucide-react";
import { Button, Modal, inputClass } from "./admin-ui";

// Standard store photography available in /products/
export const STORE_IMAGE_CATALOG: { name: string; path: string }[] = [
  { name: "Almonds (Badam)", path: "/products/almonds.jpg" },
  { name: "Cashews (Kaju)", path: "/products/cashews.jpg" },
  { name: "Roasted Cashews", path: "/products/kaju-roasted.jpg" },
  { name: "Pistachios (In-Shell)", path: "/products/pista.jpg" },
  { name: "Pistachio Kernels", path: "/products/pista-kernels.jpg" },
  { name: "Walnuts (In-Shell)", path: "/products/walnuts.jpg" },
  { name: "Walnut Kernels (Giri)", path: "/products/walnut-kernels.jpg" },
  { name: "Raisins (Kishmish)", path: "/products/kishmish.jpg" },
  { name: "Capped Cloves (Laung)", path: "/products/cloves-capped.jpg" },
  { name: "Uncapped Cloves (Laung)", path: "/products/cloves-uncapped.jpg" },
  { name: "Black Pepper (Kali Mirch)", path: "/products/black-pepper.jpg" },
  { name: "Black Pepper Powder", path: "/products/black-pepper-powder.jpg" },
  { name: "Whole Red Chilli (Sabut)", path: "/products/red-chilli.jpg" },
  { name: "Red Chilli Powder", path: "/products/red-chilli-powder.jpg" },
  { name: "Round Red Chilli (Gol Mirch)", path: "/products/gol-mirch.jpg" },
  { name: "Chilli Flakes (Dara Mirch)", path: "/products/chilli-flakes.jpg" },
  { name: "Turmeric Powder (Haldi)", path: "/products/haldi-powder.jpg" },
  { name: "Turmeric Whole Root (Ganth)", path: "/products/haldi-whole.jpg" },
  { name: "White Cumin (Zeera)", path: "/products/zeera.jpg" },
  { name: "Black Cumin (Kala Zeera)", path: "/products/zeera-black.jpg" },
  { name: "Garam Masala (Whole)", path: "/products/garam-masala.jpg" },
  { name: "Garam Masala (Powder)", path: "/products/garam-masala-powder.jpg" },
  { name: "Green Cardamom (Sabz Elaichi)", path: "/products/green-cardamom.jpg" },
  { name: "Black Cardamom (Bari Elaichi)", path: "/products/black-cardamom.jpg" },
  { name: "Fennel Seeds (Sonf)", path: "/products/sonf.jpg" },
  { name: "Black Seeds (Kalonji)", path: "/products/kalonji.jpg" },
  { name: "Chia Seeds (Tukhm-e-Sharbati)", path: "/products/chia-seeds.jpg" },
  { name: "Pumpkin Seeds", path: "/products/pumpkin-seeds.jpg" },
  { name: "Sunflower Seeds", path: "/products/sunflower-seeds.jpg" },
  { name: "Flax Seeds (Alsi)", path: "/products/flax-seeds.jpg" },
  { name: "Ispaghol Husk", path: "/products/ispaghol.jpg" },
  { name: "Oats (Jau)", path: "/products/oats.jpg" },
];

/**
 * Resizes and compresses any user-uploaded image client-side to a crisp WebP
 * (typically 30-55 KB), saving database space and guaranteeing instant loading.
 */
export async function optimizeImageFile(file: File, maxDim = 800, quality = 0.82): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const raw = reader.result as string;
          resolve({ dataUrl: raw, sizeKb: Math.round(file.size / 1024) });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
        } catch {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface AdminImageUploadProps {
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  help?: string;
}

export function AdminImageUploadField({
  value,
  onChange,
  label = "Product Image",
  help = "Drag and drop any photo from your phone or laptop. It will be automatically optimized to fast WebP.",
}: AdminImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (JPEG, PNG, WebP).");
      return;
    }
    setProcessing(true);
    try {
      const { dataUrl, sizeKb } = await optimizeImageFile(file);
      onChange(dataUrl);
      setSizeInfo(`Optimized: ${sizeKb} KB (WebP)`);
    } catch (err) {
      console.error("Image processing error:", err);
      alert("Failed to process image. Please try another file.");
    } finally {
      setProcessing(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const filteredCatalog = STORE_IMAGE_CATALOG.filter(
    (item) =>
      item.name.toLowerCase().includes(gallerySearch.toLowerCase()) ||
      item.path.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[13px] font-medium text-[#303030]">{label}</label>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="flex items-center gap-1 font-semibold text-[#005BD3] hover:underline"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Select from Library
          </button>
          <span className="text-[#8A8A8A]">·</span>
          <button
            type="button"
            onClick={() => setShowManualUrl((v) => !v)}
            className="flex items-center gap-1 text-[#616161] hover:text-[#303030] hover:underline"
          >
            <LinkIcon className="h-3.5 w-3.5" /> {showManualUrl ? "Hide URL" : "Paste URL"}
          </button>
        </div>
      </div>

      {/* Main Drag-and-Drop and Preview Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-all sm:p-6 ${
          isDragging
            ? "border-[#005BD3] bg-[#EBF4FE]"
            : value
              ? "border-[#E5E5E5] bg-white hover:border-[#8A8A8A]"
              : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#8A8A8A] hover:bg-[#F3F4F6]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileInputChange}
          className="hidden"
        />

        {processing ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#005BD3]" />
            <p className="mt-2 text-xs font-semibold text-[#303030]">Compressing &amp; Optimizing Image...</p>
            <p className="text-[11px] text-[#616161]">Resizing to high-speed WebP format</p>
          </div>
        ) : value ? (
          <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
            {/* Image Preview Thumbnail */}
            <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-[#F7F7F7] shadow-sm sm:w-36">
              <img
                src={value}
                alt="Product Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/LOGO.png";
                }}
              />
            </div>

            {/* Controls beside the preview */}
            <div className="flex flex-1 flex-col justify-center space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-xs font-semibold text-[#166534]">
                  <Check className="h-3 w-3" /> Image Loaded
                </span>
                {sizeInfo && (
                  <span className="rounded-md bg-[#F1F1F1] px-2 py-0.5 text-[11px] font-medium text-[#4A4A4A]">
                    {sizeInfo}
                  </span>
                )}
              </div>

              <p className="break-all text-[11px] text-[#8A8A8A]">
                {value.startsWith("data:") ? "Optimized Local Upload (Embedded WebP)" : value}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Replace Photo
                </Button>
                <Button
                  variant="critical"
                  onClick={() => {
                    onChange("");
                    setSizeInfo(null);
                  }}
                  className="text-xs"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer py-6 text-center"
          >
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/10">
              <UploadCloud className="h-6 w-6 text-[#005BD3]" />
            </div>
            <p className="text-sm font-semibold text-[#303030]">
              Click to upload <span className="font-normal text-[#616161]">or drag and drop photo</span>
            </p>
            <p className="mt-1 text-xs text-[#8A8A8A]">
              PNG, JPG, WebP, or Mobile Camera shots (auto-compressed to ~40 KB)
            </p>
          </div>
        )}
      </div>

      {/* Optional Manual URL / File Path Input */}
      {showManualUrl && (
        <div className="space-y-1 rounded-lg border border-[#E5E5E5] bg-white p-3 shadow-xs">
          <label className="block text-xs font-semibold text-[#616161]">Image URL or Relative Path:</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value || ""}
              onChange={(e) => {
                onChange(e.target.value);
                setSizeInfo(null);
              }}
              placeholder="/products/name.jpg or https://..."
              className={`${inputClass} text-xs`}
            />
          </div>
          <p className="text-[11px] text-[#8A8A8A]">
            You can type a static asset path (e.g. <code>/products/almonds.jpg</code>) or an external image link.
          </p>
        </div>
      )}

      {help && <p className="text-xs text-[#616161]">{help}</p>}

      {/* Library Selection Modal */}
      {showGallery && (
        <Modal
          title="Choose Photo from Existing Store Catalog"
          onClose={() => setShowGallery(false)}
          footer={
            <Button variant="secondary" onClick={() => setShowGallery(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search store images (e.g. Badam, Cloves, Zeera)..."
              value={gallerySearch}
              onChange={(e) => setGallerySearch(e.target.value)}
              className={`${inputClass} text-xs`}
              autoFocus
            />

            <div className="max-h-[380px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {filteredCatalog.map((item) => {
                  const isSelected = value === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        onChange(item.path);
                        setSizeInfo(null);
                        setShowGallery(false);
                      }}
                      className={`group relative flex flex-col items-center overflow-hidden rounded-lg border p-1.5 text-center transition-all ${
                        isSelected
                          ? "border-[#005BD3] bg-[#EBF4FE] ring-2 ring-[#005BD3]/30"
                          : "border-[#E5E5E5] bg-white hover:border-[#8A8A8A] hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden rounded bg-[#F7F7F7]">
                        <img
                          src={item.path}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <span className="mt-1.5 line-clamp-1 w-full text-[11px] font-medium text-[#303030]">
                        {item.name}
                      </span>
                      {isSelected && (
                        <div className="absolute right-2 top-2 rounded-full bg-[#005BD3] p-1 text-white shadow-xs">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {filteredCatalog.length === 0 && (
                <div className="py-8 text-center text-xs text-[#8A8A8A]">
                  No images found matching &ldquo;{gallerySearch}&rdquo;.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
