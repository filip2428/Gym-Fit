import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Phone, CalendarDays, ArrowLeft } from "lucide-react";
import api, { getErrorMessage, resolveAssetUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import type { TrainerDetailResponse } from "@/types/api";

function initials(name: string | undefined): string {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TrainerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<TrainerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<TrainerDetailResponse>(
          `/api/trainers/${id}`
        );
        if (active) setTrainer(data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load trainer."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const handleEnroll = async (classId: string) => {
    setActionError("");
    setEnrollingId(classId);
    try {
      await api.post(`/api/classes/${classId}/enroll`);
      setEnrolledIds((prev) => new Set(prev).add(classId));
    } catch (err) {
      setActionError(getErrorMessage(err, "Could not enroll in this class."));
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) return <Spinner label="Loading profile…" />;
  if (error) return <ErrorMessage message={error} />;
  if (!trainer) return null;

  const classes = trainer.upcomingClasses || [];

  return (
    <div className="space-y-6">
      <Link
        to="/trainers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to trainers
      </Link>

      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-32 w-32">
            <AvatarImage src={resolveAssetUrl(trainer.photoUrl)} alt={trainer.fullName} />
            <AvatarFallback className="text-3xl">
              {initials(trainer.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{trainer.fullName}</h1>
            {trainer.phone && (
              <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                <Phone className="h-4 w-4" /> {trainer.phone}
              </p>
            )}
            {trainer.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{trainer.bio}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-semibold">Upcoming Classes</h2>
        <ErrorMessage message={actionError} className="mb-3" />
        {classes.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming classes"
            description="This trainer has no scheduled classes right now."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((c) => {
              const isFull = c.enrolledCount >= c.capacity;
              const enrolled = enrolledIds.has(c.id);
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      {c.name}
                      <Badge variant="secondary">
                        {c.enrolledCount}/{c.capacity}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatDateTime(c.scheduledAt)} · {c.durationMinutes} min
                    </p>
                    {user?.role === "user" && (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={enrolled || isFull || enrollingId === c.id}
                        onClick={() => handleEnroll(c.id)}
                      >
                        {enrolled
                          ? "Enrolled ✓"
                          : isFull
                          ? "Class full"
                          : enrollingId === c.id
                          ? "Enrolling…"
                          : "Enroll"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
