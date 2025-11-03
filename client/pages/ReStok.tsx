import { useState } from "react";
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AddItemModal from "@/components/modals/AddItemModal";
import EditItemModal from "@/components/modals/EditItemModal";
import { useReStok } from "@/context/ReStokContext";

export default function ReStok() {
  const {
    items,
    loading,
    addItem,
    deleteItem,
    updateItemQuantity,
    saveEditItemDetails,
    addSubItem,
    deleteSubItem,
    updateSubItemQuantity,
    updateSubItem,
    reorderItems,
    saveBulkEdits,
  } = useReStok();

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderDraftIds, setReorderDraftIds] = useState<string[] | null>(null);
  const [draftItems, setDraftItems] = useState<any[] | null>(null);
  const [originalItems, setOriginalItems] = useState<any[] | null>(null);

  // Add Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Edit Item Modal
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const getStockStatus = (quantity: number, lowStock: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < lowStock) return "low-stock";
    return "normal";
  };

  const getItemStockStatus = (item: any): string => {
    // If item has sub-items, determine status from sub-items using lowest-priority rule:
    // any out-of-stock => out-of-stock, else any low-stock => low-stock, else normal
    if (item.subItems.length > 0) {
      if (item.subItems.some((sub: any) => sub.quantity === 0))
        return "out-of-stock";
      if (item.subItems.some((sub: any) => sub.quantity < sub.lowStock))
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

  const moveItemUp = (index: number) => {
    if (index === 0) return;
    if (reorderMode && reorderDraftIds) {
      const ids = [...reorderDraftIds];
      [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
      setReorderDraftIds(ids);
      return;
    }
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];
    reorderItems(newItems.map((item) => item.id));
  };

  const moveItemDown = (index: number) => {
    const currentLength = reorderMode && reorderDraftIds ? reorderDraftIds.length : items.length;
    if (index === currentLength - 1) return;

    if (reorderMode && reorderDraftIds) {
      const ids = [...reorderDraftIds];
      [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
      setReorderDraftIds(ids);
      return;
    }

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [
      newItems[index + 1],
      newItems[index],
    ];
    reorderItems(newItems.map((item) => item.id));
  };

  const saveNewOrder = async () => {
    try {
      if (reorderDraftIds && reorderDraftIds.length > 0) {
        await reorderItems(reorderDraftIds);
      }
    } finally {
      setReorderMode(false);
      setReorderDraftIds(null);
    }
  };

  // Toggle edit mode and manage local drafts
  const toggleEditMode = async () => {
    if (!editMode) {
      const deep = (arr: any[]) =>
        arr.map((it) => ({ ...it, subItems: it.subItems.map((s: any) => ({ ...s })) }));
      setOriginalItems(deep(items));
      setDraftItems(deep(items));
      setEditMode(true);
      return;
    }

    if (!draftItems || !originalItems) {
      setEditMode(false);
      setDraftItems(null);
      setOriginalItems(null);
      return;
    }

    const origMap = new Map(originalItems.map((i) => [i.id, i]));
    const draftMap = new Map(draftItems.map((i) => [i.id, i]));

    const deletedIds = originalItems
      .filter((i) => !draftMap.has(i.id))
      .map((i) => i.id);

    const isEqual = (a: any, b: any) => {
      if (!a || !b) return false;
      if (
        a.name !== b.name ||
        String(a.note || "") !== String(b.note || "") ||
        Number(a.quantity) !== Number(b.quantity) ||
        Number(a.lowStock) !== Number(b.lowStock)
      )
        return false;
      if ((a.subItems?.length || 0) !== (b.subItems?.length || 0)) return false;
      for (let idx = 0; idx < (a.subItems?.length || 0); idx++) {
        const sa = a.subItems[idx];
        const sb = b.subItems[idx];
        if (
          sa.id !== sb.id ||
          sa.name !== sb.name ||
          Number(sa.quantity) !== Number(sb.quantity) ||
          Number(sa.lowStock ?? 0) !== Number(sb.lowStock ?? 0)
        )
          return false;
      }
      return true;
    };

    const editedItems = draftItems.filter((d) => {
      const o = origMap.get(d.id);
      return !o || !isEqual(d, o);
    });

    try {
      if (editedItems.length > 0 || deletedIds.length > 0) {
        await saveBulkEdits(editedItems as any, deletedIds);
      }
    } finally {
      setEditMode(false);
      setDraftItems(null);
      setOriginalItems(null);
    }
  };

  const getItem = (id: string) => (editMode && draftItems ? draftItems : items).find((item) => item.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-2">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              ReStok
            </h1>
          </div>
          <p className="text-gray-600 ml-0">
            Manage your inventory items and stock levels
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap pt-2">
        <Button
          onClick={() => setShowAddItemModal(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white rounded-lg px-6 py-2.5"
        >
          <Plus className="h-5 w-5" />
          Add Item
        </Button>
        <Button
          onClick={toggleEditMode}
          variant={editMode ? "default" : "outline"}
          className={`gap-2 font-semibold rounded-lg px-6 py-2.5 transition-all duration-200 ${
            editMode
              ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-lg hover:shadow-xl text-white"
              : "border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
          }`}
        >
          <Edit2 className="h-5 w-5" />
          {editMode ? "Done Editing" : "Edit"}
        </Button>
        {!editMode && (
          <>
            {!reorderMode ? (
              <Button
                onClick={() => {
                  setReorderDraftIds(items.map((i) => i.id));
                  setReorderMode(true);
                }}
                className="gap-2 border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg px-6 py-2.5 transition-all duration-200"
              >
                <ArrowUp className="h-5 w-5" />
                Reorder
              </Button>
            ) : (
              <Button
                onClick={saveNewOrder}
                className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-white rounded-lg px-6 py-2.5"
              >
                <ArrowDown className="h-5 w-5" />
                Done Reordering
              </Button>
            )}
          </>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
            <p>Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-card">
            <p>No items yet. Add your first item to get started.</p>
          </div>
        ) : (
          (
            reorderMode && reorderDraftIds
              ? reorderDraftIds
                  .map((id) => items.find((i) => i.id === id))
                  .filter(Boolean) as typeof items
              : editMode && draftItems
              ? (draftItems as typeof items)
              : items
          ).map((item, index, arr) => {
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
                      {reorderMode
                        ? null
                        : item.subItems.length > 0 && (
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

                    {reorderMode ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItemUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0 rounded-full shadow-sm"
                          aria-label="Move up"
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItemDown(index)}
                          disabled={index === (arr.length - 1)}
                          className="h-8 w-8 p-0 rounded-full shadow-sm"
                          aria-label="Move down"
                          title="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : editMode ? (
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
                              onClick={() => {
                                if (editMode && draftItems) {
                                  setDraftItems((prev) =>
                                    (prev || []).map((it) =>
                                      it.id === item.id
                                        ? { ...it, quantity: Math.max(0, it.quantity - 1) }
                                        : it,
                                    ),
                                  );
                                } else {
                                  updateItemQuantity(item.id, item.quantity - 1);
                                }
                              }}
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
                              onClick={() => {
                                if (editMode && draftItems) {
                                  setDraftItems((prev) =>
                                    (prev || []).map((it) =>
                                      it.id === item.id
                                        ? { ...it, quantity: it.quantity + 1 }
                                        : it,
                                    ),
                                  );
                                } else {
                                  updateItemQuantity(item.id, item.quantity + 1);
                                }
                              }}
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
                                    onClick={() => {
                                      if (editMode && draftItems) {
                                        setDraftItems((prev) =>
                                          (prev || []).map((it) =>
                                            it.id === item.id
                                              ? {
                                                  ...it,
                                                  subItems: it.subItems.map((s: any) =>
                                                    s.id === subItem.id
                                                      ? { ...s, quantity: Math.max(0, s.quantity - 1) }
                                                      : s,
                                                  ),
                                                }
                                              : it,
                                          ),
                                        );
                                      } else {
                                        updateSubItemQuantity(
                                          item.id,
                                          subItem.id,
                                          subItem.quantity - 1,
                                        );
                                      }
                                    }}
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
                                    onClick={() => {
                                      if (editMode && draftItems) {
                                        setDraftItems((prev) =>
                                          (prev || []).map((it) =>
                                            it.id === item.id
                                              ? {
                                                  ...it,
                                                  subItems: it.subItems.map((s: any) =>
                                                    s.id === subItem.id
                                                      ? { ...s, quantity: s.quantity + 1 }
                                                      : s,
                                                  ),
                                                }
                                              : it,
                                          ),
                                        );
                                      } else {
                                        updateSubItemQuantity(
                                          item.id,
                                          subItem.id,
                                          subItem.quantity + 1,
                                        );
                                      }
                                    }}
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
          onSubmit={(name, lowStock, note) => {
            if (editMode && draftItems) {
              setDraftItems((prev) =>
                (prev || []).map((it) =>
                  it.id === editingItemId ? { ...it, name, lowStock, note } : it,
                ),
              );
            } else {
              return saveEditItemDetails(editingItemId, name, lowStock, note);
            }
          }}
          onAddSubItem={async (name, lowStock) => {
            if (editMode && draftItems) {
              setDraftItems((prev) =>
                (prev || []).map((it) =>
                  it.id === editingItemId
                    ? {
                        ...it,
                        subItems: [
                          ...it.subItems,
                          {
                            id: Date.now().toString(),
                            name,
                            quantity: 0,
                            lowStock,
                          },
                        ],
                      }
                    : it,
                ),
              );
              return;
            }
            await addSubItem(editingItemId, name, lowStock);
          }}
          onUpdateSubItem={async (subItemId, name, lowStock) => {
            if (editMode && draftItems) {
              setDraftItems((prev) =>
                (prev || []).map((it) =>
                  it.id === editingItemId
                    ? {
                        ...it,
                        subItems: it.subItems.map((s: any) =>
                          s.id === subItemId ? { ...s, name, lowStock } : s,
                        ),
                      }
                    : it,
                ),
              );
              return;
            }
            await updateSubItem(editingItemId, subItemId, name, lowStock);
          }}
          onDeleteSubItem={async (subItemId) => {
            if (editMode && draftItems) {
              setDraftItems((prev) =>
                (prev || []).map((it) =>
                  it.id === editingItemId
                    ? {
                        ...it,
                        subItems: it.subItems.filter((s: any) => s.id !== subItemId),
                      }
                    : it,
                ),
              );
              return;
            }
            await deleteSubItem(editingItemId, subItemId);
          }}
          onDeleteItem={async () => {
            if (editMode && draftItems) {
              setDraftItems((prev) => (prev || []).filter((it) => it.id !== editingItemId));
            } else {
              await deleteItem(editingItemId);
            }
            setShowEditItemModal(false);
            setEditingItemId(null);
          }}
        />
      )}
    </div>
  );
}
