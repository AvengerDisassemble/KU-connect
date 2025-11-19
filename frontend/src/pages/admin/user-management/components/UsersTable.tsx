import { Eye, MoreHorizontal, UsersRound } from "lucide-react";

import type { UserManagementItem } from "@/services/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onPreviewTranscript: (userId: string) => void;
  onPreviewVerification: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  isLoading,
  busyUserId,
  onApprove,
  onReject,
  onSuspend,
  onActivate,
  onPreviewTranscript,
  onPreviewVerification,
}) => {
  const getPrimaryActionKey = (status: string): string => {
    switch (status) {
      case "APPROVED":
        return "suspend";
      case "SUSPENDED":
      case "REJECTED":
        return "activate";
      case "PENDING":
      default:
        return "approve";
    }
  };

  const renderRow = (user: UserManagementItem) => {
    const isBusy = busyUserId === user.id;

    const actionDefinitions = [
      {
        key: "approve",
        label: "Approve",
        onClick: () => onApprove(user.id),
        disabled: isBusy || user.status === "APPROVED",
      },
      {
        key: "reject",
        label: "Reject",
        onClick: () => onReject(user.id),
        disabled: isBusy || user.status === "REJECTED",
      },
      {
        key: "suspend",
        label: "Suspend",
        onClick: () => onSuspend(user.id),
        disabled: isBusy || user.status === "SUSPENDED",
      },
      {
        key: "activate",
        label: "Activate",
        onClick: () => onActivate(user.id),
        disabled: isBusy || user.status === "APPROVED",
      },
    ];

    const primaryKey = getPrimaryActionKey(user.status);
    const primaryAction = actionDefinitions.find(
      (action) => action.key === primaryKey
    );
    const secondaryActions = actionDefinitions.filter(
      (action) => action.key !== primaryKey
    );

    const documentActions: Array<{
      key: string;
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }> = [];
    if (user.role === "STUDENT" && user.hasTranscript) {
      documentActions.push({
        key: "transcript",
        label: "Transcript",
        onClick: () => onPreviewTranscript(user.id),
        disabled: isBusy,
      });
    }
    if (user.role === "EMPLOYER" && user.hasVerificationDoc) {
      documentActions.push({
        key: "verification",
        label: "Verification",
        onClick: () => onPreviewVerification(user.id),
        disabled: isBusy,
      });
    }

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
          <div className="flex flex-col gap-2">
            {documentActions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {documentActions.map((action) => (
                  <Button
                    key={action.key}
                    size="sm"
                    variant="ghost"
                    className="h-8 border border-dashed"
                    onClick={action.onClick}
                    disabled={action.disabled}
                  >
                    <Eye className="mr-2 h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                ))}
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              {primaryAction ? (
                <Button
                  size="sm"
                  variant={
                    primaryAction.key === "approve" ? "default" : "secondary"
                  }
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                </Button>
              ) : null}
              {secondaryActions.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2"
                      disabled={isBusy}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {secondaryActions.map((action) => (
                      <DropdownMenuItem
                        key={action.key}
                        onSelect={(event) => {
                          event.preventDefault();
                          action.onClick();
                        }}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>
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
