import { useEffect, useState } from "react";
import { CalendarDays, Users, Clock, Mail } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import type { EnrolledStudent, TrainerClassItem } from "@/types/api";

export default function TrainerDashboard() {
  const [classes, setClasses] = useState<TrainerClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<TrainerClassItem | null>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<TrainerClassItem[]>(
          "/api/trainer/my-classes"
        );
        if (active) setClasses(data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load your classes."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openClass = async (cls: TrainerClassItem) => {
    setSelected(cls);
    setStudents([]);
    setStudentsError("");
    setStudentsLoading(true);
    try {
      const { data } = await api.get<EnrolledStudent[]>(
        `/api/trainer/my-classes/${cls.id}/students`
      );
      setStudents(data);
    } catch (err) {
      setStudentsError(getErrorMessage(err, "Failed to load students."));
    } finally {
      setStudentsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <p className="text-muted-foreground">
          Classes you are assigned to. Click one to see enrolled students.
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading your classes…" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes assigned"
          description="You haven't been assigned to any classes yet."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDateTime(c.scheduledAt)}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {c.durationMinutes} min
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {c.enrolledCount}/{c.capacity} enrolled
                </p>
                <div className="mt-auto pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openClass(c)}
                  >
                    View students
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected && formatDateTime(selected.scheduledAt)} · Enrolled students
            </DialogDescription>
          </DialogHeader>

          {studentsLoading ? (
            <Spinner label="Loading students…" />
          ) : studentsError ? (
            <ErrorMessage message={studentsError} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No students enrolled"
              description="No one has enrolled in this class yet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.userId}>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" /> {s.email}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">{students.length} enrolled</Badge>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
