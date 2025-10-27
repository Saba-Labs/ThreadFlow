import { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
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
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemLowStock, setNewItemLowStock] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [editingItemLowStock, setEditingItemLowStock] = useState(0);
  const [showAddSubItem, setShowAddSubItem] = useState<string | null>(null);
  const [newSubItemName, setNewSubItemName] = useState("");
  const [newSubItemQuantity, setNewSubItemQuantity] = useState(0);
  const [newSubItemLowStock, setNewSubItemLowStock] = useState(0);

  // Load data from storage
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const data = JSON.parse(result.value);
          setItems(data || []);
        }
      } catch (error) {
        console.log("No saved data found");
      }
    };
    loadData();
  }, []);

  // Save data to storage
  useEffect(() => {
    const saveData = async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save data:", error);
      }
    };
    if (items.length >= 0) {
      saveData();
    }
  }, [items]);

  const getStockStatus = (quantity: number, lowStock: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < lowStock) return "low-stock";
    return "normal";
  };

  const getItemStockStatus = (item: Item): string => {
    if (item.subItems.length > 0) {
      const allOutOfStock = item.subItems.every((sub) => sub.quantity === 0);
      if (allOutOfStock) return "out-of-stock";

      const anyLowStock = item.subItems.some((sub) => sub.quantity < sub.lowStock && sub.quantity > 0);
      if (anyLowStock) return "low-stock";

      return "normal";
    }
    return getStockStatus(item.quantity, item.lowStock);
  };

  const getStatusColor = (status: string) => {
    if (status === "out-of-stock") return "bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300";
    if (status === "low-stock") return "bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300";
    return "bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300";
  };

  const getStatusBadge = (status: string) => {
    if (status === "out-of-stock") return <span className="text-xs md:text-sm font-bold text-red-700 bg-red-200 px-3 py-1 rounded-full">OUT OF STOCK</span>;
    if (status === "low-stock") return <span className="text-xs md:text-sm font-bold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">LOW STOCK</span>;
    return <span className="text-xs md:text-sm font-bold text-emerald-700 bg-emerald-200 px-3 py-1 rounded-full">IN STOCK</span>;
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: 0,
      lowStock: newItemLowStock,
      subItems: [],
    };
    setItems([...items, newItem]);
    setNewItemName("");
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

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
      )
    );
  };

  const startEditItemDetails = (itemId: string, name: string, lowStock: number) => {
    setEditingItemId(itemId);
    setEditingItemName(name);
    setEditingItemLowStock(lowStock);
  };

  const saveEditItemDetails = (itemId: string) => {
    if (!editingItemName.trim()) return;
    setItems(
      items.map((item) =>
        item.id === itemId
          ? { ...item, name: editingItemName, lowStock: editingItemLowStock }
          : item
      )
    );
    setEditingItemId(null);
    setEditingItemName("");
    setEditingItemLowStock(0);
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

  const updateSubItemQuantity = (parentItemId: string, subItemId: string, newQuantity: number) => {
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? {
            ...item,
            subItems: item.subItems.map((s) =>
              s.id === subItemId ? { ...s, quantity: Math.max(0, newQuantity) } : s
            ),
          }
          : item
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ReStok
          </h1>
          <p className="text-slate-600 mt-2">Manage your inventory with ease</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap justify-center md:justify-start">
          <Button
            onClick={() => setShowAddItem(true)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all h-11 px-6"
          >
            <Plus className="h-5 w-5" />
            Add Item
          </Button>
          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? "default" : "outline"}
            className={`gap-2 h-11 px-6 transition-all ${editMode
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-md"
                : "border-2 hover:bg-slate-100"
              }`}
          >
            <Edit2 className="h-5 w-5" />
            {editMode ? "Done" : "Edit Mode"}
          </Button>
        </div>

        {/* Add Item Form */}
        {showAddItem && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 md:p-6 shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-slate-800">Add New Item</h2>
            <Input
              placeholder="Item name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addItem()}
              className="h-12 text-base border-2 focus:border-blue-500"
            />
            <Input
              type="number"
              placeholder="Low stock threshold"
              min="0"
              value={newItemLowStock}
              onChange={(e) => setNewItemLowStock(parseInt(e.target.value) || 0)}
              className="h-12 text-base border-2 focus:border-blue-500"
            />
            <div className="flex gap-3 pt-2">
              <Button
                onClick={addItem}
                className="flex-1 gap-2 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-base font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Item
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddItem(false);
                  setNewItemName("");
                  setNewItemLowStock(0);
                }}
                className="flex-1 h-12 border-2 text-base font-medium"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border-2 border-dashed rounded-2xl bg-white">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg font-medium">No items yet</p>
              <p className="text-sm mt-1">Add your first item to get started</p>
            </div>
          ) : (
            items.map((item) => {
              const status = getItemStockStatus(item);
              const isExpanded = expandedItems.has(item.id);

              return (
                <div key={item.id}>
                  <div className={`rounded-2xl p-4 md:p-5 shadow-md transition-all ${getStatusColor(status)}`}>
                    {editMode && editingItemId === item.id ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Item Name</label>
                          <Input
                            value={editingItemName}
                            onChange={(e) => setEditingItemName(e.target.value)}
                            className="h-12 text-base border-2"
                          />
                        </div>
                        {item.subItems.length === 0 && (
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Low Stock Threshold</label>
                            <Input
                              type="number"
                              min="0"
                              value={editingItemLowStock}
                              onChange={(e) => setEditingItemLowStock(parseInt(e.target.value) || 0)}
                              className="h-12 text-base border-2"
                            />
                          </div>
                        )}
                        {item.subItems.length > 0 && (
                          <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                            <p>Stock levels managed by sub-items</p>
                          </div>
                        )}
                        <div className="flex gap-3 pt-2">
                          <Button
                            size="sm"
                            onClick={() => saveEditItemDetails(item.id)}
                            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItemId(null)}
                            className="flex-1 h-11 border-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {item.subItems.length > 0 && (
                              <button
                                onClick={() => toggleItemExpanded(item.id)}
                                className="text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0 p-1 hover:bg-white/50 rounded-lg"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-6 w-6" />
                                ) : (
                                  <ChevronDown className="h-6 w-6" />
                                )}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base md:text-lg text-slate-800 truncate">{item.name}</p>
                              {editMode && item.subItems.length === 0 && (
                                <p className="text-xs md:text-sm text-slate-600 mt-1">Low Stock: {item.lowStock}</p>
                              )}
                            </div>
                          </div>

                          {editMode ? (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditItemDetails(item.id, item.name, item.lowStock)}
                                className="h-10 w-10 p-0 border-2"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {item.subItems.length === 0 && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                    className="h-10 w-10 p-0 text-xl font-bold border-2 hover:bg-red-50"
                                  >
                                    −
                                  </Button>
                                  <div className="w-14 text-center">
                                    <p className="font-bold text-lg">{item.quantity}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                    className="h-10 w-10 p-0 text-xl font-bold border-2 hover:bg-green-50"
                                  >
                                    +
                                  </Button>
                                </>
                              )}
                              {item.subItems.length > 0 && (
                                <div className="text-sm font-medium text-slate-600 bg-white/50 px-3 py-2 rounded-lg">
                                  {item.subItems.length} sub
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteItem(item.id)}
                                className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              {item.subItems.length === 0 && (
                                <p className="font-bold text-xl md:text-2xl text-slate-800">{item.quantity}</p>
                              )}
                              {getStatusBadge(status)}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Sub Items - Visible in both modes */}
                    {isExpanded && item.subItems.length > 0 && (
                      <div className="mt-4 space-y-3 border-t-2 pt-4 border-white/40">
                        {item.subItems.map((subItem) => {
                          return (
                            <div
                              key={subItem.id}
                              className="rounded-xl p-3 md:p-4 bg-white/70 backdrop-blur-sm shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3 ml-2 md:ml-6">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm md:text-base text-slate-800 truncate">
                                    {subItem.name}
                                  </p>
                                  {editMode && (
                                    <p className="text-xs md:text-sm text-slate-600 mt-1">
                                      Low: {subItem.lowStock}
                                    </p>
                                  )}
                                </div>

                                {editMode ? (
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateSubItemQuantity(
                                          item.id,
                                          subItem.id,
                                          subItem.quantity - 1
                                        )
                                      }
                                      className="h-9 w-9 p-0 text-lg font-bold border-2 hover:bg-red-50"
                                    >
                                      −
                                    </Button>
                                    <div className="w-12 text-center">
                                      <p className="font-bold text-base">
                                        {subItem.quantity}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateSubItemQuantity(
                                          item.id,
                                          subItem.id,
                                          subItem.quantity + 1
                                        )
                                      }
                                      className="h-9 w-9 p-0 text-lg font-bold border-2 hover:bg-green-50"
                                    >
                                      +
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        deleteSubItem(item.id, subItem.id)
                                      }
                                      className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-lg md:text-xl text-slate-800">
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
                          <div className="mt-4 border-t-2 pt-4 space-y-3 border-white/40">
                            <Input
                              placeholder="Sub-item name"
                              value={newSubItemName}
                              onChange={(e) => setNewSubItemName(e.target.value)}
                              className="h-12 text-base border-2"
                            />
                            <div className="flex gap-3">
                              <Input
                                type="number"
                                placeholder="Quantity"
                                min="0"
                                value={newSubItemQuantity}
                                onChange={(e) =>
                                  setNewSubItemQuantity(parseInt(e.target.value) || 0)
                                }
                                className="h-12 text-base border-2 flex-1"
                              />
                              <Input
                                type="number"
                                placeholder="Low stock"
                                min="0"
                                value={newSubItemLowStock}
                                onChange={(e) =>
                                  setNewSubItemLowStock(parseInt(e.target.value) || 0)
                                }
                                className="h-12 text-base border-2 flex-1"
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                size="sm"
                                onClick={() => addSubItem(item.id)}
                                className="flex-1 gap-2 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                              >
                                <Plus className="h-4 w-4" />
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowAddSubItem(null)}
                                className="flex-1 h-11 border-2"
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
                            className="mt-4 gap-2 w-full h-11 border-2 text-sm font-medium hover:bg-white/50"
                          >
                            <Plus className="h-4 w-4" />
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
    </div>
  );
}