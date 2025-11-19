import { UsersRound } from "lucide-react";

import type { UserManagementItem } from "@/services/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const mapStatusVariant = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "secondary" as const;
    case "PENDING":
      return "outline" as const;
    case "SUSPENDED":
    case "REJECTED":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

interface UsersTableProps {
  users: UserManagementItem[];
  isLoading: boolean;
  busyUserId: string | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onSuspend: (userId: string) => void;
  onActivate: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  busyUserId,
  onApprove,
  onReject,
  onSuspend,
  onActivate,
}) => {
  const renderRow = (user: UserManagementItem) => {
    const isBusy = busyUserId === user.id;
    return (
      <TableRow key={user.id} data-state={isBusy ? "selected" : undefined}>
        <TableCell>
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {user.name} {user.surname ?? ""}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>{user.role}</TableCell>
        <TableCell>
          <Badge variant={mapStatusVariant(user.status)}>{user.status}</Badge>
        </TableCell>
        <TableCell>{user.verified ? "Yes" : "No"}</TableCell>
        <TableCell>
          {new Date(user.createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onApprove(user.id)}
              disabled={isBusy || user.status === "APPROVED"}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(user.id)}
              disabled={isBusy || user.status === "REJECTED"}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSuspend(user.id)}
              disabled={isBusy || user.status === "SUSPENDED"}
            >
              Suspend
            </Button>
            <Button
              size="sm"
              onClick={() => onActivate(user.id)}
              disabled={isBusy || user.status === "APPROVED"}
            >
              Activate
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          [...Array(6)].map((_, idx) => (
            <TableRow key={idx}>
              <TableCell colSpan={6}>
                <Skeleton className="h-10 w-full" />
              </TableCell>
            </TableRow>
          ))
        ) : users.length > 0 ? (
          users.map((user) => renderRow(user))
        ) : (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-sm text-muted-foreground"
            >
              No users found for the selected filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default UsersTable;
