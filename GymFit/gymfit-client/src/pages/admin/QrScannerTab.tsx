import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanLine, Camera, CameraOff, Mail, User } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MembershipBadge from "@/components/MembershipBadge";
import ErrorMessage from "@/components/ErrorMessage";
import type { QrValidationResponse } from "@/types/api";

const REGION_ID = "qr-reader-region";

export default function QrScannerTab() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QrValidationResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [manualId, setManualId] = useState("");

  const validate = async (userId: string) => {
    if (!userId) return;
    setLookupLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.get<QrValidationResponse>(
        `/api/qr/validate/${userId.trim()}`
      );
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not validate this member."));
    } finally {
      setLookupLoading(false);
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        await scanner.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    setError("");
    setResult(null);
    try {
      const scanner = new Html5Qrcode(REGION_ID);
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await stopScanner();
          validate(decodedText);
        },
        () => {
          /* per-frame decode failures are expected; ignore */
        }
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to access the camera. Check permissions.")
      );
      await stopScanner();
    }
  };

  // Clean up the camera when leaving the tab.
  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Scanner</h1>
        <p className="text-muted-foreground">
          Scan a member's QR code to verify their membership.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ScanLine className="h-5 w-5" /> Scanner
            </CardTitle>
            <CardDescription>
              Point the camera at the member's QR code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              id={REGION_ID}
              className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg border bg-slate-100"
            />
            <div className="flex gap-2">
              {scanning ? (
                <Button variant="outline" className="w-full" onClick={stopScanner}>
                  <CameraOff className="h-4 w-4" /> Stop camera
                </Button>
              ) : (
                <Button className="w-full" onClick={startScanner}>
                  <Camera className="h-4 w-4" /> Start camera
                </Button>
              )}
            </div>

            {/* Manual fallback */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Or enter a member ID manually:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="User ID"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                />
                <Button
                  variant="secondary"
                  disabled={!manualId || lookupLoading}
                  onClick={() => validate(manualId)}
                >
                  Check
                </Button>
              </div>
            </div>

            <ErrorMessage message={error} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
            <CardDescription>Membership verification details.</CardDescription>
          </CardHeader>
          <CardContent>
            {lookupLoading ? (
              <p className="text-sm text-muted-foreground">Validating…</p>
            ) : result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <User className="h-5 w-5" /> {result.fullName}
                  </h3>
                  <MembershipBadge
                    isActive={result.isActive}
                    isExpired={result.isExpired}
                    expiresAt={result.expiresAt}
                  />
                </div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /> {result.email}
                </p>
                <div className="space-y-1 border-t pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activated</span>
                    <span className="font-medium">
                      {result.activatedAt ? formatDate(result.activatedAt) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium">
                      {result.expiresAt ? formatDate(result.expiresAt) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No scan yet. Start the camera or enter an ID to verify a member.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
