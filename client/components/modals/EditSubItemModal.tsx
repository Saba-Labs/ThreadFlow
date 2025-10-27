import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";

interface EditSubItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentItemName: string;
  subItemName: string;
  quantity: number;
  lowStock: number;
  onSubmit: (name: string, quantity: number, lowStock: number) => void;
}

export default function EditSubItemModal({
  open,
  onOpenChange,
  parentItemName,
  subItemName,
  quantity,
  lowStock,
  onSubmit,
}: EditSubItemModalProps) {
  const [editingName, setEditingName] = useState(subItemName);
  const [editingQuantity, setEditingQuantity] = useState(quantity);
  const [editingLowStock, setEditingLowStock] = useState(lowStock);

  useEffect(() => {
    if (open) {
      setEditingName(subItemName);
      setEditingQuantity(quantity);
      setEditingLowStock(lowStock);
    }
  }, [open, subItemName, quantity, lowStock]);

  const handleSubmit = () => {
    if (!editingName.trim()) return;
    onSubmit(editingName, editingQuantity, editingLowStock);
    onOpenChange(false);
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit Sub-item in ${parentItemName}`}
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sub-item Name</label>
          <Input
            placeholder="Enter sub-item name"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={editingQuantity}
              onChange={(e) =>
                setEditingQuantity(parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Low Stock Value</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={editingLowStock}
              onChange={(e) =>
                setEditingLowStock(parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>
    </SimpleModal>
  );
}
