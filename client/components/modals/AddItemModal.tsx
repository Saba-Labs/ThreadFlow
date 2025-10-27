import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";

interface SubItem {
  id: string;
  name: string;
  lowStock: number;
}

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, lowStock: number, subItems: SubItem[]) => void;
}

export default function AddItemModal({
  open,
  onOpenChange,
  onSubmit,
}: AddItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [lowStock, setLowStock] = useState(0);
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [showAddSubItemForm, setShowAddSubItemForm] = useState(false);
  const [newSubItemName, setNewSubItemName] = useState("");
  const [newSubItemLowStock, setNewSubItemLowStock] = useState(0);

  const handleSubmit = () => {
    if (!itemName.trim()) return;
    onSubmit(itemName, lowStock, subItems);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setItemName("");
    setLowStock(0);
    setSubItems([]);
    setShowAddSubItemForm(false);
    setNewSubItemName("");
    setNewSubItemLowStock(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleAddSubItem = () => {
    if (!newSubItemName.trim()) return;
    const newSubItem: SubItem = {
      id: Date.now().toString(),
      name: newSubItemName,
      lowStock: newSubItemLowStock,
    };
    setSubItems([...subItems, newSubItem]);
    setNewSubItemName("");
    setNewSubItemLowStock(0);
    setShowAddSubItemForm(false);
  };

  const handleDeleteSubItem = (id: string) => {
    setSubItems(subItems.filter((item) => item.id !== id));
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={handleOpenChange}
      title="Add New Item"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!itemName.trim()}>
            Add Item
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Item Details Section */}
        <div className="space-y-4 pb-4 border-b">
          <h3 className="font-semibold text-sm">Item Details</h3>
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

        {/* Sub-items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Sub-items (Optional)</h3>
            {!showAddSubItemForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddSubItemForm(true)}
                className="gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )}
          </div>

          {/* Existing Sub-items List */}
          {subItems.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {subItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30 flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{subItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Low: {subItem.lowStock}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSubItem(subItem.id)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {subItems.length === 0 && !showAddSubItemForm && (
            <div className="text-center py-4 text-muted-foreground text-xs border rounded-lg bg-gray-50 dark:bg-gray-900/30">
              No sub-items added yet
            </div>
          )}

          {/* Add Sub-item Form */}
          {showAddSubItemForm && (
            <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3 bg-blue-50 dark:bg-blue-900/20">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sub-item Name</label>
                <Input
                  placeholder="Enter sub-item name"
                  value={newSubItemName}
                  onChange={(e) => setNewSubItemName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddSubItem()}
                  className="text-sm"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Low Stock Value</label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={newSubItemLowStock}
                  onChange={(e) =>
                    setNewSubItemLowStock(parseInt(e.target.value) || 0)
                  }
                  className="text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddSubItem}
                  disabled={!newSubItemName.trim()}
                  className="flex-1 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Sub-item
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddSubItemForm(false);
                    setNewSubItemName("");
                    setNewSubItemLowStock(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SimpleModal>
  );
}
