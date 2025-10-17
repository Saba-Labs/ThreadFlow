import { useState, useMemo } from "react";

// Mock types based on the original code
interface PathStep {
  id: string;
  kind: "machine" | "jobwork";
  machineType?: string;
  status?: "running" | "hold" | "waiting";
}

interface WorkOrder {
  id: string;
  modelName: string;
  quantity: number;
  currentStepIndex: number;
  steps: PathStep[];
  createdAt: number;
}

// Simple Badge Component
const Badge = ({ children, variant = "default", className = "" }: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive";
  className?: string;
}) => {
  const variants = {
    default: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    secondary: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Simple Button Component
const Button = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  disabled = false,
  className = "",
  title
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  disabled?: boolean;
  className?: string;
  title?: string;
}) => {
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
    ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
  };

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm",
    icon: "p-2"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Input Component
const Input = ({
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  className = ""
}: {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string;
  className?: string;
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    />
  );
};

// Simple Modal Component
const SimpleModal = ({
  open,
  onOpenChange,
  title,
  children,
  footer
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
        <div className="p-4 border-t dark:border-gray-800">
          {footer}
        </div>
      </div>
    </div>
  );
};

// Icons as SVG components
const SkipForward = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const Scissors = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const Trash2 = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ArrowUp = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ArrowDown = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const X = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Plus = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Demo data
const DEMO_ORDERS: WorkOrder[] = [
  {
    id: "1",
    modelName: "Model A-100",
    quantity: 50,
    currentStepIndex: 1,
    createdAt: Date.now() - 1000000,
    steps: [
      { id: "s1", kind: "machine", machineType: "Cutting", status: "running" },
      { id: "s2", kind: "machine", machineType: "Sewing", status: "running" },
      { id: "s3", kind: "jobwork", status: "waiting" },
      { id: "s4", kind: "machine", machineType: "Finishing", status: "waiting" },
    ]
  },
  {
    id: "2",
    modelName: "Model B-200",
    quantity: 100,
    currentStepIndex: 0,
    createdAt: Date.now() - 2000000,
    steps: [
      { id: "s1", kind: "machine", machineType: "Cutting", status: "hold" },
      { id: "s2", kind: "jobwork", status: "waiting" },
      { id: "s3", kind: "machine", machineType: "Packing", status: "waiting" },
    ]
  },
  {
    id: "3",
    modelName: "Model C-300",
    quantity: 75,
    currentStepIndex: 3,
    createdAt: Date.now() - 3000000,
    steps: [
      { id: "s1", kind: "machine", machineType: "Cutting", status: "running" },
      { id: "s2", kind: "machine", machineType: "Sewing", status: "running" },
      { id: "s3", kind: "machine", machineType: "Finishing", status: "running" },
    ]
  }
];

export default function ModelList() {
  const [orders, setOrders] = useState<WorkOrder[]>(DEMO_ORDERS);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [splitFor, setSplitFor] = useState<WorkOrder | null>(null);
  const [splitInputs, setSplitInputs] = useState<number[]>([0, 0]);

  const sorted = useMemo(
    () => orders.slice().sort((a, b) => b.createdAt - a.createdAt),
    [orders],
  );

  const handleDelete = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const handleNext = (id: string) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, currentStepIndex: o.currentStepIndex + 1 } : o
    ));
  };

  const handleEditPath = (orderId: string, editor: (steps: PathStep[]) => PathStep[]) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, steps: editor(o.steps) } : o
    ));
    if (editing) {
      setEditing(prev => prev && prev.id === orderId
        ? { ...prev, steps: editor(prev.steps) }
        : prev
      );
    }
  };

  const handleSplit = () => {
    if (!splitFor) return;
    const validQuantities = splitInputs.filter(q => q > 0);
    if (validQuantities.length === 0) return;

    // In real implementation, this would create multiple orders
    console.log('Splitting', splitFor.id, 'into batches:', validQuantities);

    setSplitFor(null);
    setSplitInputs([0, 0]);
  };

  const handleRemoveBatch = (index: number) => {
    setSplitInputs(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Production Orders</h1>

        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden lg:block rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">Model</th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">Qty</th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">Current</th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">Path</th>
                    <th className="p-3 text-left font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((o) => {
                    const i = o.currentStepIndex;
                    const step = o.steps[i];
                    return (
                      <tr key={o.id} className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{o.modelName}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{o.quantity}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">
                          {i < 0
                            ? "Not started"
                            : i >= o.steps.length
                              ? "Completed"
                              : step.kind === "machine"
                                ? step.machineType
                                : "Job Work"}
                        </td>
                        <td className="p-3">
                          {i < 0 || i >= o.steps.length ? (
                            <Badge variant="secondary">—</Badge>
                          ) : (
                            <Badge
                              variant={
                                step.status === "running"
                                  ? "default"
                                  : step.status === "hold"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {step.status}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 max-w-[320px]">
                          <div className="flex flex-wrap gap-1">
                            {o.steps.map((s, idx) => (
                              <span
                                key={s.id}
                                className={`rounded-full px-2 py-0.5 text-xs border ${idx < i
                                    ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : idx === i
                                      ? "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                      : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700"
                                  }`}
                              >
                                {s.kind === "machine" ? s.machineType : "Job Work"}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditing(o)}
                            >
                              Edit Path
                            </Button>
                            <Button size="sm" onClick={() => handleNext(o.id)}>
                              <SkipForward className="h-4 w-4 mr-1" /> Next
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSplitFor(o);
                                setSplitInputs([0, 0]);
                              }}
                              title="Split into batches"
                            >
                              <Scissors className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(o.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No models yet. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {sorted.map((o) => {
              const i = o.currentStepIndex;
              const step = o.steps[i];
              return (
                <div
                  key={o.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">
                        {o.modelName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Quantity: {o.quantity}
                      </p>
                    </div>
                    {i >= 0 && i < o.steps.length && (
                      <Badge
                        variant={
                          step.status === "running"
                            ? "default"
                            : step.status === "hold"
                              ? "destructive"
                              : "secondary"
                        }
                        className="shrink-0"
                      >
                        {step.status}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Current: </span>
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

                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                        Production Path:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {o.steps.map((s, idx) => (
                          <span
                            key={s.id}
                            className={`rounded-full px-2.5 py-1 text-xs border font-medium ${idx < i
                                ? "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : idx === i
                                  ? "bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-700"
                              }`}
                          >
                            {s.kind === "machine" ? s.machineType : "Job Work"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(o)}
                      className="flex-1"
                    >
                      Edit Path
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleNext(o.id)}
                      className="flex-1"
                    >
                      <SkipForward className="h-4 w-4 mr-1" /> Next
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSplitFor(o);
                        setSplitInputs([0, 0]);
                      }}
                      className="flex-1"
                    >
                      <Scissors className="h-4 w-4 mr-1.5" /> Split Batches
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(o.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No models yet. Create one to get started.
                </p>
              </div>
            )}
          </div>

          {/* Edit Path Modal */}
          <SimpleModal
            open={!!editing}
            onOpenChange={(v) => !v && setEditing(null)}
            title={`Edit Path — ${editing?.modelName}`}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              {editing && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {editing.steps.map((st, idx) => (
                    <div key={st.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="min-w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-gray-900 dark:text-gray-100">
                          {st.kind === "machine" ? st.machineType : "Job Work"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={idx === 0}
                          onClick={() =>
                            handleEditPath(editing.id, (steps) => {
                              const j = idx - 1;
                              if (j < 0) return steps;
                              const arr = steps.slice();
                              const tmp = arr[idx];
                              arr[idx] = arr[j];
                              arr[j] = tmp;
                              return arr;
                            })
                          }
                          className="h-8 w-8"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={idx === editing.steps.length - 1}
                          onClick={() =>
                            handleEditPath(editing.id, (steps) => {
                              const j = idx + 1;
                              if (j >= steps.length) return steps;
                              const arr = steps.slice();
                              const tmp = arr[idx];
                              arr[idx] = arr[j];
                              arr[j] = tmp;
                              return arr;
                            })
                          }
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SimpleModal>

          {/* Split Modal */}
          <SimpleModal
            open={!!splitFor}
            onOpenChange={(v) => !v && setSplitFor(null)}
            title={`Split into Batches — ${splitFor?.modelName}`}
            footer={
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSplitFor(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSplit}>
                  Split into {splitInputs.filter(q => q > 0).length} Batches
                </Button>
              </div>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter quantities for each batch. Total available: {splitFor?.quantity || 0}
              </p>

              <div className="space-y-2">
                {splitInputs.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        min="0"
                        placeholder={`Batch ${i + 1} quantity`}
                        value={q || ""}
                        onChange={(e) =>
                          setSplitInputs((arr) =>
                            arr.map((v, idx) => (idx === i ? Number(e.target.value) || 0 : v)),
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

              {splitInputs.filter(q => q > 0).length > 0 && (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-sm">
                  <div className="font-medium mb-1 text-gray-900 dark:text-gray-100">Summary:</div>
                  <div className="space-y-1 text-gray-600 dark:text-gray-400">
                    {splitInputs.map((q, i) => q > 0 && (
                      <div key={i}>Batch {i + 1}: {q} units</div>
                    ))}
                    <div className="pt-1 border-t border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-gray-100">
                      Total: {splitInputs.reduce((sum, q) => sum + q, 0)} units
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SimpleModal>
        </div>
      </div>
    </div>
  );
}