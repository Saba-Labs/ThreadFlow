import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useMachineTypes,
  getMachineTypes,
  setMachineTypes,
  type MachineTypeConfig,
} from "@/lib/machineTypes";
import { Trash2, Plus, GripVertical, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SettingsProductionPath() {
  const types = useMachineTypes();
  const [local, setLocal] = useState<MachineTypeConfig[]>(() =>
    getMachineTypes(),
  );
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

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
  const remove = (idx: number) =>
    setLocal((s) => s.filter((_, i) => i !== idx));

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    setLocal((s) => {
      const arr = s.slice();
      const dragged = arr[draggedIdx];
      arr.splice(draggedIdx, 1);
      arr.splice(targetIdx, 0, dragged);
      return arr;
    });
    setDraggedIdx(null);
  };

  const save = () => {
    const cleaned = local
      .filter((c) => c.name.trim() && c.letter.trim())
      .map((c) => ({ name: c.name.trim(), letter: c.letter.trim() }));
    if (cleaned.length === 0) return;
    setMachineTypes(cleaned);
    alert("Production path saved");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Production Path
          </h1>
          <p className="text-muted-foreground max-w-prose">
            Add, reorder or remove steps used in production paths.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/settings">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
          </Link>
        </Button>
      </div>

      <section className="rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-medium">Steps</h2>
            <p className="text-sm text-muted-foreground">
              Configure the machines and job work order.
            </p>
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
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-move ${
                draggedIdx === i
                  ? "bg-primary/10 border-primary"
                  : "bg-transparent border-transparent hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Path name"
                  value={t.name}
                  onChange={(e) => updateName(i, e.target.value)}
                />
              </div>
              <div className="w-14">
                <Input
                  placeholder="Letter"
                  maxLength={3}
                  value={t.letter}
                  onChange={(e) => updateLetter(i, e.target.value)}
                  className="text-center text-sm"
                />
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
