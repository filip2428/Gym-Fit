import { Badge } from "@/components/ui/badge";
import { isExpired as checkExpired } from "@/lib/dates";

/**
 * Derives membership state and renders the matching badge.
 * active = green, expired = orange, inactive = red.
 * Accepts either an explicit `isExpired` flag (from the API) or an `expiresAt` date.
 */
export default function MembershipBadge({ isActive, expiresAt, isExpired }) {
  const expired =
    typeof isExpired === "boolean" ? isExpired : checkExpired(expiresAt);

  if (isActive && expired) {
    return <Badge variant="warning">Expired</Badge>;
  }
  if (isActive) {
    return <Badge variant="success">Active</Badge>;
  }
  return <Badge variant="danger">Inactive</Badge>;
}
