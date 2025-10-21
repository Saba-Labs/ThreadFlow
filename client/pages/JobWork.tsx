import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useJobWorks,
  getJobWorks,
  setJobWorks,
  addJobWork,
  updateJobWork,
  deleteJobWork,
  type JobWork,
} from "@/lib/jobWorks";
import { Trash2, Save, Plus } from "lucide-react";

export default function JobWork() {
  const list = useJobWorks();
  const [local, setLocal] = useState<JobWork[]>(() => getJobWorks());
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    setLocal(list);
  }, [list]);

  const add = () => {
    if (!newName.trim()) return;
    addJobWork({ name: newName, description: newDesc });
    setNewName("");
    setNewDesc("");
  };

  const saveAll = () => {
    const cleaned = local.map((j) => ({
      ...j,
      name: j.name.trim(),
      description: j.description.trim(),
    }));
    setJobWorks(cleaned);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Work</h1>
        <p className="text-muted-foreground max-w-prose">
          Create, edit, and delete Job Work items.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input placeholder="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={add}><Plus className="h-4 w-4 mr-2"/>Add</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-medium">All Job Works</div>
          <Button variant="outline" size="sm" onClick={saveAll}><Save className="h-4 w-4 mr-2"/>Save</Button>
        </div>
        <div className="divide-y">
          {local.map((j) => (
            <div key={j.id} className="p-3 flex items-center gap-2">
              <div className="flex-1 grid gap-2 sm:grid-cols-2">
                <Input value={j.name} onChange={(e) => setLocal((s)=> s.map((x)=> x.id===j.id? { ...x, name: e.target.value}: x))} />
                <Input value={j.description} onChange={(e) => setLocal((s)=> s.map((x)=> x.id===j.id? { ...x, description: e.target.value}: x))} />
              </div>
              <Button size="icon" variant="ghost" onClick={()=> deleteJobWork(j.id)} title="Delete"><Trash2 className="h-4 w-4"/></Button>
            </div>
          ))}
          {local.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No job works yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
