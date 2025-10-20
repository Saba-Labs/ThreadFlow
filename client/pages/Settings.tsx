import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMachineTypes, getMachineTypes, setMachineTypes, type MachineTypeConfig } from "@/lib/machineTypes";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";

export default function Settings() {
  const types = useMachineTypes();
  const [local, setLocal] = useState<MachineTypeConfig[]>(() => getMachineTypes());

  // keep local in sync if global changes externally
  useEffect(() => {
    try {
      if (JSON.stringify(local) !== JSON.stringify(types)) {
        setLocal(types);
      }
    } catch (_) {}
  }, [types]);

  const updateName = (idx: number, name: string) => {
    setLocal((s) => s.map((x, i) => (i === idx ? { ...x, name } : x)));
  };

  const updateLetter = (idx: number, letter: string) => {
    setLocal((s) => s.map((x, i) => (i === idx ? { ...x, letter } : x)));
  };

  const add = () => setLocal((s) => [...s, { name: "New Step", letter: "N" }]);
  const remove = (idx: number) => setLocal((s) => s.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) =>
    setLocal((s) => {
      const arr = s.slice();
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return arr;
      const tmp = arr[idx];
      arr[idx] = arr[j];
      arr[j] = tmp;
      return arr;
    });

  const save = () => {
    const cleaned = local
      .filter((c) => c.name.trim() && c.letter.trim())
      .map((c) => ({
        name: c.name.trim(),
        letter: c.letter.trim(),
      }));
    if (cleaned.length === 0) return;
    setMachineTypes(cleaned);
    alert("Production path saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground max-w-prose">
          Configure user roles, default machine sequences, and job work units
          here. Changes to the production path are saved to your browser and
          will be applied immediately.
        </p>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-medium">Production Path</h2>
            <p className="text-sm text-muted-foreground">Add, reorder or remove steps used in production paths.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={add} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Step
            </Button>
            <Button variant="default" size="sm" onClick={save}>
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {local.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1">
                <Input value={t} onChange={(e) => update(i, e.target.value)} />
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === local.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
