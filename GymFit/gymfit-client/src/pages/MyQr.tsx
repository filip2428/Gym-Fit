import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import MembershipBadge from "@/components/MembershipBadge";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import type { MembershipStatusResponse, QrCodeResponse } from "@/types/api";

export default function MyQr() {
  const [qr, setQr] = useState<QrCodeResponse | null>(null);
  const [membership, setMembership] = useState<MembershipStatusResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [q, m] = await Promise.all([
          api.get<QrCodeResponse>("/api/qr/generate"),
          api.get<MembershipStatusResponse>("/api/membership/status"),
        ]);
        if (active) {
          setQr(q.data);
          setMembership(m.data);
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load your QR code."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">My QR Code</h1>
        <p className="text-muted-foreground">
          Show this at the front desk to check in.
        </p>
      </div>

      {loading ? (
        <Spinner label="Generating QR…" />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" /> Member Pass
            </CardTitle>
            <CardDescription>Scan to verify membership</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="rounded-lg border bg-white p-4">
              {qr?.qrCodeBase64 ? (
                <img
                  src={qr.qrCodeBase64}
                  alt="Your membership QR code"
                  className="h-56 w-56"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-sm text-muted-foreground">
                  No QR available
                </div>
              )}
            </div>

            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                {membership && (
                  <MembershipBadge
                    isActive={membership.isActive}
                    isExpired={membership.isExpired}
                    expiresAt={membership.expiresAt}
                  />
                )}
              </div>
              {membership?.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">
                    {formatDate(membership.expiresAt)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
