import { useState, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddItemModal from "@/components/modals/AddItemModal";
import EditItemModal from "@/components/modals/EditItemModal";

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
  note?: string;
  subItems: SubItem[];
}

const STORAGE_KEY = "restok_items";

export default function ReStok() {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);

  // Add Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Edit Item Modal
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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

  const getItemStockStatus = (item: Item): string => {
    // If item has sub-items, determine status from sub-items using lowest-priority rule:
    // any out-of-stock => out-of-stock, else any low-stock => low-stock, else normal
    if (item.subItems.length > 0) {
      if (item.subItems.some((sub) => sub.quantity === 0)) return "out-of-stock";
      if (item.subItems.some((sub) => sub.quantity < sub.lowStock)) return "low-stock";
      return "normal";
    }
    // Otherwise use parent item's own values
    return getStockStatus(item.quantity, item.lowStock);
  };

  const getStatusColor = (status: string) => {
    if (status === "out-of-stock") return "bg-red-100 border border-red-300";
    if (status === "low-stock") return "bg-yellow-100 border border-yellow-300";
    return "bg-green-100 border border-green-300";
  };

  const getStatusBadge = (status: string) => {
    if (status === "out-of-stock")
      return (
        <span className="text-xs font-bold text-red-700">OUT OF STOCK</span>
      );
    if (status === "low-stock")
      return (
        <span className="text-xs font-bold text-yellow-700">LOW STOCK</span>
      );
    return <span className="text-xs font-bold text-green-700">NORMAL</span>;
  };

  const addItem = (
    name: string,
    lowStock: number,
    subItems: any[] = [],
    note: string = "",
  ) => {
    const newItem: Item = {
      id: Date.now().toString(),
      name,
      quantity: 0,
      lowStock,
      note,
      subItems: subItems.map((sub) => ({
        id: sub.id,
        name: sub.name,
        quantity: 0,
        lowStock: sub.lowStock,
      })),
    };
    setItems([...items, newItem]);
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
        item.id === itemId
          ? { ...item, quantity: Math.max(0, newQuantity) }
          : item,
      ),
    );
  };

  const saveEditItemDetails = (
    itemId: string,
    name: string,
    lowStock: number,
    note: string,
  ) => {
    setItems(
      items.map((item) =>
        item.id === itemId ? { ...item, name, lowStock, note } : item,
      ),
    );
    setEditingItemId(null);
    setShowEditItemModal(false);
  };

  const addSubItem = (parentItemId: string, name: string, lowStock: number) => {
    const newSubItem: SubItem = {
      id: Date.now().toString(),
      name,
      quantity: 0,
      lowStock,
    };
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? { ...item, subItems: [...item.subItems, newSubItem] }
          : item,
      ),
    );
  };

  const deleteSubItem = (parentItemId: string, subItemId: string) => {
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? {
              ...item,
              subItems: item.subItems.filter((s) => s.id !== subItemId),
            }
          : item,
      ),
    );
  };

  const updateSubItemQuantity = (
    parentItemId: string,
    subItemId: string,
    newQuantity: number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? {
              ...item,
              subItems: item.subItems.map((s) =>
                s.id === subItemId
                  ? { ...s, quantity: Math.max(0, newQuantity) }
                  : s,
              ),
            }
          : item,
      ),
    );
  };

  const updateSubItem = (
    parentItemId: string,
    subItemId: string,
    name: string,
    lowStock: number,
  ) => {
    setItems(
      items.map((item) =>
        item.id === parentItemId
          ? {
              ...item,
              subItems: item.subItems.map((s) =>
                s.id === subItemId ? { ...s, name, lowStock } : s,
              ),
            }
          : item,
      ),
    );
  };

  const getItem = (id: string) => items.find((item) => item.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ReStok</h1>
          <p className="text-muted-foreground">
            Manage your inventory items and stock levels
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowAddItemModal(true)} className="gap-2">
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

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
            <p>No items yet. Add your first item to get started.</p>
          </div>
        ) : (
          items.map((item) => {
            const status = getItemStockStatus(item);
            const isExpanded = expandedItems.has(item.id);

            return (
              <div key={item.id}>
                <div
                  className={`rounded-lg p-3 ${
                    item.subItems.length > 0 && isExpanded
                      ? "bg-blue-50 border border-blue-200"
                      : getStatusColor(status)
                  }`}
                >
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
                        {item.note && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {editMode ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setShowEditItemModal(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {item.subItems.length === 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity - 1)
                              }
                              className="h-8 w-8 p-0 text-lg font-bold"
                            >
                              −
                            </Button>
                            <div className="w-12 text-center">
                              <p className="font-bold text-sm">
                                {item.quantity}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateItemQuantity(item.id, item.quantity + 1)
                              }
                              className="h-8 w-8 p-0 text-lg font-bold"
                            >
                              +
                            </Button>
                          </>
                        )}
                        {item.subItems.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {item.subItems.length} sub-item
                            {item.subItems.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {item.subItems.length === 0 && (
                            <p className="font-bold text-sm">{item.quantity}</p>
                          )}
                          {getStatusBadge(status)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sub Items - Visible in both modes */}
                  {isExpanded && item.subItems.length > 0 && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {item.subItems.map((subItem) => {
                        return (
                          <div
                            key={subItem.id}
                            className={`rounded-md p-2 ${getStatusColor(
                              getStockStatus(subItem.quantity, subItem.lowStock),
                            )}`}
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
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateSubItemQuantity(
                                        item.id,
                                        subItem.id,
                                        subItem.quantity - 1,
                                      )
                                    }
                                    className="h-7 w-7 p-0 text-sm font-bold"
                                  >
                                    −
                                  </Button>
                                  <div className="w-10 text-center">
                                    <p className="font-bold text-xs">
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
                                        subItem.quantity + 1,
                                      )
                                    }
                                    className="h-7 w-7 p-0 text-sm font-bold"
                                  >
                                    +
                                  </Button>
                                </div>
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AddItemModal
        open={showAddItemModal}
        onOpenChange={setShowAddItemModal}
        onSubmit={addItem}
      />

      {editingItemId && (
        <EditItemModal
          open={showEditItemModal}
          onOpenChange={setShowEditItemModal}
          itemName={getItem(editingItemId)?.name || ""}
          lowStock={getItem(editingItemId)?.lowStock || 0}
          note={getItem(editingItemId)?.note || ""}
          subItems={getItem(editingItemId)?.subItems || []}
          hasSubItems={getItem(editingItemId)?.subItems.length || 0 > 0}
          onSubmit={(name, lowStock, note) =>
            saveEditItemDetails(editingItemId, name, lowStock, note)
          }
          onAddSubItem={(name, lowStock) =>
            addSubItem(editingItemId, name, lowStock)
          }
          onUpdateSubItem={(subItemId, name, lowStock) =>
            updateSubItem(editingItemId, subItemId, name, lowStock)
          }
          onDeleteSubItem={(subItemId) =>
            deleteSubItem(editingItemId, subItemId)
          }
          onDeleteItem={() => {
            deleteItem(editingItemId);
            setShowEditItemModal(false);
            setEditingItemId(null);
          }}
        />
      )}
    </div>
  );
}
