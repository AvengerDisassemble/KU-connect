import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  activateUser,
  approveUser,
  createProfessorAccount,
  listUsers,
  rejectUser,
  suspendUser,
} from "@/services/admin";
import type {
  CreateProfessorData,
  CreateProfessorResponse,
  UserFilters,
  UserListResponse,
} from "@/services/admin";
import type { RoleFilterValue } from "./types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import ProfessorFormDialog from "./components/ProfessorFormDialog";
import UserFiltersPanel from "./components/UserFilters";
import UsersTable from "./components/UsersTable";

type UserTab = "all" | "pending" | "approved" | "suspended";

const TABS: Array<{ key: UserTab; label: string; status?: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending", status: "PENDING" },
  { key: "approved", label: "Approved", status: "APPROVED" },
  { key: "suspended", label: "Suspended", status: "SUSPENDED" },
];

const ROLE_OPTIONS: Array<{ value: RoleFilterValue; label: string }> = [
  { value: "ALL_ROLES", label: "All roles" },
  { value: "STUDENT", label: "Student" },
  { value: "EMPLOYER", label: "Employer" },
  { value: "PROFESSOR", label: "Professor" },
  { value: "ADMIN", label: "Admin" },
];

const parseRoleFilter = (value: string | null): RoleFilterValue => {
  switch (value) {
    case "STUDENT":
    case "EMPLOYER":
    case "PROFESSOR":
    case "ADMIN":
      return value;
    default:
      return "ALL_ROLES";
  }
};

const DEFAULT_LIMIT = 20;

const useUserFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as UserTab) || "all";
  const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
  const [role, setRole] = useState<RoleFilterValue>(
    parseRoleFilter(searchParams.get("role"))
  );
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("q") || ""
  );
  const [query, setQuery] = useState<string>(searchParams.get("q") || "");
  const [page, setPage] = useState<number>(
    Number(searchParams.get("page")) || 1
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (activeTab !== "all") next.set("tab", activeTab);
    if (role !== "ALL_ROLES") next.set("role", role);
    if (query) next.set("q", query);
    if (page > 1) next.set("page", String(page));
    setSearchParams(next, { replace: true });
  }, [activeTab, role, query, page, setSearchParams]);

  return {
    activeTab,
    setActiveTab,
    role,
    setRole,
    searchTerm,
    setSearchTerm,
    query,
    setQuery,
    page,
    setPage,
  };
};

const useUserListQuery = (
  filters: UserFilters,
  initialData: UserListResponse
) =>
  useQuery<UserListResponse, Error>({
    queryKey: ["admin", "users", filters],
    queryFn: () => listUsers(filters),
    placeholderData: (previous) => previous ?? initialData,
  });

const buildFilters = (
  activeTab: UserTab,
  role: RoleFilterValue,
  query: string,
  page: number
): UserFilters => {
  const filters: UserFilters = { page, limit: DEFAULT_LIMIT };
  const tabConfig = TABS.find((tab) => tab.key === activeTab);
  if (tabConfig?.status) {
    filters.status = tabConfig.status;
  }
  if (role !== "ALL_ROLES") {
    filters.role = role;
  }
  if (query) {
    filters.search = query;
  }
  return filters;
};

type UserActionVariables = { userId: string; reason?: string };

const useUserMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const approveMutation = useMutation<unknown, Error, UserActionVariables>({
    mutationFn: ({ userId }) => approveUser(userId),
    onSuccess: () => {
      toast.success("User approved");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve user"
      );
    },
  });

  const rejectMutation = useMutation<unknown, Error, UserActionVariables>({
    mutationFn: ({ userId, reason }) => rejectUser(userId, reason),
    onSuccess: () => {
      toast.success("User rejected");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to reject user"
      );
    },
  });

  const suspendMutation = useMutation<unknown, Error, UserActionVariables>({
    mutationFn: ({ userId, reason }) => suspendUser(userId, reason),
    onSuccess: () => {
      toast.success("User suspended");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to suspend user"
      );
    },
  });

  const activateMutation = useMutation<unknown, Error, UserActionVariables>({
    mutationFn: ({ userId }) => activateUser(userId),
    onSuccess: () => {
      toast.success("User activated");
      invalidate();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to activate user"
      );
    },
  });

  return {
    approveMutation,
    rejectMutation,
    suspendMutation,
    activateMutation,
  };
};

const useCreateProfessor = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateProfessorResponse, Error, CreateProfessorData>({
    mutationFn: (payload) => createProfessorAccount(payload),
    onSuccess: (data) => {
      const tempPassword = data.credentials?.temporaryPassword;
      const email = data.user?.email;
      toast.success("Professor account created", {
        description:
          tempPassword && email
            ? `Email: ${email} · Temporary password: ${tempPassword}`
            : tempPassword
            ? `Temporary password: ${tempPassword}`
            : email
            ? `Email: ${email}`
            : undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create professor"
      );
    },
  });
};


const UserManagementPage: React.FC = () => {
  const filtersState = useUserFilters();
  const {
    activeTab,
    setActiveTab,
    role,
    setRole,
    searchTerm,
    setSearchTerm,
    query,
    setQuery,
    page,
    setPage,
  } = filtersState;
  const filters = useMemo(
    () => buildFilters(activeTab, role, query, page),
    [activeTab, role, query, page]
  );
  const queryClient = useQueryClient();

  const initialData = useMemo<UserListResponse>(
    () => ({
      users: [],
      total: 0,
      page,
      limit: filters.limit ?? DEFAULT_LIMIT,
      totalPages: 1,
    }),
    [filters.limit, page]
  );

  const { data, isLoading, isFetching } = useUserListQuery(
    filters,
    initialData
  );

  const resolvedData = data ?? initialData;

  const users = resolvedData.users ?? [];

  const { approveMutation, rejectMutation, suspendMutation, activateMutation } =
    useUserMutations();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const createProfessorMutation = useCreateProfessor();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSearch = () => {
    setQuery(searchTerm.trim());
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, role, setPage]);

  const executeAction = async (
    mutation: UseMutationResult<unknown, Error, UserActionVariables, unknown>,
    userId: string,
    reason?: string
  ) => {
    setBusyUserId(userId);
    try {
      await mutation.mutateAsync({ userId, reason });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleApprove = (userId: string) =>
    executeAction(approveMutation, userId);
  const handleReject = (userId: string) =>
    executeAction(rejectMutation, userId);
  const handleSuspend = (userId: string) =>
    executeAction(suspendMutation, userId);
  const handleActivate = (userId: string) =>
    executeAction(activateMutation, userId);

  const totalPages = resolvedData.totalPages ?? 1;

  const handleProfessorSubmit = async (values: CreateProfessorData) => {
    const payload: CreateProfessorData = {
      ...values,
      password: values.password?.trim() ? values.password.trim() : undefined,
    };

    try {
      await createProfessorMutation.mutateAsync(payload);
      setDialogOpen(false);
      setSearchTerm("");
      setQuery("");
      setPage(1);
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } catch {
      // already handled in mutation
    }
  };

  return (
    <AdminLayout
      title="User Management"
      description="Approve new accounts, suspend misuse, and onboard professors."
      actions={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Professor Account</DialogTitle>
              <DialogDescription>
                Professors receive immediate access to mentoring and
                verification tools.
              </DialogDescription>
            </DialogHeader>
            <ProfessorFormDialog
              onSubmit={handleProfessorSubmit}
              isLoading={createProfessorMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <UserFiltersPanel
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
            role={role}
            onRoleChange={(nextRole: RoleFilterValue) => setRole(nextRole)}
            roleOptions={ROLE_OPTIONS}
            total={resolvedData.total}
            isFetching={isFetching}
          />
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(nextTab: string) => setActiveTab(nextTab as UserTab)}
        className="space-y-6"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="capitalize">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card className="overflow-hidden">
            <UsersTable
              users={users}
              isLoading={isLoading}
              busyUserId={busyUserId}
              onApprove={handleApprove}
              onReject={handleReject}
              onSuspend={handleSuspend}
              onActivate={handleActivate}
            />
          </Card>

          <div className="flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default UserManagementPage;
