import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";

interface SubItem {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
}

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  lowStock: number;
  note: string;
  subItems: SubItem[];
  hasSubItems: boolean;
  onSubmit: (name: string, lowStock: number, note: string) => void | Promise<void>;
  onAddSubItem: (name: string, lowStock: number) => void | Promise<void>;
  onUpdateSubItem: (subItemId: string, name: string, lowStock: number) => void | Promise<void>;
  onDeleteSubItem: (subItemId: string) => void | Promise<void>;
  onDeleteItem: () => void | Promise<void>;
}

export default function EditItemModal({
  open,
  onOpenChange,
  itemName,
  lowStock,
  note,
  subItems,
  hasSubItems,
  onSubmit,
  onAddSubItem,
  onUpdateSubItem,
  onDeleteSubItem,
  onDeleteItem,
}: EditItemModalProps) {
  const [editingName, setEditingName] = useState(itemName);
  const [editingLowStock, setEditingLowStock] = useState(lowStock);
  const [editingNote, setEditingNote] = useState(note);
  const [showAddSubItemForm, setShowAddSubItemForm] = useState(false);
  const [newSubItemName, setNewSubItemName] = useState("");
  const [newSubItemLowStock, setNewSubItemLowStock] = useState(0);
  const [editingSubItemId, setEditingSubItemId] = useState<string | null>(null);
  const [editingSubItem, setEditingSubItem] = useState<{
    name: string;
    lowStock: number;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setEditingName(itemName);
      setEditingLowStock(lowStock);
      setEditingNote(note);
      setShowAddSubItemForm(false);
      setNewSubItemName("");
      setNewSubItemLowStock(0);
      setEditingSubItemId(null);
      setEditingSubItem(null);
    }
  }, [open, itemName, lowStock, note]);

  const handleSubmitItem = async () => {
    if (!editingName.trim()) return;
    try {
      await onSubmit(editingName, editingLowStock, editingNote);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit:", error);
    }
  };

  const handleDeleteItem = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      await onDeleteItem();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleAddSubItem = async () => {
    if (!newSubItemName.trim()) return;
    try {
      await onAddSubItem(newSubItemName, newSubItemLowStock);
      setNewSubItemName("");
      setNewSubItemLowStock(0);
      setShowAddSubItemForm(false);
    } catch (error) {
      console.error("Failed to add sub-item:", error);
    }
  };

  const handleStartEditSubItem = (subItem: SubItem) => {
    setEditingSubItemId(subItem.id);
    setEditingSubItem({
      name: subItem.name,
      lowStock: subItem.lowStock,
    });
  };

  const handleSaveSubItem = async () => {
    if (!editingSubItem || !editingSubItemId || !editingSubItem.name.trim())
      return;
    try {
      await onUpdateSubItem(
        editingSubItemId,
        editingSubItem.name,
        editingSubItem.lowStock,
      );
      setEditingSubItemId(null);
      setEditingSubItem(null);
    } catch (error) {
      console.error("Failed to save sub-item:", error);
    }
  };

  const handleCancelEditSubItem = () => {
    setEditingSubItemId(null);
    setEditingSubItem(null);
  };

  const handleDeleteSubItem = async (subItemId: string) => {
    try {
      await onDeleteSubItem(subItemId);
    } catch (error) {
      console.error("Failed to delete sub-item:", error);
    }
  };

  return (
    <SimpleModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit Item — ${itemName}`}
      footer={
        <div className="flex items-center justify-between gap-2">
          <div>
            <Button
              variant="ghost"
              onClick={handleDeleteItem}
              className="gap-1 text-red-600 bg-white hover:bg-red-50 border"
            >
              <Trash2 className="h-3 w-3" />
              Delete Item
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitItem}>Save Changes</Button>
          </div>
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
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitItem()}
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
                onChange={(e) =>
                  setEditingLowStock(parseInt(e.target.value) || 0)
                }
              />
            </div>
          )}
          {hasSubItems && (
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <p>Low stock is determined by sub-items</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Note (Optional)</label>
            <Input
              placeholder="Add a note"
              value={editingNote}
              onChange={(e) => setEditingNote(e.target.value)}
            />
          </div>
        </div>

        {/* Sub-items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Sub-items ({subItems.length})
            </h3>
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
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30 space-y-2"
                >
                  {editingSubItemId === subItem.id && editingSubItem ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Sub-item Name
                        </label>
                        <Input
                          placeholder="Sub-item name"
                          value={editingSubItem.name}
                          onChange={(e) =>
                            setEditingSubItem({
                              ...editingSubItem,
                              name: e.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Low Stock Value
                        </label>
                        <Input
                          type="number"
                          placeholder="Low stock"
                          min="0"
                          value={editingSubItem.lowStock}
                          onChange={(e) =>
                            setEditingSubItem({
                              ...editingSubItem,
                              lowStock: parseInt(e.target.value) || 0,
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditSubItem}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveSubItem}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{subItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {subItem.quantity} | Low: {subItem.lowStock}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEditSubItem(subItem)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeleteSubItem(subItem.id)}
                            className="h-8 w-8 p-0 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {subItems.length === 0 && !showAddSubItemForm && (
            <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg bg-gray-50 dark:bg-gray-900/30">
              No sub-items yet
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
