"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/features/tasks/api";
import { Can } from "@/components/common/can";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"];

export function CreateTaskDialog({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createTask(projectId, {
        title,
        priority,
        status,
        due_date: dueDate || undefined,
      }),
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      setOpen(false);
      setTitle("");
      setPriority("MEDIUM");
      setStatus("TODO");
      setDueDate("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Can permission="tasks.create">
      <>
        <Button onClick={() => setOpen(true)}>New Task</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a task to this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Implement login flow"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v ?? "MEDIUM")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v ?? "TODO")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="due">Due date</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!title || mutation.isPending}
            >
              {mutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </Can>
  );
}
