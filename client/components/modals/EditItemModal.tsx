import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  lowStock: number;
  hasSubItems: boolean;
  onSubmit: (name: string, lowStock: number) => void;
}

export default function EditItemModal({
  open,
  onOpenChange,
  itemName,
  lowStock,
  hasSubItems,
  onSubmit,
}: EditItemModalProps) {
  const [editingName, setEditingName] = useState(itemName);
  const [editingLowStock, setEditingLowStock] = useState(lowStock);

  useEffect(() => {
    if (open) {
      setEditingName(itemName);
      setEditingLowStock(lowStock);
    }
  }, [open, itemName, lowStock]);

  const handleSubmit = () => {
    if (!editingName.trim()) return;
    onSubmit(editingName, editingLowStock);
    onOpenChange(false);
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Item"
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Item Name</label>
          <Input
            placeholder="Enter item name"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>
        {!hasSubItems && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Low Stock Value</label>
            <Input
              type="number"
              placeholder="Enter low stock threshold"
              min="0"
              value={editingLowStock}
              onChange={(e) => setEditingLowStock(parseInt(e.target.value) || 0)}
            />
          </div>
        )}
        {hasSubItems && (
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p>Low stock is determined by sub-items</p>
          </div>
        )}
      </div>
    </SimpleModal>
  );
}
