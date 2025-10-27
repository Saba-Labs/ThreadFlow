import { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SubItem {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  lowStock: number;
  subItems: SubItem[];
}

const STORAGE_KEY = "restok_items";

export default function ReStok() {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: number }>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(0);
  const [newItemLowStock, setNewItemLowStock] = useState(0);
  const [showAddSubItem, setShowAddSubItem] = useState<string | null>(null);
  const [newSubItemName, setNewSubItemName] = useState("");
  const [newSubItemQuantity, setNewSubItemQuantity] = useState(0);
  const [newSubItemLowStock, setNewSubItemLowStock] = useState(0);

  // Load data from local storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setItems(data || []);
      } catch (error) {
        console.error("Failed to load data from storage:", error);
      }
    }
  }, []);

  // Save data to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const getStockStatus = (quantity: number, lowStock: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < lowStock) return "low-stock";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    if (status === "out-of-stock") return "bg-red-100 border border-red-300";
    if (status === "low-stock") return "bg-yellow-100 border border-yellow-300";
    return "bg-green-100 border border-green-300";
  };

  const getStatusBadge = (status: string) => {
    if (status === "out-of-stock") return <span className="text-xs font-bold text-red-700">OUT OF STOCK</span>;
    if (status === "low-stock") return <span className="text-xs font-bold text-yellow-700">LOW STOCK</span>;
    return <span className="text-xs font-bold text-green-700">NORMAL</span>;
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: newItemQuantity,
      lowStock: newItemLowStock,
      subItems: [],
    };
    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemQuantity(0);
    setNewItemLowStock(0);
    setShowAddItem(false);
  };

  const deleteItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const startEditItem = (itemId: string, currentQuantity: number) => {
    setEditingItem(itemId);
    setEditValues({ [itemId]: currentQuantity });
  };

  const saveEditItem = (itemId: string) => {
    const newQuantity = editValues[itemId];
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    setEditingItem(null);
    setEditValues({});
  };

  const addSubItem = (parentItemId: string) => {
    if (!newSubItemName.trim()) return;
    const newSubItem: SubItem = {
      id: Date.now().toString(),
      name: newSubItemName,
      quantity: newSubItemQuantity,
      lowStock: newSubItemLowStock,
    };
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? { ...item, subItems: [...item.subItems, newSubItem] }
          : item
      )
    );
    setNewSubItemName("");
    setNewSubItemQuantity(0);
    setNewSubItemLowStock(0);
    setShowAddSubItem(null);
  };

  const deleteSubItem = (parentItemId: string, subItemId: string) => {
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? {
              ...item,
              subItems: item.subItems.filter((s) => s.id !== subItemId),
            }
          : item
      )
    );
  };

  const startEditSubItem = (parentItemId: string, subItemId: string, currentQuantity: number) => {
    const editKey = `${parentItemId}-${subItemId}`;
    setEditingItem(editKey);
    setEditValues({ [editKey]: currentQuantity });
  };

  const saveEditSubItem = (parentItemId: string, subItemId: string) => {
    const editKey = `${parentItemId}-${subItemId}`;
    const newQuantity = editValues[editKey];
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? {
              ...item,
              subItems: item.subItems.map((s) =>
                s.id === subItemId ? { ...s, quantity: newQuantity } : s
              ),
            }
          : item
      )
    );
    setEditingItem(null);
    setEditValues({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ReStok</h1>
          <p className="text-muted-foreground">Manage your inventory items and stock levels</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowAddItem(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? "default" : "outline"}
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          {editMode ? "Done Editing" : "Edit"}
        </Button>
      </div>

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-card rounded-lg border p-4 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Add New Item</h2>
          <Input
            placeholder="Item name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addItem()}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Quantity"
              min="0"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 0)}
            />
            <Input
              type="number"
              placeholder="Low stock value"
              min="0"
              value={newItemLowStock}
              onChange={(e) => setNewItemLowStock(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={addItem} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddItem(false);
                setNewItemName("");
                setNewItemQuantity(0);
                setNewItemLowStock(0);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
            <p>No items yet. Add your first item to get started.</p>
          </div>
        ) : (
          items.map((item) => {
            const status = getStockStatus(item.quantity, item.lowStock);
            const isEditing = editingItem === item.id;
            const isExpanded = expandedItems.has(item.id);

            return (
              <div key={item.id}>
                <div className={`rounded-lg p-3 ${getStatusColor(status)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      {item.subItems.length > 0 && (
                        <button
                          onClick={() => toggleItemExpanded(item.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        {editMode && <p className="text-xs">Low Stock: {item.lowStock}</p>}
                      </div>
                    </div>

                    {editMode ? (
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              min="0"
                              value={editValues[item.id] || 0}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [item.id]: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-16 h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveEditItem(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem(null)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="text-right">
                              <p className="font-bold text-sm">{item.quantity}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditItem(item.id, item.quantity)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                              className="h-8 w-8 p-0 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold text-sm">{item.quantity}</p>
                          {getStatusBadge(status)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sub Items - Visible in both modes */}
                  {isExpanded && item.subItems.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {item.subItems.map((subItem) => {
                        const editKey = `${item.id}-${subItem.id}`;
                        const isEditingSub = editingItem === editKey;

                        return (
                          <div
                            key={subItem.id}
                            className="rounded-md p-2 bg-white/50"
                          >
                            <div className="flex items-center justify-between gap-2 ml-6">
                              <div className="flex-1">
                                <p className="font-medium text-xs">
                                  {subItem.name}
                                </p>
                                {editMode && (
                                  <p className="text-xs text-muted-foreground">
                                    Low: {subItem.lowStock}
                                  </p>
                                )}
                              </div>

                              {editMode ? (
                                isEditingSub ? (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={editValues[editKey] || 0}
                                      onChange={(e) =>
                                        setEditValues({
                                          ...editValues,
                                          [editKey]: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="w-16 h-7 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        saveEditSubItem(item.id, subItem.id)
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingItem(null)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <p className="font-bold text-xs">
                                        {subItem.quantity}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        startEditSubItem(
                                          item.id,
                                          subItem.id,
                                          subItem.quantity
                                        )
                                      }
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        deleteSubItem(item.id, subItem.id)
                                      }
                                      className="h-7 w-7 p-0 text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <div className="text-right">
                                  <p className="font-bold text-xs">
                                    {subItem.quantity}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Sub Item - Only in Edit Mode */}
                  {editMode && (
                    <>
                      {showAddSubItem === item.id ? (
                        <div className="mt-3 border-t pt-3 space-y-2">
                          <Input
                            placeholder="Sub-item name"
                            value={newSubItemName}
                            onChange={(e) => setNewSubItemName(e.target.value)}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Quantity"
                              min="0"
                              value={newSubItemQuantity}
                              onChange={(e) =>
                                setNewSubItemQuantity(parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              placeholder="Low stock"
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
                              onClick={() => addSubItem(item.id)}
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAddSubItem(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddSubItem(item.id)}
                          className="mt-2 gap-1 w-full text-xs"
                        >
                          <Plus className="h-3 w-3" />
                          Add Sub-item
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
