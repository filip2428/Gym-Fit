import { useEffect, useState, useCallback } from "react";
import { CalendarDays, Users, Clock, Dumbbell } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        api.get("/api/classes"),
        api.get("/api/classes/enrolled"),
      ]);
      setClasses(all.data);
      setEnrolledIds(new Set(mine.data.map((c) => c.id)));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load classes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (cls, enrolled) => {
    setActionError("");
    setBusyId(cls.id);
    try {
      if (enrolled) {
        await api.delete(`/api/classes/${cls.id}/unenroll`);
      } else {
        await api.post(`/api/classes/${cls.id}/enroll`);
      }
      // Refresh the list so counts and enrollment state stay accurate.
      await load();
    } catch (err) {
      setActionError(
        getErrorMessage(
          err,
          enrolled ? "Could not unenroll." : "Could not enroll in this class."
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
        <p className="text-muted-foreground">Find a session and book your spot.</p>
      </div>

      <ErrorMessage message={actionError} />

      {loading ? (
        <Spinner label="Loading classes…" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No classes yet"
          description="There are no classes on the schedule right now."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const enrolled = enrolledIds.has(c.id);
            const isFull = c.enrolledCount >= c.capacity;
            const busy = busyId === c.id;
            return (
              <Card key={c.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span>{c.name}</span>
                    {enrolled && <Badge variant="success">Enrolled</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                  {c.description && (
                    <p className="line-clamp-2">{c.description}</p>
                  )}
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDateTime(c.scheduledAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {c.durationMinutes} min
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {c.enrolledCount}/{c.capacity} enrolled
                  </p>
                  {c.trainers?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.trainers.map((t) => (
                        <Badge key={t.id} variant="secondary">
                          {t.fullName}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    <Button
                      className="w-full"
                      variant={enrolled ? "outline" : "default"}
                      disabled={busy || (!enrolled && isFull)}
                      onClick={() => handleToggle(c, enrolled)}
                    >
                      {busy
                        ? "Working…"
                        : enrolled
                        ? "Unenroll"
                        : isFull
                        ? "Class full"
                        : "Enroll"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
