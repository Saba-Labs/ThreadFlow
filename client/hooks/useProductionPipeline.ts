import { useCallback, useMemo, useSyncExternalStore } from "react";

export type StepStatus = "pending" | "running" | "hold" | "completed";

import { useMachineTypes } from "@/lib/machineTypes";

export type MachineType = string;

export interface PathStep {
  id: string;
  kind: "machine" | "job";
  machineType?: Exclude<MachineType, "Job Work">;
  externalUnitName?: string; // for job work
  status: StepStatus;
  activeMachines: number; // how many machines are currently working this step
  quantityDone: number; // optional tracking of pieces done in this step
}

export interface ParallelMachineGroup {
  stepIndex: number;
  machineIndices: number[]; // indices of machines in the parallel group
  status: StepStatus;
}

export interface WorkOrder {
  id: string;
  modelName: string;
  quantity: number;
  createdAt: number;
  steps: PathStep[];
  currentStepIndex: number; // -1 if not started, len if completed
  parentId?: string; // if split from another
  parallelGroups: ParallelMachineGroup[]; // groups of machines running in parallel
  jobWorkIds?: string[];
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const STORAGE_KEY = "threadflow_pipeline_v1";

export interface PipelineState {
  orders: WorkOrder[];
}

// Module-level shared store so multiple components see the same data
let STORE: PipelineState = (function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PipelineState;
  } catch {}
  return { orders: [] };
})();

const subscribers = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORE));
  } catch {}
}

function setStore(updater: (s: PipelineState) => PipelineState) {
  STORE = updater(STORE);
  persist();
  for (const s of Array.from(subscribers)) s();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function useProductionPipeline() {
  const state = useSyncExternalStore(
    subscribe,
    () => STORE,
    () => STORE,
  );

  const createWorkOrder = useCallback(
    (input: {
      modelName: string;
      quantity: number;
      createdAt?: number; // allow custom creation date
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
        currentStepIndex: steps.length > 0 ? 0 : -1,
        parallelGroups: [],
        jobWorkIds: [],
      };
      setStore((s) => ({ orders: [order, ...s.orders] }));
      return order.id;
    },
    [],
  );

  const deleteOrder = useCallback((orderId: string) => {
    setStore((s) => ({ orders: s.orders.filter((o) => o.id !== orderId) }));
  }, []);

  const editPath = useCallback(
    (orderId: string, editor: (steps: PathStep[]) => PathStep[]) => {
      setStore((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const currentStepId = o.steps[o.currentStepIndex]?.id;
          const nextSteps = editor([...o.steps]);
          const newIndex = currentStepId
            ? nextSteps.findIndex((st) => st.id === currentStepId)
            : nextSteps.length > 0
              ? 0
              : -1;
          return { ...o, steps: nextSteps, currentStepIndex: newIndex };
        }),
      }));
    },
    [],
  );

  const updateStepStatus = useCallback(
    (
      orderId: string,
      stepIndex: number,
      patch: Partial<
        Pick<PathStep, "status" | "activeMachines" | "quantityDone">
      >,
    ) => {
      setStore((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const steps = o.steps.map((st, i) =>
            i === stepIndex ? { ...st, ...patch } : st,
          );
          return { ...o, steps };
        }),
      }));
    },
    [],
  );

  const moveToNextStep = useCallback((orderId: string) => {
    setStore((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.currentStepIndex < 0) return o;
        const idx = o.currentStepIndex;
        const steps = o.steps.slice();

        // Do NOT mark previous step as completed; keep it as hold
        if (steps[idx]) {
          steps[idx] = { ...steps[idx], status: "hold", activeMachines: 0 };
        }

        const nextIndex = idx + 1 < steps.length ? idx + 1 : steps.length;

        // Set next step explicitly to hold
        if (nextIndex < steps.length && steps[nextIndex]) {
          steps[nextIndex] = {
            ...steps[nextIndex],
            status: "hold",
            activeMachines: 0,
          };
        }

        // Clear any parallel machine selections when moving steps
        return { ...o, steps, currentStepIndex: nextIndex, parallelGroups: [] };
      }),
    }));
  }, []);

  const moveToPrevStep = useCallback((orderId: string) => {
    setStore((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.currentStepIndex <= 0 && o.steps.length > 0) {
          // already at first or not started
          return { ...o, currentStepIndex: 0 };
        }
        const steps = o.steps.slice();
        const idx = o.currentStepIndex;
        const target = idx >= steps.length ? steps.length - 1 : idx - 1;

        // Ensure current step remains/sets to hold
        if (idx >= 0 && steps[idx]) {
          steps[idx] = { ...steps[idx], status: "hold", activeMachines: 0 };
        }

        // Set target step explicitly to hold
        if (target >= 0 && steps[target]) {
          steps[target] = {
            ...steps[target],
            status: "hold",
            activeMachines: 0,
          };
        }

        // Clear any parallel machine selections when moving steps
        return {
          ...o,
          steps,
          currentStepIndex: Math.max(0, target),
          parallelGroups: [],
        };
      }),
    }));
  }, []);

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

          // If a group exists for this stepIndex, toggle the machineIndex immutably
          if (idx >= 0) {
            const existing = groups[idx];
            const has = existing.machineIndices.includes(machineIndex);
            if (has) {
              const newIndices = existing.machineIndices.filter(
                (m) => m !== machineIndex,
              );
              if (newIndices.length === 0) {
                // remove the group entirely
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

          // otherwise add new group
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
      if (sum <= 0 || sum >= src.quantity) return s;
      const remainder = src.quantity - sum;
      const base = (q: number): WorkOrder => ({
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
      });
      const children = valid.map((q) => base(q));
      const remainderOrder = base(remainder);
      const withoutSrc = s.orders.filter((o) => o.id !== src.id);
      return { orders: [remainderOrder, ...children, ...withoutSrc] };
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
    // update an existing order's basic properties (modelName, quantity, createdAt, path)
    updateOrder: (
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
      setStore((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== orderId) return o;
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
            Math.min(o.currentStepIndex, newSteps.length - 1),
          );
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
    },
    board,
    progressOf,
  };
}
