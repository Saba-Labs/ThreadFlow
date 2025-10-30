import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMachineTypes } from "@/lib/machineTypes";
import { useSSESubscription } from "./useSSESubscription";
import { syncQueue, createSyncTask } from "@/lib/backgroundSync";
import { fetchWithTimeout, fetchWithTimeoutText } from "@/lib/fetchWithTimeout";
import { toast } from "./use-toast";

export type StepStatus = "pending" | "running" | "hold" | "completed";

export type MachineType = string;

export interface PathStep {
  id: string;
  kind: "machine" | "job";
  machineType?: Exclude<MachineType, "Job Work">;
  externalUnitName?: string;
  status: StepStatus;
  activeMachines: number;
  quantityDone: number;
}

export interface ParallelMachineGroup {
  stepIndex: number;
  machineIndices: number[];
  status: StepStatus;
}

export interface JobWorkAssignment {
  jobWorkId: string;
  jobWorkName?: string;
  quantity: number;
  pickupDate: number;
  completionDate?: number;
  status: "pending" | "completed";
}

export interface WorkOrder {
  id: string;
  modelName: string;
  quantity: number;
  createdAt: number;
  steps: PathStep[];
  currentStepIndex: number;
  parentId?: string;
  parallelGroups: ParallelMachineGroup[];
  jobWorkIds?: string[];
  jobWorkAssignments?: JobWorkAssignment[];
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface PipelineState {
  orders: WorkOrder[];
}

let STORE: PipelineState = { orders: [] };
let isLoading = false;
let initialized = false;

const subscribers = new Set<() => void>();

async function fetchFromServer() {
  if (isLoading) return;
  isLoading = true;
  try {
    const orders = await fetchWithTimeout<WorkOrder[]>("/api/pipeline/orders");
    STORE = { orders };
    for (const s of Array.from(subscribers)) s();
  } catch (error) {
    console.error("Failed to fetch pipeline orders:", error);
  } finally {
    isLoading = false;
  }
}

function setStore(updater: (s: PipelineState) => PipelineState) {
  STORE = updater(STORE);
  for (const s of Array.from(subscribers)) s();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (!initialized) {
    initialized = true;
    fetchFromServer();
  }
  return () => subscribers.delete(cb);
}

export function useProductionPipeline() {
  const state = useSyncExternalStore(
    subscribe,
    () => STORE,
    () => STORE,
  );

  useSSESubscription((event) => {
    if (event.type === "pipeline_updated") {
      fetchFromServer();
    }
  });

  const createWorkOrder = useCallback(
    async (input: {
      modelName: string;
      quantity: number;
      createdAt?: number;
      path: (
        | { kind: "machine"; machineType: Exclude<MachineType, "Job Work"> }
        | { kind: "job"; externalUnitName: string }
      )[];
    }) => {
      const steps: PathStep[] = input.path.map((p) => ({
        id: uid("step"),
        kind: p.kind,
        machineType: p.kind === "machine" ? p.machineType : undefined,
        externalUnitName: p.kind === "job" ? p.externalUnitName : undefined,
        status: "hold",
        activeMachines: 0,
        quantityDone: 0,
      }));
      const order: WorkOrder = {
        id: uid("order"),
        modelName: input.modelName.trim(),
        quantity: Math.max(0, Math.floor(input.quantity)),
        createdAt:
          typeof input.createdAt === "number" ? input.createdAt : Date.now(),
        steps,
        currentStepIndex: -1,
        parallelGroups: [],
        jobWorkIds: [],
        jobWorkAssignments: [],
      };

      // Optimistic update - show the new order immediately
      setStore((s) => ({ orders: [...s.orders, order] }));

      // Background sync - send to server without blocking UI
      syncQueue.enqueue(
        createSyncTask(
          "createWorkOrder",
          async () => {
            await fetchWithTimeout("/api/pipeline/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(order),
            });
          },
          (error) => {
            // On error, remove the optimistic order and show toast
            setStore((s) => ({
              orders: s.orders.filter((o) => o.id !== order.id),
            }));
            toast({
              title: "Error",
              description: "Failed to create model. It has been removed.",
              variant: "destructive",
            });
          },
          () => {
            toast({
              title: "Success",
              description: "Model created successfully",
            });
          },
        ),
      );

      return order.id;
    },
    [],
  );

  const deleteOrder = useCallback(async (orderId: string) => {
    // Store the deleted order for potential rollback
    const deletedOrder = STORE.orders.find((o) => o.id === orderId);

    // Optimistic update - remove immediately
    setStore((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) }));

    // Background sync
    syncQueue.enqueue(
      createSyncTask(
        "deleteOrder",
        async () => {
          await fetchWithTimeout(`/api/pipeline/orders/${orderId}`, {
            method: "DELETE",
          });
        },
        (error) => {
          // On error, restore the deleted order
          if (deletedOrder) {
            setStore((s) => ({
              orders: [...s.orders, deletedOrder],
            }));
          }
          toast({
            title: "Error",
            description: "Failed to delete model. It has been restored.",
            variant: "destructive",
          });
        },
        () => {
          toast({
            title: "Success",
            description: "Model deleted successfully",
          });
        },
      ),
    );
  }, []);

  const editPath = useCallback(
    async (orderId: string, editor: (steps: PathStep[]) => PathStep[]) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return;

      const currentStepId = order.steps[order.currentStepIndex]?.id;
      const nextSteps = editor([...order.steps]);
      const newIndex = currentStepId
        ? nextSteps.findIndex((st) => st.id === currentStepId)
        : nextSteps.length > 0
          ? 0
          : -1;

      try {
        await fetchWithTimeout(`/api/pipeline/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: order.modelName,
            quantity: order.quantity,
            currentStepIndex: newIndex,
            steps: nextSteps,
          }),
        });
        setStore((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, steps: nextSteps, currentStepIndex: newIndex }
              : o,
          ),
        }));
      } catch (error) {
        console.error("Failed to edit path:", error);
        throw error;
      }
    },
    [state.orders],
  );

  const updateStepStatus = useCallback(
    async (
      orderId: string,
      stepIndex: number,
      patch: Partial<
        Pick<PathStep, "status" | "activeMachines" | "quantityDone">
      >,
    ) => {
      // Store the previous state for rollback
      const order = STORE.orders.find((o) => o.id === orderId);
      const previousStep = order?.steps[stepIndex];

      // Optimistic update - change status immediately
      setStore((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const steps = o.steps.map((st, i) =>
            i === stepIndex ? { ...st, ...patch } : st,
          );
          return { ...o, steps };
        }),
      }));

      // Background sync
      syncQueue.enqueue(
        createSyncTask(
          "updateStepStatus",
          async () => {
            await fetchWithTimeout(
              `/api/pipeline/orders/${orderId}/steps/${stepIndex}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
              },
            );
          },
          () => {
            // On error, revert to previous state
            if (previousStep) {
              setStore((s) => ({
                orders: s.orders.map((o) => {
                  if (o.id !== orderId) return o;
                  const steps = o.steps.map((st, i) =>
                    i === stepIndex ? previousStep : st,
                  );
                  return { ...o, steps };
                }),
              }));
            }
            toast({
              title: "Error",
              description: "Failed to update step status.",
              variant: "destructive",
            });
          },
        ),
      );
    },
    [],
  );

  const moveToNextStep = useCallback(
    async (orderId: string) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const idx = order.currentStepIndex;
      const previousOrder = order;
      const steps = order.steps.slice();
      let newIndex: number;

      if (idx < 0) {
        if (steps.length > 0 && steps[0]) {
          steps[0] = { ...steps[0], status: "hold", activeMachines: 0 };
        }
        newIndex = 0;
      } else {
        if (steps[idx]) {
          steps[idx] = { ...steps[idx], status: "hold", activeMachines: 0 };
        }
        newIndex = idx + 1 < steps.length ? idx + 1 : steps.length;
        if (newIndex < steps.length && steps[newIndex]) {
          steps[newIndex] = {
            ...steps[newIndex],
            status: "hold",
            activeMachines: 0,
          };
        }
      }

      // Optimistic update - change step immediately
      setStore((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, steps, currentStepIndex: newIndex } : o,
        ),
      }));

      // Background sync
      syncQueue.enqueue(
        createSyncTask(
          "moveToNextStep",
          async () => {
            await fetchWithTimeout(`/api/pipeline/orders/${orderId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                modelName: order.modelName,
                quantity: order.quantity,
                currentStepIndex: newIndex,
                steps,
              }),
            });
          },
          () => {
            // On error, revert to previous state
            setStore((s) => ({
              orders: s.orders.map((o) =>
                o.id === orderId ? previousOrder : o,
              ),
            }));
            toast({
              title: "Error",
              description: "Failed to move to next step.",
              variant: "destructive",
            });
          },
        ),
      );
    },
    [state.orders],
  );

  const moveToPrevStep = useCallback(
    async (orderId: string) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const previousOrder = order;
      const idx = order.currentStepIndex;
      let target: number;
      const steps = order.steps.slice();

      if (idx === 0) {
        target = -1;
      } else if (idx < 0) {
        return;
      } else {
        target = idx - 1;
        if (idx >= 0 && steps[idx]) {
          steps[idx] = { ...steps[idx], status: "hold", activeMachines: 0 };
        }
        if (target >= 0 && steps[target]) {
          steps[target] = {
            ...steps[target],
            status: "hold",
            activeMachines: 0,
          };
        }
      }

      // Optimistic update
      setStore((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                steps: target === -1 ? o.steps : steps,
                currentStepIndex: target,
              }
            : o,
        ),
      }));

      // Background sync
      syncQueue.enqueue(
        createSyncTask(
          "moveToPrevStep",
          async () => {
            const response = await fetch(`/api/pipeline/orders/${orderId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                modelName: order.modelName,
                quantity: order.quantity,
                currentStepIndex: target,
                steps: target === -1 ? order.steps : steps,
              }),
            });
            if (!response.ok) {
              let errorData = "";
              try {
                errorData = await response.text();
              } catch {
                // Body already read or unavailable
              }
              throw new Error(
                `Failed to move to prev step: ${response.statusText}${errorData ? ` - ${errorData}` : ""}`,
              );
            }
          },
          () => {
            // On error, revert
            setStore((s) => ({
              orders: s.orders.map((o) =>
                o.id === orderId ? previousOrder : o,
              ),
            }));
            toast({
              title: "Error",
              description: "Failed to move to previous step.",
              variant: "destructive",
            });
          },
        ),
      );
    },
    [state.orders],
  );

  const setCurrentStep = useCallback((orderId: string, index: number) => {
    setStore((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const bounded = Math.max(-1, Math.min(index, o.steps.length));
        return { ...o, currentStepIndex: bounded };
      }),
    }));
  }, []);

  const toggleParallelMachine = useCallback(
    (orderId: string, stepIndex: number, machineIndex: number) => {
      setStore((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;

          const groups = (o.parallelGroups || []).slice();
          const idx = groups.findIndex((g) => g.stepIndex === stepIndex);

          if (idx >= 0) {
            const existing = groups[idx];
            const has = existing.machineIndices.includes(machineIndex);
            if (has) {
              const newIndices = existing.machineIndices.filter(
                (m) => m !== machineIndex,
              );
              if (newIndices.length === 0) {
                return {
                  ...o,
                  parallelGroups: groups.filter((_, i) => i !== idx),
                };
              }
              const newGroup = { ...existing, machineIndices: newIndices };
              const newGroups = groups.slice();
              newGroups[idx] = newGroup;
              return { ...o, parallelGroups: newGroups };
            } else {
              const newGroup = {
                ...existing,
                machineIndices: [...existing.machineIndices, machineIndex],
              };
              const newGroups = groups.slice();
              newGroups[idx] = newGroup;
              return { ...o, parallelGroups: newGroups };
            }
          }

          const added = {
            stepIndex,
            machineIndices: [machineIndex],
            status: "hold" as StepStatus,
          };
          return { ...o, parallelGroups: [...groups, added] };
        }),
      }));
    },
    [],
  );

  const splitOrder = useCallback(
    async (orderId: string, quantities: number[]) => {
      const src = state.orders.find((o) => o.id === orderId);
      if (!src) return;

      const valid = quantities
        .map((q) => Math.max(0, Math.floor(q)))
        .filter((q) => q > 0);
      const sum = valid.reduce((a, b) => a + b, 0);
      if (sum <= 0) return;
      if (src.quantity > 0 && sum >= src.quantity) return;
      const remainder = src.quantity - sum;

      const createChild = (q: number): WorkOrder => ({
        id: uid("order"),
        modelName: src.modelName,
        quantity: q,
        createdAt: Date.now(),
        steps: src.steps.map((st) => ({
          ...st,
          id: uid("step"),
          status:
            st.status === "completed"
              ? ("completed" as StepStatus)
              : ("hold" as StepStatus),
          activeMachines: 0,
          quantityDone: 0,
        })),
        currentStepIndex: src.currentStepIndex,
        parentId: src.id,
        parallelGroups: (src.parallelGroups || []).map((g) => ({
          stepIndex: g.stepIndex,
          machineIndices: g.machineIndices.slice(),
          status: g.status as StepStatus,
        })),
        jobWorkAssignments: [],
      });

      const children = valid.map((q) => createChild(q));

      // Update local state immediately
      setStore((s) => {
        const updatedSrc: WorkOrder = { ...src, quantity: remainder };
        const newOrders: WorkOrder[] = [];
        for (const o of s.orders) {
          if (o.id === src.id) {
            newOrders.push(updatedSrc);
            for (const c of children) newOrders.push(c);
          } else {
            newOrders.push(o);
          }
        }
        return { orders: newOrders };
      });

      // Persist to database
      try {
        // Update parent order with remainder quantity
        await fetch(`/api/pipeline/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: src.modelName,
            quantity: remainder,
            currentStepIndex: src.currentStepIndex,
            steps: src.steps,
          }),
        });

        // Create child orders
        for (const child of children) {
          const response = await fetch("/api/pipeline/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(child),
          });
          if (!response.ok) {
            throw new Error(
              `Failed to create child order: ${response.statusText}`,
            );
          }
        }

        // Fetch updated state from server to ensure sync
        await fetchFromServer();
      } catch (error) {
        console.error("Failed to persist split to database:", error);
        // Revert local state on error
        await fetchFromServer();
        throw error;
      }
    },
    [state.orders],
  );

  const machineTypes = useMachineTypes();

  const board = useMemo(() => {
    const map: Record<MachineType, WorkOrder[]> = Object.fromEntries(
      machineTypes.map((m) => [m.name, [] as WorkOrder[]]),
    ) as Record<MachineType, WorkOrder[]>;
    for (const o of state.orders) {
      const idx = o.currentStepIndex;
      if (idx < 0 || idx >= o.steps.length) continue;
      const step = o.steps[idx];
      if (step.kind === "machine" && step.machineType) {
        if (!map[step.machineType]) map[step.machineType] = [];
        map[step.machineType].push(o);
      } else {
        if (!map["Job Work"]) map["Job Work"] = [];
        map["Job Work"].push(o);
      }
    }
    return map;
  }, [state.orders, machineTypes]);

  const progressOf = useMemo(
    () => (o: WorkOrder) => {
      if (o.steps.length === 0) return 1;
      const completed = o.steps.filter((s) => s.status === "completed").length;
      return completed / o.steps.length;
    },
    [],
  );

  return {
    orders: state.orders,
    createWorkOrder,
    deleteOrder,
    editPath,
    updateStepStatus,
    moveToNextStep,
    moveToPrevStep,
    setCurrentStep,
    splitOrder,
    toggleParallelMachine,
    setOrderJobWorks: (orderId: string, ids: string[]) => {
      setStore((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId ? { ...o, jobWorkIds: ids.slice() } : o,
        ),
      }));
    },
    setJobWorkAssignments: async (
      orderId: string,
      assignments: JobWorkAssignment[],
    ) => {
      try {
        const response = await fetch(
          `/api/pipeline/orders/${orderId}/job-work-assignments`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignments }),
          },
        );
        if (!response.ok) throw new Error("Failed to set job work assignments");
        await fetchFromServer();
      } catch (error) {
        console.error("Error setting job work assignments:", error);
        throw error;
      }
    },
    updateJobWorkAssignmentStatus: async (
      orderId: string,
      jobWorkId: string,
      status: "pending" | "completed",
      completionDate?: number,
    ) => {
      try {
        const response = await fetch(
          `/api/pipeline/orders/${orderId}/job-works/${jobWorkId}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, completionDate }),
          },
        );
        if (!response.ok) {
          let errorData = "";
          try {
            errorData = await response.text();
          } catch {
            // Body already read or unavailable
          }
          throw new Error(
            `Failed to update job work assignment status: ${response.statusText}${errorData ? ` - ${errorData}` : ""}`,
          );
        }
        await fetchFromServer();
      } catch (error) {
        console.error(
          `Error updating job work assignment status for jobWorkId ${jobWorkId} in order ${orderId}:`,
          error,
        );
        throw error;
      }
    },
    updateOrder: async (
      orderId: string,
      data: {
        modelName: string;
        quantity: number;
        createdAt: number;
        path: (
          | { kind: "machine"; machineType: string }
          | { kind: "job"; externalUnitName: string }
        )[];
      },
    ) => {
      const newSteps = data.path.map((p) => ({
        id: uid("step"),
        kind: p.kind as "machine" | "job",
        machineType:
          p.kind === "machine" ? (p.machineType as string) : undefined,
        externalUnitName:
          p.kind === "job" ? (p.externalUnitName as string) : undefined,
        status: "hold" as StepStatus,
        activeMachines: 0,
        quantityDone: 0,
      }));
      const newIndex = Math.max(
        0,
        Math.min(
          state.orders.find((o) => o.id === orderId)?.currentStepIndex ?? -1,
          newSteps.length - 1,
        ),
      );

      try {
        const response = await fetch(`/api/pipeline/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: data.modelName,
            quantity: data.quantity,
            currentStepIndex: newSteps.length === 0 ? -1 : newIndex,
            steps: newSteps,
          }),
        });
        if (!response.ok) throw new Error("Failed to update order");
        setStore((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              modelName: data.modelName,
              quantity: data.quantity,
              createdAt: data.createdAt,
              steps: newSteps,
              currentStepIndex: newSteps.length === 0 ? -1 : newIndex,
              parallelGroups: [],
            };
          }),
        }));
      } catch (error) {
        console.error("Failed to update order:", error);
        throw error;
      }
    },
    board,
    progressOf,
  };
}
