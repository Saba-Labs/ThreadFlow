import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, lowStock: number) => void;
}

export default function AddItemModal({
  open,
  onOpenChange,
  onSubmit,
}: AddItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [lowStock, setLowStock] = useState(0);

  const handleSubmit = () => {
    if (!itemName.trim()) return;
    onSubmit(itemName, lowStock);
    setItemName("");
    setLowStock(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setItemName("");
      setLowStock(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Add New Item"
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Item</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Item Name</label>
          <Input
            placeholder="Enter item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Low Stock Value</label>
          <Input
            type="number"
            placeholder="Enter low stock threshold"
            min="0"
            value={lowStock}
            onChange={(e) => setLowStock(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </SimpleModal>
  );
}
