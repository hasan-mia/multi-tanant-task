"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  deleteOrganization,
  getOrganizations,
  updateOrganization,
} from "@/features/organizations/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export function OrganizationManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["organizations"] });

  const createMutation = useMutation({
    mutationFn: (name: string) => createOrganization({ name }),
    onSuccess: () => {
      toast.success("Organization created");
      invalidate();
      setCreateOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateOrganization(id, { name }),
    onSuccess: () => {
      toast.success("Organization updated");
      invalidate();
      setEditTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      toast.success("Organization deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const organizations = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {organizations.length} organization
          {organizations.length === 1 ? "" : "s"}
        </p>
        <Button onClick={() => setCreateOpen(true)}>New Organization</Button>
      </div>

      {organizations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organizations yet.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditTarget({ id: org.id, name: org.name })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setDeleteTarget({ id: org.id, name: org.name })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <OrganizationFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create Organization"
        description="Add a new organization (tenant)."
        submitLabel="Create"
        onSubmit={(name) => createMutation.mutate(name)}
        pending={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editTarget && (
        <OrganizationFormDialog
          open
          initialName={editTarget.name}
          onOpenChange={(o) => !o && setEditTarget(null)}
          title="Edit Organization"
          description="Rename this organization."
          submitLabel="Save"
          onSubmit={(name) =>
            updateMutation.mutate({ id: editTarget.id, name })
          }
          pending={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-medium">{deleteTarget?.name}</span>. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function OrganizationFormDialog({
  open,
  initialName = "",
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  pending,
}: {
  open: boolean;
  initialName?: string;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(initialName);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setName(initialName);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="org-name">Name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSubmit(name)}
            disabled={!name.trim() || pending}
          >
            {pending ? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
