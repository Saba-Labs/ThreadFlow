import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";

interface AddSubItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentItemName: string;
  onSubmit: (name: string, quantity: number, lowStock: number) => void;
}

export default function AddSubItemModal({
  open,
  onOpenChange,
  parentItemName,
  onSubmit,
}: AddSubItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [lowStock, setLowStock] = useState(0);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name, quantity, lowStock);
    setName("");
    setQuantity(0);
    setLowStock(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setQuantity(0);
      setLowStock(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={handleOpenChange}
      title={`Add Sub-item to ${parentItemName}`}
      footer={
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Sub-item</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sub-item Name</label>
          <Input
            placeholder="Enter sub-item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Low Stock Value</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={lowStock}
              onChange={(e) => setLowStock(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </SimpleModal>
  );
}
