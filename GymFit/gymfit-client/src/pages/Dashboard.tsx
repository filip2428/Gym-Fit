import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, QrCode, Dumbbell, CalendarCheck } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatDateTime } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MembershipBadge from "@/components/MembershipBadge";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";
import type { ClassListItem, MembershipStatusResponse } from "@/types/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<MembershipStatusResponse | null>(
    null
  );
  const [classes, setClasses] = useState<ClassListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [m, c] = await Promise.all([
          api.get<MembershipStatusResponse>("/api/membership/status"),
          api.get<ClassListItem[]>("/api/classes/enrolled"),
        ]);
        if (active) {
          setMembership(m.data);
          setClasses(c.data);
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load your dashboard."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">Here's your gym at a glance.</p>
      </div>

      <ErrorMessage message={error} />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Membership status */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Membership
              {membership && (
                <MembershipBadge
                  isActive={membership.isActive}
                  isExpired={membership.isExpired}
                  expiresAt={membership.expiresAt}
                />
              )}
            </CardTitle>
            <CardDescription>Your current plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {membership?.activatedAt ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activated</span>
                  <span className="font-medium">{formatDate(membership.activatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">{formatDate(membership.expiresAt)}</span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Your membership is not active yet. Please contact the front desk.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/classes">
                <Dumbbell className="h-4 w-4" /> Browse classes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/my-qr">
                <QrCode className="h-4 w-4" /> View my QR
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/trainers">
                <CalendarDays className="h-4 w-4" /> Our trainers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled classes */}
      <div>
        <h2 className="mb-3 text-xl font-semibold">My classes</h2>
        {classes.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="You're not enrolled in any classes"
            description="Browse the schedule and join a class to get started."
          >
            <Button asChild size="sm">
              <Link to="/classes">Browse classes</Link>
            </Button>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDateTime(c.scheduledAt)}
                  </p>
                  <p>{c.durationMinutes} min</p>
                  {c.trainers?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {c.trainers.map((t) => (
                        <Badge key={t.id} variant="secondary">
                          {t.fullName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
