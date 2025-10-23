import React, { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import { Checkbox } from "@/components/ui/checkbox";
import { useJobWorks } from "@/lib/jobWorks";
import {
  Scissors,
  SkipForward,
  SkipBack,
  Trash2,
  X,
  Pencil,
  CalendarDays,
  Plus,
} from "lucide-react";
import type { PathStep, WorkOrder } from "@/hooks/useProductionPipeline";
import { useMachineTypes, getMachineTypeConfig } from "@/lib/machineTypes";

interface ModelListProps {
  orders: WorkOrder[];
  onDelete: (id: string) => void;
  onNext: (id: string) => void;
  onPrev: (id: string) => void;
  onEditPath: (
    orderId: string,
    editor: (steps: PathStep[]) => PathStep[],
  ) => void;
  onSplit: (orderId: string, quantities: number[]) => void;
  onSetStepStatus: (
    orderId: string,
    stepIndex: number,
    status: "pending" | "running" | "hold" | "completed",
  ) => void;
  onToggleParallelMachine: (
    orderId: string,
    stepIndex: number,
    machineIndex: number,
  ) => void;
  setOrderJobWorks?: (orderId: string, ids: string[]) => void;
  showDetails?: boolean;
  viewMode?: "cards" | "list";
}

export default function ModelList(props: ModelListProps) {
  const machineTypes = useMachineTypes();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [splitForId, setSplitForId] = useState<string | null>(null);
  const [splitInputs, setSplitInputs] = useState<number[]>([0]);
  const jobWorks = useJobWorks();
  const [jwForId, setJwForId] = useState<string | null>(null);
  const [jwSelected, setJwSelected] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sorted = useMemo(
    () => props.orders.slice().sort((a, b) => b.createdAt - a.createdAt),
    [props.orders],
  );

  const editing = editingId
    ? sorted.find((o) => o.id === editingId) || null
    : null;
  const splitFor = splitForId
    ? sorted.find((o) => o.id === splitForId) || null
    : null;

  const [splitAnim, setSplitAnim] = useState<{
    parentId: string;
    at: number;
  } | null>(null);

  const handleSplit = async () => {
    if (!splitForId) return;
    const validQuantities = splitInputs
      .map((q) => Math.max(0, Math.floor(q)))
      .filter((q) => q > 0);
    if (validQuantities.length === 0) return;

    const parentId = splitForId!;
    const originalToggled = toggledIds.includes(parentId);
    let tempExpanded = false;
    let addedChildIds: string[] = [];

    // close modal immediately
    setSplitForId(null);
    setSplitInputs([0]);

    // If global details are hidden and the parent isn't toggled, temporarily expand it
    if (!showDetails && !originalToggled) {
      tempExpanded = true;
      setToggledIds((prev) => [...new Set([...prev, parentId])]);
      // wait for next paint so the DOM updates
      await new Promise((res) => requestAnimationFrame(res));
    }

    // FLIP with WAAPI: measure before (only visible elements)
    const allElsBefore = Array.from(
      document.querySelectorAll<HTMLElement>("[data-order-id]"),
    ) as HTMLElement[];
    const elsBefore = allElsBefore.filter((el) => el.offsetParent !== null);
    const rectsBefore = new Map<string, DOMRect>();
    elsBefore.forEach((el) => {
      const id = el.getAttribute("data-order-id");
      if (id) rectsBefore.set(id, el.getBoundingClientRect());
    });

    const sourceRect = rectsBefore.get(parentId) || null;

    // perform split (synchronous state update)
    props.onSplit(parentId, validQuantities);

    // next paint: detect new children, expand them (so they render for animation), then measure after and animate
    requestAnimationFrame(() => {
      const allElsAfter = Array.from(
        document.querySelectorAll<HTMLElement>("[data-order-id]"),
      ) as HTMLElement[];
      const elsAfter = allElsAfter.filter((el) => el.offsetParent !== null);

      // find new child IDs that weren't present before
      const newChildIds: string[] = [];
      elsAfter.forEach((el) => {
        const id = el.getAttribute("data-order-id");
        const p = el.getAttribute("data-parent-id");
        if (id && p === parentId && !rectsBefore.has(id)) {
          newChildIds.push(id);
        }
      });

      if (newChildIds.length > 0) {
        addedChildIds = newChildIds;
        setToggledIds((prev) => [...new Set([...prev, ...newChildIds])]);
        // wait another frame to ensure newly toggled children render
        requestAnimationFrame(() => runAnimation(rectsBefore, parentId));
      } else {
        runAnimation(rectsBefore, parentId);
      }
    });

    const runAnimation = (
      rectsBefore: Map<string, DOMRect>,
      parentId: string,
    ) => {
      const allElsAfter = Array.from(
        document.querySelectorAll<HTMLElement>("[data-order-id]"),
      ) as HTMLElement[];
      const elsAfter = allElsAfter.filter((el) => el.offsetParent !== null);

      // build a map of id -> all elements after
      const elsAfterById = new Map<string, HTMLElement[]>();
      elsAfter.forEach((el) => {
        const id = el.getAttribute("data-order-id");
        if (!id) return;
        const arr = elsAfterById.get(id) || [];
        arr.push(el);
        elsAfterById.set(id, arr);
      });

      const DURATION = 1200;
      const EASING = "cubic-bezier(.2,.9,.3,1)";

      const animations: Animation[] = [];

      // Only animate elements belonging to the affected parentId (parent row + its new children)
      const elsToAnimate = elsAfter.filter((el) => {
        const id = el.getAttribute("data-order-id");
        const p = el.getAttribute("data-parent-id");
        return id === parentId || p === parentId;
      });

      elsToAnimate.forEach((el) => {
        const id = el.getAttribute("data-order-id")!;
        const beforeRect =
          rectsBefore.get(id) || rectsBefore.get(parentId) || sourceRect;
        if (!beforeRect) return;
        const afterRect = el.getBoundingClientRect();

        const dx = beforeRect.left - afterRect.left;
        const dy = beforeRect.top - afterRect.top;
        const sx = beforeRect.width / afterRect.width;
        const sy = beforeRect.height / afterRect.height;

        const from = {
          transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,
          opacity: 0.85,
        };
        const to = { transform: "none", opacity: 1 };

        try {
          const anim = el.animate([from, to], {
            duration: DURATION,
            easing: EASING,
            fill: "both",
          });
          animations.push(anim);
        } catch (e) {
          el.style.transition = `transform ${DURATION}ms ${EASING}, opacity ${Math.min(600, DURATION)}ms linear`;
          el.style.transform = from.transform;
          el.style.opacity = String(from.opacity);
          requestAnimationFrame(() => {
            el.style.transform = "";
            el.style.opacity = "";
          });
        }
      });

      // when all animations finish, ensure cleanup and revert any temporary toggles
      const cleanup = () => {
        elsToAnimate.forEach((el) => {
          el.style.transition = "";
          el.style.transform = "";
          el.style.opacity = "";
        });

        // Only revert toggles if we temporarily expanded the parent for animation.
        // If the parent was already toggled open by the user, keep parent and new children toggled.
        if (tempExpanded) {
          setToggledIds((prev) =>
            prev.filter((id) => id !== parentId && !addedChildIds.includes(id)),
          );
        }
      };

      if (animations.length > 0) {
        Promise.all(animations.map((a) => a.finished))
          .then(cleanup)
          .catch(cleanup);
      } else {
        // fallback cleanup after duration
        setTimeout(cleanup, DURATION + 100);
      }
    };
  };

  const handleRemoveBatch = (index: number) => {
    setSplitInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = String(d.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  };
  const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  const getPathLetterPills = (
    o: WorkOrder,
    onPillClick?: (orderId: string, stepIndex: number) => void,
  ) => {
    const currentIdx = o.currentStepIndex;
    const currentStep = o.steps[currentIdx];
    const isCurrentRunning =
      currentIdx >= 0 &&
      currentIdx < o.steps.length &&
      currentStep?.status === "running";
    const currentGroup = (o.parallelGroups || []).find(
      (g) => g.stepIndex === currentIdx,
    );
    const selectedIndices = currentGroup?.machineIndices || [];

    return o.steps.map((step, idx) => {
      const machineType =
        step.kind === "machine" ? step.machineType : "Job Work";
      const config = getMachineTypeConfig(machineType || "");
      const letter =
        config?.letter || machineType?.charAt(0).toUpperCase() || "?";
      const isCurrent = idx === currentIdx;
      const isCompleted = step.status === "completed";

      const machineIndex = machineTypes.findIndex(
        (m) => m.name === machineType,
      );
      const isSelectedInCurrent = selectedIndices.includes(machineIndex);

      let variantClass =
        "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
      if (isCurrent) {
        if (step.status === "running") {
          // Use a dark pill with white text for running steps (matches status badge style)
          variantClass = "bg-green-700 text-white dark:bg-green-600";
        } else if (step.status === "hold") {
          // Dark red pill with white text for hold
          variantClass = "bg-red-600 text-white dark:bg-red-500";
        }
      } else if (isCompleted) {
        variantClass =
          "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 line-through";
      }

      if (isSelectedInCurrent) {
        // Selected for parallel: use the same dark green pill (no outer ring)
        variantClass = "bg-green-700 text-white dark:bg-green-600";
      }

      const isClickable = isCurrentRunning && machineIndex >= 0;

      return (
        <span
          key={step.id}
          className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-medium ${variantClass} ${
            isClickable
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }`}
          title={`${machineType}${
            isClickable
              ? isSelectedInCurrent
                ? " (click to deselect)"
                : " (click to select for parallel)"
              : ""
          }`}
          onClick={() => {
            if (isClickable && onPillClick) onPillClick(o.id, idx);
          }}
        >
          {letter}
        </span>
      );
    });
  };

  const statusBgClass = (o: WorkOrder) => {
    const i = o.currentStepIndex;
    if (i < 0 || i >= o.steps.length) {
      // completed
      return "bg-green-50 dark:bg-green-900/20";
    }
    const st = o.steps[i];
    if (st.status === "hold") return "bg-red-50 dark:bg-red-900/20";
    if (st.status === "running") {
      const hasJW = ((o as any).jobWorkIds || []).length > 0;
      return hasJW
        ? "bg-purple-50 dark:bg-purple-900/20"
        : "bg-green-50 dark:bg-green-900/20";
    }
    return "";
  };

  const toggleCardStatus = (o: WorkOrder) => {
    const i = o.currentStepIndex;
    if (i < 0 || i >= o.steps.length) return;
    const st = o.steps[i];
    const newStatus = st.status === "running" ? "hold" : "running";
    props.onSetStepStatus(o.id, i, newStatus);
  };

  const isMobile = useIsMobile();
  const showDetails = (isMobile ? (props.showDetails ?? true) : true);
  const emptyColSpan = showDetails ? 7 : 2;

  const [toggledIds, setToggledIds] = useState<string[]>([]);

  // When 'showDetails' toggles, control which rows are expanded.
  // If details are shown we expand all rows by default, but still allow
  // the user to toggle individual cards. If details are hidden we collapse all.
  const prevShowRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const prev = prevShowRef.current;
    // First render or when showDetails toggles
    if (prev === undefined || prev !== showDetails) {
      if (showDetails) {
        // Show details => expand all
        setToggledIds(sorted.map((o) => o.id));
      } else {
        // Hide details => collapse all
        setToggledIds([]);
      }
    } else {
      // showDetails unchanged; preserve user toggles across data updates
      // but remove IDs that no longer exist
      setToggledIds((prevIds) => prevIds.filter((id) => sorted.some((o) => o.id === id)));
    }

    prevShowRef.current = showDetails;
  }, [showDetails, sorted]);

  const toggleExpanded = (id: string) => {
    // Disable toggling only when desktop forces showDetails. On mobile
    // allow toggling even when showDetails is true (eye open).
    if (!isMobile && showDetails) return;

    setToggledIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen">
      <div className="px-0">
        <div className="space-y-3">
          {/* Desktop table */}
          <div className="hidden lg:block rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    {showDetails && (
                      <th
                        className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                        style={{ width: "80px" }}
                      >
                        Date
                      </th>
                    )}
                    <th
                      className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                      style={{ width: "120px" }}
                    >
                      Model
                    </th>
                    {showDetails && (
                      <th
                        className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                        style={{ width: "60px" }}
                      >
                        Qty
                      </th>
                    )}
                    {showDetails && (
                      <th
                        className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                        style={{ width: "240px" }}
                      >
                        Path
                      </th>
                    )}
                    <th
                      className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                      style={{ width: "120px" }}
                    >
                      Current
                    </th>
                    {showDetails && (
                      <>
                        <th
                          className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                          style={{ width: "120px" }}
                        >
                          Status
                        </th>
                        <th
                          className="p-3 text-left font-medium text-gray-900 dark:text-gray-100"
                          style={{ width: "140px" }}
                        >
                          Actions
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((o) => {
                    const i = o.currentStepIndex;
                    const step = o.steps[i];
                    const bg = statusBgClass(o);
                    const isExpanded = toggledIds.includes(o.id);
                    return (
                      <Fragment key={o.id}>
                        <tr
                          data-order-id={o.id}
                          data-parent-id={o.parentId ?? ""}
                          className={`${bg} border-t border-gray-200 dark:border-gray-800`}
                        >
                          {showDetails && (
                            <td
                              className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap"
                              style={{ width: "80px" }}
                            >
                              {formatDate(o.createdAt)}
                            </td>
                          )}
                          <td
                            className="p-3 font-medium text-gray-900 dark:text-gray-100"
                            style={{ width: "120px" }}
                          >
                            <div className="text-left break-words whitespace-normal">
                              {o.modelName}{" "}
                              {!showDetails && o.quantity > 0 && (
                                <span className="text-muted-foreground">
                                  ({o.quantity})
                                </span>
                              )}
                            </div>
                          </td>
                          {showDetails && (
                            <td
                              className="p-3 text-gray-700 dark:text-gray-300"
                              style={{ width: "60px" }}
                            >
                              {o.quantity > 0 ? o.quantity : ""}
                            </td>
                          )}
                          {showDetails && (
                            <td className="p-3" style={{ width: "240px" }}>
                              <div className="flex flex-wrap items-center gap-1">
                                {getPathLetterPills(o, (orderId, stepIdx) => {
                                  const stepAtIdx = o.steps[stepIdx];
                                  if (
                                    stepAtIdx.kind === "machine" &&
                                    stepAtIdx.machineType
                                  ) {
                                    const machineIndex = machineTypes.findIndex(
                                      (m) => m.name === stepAtIdx.machineType,
                                    );
                                    if (machineIndex >= 0) {
                                      props.onToggleParallelMachine(
                                        orderId,
                                        o.currentStepIndex,
                                        machineIndex,
                                      );
                                    }
                                  }
                                })}
                              </div>
                            </td>
                          )}
                          <td
                            className="p-3 text-gray-700 dark:text-gray-300"
                            style={{ width: "120px" }}
                          >
                            {i < 0
                              ? "Not started"
                              : i >= o.steps.length
                                ? "Completed"
                                : (() => {
                                    const primaryMachine =
                                      step.kind === "machine"
                                        ? step.machineType
                                        : "Job Work";
                                    const parallelGroup = (
                                      o.parallelGroups || []
                                    ).find((g) => g.stepIndex === i);
                                    const selectedIndices =
                                      parallelGroup?.machineIndices || [];

                                    if (selectedIndices.length === 0) {
                                      return primaryMachine;
                                    }

                                    const selectedMachines = selectedIndices
                                      .map((idx) => machineTypes[idx]?.name)
                                      .filter(
                                        (name) =>
                                          !!name && name !== primaryMachine,
                                      );
                                    return (
                                      <div className="flex flex-col gap-0.5">
                                        <div className="font-medium">
                                          {primaryMachine}
                                        </div>
                                        {selectedMachines.map((machine) => (
                                          <div
                                            key={machine}
                                            className="text-sm font-medium text-gray-900 dark:text-gray-100"
                                          >
                                            {machine}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                          </td>
                          {showDetails && (
                            <td className="p-3" style={{ width: "120px" }}>
                              {i < 0 || i >= o.steps.length ? (
                                <Badge variant="secondary">—</Badge>
                              ) : (
                                (() => {
                                  const displayStatus =
                                    step.status === "pending"
                                      ? "hold"
                                      : step.status;
                                  return (
                                    <>
                                      <button
                                        onClick={() => toggleCardStatus(o)}
                                      >
                                        <Badge
                                          variant={
                                            displayStatus === "running"
                                              ? "success"
                                              : displayStatus === "hold"
                                                ? "destructive"
                                                : "secondary"
                                          }
                                          className="cursor-pointer whitespace-nowrap"
                                          aria-label={`Set status for ${o.modelName}`}
                                        >
                                          {cap(displayStatus)}
                                        </Badge>
                                      </button>
                                      {((o as any).jobWorkIds || []).length >
                                        0 && (
                                        <div className="mt-1">
                                          {jobWorks
                                            .filter((j) =>
                                              (
                                                ((o as any).jobWorkIds ||
                                                  []) as string[]
                                              ).includes(j.id),
                                            )
                                            .map((j) => (
                                              <div
                                                key={j.id}
                                                className="text-xs text-muted-foreground"
                                              >
                                                {j.name}
                                              </div>
                                            ))}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()
                              )}
                            </td>
                          )}
                          {showDetails && (
                            <td className="p-3" style={{ width: "140px" }}>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    navigate(`/models/${o.id}/edit`)
                                  }
                                  title="Details"
                                  aria-label="Details"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant={
                                    ((o as any).jobWorkIds || []).length > 0
                                      ? "default"
                                      : "ghost"
                                  }
                                  onClick={() => {
                                    setJwForId(o.id);
                                    setJwSelected(
                                      ((o as any).jobWorkIds || []) as string[],
                                    );
                                  }}
                                  title="Job Work"
                                  aria-label="Job Work"
                                >
                                  JW
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => props.onPrev(o.id)}
                                  title="Previous step"
                                  aria-label="Previous step"
                                >
                                  <SkipBack className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  onClick={() => props.onNext(o.id)}
                                  title="Next step"
                                  aria-label="Next step"
                                >
                                  <SkipForward className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSplitForId(o.id);
                                    setSplitInputs([0]);
                                  }}
                                  title="Split into batches"
                                  aria-label="Split into batches"
                                >
                                  <Scissors className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteConfirmId(o.id)}
                                  title="Delete"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                        {isMobile && toggledIds.includes(o.id) && (
                          <tr>
                            <td colSpan={emptyColSpan} className="p-2">
                              <div className="overflow-hidden transition-all duration-200 bg-muted/20 p-2 rounded-sm">
                                <div className="flex flex-col gap-2">
                                  <div className="text-sm text-muted-foreground">
                                    Date: {formatDate(o.createdAt)}
                                  </div>
                                  {o.quantity > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                      Qty: {o.quantity}
                                    </div>
                                  )}
                                  <div className="flex flex-wrap items-center gap-1">
                                    {getPathLetterPills(o)}
                                  </div>
                                  <div className="mt-2">
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        navigate(`/models/${o.id}/edit`)
                                      }
                                    >
                                      Open
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={emptyColSpan}
                        className="p-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        No models yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {sorted.map((o) => {
              const i = o.currentStepIndex;
              const step = o.steps[i];
              const bg = statusBgClass(o);
              const isExpandedMobile = toggledIds.includes(o.id);
              return (
                <div
                  key={o.id}
                  data-order-id={o.id}
                  data-parent-id={o.parentId ?? ""}
                  className={`${bg} rounded-sm border border-gray-200 dark:border-gray-800 py-2 px-3 space-y-1 w-full ${bg ? "" : "bg-white dark:bg-gray-900"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                        <button
                          onClick={() => toggleExpanded(o.id)}
                          disabled={!isMobile && showDetails}
                          className={`text-left w-full truncate ${!isMobile && showDetails ? 'opacity-60 cursor-default' : ''}`}
                        >
                          {o.modelName}{" "}
                          {o.quantity > 0 && (
                            <span className="text-muted-foreground">
                              ({o.quantity})
                            </span>
                          )}
                        </button>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                        {isExpandedMobile && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />{" "}
                            {formatDate(o.createdAt)}
                          </span>
                        )}
                      </div>
                      {isExpandedMobile && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {getPathLetterPills(o, (orderId, stepIdx) => {
                            const stepAtIdx = o.steps[stepIdx];
                            if (
                              stepAtIdx.kind === "machine" &&
                              stepAtIdx.machineType
                            ) {
                              const machineIndex = machineTypes.findIndex(
                                (m) => m.name === stepAtIdx.machineType,
                              );
                              if (machineIndex >= 0) {
                                props.onToggleParallelMachine(
                                  orderId,
                                  o.currentStepIndex,
                                  machineIndex,
                                );
                              }
                            }
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {i >= 0 &&
                        i < o.steps.length &&
                        (() => {
                          const displayStatus =
                            step.status === "pending" ? "hold" : step.status;
                          return (
                            <>
                              <div className="text-sm text-right">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {i < 0
                                    ? "Not started"
                                    : i >= o.steps.length
                                      ? "Completed"
                                      : step.kind === "machine"
                                        ? step.machineType
                                        : "Job Work"}
                                </span>
                              </div>

                              {(() => {
                                const parallelGroup = (
                                  o.parallelGroups || []
                                ).find((g) => g.stepIndex === i);
                                const selectedIndices =
                                  parallelGroup?.machineIndices || [];
                                const primaryMachine =
                                  step.kind === "machine"
                                    ? step.machineType
                                    : "Job Work";
                                const selectedMachines = selectedIndices
                                  .map((idx) => machineTypes[idx]?.name)
                                  .filter(
                                    (name) => !!name && name !== primaryMachine,
                                  );
                                if (selectedMachines.length === 0) return null;
                                return (
                                  <div className="text-sm text-right">
                                    {selectedMachines.map((m) => (
                                      <div
                                        key={m}
                                        className="font-medium text-gray-900 dark:text-gray-100"
                                      >
                                        {m}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}

                              {isExpandedMobile && (
                                <>
                                  <button onClick={() => toggleCardStatus(o)}>
                                    <Badge
                                      variant={
                                        displayStatus === "running"
                                          ? "success"
                                          : displayStatus === "hold"
                                            ? "destructive"
                                            : "secondary"
                                      }
                                      className="shrink-0 cursor-pointer"
                                    >
                                      {cap(displayStatus)}
                                    </Badge>
                                  </button>
                                  {((o as any).jobWorkIds || []).length > 0 && (
                                    <div className="mt-1 text-right">
                                      {jobWorks
                                        .filter((j) =>
                                          (
                                            ((o as any).jobWorkIds ||
                                              []) as string[]
                                          ).includes(j.id),
                                        )
                                        .map((j) => (
                                          <div
                                            key={j.id}
                                            className="text-sm text-muted-foreground"
                                          >
                                            {j.name}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          );
                        })()}
                    </div>
                  </div>

                  {isExpandedMobile && (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/models/${o.id}/edit`)}
                          title="Details"
                          aria-label="Details"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant={
                            ((o as any).jobWorkIds || []).length > 0
                              ? "default"
                              : "ghost"
                          }
                          onClick={() => {
                            setJwForId(o.id);
                            setJwSelected(
                              ((o as any).jobWorkIds || []) as string[],
                            );
                          }}
                          title="Job Work"
                          aria-label="Job Work"
                        >
                          JW
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => props.onPrev(o.id)}
                          title="Previous step"
                          aria-label="Previous step"
                        >
                          <SkipBack className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => props.onNext(o.id)}
                          title="Next step"
                          aria-label="Next step"
                        >
                          <SkipForward className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSplitForId(o.id);
                            setSplitInputs([0]);
                          }}
                          title="Split into batches"
                          aria-label="Split into batches"
                        >
                          <Scissors className="h-5 w-5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(o.id)}
                          title="Delete"
                          aria-label="Delete"
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center bg-white dark:bg-gray-900">
                <p className="text-gray-500 dark:text-gray-400">
                  No models yet. Create one to get started.
                </p>
              </div>
            )}
          </div>

          {/* JW modal */}
          <SimpleModal
            open={!!jwForId}
            onOpenChange={(v) => !v && setJwForId(null)}
            title="Assign to"
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setJwForId(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const o = sorted.find((x) => x.id === jwForId);
                    if (o) {
                      const idx = o.currentStepIndex;
                      if (idx >= 0 && idx < o.steps.length) {
                        props.onSetStepStatus(o.id, idx, "running");
                      }
                      props.setOrderJobWorks?.(o.id, jwSelected);
                    }
                    setJwForId(null);
                  }}
                >
                  Save
                </Button>
              </div>
            }
          >
            <div className="space-y-2">
              {jobWorks.map((j) => (
                <label
                  key={j.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    id={`jw-${j.id}`}
                    checked={jwSelected.includes(j.id)}
                    onCheckedChange={(c) => {
                      setJwSelected((prev) => {
                        const has = prev.includes(j.id);
                        if (c && !has) return [...prev, j.id];
                        if (!c && has) return prev.filter((x) => x !== j.id);
                        return prev;
                      });
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{j.name}</div>
                    {j.description && (
                      <div className="text-xs text-muted-foreground">
                        {j.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
              {jobWorks.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No job works yet. Add them in Job Work.
                </div>
              )}
            </div>
          </SimpleModal>

          {/* Edit Path / Details Modal */}
          <SimpleModal
            open={!!editing}
            onOpenChange={(v) => !v && setEditingId(null)}
            title={`Model Details — ${editing?.modelName}`}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {editing && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Model
                        </div>
                        <div className="font-medium text-lg">
                          {editing.modelName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {editing.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Date: {formatDate(editing.createdAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Current status
                        </div>
                        <div className="mt-1">
                          {editing.currentStepIndex < 0 ||
                          editing.currentStepIndex >= editing.steps.length ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            (() => {
                              const ds =
                                editing.steps[editing.currentStepIndex]
                                  .status === "pending"
                                  ? "hold"
                                  : editing.steps[editing.currentStepIndex]
                                      .status;
                              return (
                                <Badge
                                  variant={
                                    ds === "running"
                                      ? "success"
                                      : ds === "hold"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {cap(ds)}
                                </Badge>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-sm text-muted-foreground mb-2">
                      Production Path
                    </div>
                    <div className="space-y-2">
                      {editing.steps.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {st.kind === "machine"
                                ? st.machineType
                                : "Job Work"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {st.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SimpleModal>

          {/* Split modal */}
          <SimpleModal
            open={!!splitFor}
            onOpenChange={(v) => !v && setSplitForId(null)}
            title={`Split into Batches — ${splitFor?.modelName}`}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSplitForId(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSplit}>
                  Split into {splitInputs.filter((q) => q > 0).length} Batches
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter quantities for each batch. Total available:{" "}
                {splitFor?.quantity || 0}
              </p>

              {/* Fraction presets */}
              <div className="flex items-center gap-2">
                {([0.25, 0.5, 0.75] as const).map((f) => {
                  const total = splitFor?.quantity || 0;
                  const part = Math.floor(total * f);
                  const remainder = total - part;
                  const disabled = part < 1 || remainder < 1;
                  return (
                    <Button
                      key={f}
                      variant={"outline"}
                      size="sm"
                      onClick={() => {
                        if (!splitFor) return;
                        if (disabled) return;
                        setSplitInputs([part]);
                      }}
                      disabled={disabled}
                    >
                      {f === 0.25 ? "1/4" : f === 0.5 ? "1/2" : "3/4"}
                    </Button>
                  );
                })}
                <div className="ml-2 text-sm text-muted-foreground">
                  Or enter manually
                </div>
              </div>

              <div className="space-y-2">
                {splitInputs.map((q, i) => (
                  <div key={`split-${i}`} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min={0}
                        placeholder={`Batch ${i + 1} quantity`}
                        value={q || ""}
                        onChange={(e) =>
                          setSplitInputs((arr) =>
                            arr.map((v, idx) =>
                              idx === i ? Number(e.target.value) || 0 : v,
                            ),
                          )
                        }
                        className="h-10"
                      />
                    </div>
                    {splitInputs.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveBatch(i)}
                        className="h-10 w-10 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setSplitInputs((arr) => [...arr, 0])}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Batch
              </Button>

              {splitInputs.filter((q) => q > 0).length > 0 && (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-sm">
                  <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">
                    Summary:
                  </div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    {splitInputs.map(
                      (q, i) =>
                        q > 0 && (
                          <div key={`batch-summary-${i}`}>
                            Batch {i + 1}: {q} units
                          </div>
                        ),
                    )}
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      Total: {splitInputs.reduce((sum, q) => sum + q, 0)} units
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SimpleModal>

          {/* Delete confirmation modal */}
          <SimpleModal
            open={!!deleteConfirmId}
            onOpenChange={(v) => !v && setDeleteConfirmId(null)}
            title="Confirm delete"
            footer={
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deleteConfirmId) props.onDelete(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            }
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this model? This action cannot
                be undone.
              </p>
            </div>
          </SimpleModal>
        </div>
      </div>
    </div>
  );
}
