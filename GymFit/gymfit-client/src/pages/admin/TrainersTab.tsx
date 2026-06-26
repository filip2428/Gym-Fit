import {
  useEffect,
  useState,
  useCallback,
  useRef,
  type FormEvent,
} from "react";
import { Dumbbell, Plus, Upload, Trash2, Pencil, Check, X } from "lucide-react";
import api, { getErrorMessage, resolveAssetUrl } from "@/lib/api";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import type { TrainerListItem } from "@/types/api";

interface TrainerForm {
  fullName: string;
  email: string;
  password: string;
  bio: string;
  phone: string;
}

const emptyForm: TrainerForm = {
  fullName: "",
  email: "",
  password: "",
  bio: "",
  phone: "",
};

function initials(name: string | undefined): string {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TrainersTab() {
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<TrainerForm>(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const photoInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<TrainerListItem[]>("/api/trainers");
      setTrainers(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load trainers."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setDialogError("");
    setSaving(true);
    try {
      const { data: created } = await api.post<TrainerListItem>(
        "/api/trainers",
        form
      );
      if (photo) {
        const fd = new FormData();
        fd.append("file", photo);
        await api.post(`/api/trainers/${created.id}/photo`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setAddOpen(false);
      setForm(emptyForm);
      setPhoto(null);
      await load();
    } catch (err) {
      setDialogError(getErrorMessage(err, "Failed to create trainer."));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (t: TrainerListItem) => {
    setEditingId(t.id);
    setEditBio(t.bio || "");
    setEditPhone(t.phone || "");
  };

  const saveEdit = async (t: TrainerListItem) => {
    setRowBusy(t.id);
    try {
      await api.put(`/api/trainers/${t.id}`, { bio: editBio, phone: editPhone });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update trainer."));
    } finally {
      setRowBusy(null);
    }
  };

  const handleDelete = async (t: TrainerListItem) => {
    if (!window.confirm(`Remove ${t.fullName} as a trainer?`)) return;
    setRowBusy(t.id);
    try {
      await api.delete(`/api/trainers/${t.id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete trainer."));
    } finally {
      setRowBusy(null);
    }
  };

  const handlePhotoUpload = async (
    t: TrainerListItem,
    file: File | undefined
  ) => {
    if (!file) return;
    setRowBusy(t.id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/api/trainers/${t.id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload photo."));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trainers</h1>
          <p className="text-muted-foreground">Manage your training team.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add trainer
        </Button>
      </div>

      <ErrorMessage message={error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All trainers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner label="Loading trainers…" />
          ) : trainers.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No trainers yet"
              description="Add your first trainer to get started."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainers.map((t) => {
                  const editing = editingId === t.id;
                  const busy = rowBusy === t.id;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={resolveAssetUrl(t.photoUrl)} alt={t.fullName} />
                            <AvatarFallback>{initials(t.fullName)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{t.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {editing ? (
                          <Input
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Bio"
                          />
                        ) : (
                          <span className="line-clamp-2 text-muted-foreground">
                            {t.bio || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editing ? (
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Phone"
                          />
                        ) : (
                          <span className="text-muted-foreground">
                            {t.phone || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {editing ? (
                            <>
                              <Button
                                size="icon"
                                variant="default"
                                disabled={busy}
                                onClick={() => saveEdit(t)}
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                ref={(el) => {
                                  photoInputs.current[t.id] = el;
                                }}
                                onChange={(e) =>
                                  handlePhotoUpload(t, e.target.files?.[0])
                                }
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                disabled={busy}
                                onClick={() => photoInputs.current[t.id]?.click()}
                                title="Upload photo"
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => startEdit(t)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => handleDelete(t)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add trainer dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add trainer</DialogTitle>
            <DialogDescription>
              Creates a trainer account and profile.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <ErrorMessage message={dialogError} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create trainer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
