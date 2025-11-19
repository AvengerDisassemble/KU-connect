import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Search, UsersRound } from "lucide-react";
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
  UserManagementItem,
} from "@/services/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

type UserTab = "all" | "pending" | "approved" | "suspended";
type RoleFilterValue =
  | "ALL_ROLES"
  | "STUDENT"
  | "EMPLOYER"
  | "PROFESSOR"
  | "ADMIN";

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

const ProfessorFormDialog: React.FC<{
  onSubmit: (values: CreateProfessorData) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const form = useForm<CreateProfessorData>({
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      department: "",
      title: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: "Name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="surname"
            rules={{ required: "Surname is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surname</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          rules={{ required: "Email is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="professor@ku.th" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password (optional)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to auto-generate"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Assistant Professor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create Professor
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const renderUserRow = (
  user: UserManagementItem,
  handleApprove: (userId: string) => void,
  handleReject: (userId: string) => void,
  handleSuspend: (userId: string) => void,
  handleActivate: (userId: string) => void,
  busyUserId: string | null
) => {
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
            onClick={() => handleApprove(user.id)}
            disabled={isBusy || user.status === "APPROVED"}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReject(user.id)}
            disabled={isBusy || user.status === "REJECTED"}
          >
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSuspend(user.id)}
            disabled={isBusy || user.status === "SUSPENDED"}
          >
            Suspend
          </Button>
          <Button
            size="sm"
            onClick={() => handleActivate(user.id)}
            disabled={isBusy || user.status === "APPROVED"}
          >
            Activate
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
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
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid w-full gap-3 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Search
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name or email"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as RoleFilterValue)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{resolvedData.total} users</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={(next) => setActiveTab(next as UserTab)}
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
                  users.map((user) =>
                    renderUserRow(
                      user,
                      handleApprove,
                      handleReject,
                      handleSuspend,
                      handleActivate,
                      busyUserId
                    )
                  )
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
