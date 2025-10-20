import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import SimpleModal from "@/components/ui/SimpleModal";
import { Plus } from "lucide-react";
import { useMachineTypes } from "@/lib/machineTypes";

export interface NewPathStep {
  kind: "machine" | "job";
  machineType?: string;
  externalUnitName?: string;
}

export default function ModelForm(props: {
  onCreate: (data: {
    modelName: string;
    quantity: number;
    createdAt: number;
    path: NewPathStep[];
  }) => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [dateStr, setDateStr] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [selectedMachines, setSelectedMachines] = useState<Set<string>>(new Set());
  const [includeJobWork, setIncludeJobWork] = useState(false);

  const machineTypes = useMachineTypes();

  // populate default path when modal opens if path is empty
  useEffect(() => {
    if (open && selectedMachines.size === 0) {
      const allMachines = machineTypes
        .filter((m) => m.name !== "Job Work")
        .map((m) => m.name);
      setSelectedMachines(new Set(allMachines));
    }
  }, [open, machineTypes]);

  const toggleMachine = (machineName: string) => {
    setSelectedMachines((prev) => {
      const next = new Set(prev);
      if (next.has(machineName)) {
        next.delete(machineName);
      } else {
        next.add(machineName);
      }
      return next;
    });
  };

  const buildPath = (): NewPathStep[] => {
    const steps: NewPathStep[] = [];

    // Add machines in order they appear in machineTypes
    machineTypes.forEach((mt) => {
      if (mt.name !== "Job Work" && selectedMachines.has(mt.name)) {
        steps.push({ kind: "machine", machineType: mt.name });
      }
    });

    // Add Job Work if selected
    if (includeJobWork) {
      steps.push({ kind: "job", externalUnitName: "Job Work Unit" });
    }

    return steps;
  };

  const reset = () => {
    setModelName("");
    setQuantity(100);
    setDateStr(new Date().toISOString().slice(0, 10));
    setSelectedMachines(new Set());
    setIncludeJobWork(false);
  };

  const submit = () => {
    if (!modelName.trim()) return;
    const path = buildPath();
    if (path.length === 0) return;

    props.onCreate({
      modelName,
      quantity: Math.max(1, Math.floor(quantity)),
      createdAt: new Date(dateStr).getTime(),
      path,
    });
    reset();
    setOpen(false);
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {props.trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> New Model
          </Button>
        )}
      </div>
      <SimpleModal
        open={open}
        onOpenChange={setOpen}
        title="New Model / Batch"
        footer={
          <div className="flex justify-end">
            <Button onClick={submit}>Create</Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground mb-4">
          Define quantity, date, and the exact path through machines or job
          work.
        </p>
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Model name</label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., KIDS TEE M1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Path</label>
              <div className="flex gap-2">
                <Select
                  onValueChange={(v) =>
                    addStep({
                      kind: "machine",
                      machineType: v as string,
                    })
                  }
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Add machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machineOptions.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addStep({ kind: "job", externalUnitName: "Job Work Unit" })
                  }
                >
                  Add Job Work
                </Button>
              </div>
            </div>
            <div className="rounded-md border divide-y">
              {path.map((st, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <span className="inline-flex min-w-8 justify-center text-xs text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    {st.kind === "machine" ? (
                      <div className="font-medium">{st.machineType}</div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium">Job Work</div>
                        <div className="text-xs text-muted-foreground">
                          {st.externalUnitName}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {path.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">
                  No steps yet. Add machines or job work above.
                </div>
              )}
            </div>
          </div>
        </div>
      </SimpleModal>
    </>
  );
}
