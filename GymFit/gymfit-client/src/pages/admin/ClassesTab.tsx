import { useEffect, useState, useCallback, type FormEvent } from "react";
import { CalendarDays, Plus, Trash2, Pencil, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import api, { getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type {
  ClassListItem,
  CreateClassRequest,
  TrainerListItem,
} from "@/types/api";

interface ClassForm {
  name: string;
  description: string;
  capacity: number | string;
  scheduledDate: Date | null;
  scheduledTime: string;
  durationMinutes: number | string;
  trainerIds: string[];
}

const emptyForm: ClassForm = {
  name: "",
  description: "",
  capacity: 10,
  scheduledDate: null,
  scheduledTime: "09:00",
  durationMinutes: 60,
  trainerIds: [],
};

export default function ClassesTab() {
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api.get<ClassListItem[]>("/api/classes"),
        api.get<TrainerListItem[]>("/api/trainers"),
      ]);
      setClasses(c.data);
      setTrainers(t.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load classes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogError("");
    setDialogOpen(true);
  };

  const openEdit = (c: ClassListItem) => {
    setEditingId(c.id);
    const d = c.scheduledAt ? new Date(c.scheduledAt) : null;
    const pad = (n: number) => String(n).padStart(2, "0");
    setForm({
      name: c.name,
      description: c.description || "",
      capacity: c.capacity,
      scheduledDate: d,
      scheduledTime: d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "09:00",
      durationMinutes: c.durationMinutes,
      trainerIds: (c.trainers || []).map((t) => t.id),
    });
    setDialogError("");
    setDialogOpen(true);
  };

  const toggleTrainer = (id: string) => {
    setForm((f) => ({
      ...f,
      trainerIds: f.trainerIds.includes(id)
        ? f.trainerIds.filter((x) => x !== id)
        : [...f.trainerIds, id],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDialogError("");
    if (!form.scheduledDate) {
      setDialogError("Please pick a date.");
      return;
    }
    setSaving(true);
    const [hours, minutes] = (form.scheduledTime || "00:00")
      .split(":")
      .map(Number);
    const dt = new Date(form.scheduledDate);
    dt.setHours(hours, minutes, 0, 0);
    const scheduledAt = dt.toISOString();
    const payload: CreateClassRequest = {
      name: form.name,
      description: form.description,
      capacity: Number(form.capacity),
      scheduledAt,
      durationMinutes: Number(form.durationMinutes),
      trainerIds: form.trainerIds,
    };
    try {
      if (editingId) {
        await api.put(`/api/classes/${editingId}`, payload);
      } else {
        await api.post("/api/classes", payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setDialogError(getErrorMessage(err, "Failed to save class."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: ClassListItem) => {
    if (!window.confirm(`Delete class "${c.name}"?`)) return;
    setRowBusy(c.id);
    try {
      await api.delete(`/api/classes/${c.id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete class."));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Schedule and manage classes.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add class
        </Button>
      </div>

      <ErrorMessage message={error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All classes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner label="Loading classes…" />
          ) : classes.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No classes yet"
              description="Create your first class to populate the schedule."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Trainers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(c.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.durationMinutes} min
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {c.enrolledCount}/{c.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.trainers?.length ? (
                          c.trainers.map((t) => (
                            <Badge key={t.id} variant="outline">
                              {t.fullName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => openEdit(c)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          disabled={rowBusy === c.id}
                          onClick={() => handleDelete(c)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / edit class dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit class" : "Add class"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the class details and assigned trainers."
                : "Create a new class on the schedule."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  required
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  required
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm({ ...form, durationMinutes: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Scheduled at</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !form.scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-6 shrink-0" />
                        {form.scheduledDate
                          ? format(form.scheduledDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.scheduledDate ?? undefined}
                        onSelect={(date) =>
                          setForm({ ...form, scheduledDate: date ?? null })
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    required
                    className="w-28"
                    value={form.scheduledTime}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Trainers</Label>
              {trainers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No trainers available. Add trainers first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trainers.map((t) => {
                    const selected = form.trainerIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTrainer(t.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:bg-accent"
                        )}
                      >
                        {t.fullName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <ErrorMessage message={dialogError} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save changes" : "Create class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
