import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleModal from "@/components/ui/SimpleModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
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
  const [path, setPath] = useState<NewPathStep[]>([]);

  const machineTypes = useMachineTypes();
  const machineOptions = useMemo(
    () => machineTypes.filter((m) => m.name !== "Job Work").map((m) => m.name),
    [machineTypes],
  );

  // populate default path when modal opens if path is empty
  useEffect(() => {
    if (open && path.length === 0 && machineOptions.length > 0) {
      setPath(machineOptions.map((m) => ({ kind: "machine", machineType: m })));
    }
  }, [open, machineOptions]);

  const addStep = (next: NewPathStep) => setPath((p) => [...p, next]);
  const removeStep = (i: number) =>
    setPath((p) => p.filter((_, idx) => idx !== i));

  const reset = () => {
    setModelName("");
    setQuantity(100);
    setDateStr(new Date().toISOString().slice(0, 10));
    setPath([{ kind: "machine", machineType: "Singer" }]);
  };

  const submit = () => {
    if (!modelName.trim()) return;
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
