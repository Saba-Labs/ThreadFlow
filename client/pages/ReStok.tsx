import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddItemModal from "@/components/modals/AddItemModal";
import EditItemModal from "@/components/modals/EditItemModal";
import { useSSESubscription } from "@/hooks/useSSESubscription";

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

export default function ReStok() {
  const [items, setItems] = useState<Item[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Edit Item Modal
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Define fetchItems before using it in useEffect and SSE subscription
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/restok/items");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to load items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data from API on mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Subscribe to real-time updates
  useSSESubscription((event) => {
    if (event.type === "restok_updated") {
      fetchItems();
    }
  });

  const getStockStatus = (quantity: number, lowStock: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < lowStock) return "low-stock";
    return "normal";
  };

  const getItemStockStatus = (item: Item): string => {
    // If item has sub-items, determine status from sub-items using lowest-priority rule:
    // any out-of-stock => out-of-stock, else any low-stock => low-stock, else normal
    if (item.subItems.length > 0) {
      if (item.subItems.some((sub) => sub.quantity === 0))
        return "out-of-stock";
      if (item.subItems.some((sub) => sub.quantity < sub.lowStock))
        return "low-stock";
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

  const addItem = async (
    name: string,
    lowStock: number,
    subItems: any[] = [],
    note: string = "",
  ) => {
    try {
      const id = Date.now().toString();
      const response = await fetch("/api/restok/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
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
        }),
      });
      if (!response.ok) throw new Error("Failed to create item");
      await fetchItems();
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/restok/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete item");
      setItems(items.filter((i) => i.id !== itemId));
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
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

  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const updatedQuantity = Math.max(0, newQuantity);
    try {
      const response = await fetch(`/api/restok/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          quantity: updatedQuantity,
          lowStock: item.lowStock,
          note: item.note,
          subItems: item.subItems,
        }),
      });
      if (!response.ok) throw new Error("Failed to update item");
      setItems(
        items.map((i) =>
          i.id === itemId ? { ...i, quantity: updatedQuantity } : i,
        ),
      );
    } catch (error) {
      console.error("Failed to update item quantity:", error);
    }
  };

  const saveEditItemDetails = async (
    itemId: string,
    name: string,
    lowStock: number,
    note: string,
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      const response = await fetch(`/api/restok/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          quantity: item.quantity,
          lowStock,
          note,
          subItems: item.subItems,
        }),
      });
      if (!response.ok) throw new Error("Failed to update item");
      setItems(
        items.map((i) =>
          i.id === itemId ? { ...i, name, lowStock, note } : i,
        ),
      );
      setEditingItemId(null);
      setShowEditItemModal(false);
    } catch (error) {
      console.error("Failed to update item details:", error);
    }
  };

  const addSubItem = async (
    parentItemId: string,
    name: string,
    lowStock: number,
  ) => {
    const item = items.find((i) => i.id === parentItemId);
    if (!item) return;

    const newSubItem: SubItem = {
      id: Date.now().toString(),
      name,
      quantity: 0,
      lowStock,
    };

    try {
      const response = await fetch(`/api/restok/items/${parentItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity,
          lowStock: item.lowStock,
          note: item.note,
          subItems: [...item.subItems, newSubItem],
        }),
      });
      if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error("Server error response:", errorData);
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          console.error("Could not parse error response as JSON:", parseError);
          try {
            const text = await response.text();
            if (text) {
              console.error("Server error text:", text);
              errorMsg = text;
            }
          } catch {
            // Could not parse error response
          }
        }
        console.error(`Failed to add sub-item. Status: ${response.status}, Message: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      setItems(
        items.map((i) =>
          i.id === parentItemId
            ? { ...i, subItems: [...i.subItems, newSubItem] }
            : i,
        ),
      );
    } catch (error) {
      console.error("Failed to add sub-item:", error);
      throw error;
    }
  };

  const deleteSubItem = async (parentItemId: string, subItemId: string) => {
    const item = items.find((i) => i.id === parentItemId);
    if (!item) return;

    try {
      const response = await fetch(`/api/restok/items/${parentItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity,
          lowStock: item.lowStock,
          note: item.note,
          subItems: item.subItems.filter((s) => s.id !== subItemId),
        }),
      });
      if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMsg);
      }
      setItems(
        items.map((i) =>
          i.id === parentItemId
            ? {
                ...i,
                subItems: i.subItems.filter((s) => s.id !== subItemId),
              }
            : i,
        ),
      );
    } catch (error) {
      console.error("Failed to delete sub-item:", error);
      throw error;
    }
  };

  const updateSubItemQuantity = async (
    parentItemId: string,
    subItemId: string,
    newQuantity: number,
  ) => {
    const item = items.find((i) => i.id === parentItemId);
    if (!item) return;

    const updatedQuantity = Math.max(0, newQuantity);
    try {
      const response = await fetch(`/api/restok/items/${parentItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity,
          lowStock: item.lowStock,
          note: item.note,
          subItems: item.subItems.map((s) =>
            s.id === subItemId ? { ...s, quantity: updatedQuantity } : s,
          ),
        }),
      });
      if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMsg);
      }
      setItems(
        items.map((i) =>
          i.id === parentItemId
            ? {
                ...i,
                subItems: i.subItems.map((s) =>
                  s.id === subItemId ? { ...s, quantity: updatedQuantity } : s,
                ),
              }
            : i,
        ),
      );
    } catch (error) {
      console.error("Failed to update sub-item quantity:", error);
      throw error;
    }
  };

  const updateSubItem = async (
    parentItemId: string,
    subItemId: string,
    name: string,
    lowStock: number,
  ) => {
    const item = items.find((i) => i.id === parentItemId);
    if (!item) return;

    try {
      const response = await fetch(`/api/restok/items/${parentItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity,
          lowStock: item.lowStock,
          note: item.note,
          subItems: item.subItems.map((s) =>
            s.id === subItemId ? { ...s, name, lowStock } : s,
          ),
        }),
      });
      if (!response.ok) {
        let errorMsg = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // Could not parse error response
        }
        throw new Error(errorMsg);
      }
      setItems(
        items.map((i) =>
          i.id === parentItemId
            ? {
                ...i,
                subItems: i.subItems.map((s) =>
                  s.id === subItemId ? { ...s, name, lowStock } : s,
                ),
              }
            : i,
        ),
      );
    } catch (error) {
      console.error("Failed to update sub-item:", error);
      throw error;
    }
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
                              getStockStatus(
                                subItem.quantity,
                                subItem.lowStock,
                              ),
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
          hasSubItems={(getItem(editingItemId)?.subItems.length || 0) > 0}
          onSubmit={(name, lowStock, note) =>
            saveEditItemDetails(editingItemId, name, lowStock, note)
          }
          onAddSubItem={async (name, lowStock) =>
            await addSubItem(editingItemId, name, lowStock)
          }
          onUpdateSubItem={async (subItemId, name, lowStock) =>
            await updateSubItem(editingItemId, subItemId, name, lowStock)
          }
          onDeleteSubItem={async (subItemId) =>
            await deleteSubItem(editingItemId, subItemId)
          }
          onDeleteItem={async () => {
            await deleteItem(editingItemId);
            setShowEditItemModal(false);
            setEditingItemId(null);
          }}
        />
      )}
    </div>
  );
}
