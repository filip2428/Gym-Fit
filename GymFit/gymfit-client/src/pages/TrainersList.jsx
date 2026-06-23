import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import api, { getErrorMessage, resolveAssetUrl } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import EmptyState from "@/components/EmptyState";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TrainersList() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/api/trainers");
        if (active) setTrainers(data);
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load trainers."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Our Trainers</h1>
        <p className="text-muted-foreground">
          Meet the people who will push you to your best.
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading trainers…" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : trainers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No trainers yet"
          description="Check back soon — our team is growing."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((t) => (
            <Link key={t.id} to={`/trainers/${t.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={resolveAssetUrl(t.photoUrl)} alt={t.fullName} />
                    <AvatarFallback className="text-xl">
                      {initials(t.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{t.fullName}</h3>
                    {t.bio && (
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                        {t.bio}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
