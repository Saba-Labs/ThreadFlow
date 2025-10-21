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
  inline?: boolean;
  initialData?: { modelName: string; quantity: number; createdAt: number; path: NewPathStep[] };
  onCancel?: () => void;
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

  // initialize from initialData, otherwise populate default path when modal opens or when rendered inline
  useEffect(() => {
    if (props.initialData) {
      setModelName(props.initialData.modelName || "");
      setQuantity(props.initialData.quantity ?? 100);
      setDateStr(new Date(props.initialData.createdAt).toISOString().slice(0, 10));
      const sel = new Set<string>();
      let job = false;
      for (const p of props.initialData.path) {
        if (p.kind === "machine" && p.machineType) sel.add(p.machineType);
        if (p.kind === "job") job = true;
      }
      setSelectedMachines(sel);
      setIncludeJobWork(job);
      return;
    }

    if ((open || props.inline) && selectedMachines.size === 0) {
      const allMachines = machineTypes
        .filter((m) => m.name !== "Job Work")
        .map((m) => m.name);
      setSelectedMachines(new Set(allMachines));
    }
  }, [open, props.inline, machineTypes, props.initialData]);

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
    if (!props.inline) setOpen(false);
  };

  const formContent = (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Define quantity, date, and select which production paths to include.
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
        <div className="space-y-3">
          <label className="text-sm font-medium">Production Path</label>
          <div className="rounded-md border p-3 space-y-2 bg-muted/30">
            {machineTypes.map((mt) => {
              if (mt.name === "Job Work") {
                return (
                  <div key={mt.name} className="flex items-center gap-2">
                    <Checkbox
                      id={`jobwork-${mt.name}`}
                      checked={includeJobWork}
                      onCheckedChange={(checked) =>
                        setIncludeJobWork(checked === true)
                      }
                    />
                    <label
                      htmlFor={`jobwork-${mt.name}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {mt.name}
                    </label>
                  </div>
                );
              }
              return (
                <div key={mt.name} className="flex items-center gap-2">
                  <Checkbox
                    id={`machine-${mt.name}`}
                    checked={selectedMachines.has(mt.name)}
                    onCheckedChange={() => toggleMachine(mt.name)}
                  />
                  <label
                    htmlFor={`machine-${mt.name}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {mt.name}
                  </label>
                </div>
              );
            })}
            {machineTypes.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No production paths configured. Add them in Settings.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        {props.onCancel && (
          <Button variant="outline" className="mr-2" onClick={props.onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={submit}>{props.initialData ? "Save" : "Create"}</Button>
      </div>
    </>
  );

  if (props.inline) {
    return <div>{formContent}</div>;
  }

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
        footer={<div className="flex justify-end">{props.onCancel && (<Button variant="outline" className="mr-2" onClick={props.onCancel}>Cancel</Button>)}<Button onClick={submit}>{props.initialData ? "Save" : "Create"}</Button></div>}
      >
        {formContent}
      </SimpleModal>
    </>
  );
}
