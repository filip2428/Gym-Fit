import { useEffect, useState, useCallback } from "react";
import { Users } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import MembershipBadge from "@/components/MembershipBadge";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";

export default function MembersTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activateTarget, setActivateTarget] = useState(null);
  const [durationDays, setDurationDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users", { params: { role: "user" } });
      setMembers(data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load members."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleActivate = async () => {
    setDialogError("");
    setSaving(true);
    try {
      await api.post("/api/membership/activate", {
        userId: activateTarget.userId,
        durationDays: Number(durationDays),
      });
      setActivateTarget(null);
      await load();
    } catch (err) {
      setDialogError(getErrorMessage(err, "Failed to activate membership."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member) => {
    setBusyId(member.userId);
    try {
      await api.patch("/api/membership/deactivate", { userId: member.userId });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to deactivate membership."));
    } finally {
      setBusyId(null);
    }
  };

  const openActivate = (member) => {
    setDurationDays(30);
    setDialogError("");
    setActivateTarget(member);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground">Manage member memberships.</p>
      </div>

      <ErrorMessage message={error} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Spinner label="Loading members…" />
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Registered users will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.userId}>
                    <TableCell className="font-medium">{m.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      <MembershipBadge
                        isActive={m.isActive}
                        isExpired={m.isExpired}
                        expiresAt={m.expiresAt}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.expiresAt ? formatDate(m.expiresAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => openActivate(m)}>
                          Activate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!m.isActive || busyId === m.userId}
                          onClick={() => handleDeactivate(m)}
                        >
                          Deactivate
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

      <Dialog
        open={!!activateTarget}
        onOpenChange={(o) => !o && setActivateTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate membership</DialogTitle>
            <DialogDescription>
              Set the membership duration for {activateTarget?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (days)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
          <ErrorMessage message={dialogError} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={saving || !durationDays}>
              {saving ? "Activating…" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
