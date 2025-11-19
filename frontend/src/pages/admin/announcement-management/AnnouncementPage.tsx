import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Loader2, Filter, Edit, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  createAnnouncement,
  deleteAnnouncement,
  searchAnnouncements,
  updateAnnouncement,
} from "@/services/admin";
import type {
  AnnouncementItem,
  AnnouncementMutationPayload,
  AnnouncementSearchPayload,
  AnnouncementSearchResult,
  AnnouncementAudience,
} from "@/services/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
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

type StatusFilter = "all" | "active" | "inactive";

type AnnouncementFormValues = {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  priority: "LOW" | "MEDIUM" | "HIGH";
  expiresAt?: string;
};

const DEFAULT_LIMIT = 10;

type AudienceFilterValue = AnnouncementAudience | "ALL_AUDIENCES";

const AUDIENCE_OPTIONS: { label: string; value: AudienceFilterValue }[] = [
  { label: "All audiences", value: "ALL_AUDIENCES" },
  { label: "All Users", value: "ALL" },
  { label: "Students", value: "STUDENTS" },
  { label: "Employers", value: "EMPLOYERS" },
  { label: "Professors", value: "PROFESSORS" },
  { label: "Admins", value: "ADMINS" },
];

const PRIORITY_OPTIONS: Array<AnnouncementFormValues["priority"]> = [
  "LOW",
  "MEDIUM",
  "HIGH",
];

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";

const buildSearchParams = (
  search: string,
  audience: AudienceFilterValue,
  status: StatusFilter,
  page: number
): AnnouncementSearchPayload => {
  const payload: AnnouncementSearchPayload = {
    page,
    limit: DEFAULT_LIMIT,
  };

  if (search.trim()) {
    payload.search = search.trim();
  }

  if (audience !== "ALL_AUDIENCES") {
    payload.audience = audience;
  }

  if (status !== "all") {
    payload.isActive = status === "active";
  }

  return payload;
};

const useAnnouncementsQuery = (payload: AnnouncementSearchPayload) =>
  useQuery<AnnouncementSearchResult, Error>({
    queryKey: ["admin", "announcements", payload],
    queryFn: () => searchAnnouncements(payload),
    placeholderData: (previous) => previous,
  });

const AnnouncementForm: React.FC<{
  defaultValues: AnnouncementFormValues;
  onSubmit: SubmitHandler<AnnouncementFormValues>;
  isSubmitting: boolean;
}> = ({ defaultValues, onSubmit, isSubmitting }) => {
  const form = useForm<AnnouncementFormValues>({
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          rules={{ required: "Title is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Announcement title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          rules={{ required: "Content is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  rows={5}
                  placeholder="Write the announcement..."
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
            name="audience"
            rules={{ required: "Audience is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIENCE_OPTIONS.filter(
                        (option) => option.value !== "ALL_AUDIENCES"
                      ).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Save Announcement
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const AnnouncementManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceFilter, setAudienceFilter] =
    useState<AudienceFilterValue>("ALL_AUDIENCES");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<AnnouncementItem | null>(null);

  const queryClient = useQueryClient();

  const searchPayload = useMemo(
    () => buildSearchParams(searchTerm, audienceFilter, statusFilter, page),
    [searchTerm, audienceFilter, statusFilter, page]
  );

  const { data, isLoading, isFetching } = useAnnouncementsQuery(searchPayload);

  const announcements = data?.announcements ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  };

  const invalidateAnnouncements = () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin", "announcements"],
    });
  };

  const createMutation = useMutation({
    mutationFn: (payload: AnnouncementMutationPayload) =>
      createAnnouncement(payload),
    onSuccess: () => {
      toast.success("Announcement created");
      invalidateAnnouncements();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create announcement"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AnnouncementMutationPayload>;
    }) => updateAnnouncement(id, payload),
    onSuccess: () => {
      toast.success("Announcement updated");
      invalidateAnnouncements();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update announcement"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (announcementId: string) => deleteAnnouncement(announcementId),
    onSuccess: () => {
      toast.success("Announcement deleted");
      invalidateAnnouncements();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete announcement"
      );
    },
  });

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: AnnouncementItem) => {
    setEditingAnnouncement(announcement);
    setIsDialogOpen(true);
  };

  const handleSubmit: SubmitHandler<AnnouncementFormValues> = async (
    values
  ) => {
    const payload: AnnouncementMutationPayload = {
      title: values.title,
      content: values.content,
      audience: values.audience,
      priority: values.priority,
      expiresAt: values.expiresAt ? `${values.expiresAt}T00:00:00Z` : null,
    };

    if (editingAnnouncement) {
      await updateMutation.mutateAsync({ id: editingAnnouncement.id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const resetPageAndSearch = () => {
    setPage(1);
  };

  const totalPages = pagination.totalPages || 1;

  return (
    <AdminLayout
      title="Announcement Management"
      description="Create announcements and ensure news reaches the right audience."
      actions={
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAnnouncement(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement
                  ? "Edit Announcement"
                  : "Create Announcement"}
              </DialogTitle>
              <DialogDescription>
                Broadcast announcements to students, employers, professors, or
                all users.
              </DialogDescription>
            </DialogHeader>
            <AnnouncementForm
              key={editingAnnouncement?.id ?? "new"}
              defaultValues={
                editingAnnouncement
                  ? {
                      title: editingAnnouncement.title,
                      content: editingAnnouncement.content,
                      audience: editingAnnouncement.audience,
                      priority: editingAnnouncement.priority,
                      expiresAt: editingAnnouncement.expiresAt
                        ? new Date(editingAnnouncement.expiresAt)
                            .toISOString()
                            .slice(0, 10)
                        : undefined,
                    }
                  : {
                      title: "",
                      content: "",
                      audience: "ALL",
                      priority: "MEDIUM",
                    }
              }
              onSubmit={handleSubmit}
              isSubmitting={
                createMutation.isPending || updateMutation.isPending
              }
            />
          </DialogContent>
        </Dialog>
      }
    >
      <Card>
        <CardContent className="gap-4 pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Filter className="h-3 w-3" /> Audience
                </label>
                <Select
                  value={audienceFilter}
                  onValueChange={(value) => {
                    setAudienceFilter(value as AudienceFilterValue);
                    resetPageAndSearch();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All audiences" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.label} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as StatusFilter);
                    resetPageAndSearch();
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Keyword
                </label>
                <Input
                  placeholder="Search announcements"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    resetPageAndSearch();
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>{pagination.total} announcements</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground"
                >
                  No announcements found.
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">
                        {announcement.title}
                      </span>
                      <span
                        className="max-w-[320px] break-words text-xs text-muted-foreground line-clamp-2"
                        title={announcement.content}
                      >
                        {announcement.content}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{announcement.audience}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        announcement.priority === "HIGH"
                          ? "bg-red-100 text-red-600"
                          : announcement.priority === "MEDIUM"
                          ? "bg-teal-100 text-teal-700"
                          : "bg-lime-100 text-lime-700"
                      }
                    >
                      {announcement.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(announcement.expiresAt)}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(announcement.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete announcement?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The announcement
                              will be removed from all audiences.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate(announcement.id)
                              }
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-muted-foreground">
          Page {pagination.page} of {totalPages}
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
    </AdminLayout>
  );
};

export default AnnouncementManagementPage;
