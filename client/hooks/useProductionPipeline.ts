import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useMachineTypes } from "@/lib/machineTypes";
import { useSSESubscription } from "./useSSESubscription";

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
    const response = await fetch("/api/pipeline/orders");
    if (!response.ok) throw new Error("Failed to fetch orders");
    const orders = await response.json();
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

      try {
        const response = await fetch("/api/pipeline/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });
        if (!response.ok) throw new Error("Failed to create order");
        await fetchFromServer();
        return order.id;
      } catch (error) {
        console.error("Failed to create work order:", error);
        throw error;
      }
    },
    [],
  );

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(`/api/pipeline/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete order");
      setStore((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) }));
    } catch (error) {
      console.error("Failed to delete order:", error);
      throw error;
    }
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
        const response = await fetch(`/api/pipeline/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: order.modelName,
            quantity: order.quantity,
            currentStepIndex: newIndex,
            steps: nextSteps,
          }),
        });
        if (!response.ok) throw new Error("Failed to update path");
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
      try {
        const response = await fetch(
          `/api/pipeline/orders/${orderId}/steps/${stepIndex}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
          },
        );
        if (!response.ok) throw new Error("Failed to update step status");
        setStore((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const steps = o.steps.map((st, i) =>
              i === stepIndex ? { ...st, ...patch } : st,
            );
            return { ...o, steps };
          }),
        }));
      } catch (error) {
        console.error("Failed to update step status:", error);
        throw error;
      }
    },
    [],
  );

  const moveToNextStep = useCallback(
    async (orderId: string) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const idx = order.currentStepIndex;
      const steps = order.steps.slice();

      if (idx < 0) {
        if (steps.length > 0 && steps[0]) {
          steps[0] = { ...steps[0], status: "hold", activeMachines: 0 };
        }
        const newIndex = 0;
        try {
          const response = await fetch(`/api/pipeline/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelName: order.modelName,
              quantity: order.quantity,
              currentStepIndex: newIndex,
              steps,
            }),
          });
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to move to next step: ${response.statusText}${errorData ? ` - ${errorData}` : ""}`);
          }
          setStore((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId
                ? { ...o, steps, currentStepIndex: newIndex }
                : o,
            ),
          }));
        } catch (error) {
          console.error("Failed to move to next step:", error);
          throw error;
        }
        return;
      }

      if (steps[idx]) {
        steps[idx] = { ...steps[idx], status: "hold", activeMachines: 0 };
      }

      const nextIndex = idx + 1 < steps.length ? idx + 1 : steps.length;

      if (nextIndex < steps.length && steps[nextIndex]) {
        steps[nextIndex] = {
          ...steps[nextIndex],
          status: "hold",
          activeMachines: 0,
        };
      }

      try {
        const response = await fetch(`/api/pipeline/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: order.modelName,
            quantity: order.quantity,
            currentStepIndex: nextIndex,
            steps,
          }),
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to move to next step: ${response.statusText}${errorData ? ` - ${errorData}` : ""}`);
        }
        setStore((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, steps, currentStepIndex: nextIndex } : o,
          ),
        }));
      } catch (error) {
        console.error("Failed to move to next step:", error);
        throw error;
      }
    },
    [state.orders],
  );

  const moveToPrevStep = useCallback(
    async (orderId: string) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Order not found");

      const idx = order.currentStepIndex;

      if (idx === 0) {
        try {
          const response = await fetch(`/api/pipeline/orders/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              modelName: order.modelName,
              quantity: order.quantity,
              currentStepIndex: -1,
              steps: order.steps,
            }),
          });
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to move to prev step: ${response.statusText}${errorData ? ` - ${errorData}` : ""}`);
          }
          setStore((s) => ({
            orders: s.orders.map((o) =>
              o.id === orderId ? { ...o, currentStepIndex: -1 } : o,
            ),
          }));
        } catch (error) {
          console.error("Failed to move to prev step:", error);
          throw error;
        }
        return;
      }

      if (idx < 0) return;

      const steps = order.steps.slice();
      const target = idx - 1;

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

      try {
        const response = await fetch(`/api/pipeline/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelName: order.modelName,
            quantity: order.quantity,
            currentStepIndex: target,
            steps,
          }),
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to move to prev step: ${response.statusText}${errorData ? ` - ${errorData}` : ""}`);
        }
        setStore((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, steps, currentStepIndex: target } : o,
          ),
        }));
      } catch (error) {
        console.error("Failed to move to prev step:", error);
        throw error;
      }
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

  const splitOrder = useCallback((orderId: string, quantities: number[]) => {
    setStore((s) => {
      const src = s.orders.find((o) => o.id === orderId);
      if (!src) return s;
      const valid = quantities
        .map((q) => Math.max(0, Math.floor(q)))
        .filter((q) => q > 0);
      const sum = valid.reduce((a, b) => a + b, 0);
      if (sum <= 0) return s;
      if (src.quantity > 0 && sum >= src.quantity) return s;
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
  }, []);

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
    setJobWorkAssignments: (
      orderId: string,
      assignments: JobWorkAssignment[],
    ) => {
      setStore((s) => ({
        orders: s.orders.map((o) =>
          o.id === orderId
            ? { ...o, jobWorkAssignments: assignments.slice() }
            : o,
        ),
      }));
    },
    updateJobWorkAssignmentStatus: (
      orderId: string,
      jobWorkId: string,
      status: "pending" | "completed",
      completionDate?: number,
    ) => {
      setStore((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const assignments = (o.jobWorkAssignments || []).map((a) =>
            a.jobWorkId === jobWorkId
              ? {
                  ...a,
                  status,
                  completionDate:
                    status === "completed"
                      ? (completionDate ?? Date.now())
                      : undefined,
                }
              : a,
          );
          return { ...o, jobWorkAssignments: assignments };
        }),
      }));
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
