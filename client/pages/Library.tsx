import { useRef, useState } from "react";
import { ImagePlus, Trash2, Library as LibraryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImageLibrary } from "@/context/ImageLibraryContext";

export default function LibraryPage() {
  const { images, addImage, deleteImage } = useImageLibrary();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleFiles = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024)
      return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setIsSaving(true);
      try {
        await addImage(name.trim() || file.name, reader.result);
        setName("");
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <LibraryIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Library</h1>
              <p className="text-sm text-slate-600">
                Store reusable model images
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Image name (optional)"
            className="h-10 sm:w-56"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleFiles(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => inputRef.current?.click()}
            className="h-10 bg-blue-600 hover:bg-blue-700"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Add image
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-600">
          No images in your library yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <img
                src={image.imageData}
                alt={image.name}
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-sm font-medium text-slate-800">
                  {image.name}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${image.name}`}
                  title="Delete image"
                  onClick={() => void deleteImage(image.id)}
                  className="h-8 w-8 flex-shrink-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
