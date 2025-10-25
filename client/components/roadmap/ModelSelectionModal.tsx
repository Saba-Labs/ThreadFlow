import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkOrder } from "@/hooks/useProductionPipeline";
import { Search } from "lucide-react";

interface ModelSelectionModalProps {
  onSelect: (selectedIds: string[]) => void;
  onClose: () => void;
  allModels: WorkOrder[];
  excludeModelIds: string[];
}

export default function ModelSelectionModal({
  onSelect,
  onClose,
  allModels,
  excludeModelIds,
}: ModelSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableModels = useMemo(() => {
    return allModels.filter((model) => !excludeModelIds.includes(model.id));
  }, [allModels, excludeModelIds]);

  const filteredModels = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return availableModels.filter((model) =>
      model.modelName.toLowerCase().includes(query),
    );
  }, [availableModels, searchQuery]);

  const handleToggleModel = (modelId: string) => {
    setSelectedIds((prev) =>
      prev.includes(modelId)
        ? prev.filter((id) => id !== modelId)
        : [...prev, modelId],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredModels.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredModels.map((m) => m.id));
    }
  };

  const handleConfirm = () => {
    onSelect(selectedIds);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Models to Phase</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                filteredModels.length > 0 &&
                selectedIds.length === filteredModels.length
              }
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="cursor-pointer">
              Select All ({filteredModels.length})
            </Label>
          </div>

          <ScrollArea className="h-80 border rounded-md p-4">
            <div className="space-y-2">
              {filteredModels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery
                    ? "No models match your search"
                    : "No available models"}
                </p>
              ) : (
                filteredModels.map((model) => (
                  <div key={model.id} className="flex items-center gap-3 pb-2">
                    <Checkbox
                      id={model.id}
                      checked={selectedIds.includes(model.id)}
                      onCheckedChange={() => handleToggleModel(model.id)}
                    />
                    <Label
                      htmlFor={model.id}
                      className="cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <span className="font-medium">{model.modelName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({model.quantity} qty)
                      </span>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="text-sm text-muted-foreground">
            Selected: {selectedIds.length} model(s)
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
            Add Selected Models
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
