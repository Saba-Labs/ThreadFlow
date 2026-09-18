import { useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Trash2,
  Library as LibraryIcon,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useImageLibrary } from "@/context/ImageLibraryContext";

export default function LibraryPage() {
  const { images, addImage, renameImage, deleteImage } = useImageLibrary();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageToDelete = images.find((image) => image.id === deleteConfirmId);
  const filteredImages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return images;
    return images.filter((image) => image.name.toLowerCase().includes(query));
  }, [images, searchQuery]);

  const handleFiles = async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/") || file.size > 2 * 1024 * 1024)
      return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setIsSaving(true);
      try {
        await addImage(file.name, reader.result);
        setSearchQuery("");
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
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search images..."
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
      ) : filteredImages.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center text-sm text-slate-600">
          No images match your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <img
                src={image.imageData}
                alt={image.name}
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center gap-2 p-3">
                <Input
                  value={nameDrafts[image.id] ?? image.name}
                  aria-label={`Edit ${image.name}`}
                  onChange={(event) =>
                    setNameDrafts((drafts) => ({
                      ...drafts,
                      [image.id]: event.target.value,
                    }))
                  }
                  onBlur={(event) => {
                    const nextName = event.target.value.trim();
                    if (nextName && nextName !== image.name) {
                      void renameImage(image.id, nextName).catch((error) =>
                        console.error("Error renaming library image:", error),
                      );
                    } else {
                      setNameDrafts((drafts) => {
                        const nextDrafts = { ...drafts };
                        delete nextDrafts[image.id];
                        return nextDrafts;
                      });
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                    if (event.key === "Escape") {
                      setNameDrafts((drafts) => {
                        const nextDrafts = { ...drafts };
                        delete nextDrafts[image.id];
                        return nextDrafts;
                      });
                      event.currentTarget.blur();
                    }
                  }}
                  className="h-8 min-w-0 flex-1 border-0 px-0 text-sm font-medium text-slate-800 shadow-none focus-visible:ring-0"
                />
                <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${image.name}`}
                  title="Delete image"
                  onClick={() => setDeleteConfirmId(image.id)}
                  className="h-8 w-8 flex-shrink-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete library image?</AlertDialogTitle>
            <AlertDialogDescription>
              {imageToDelete
                ? `“${imageToDelete.name}” will be permanently removed from the library.`
                : "This image will be permanently removed from the library."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) void deleteImage(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
