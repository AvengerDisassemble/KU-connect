import { BASE_URL } from "@/lib/config";
import { refreshAccessToken } from "@/services/auth";

/** Generic API */
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location: string;
  jobType: string; // e.g. "internship"
  workArrangement: string; // e.g. "hybrid"
  duration?: string;
  minSalary?: number;
  maxSalary?: number;
  application_deadline?: string; // ISO string "2025-12-31T23:59:59Z"
  email?: string;
  phone_number?: string;
  other_contact_information?: string | null;
  requirements?: string[];
  qualifications?: string[];
  responsibilities?: string[];
  benefits?: string[];
  tags?: string[]; // ["backend", "nodejs", "internship"]
}

export interface CreatedJobResponse {
  id: string;
  hrId: string;
  title: string;
  companyName?: string;
  description: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  application_deadline?: string | null;
  email?: string | null;
  phone_number?: string | null;
  other_contact_information?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Internal helpers */
const buildRequestInit = (init?: RequestInit): RequestInit => {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    else headers.delete("Authorization");
  }

  return { ...init, headers, credentials: "include" };
};

const authorizedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
  let response = await fetch(input, buildRequestInit(init));
  if (response.status === 401) {
    try {
      await refreshAccessToken();
    } catch {
      throw new Error("Session expired. Please log in again.");
    }
    response = await fetch(input, buildRequestInit(init));
  }
  return response;
};

/** APIs */

// POST /api/job
// Job interfaces for browsing
export interface Job {
  id: string;
  title: string;
  companyName: string;
  location: string;
  jobType: string;
  workArrangement: string;
  duration?: string | null;
  minSalary?: number | null;
  maxSalary?: number | null;
  application_deadline?: string | null;
  email?: string | null;
  phone_number?: string | null;
  other_contact_information?: string | null;
  description: string;
  requirements?: string[] | null;
  qualifications?: string[] | null;
  responsibilities?: string[] | null;
  benefits?: string[] | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
  isApplied?: boolean;
  _count?: {
    applications: number;
  } | null;
}

export interface JobFilters {
  search?: string;
  keyword?: string;
  location?: string;
  jobType?: string;
  workArrangement?: string;
  minSalary?: number;
  maxSalary?: number;
  remoteOnly?: boolean;
  hasBenefits?: boolean;
  jobTypes?: string[];
  experienceLevels?: string[];
  fields?: string[];
  locations?: string[];
  salaryRange?:
    | {
        min?: number;
        max?: number;
      }
    | [number, number];
  workArrangements?: string[];
  companies?: string[];
  tags?: string[];
  datePosted?: string; // 'today', 'week', 'month'
  deadline?: {
    before?: string; // ISO date
    after?: string;
  };
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface JobDetailResponse extends Job {
  hr: {
    id: string;
    companyName: string;
    description?: string | null;
    address: string;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
  } | null;
  applicationCount: number;
  isApplied?: boolean;
  isSaved?: boolean;
}

const parseNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

type RelationText = { text?: string | null };
type RelationTag = { name?: string | null };

type RawJob = {
  id?: string;
  title?: string;
  companyName?: string;
  location?: string;
  jobType?: string;
  workArrangement?: string;
  duration?: string | null;
  minSalary?: number | string | null;
  maxSalary?: number | string | null;
  application_deadline?: string | null;
  email?: string | null;
  phone_number?: string | null;
  other_contact_information?: string | null;
  description?: string;
  requirements?: Array<RelationText | string> | null;
  qualifications?: Array<RelationText | string> | null;
  responsibilities?: Array<RelationText | string> | null;
  benefits?: Array<RelationText | string> | null;
  tags?: Array<RelationTag | string> | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    applications?: number;
  } | null;
  hr?: {
    id?: string;
    companyName?: string;
    description?: string | null;
    address?: string;
    industry?: string | null;
    companySize?: string | null;
    website?: string | null;
    user?: {
      companyName?: string | null;
    } | null;
  } | null;
  applicationCount?: number;
  isSaved?: boolean;
  isApplied?: boolean;
};

type ListJobsResponseData = {
  jobs?: RawJob[];
  items?: RawJob[];
  results?: RawJob[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
};

const toStringArray = (
  value?: Array<RelationText | string> | null
): string[] | null => {
  if (!Array.isArray(value)) return null;

  const result = value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && typeof item.text === "string")
        return item.text.trim();
      return null;
    })
    .filter((entry): entry is string => Boolean(entry));

  return result.length ? result : null;
};

const extractTags = (
  value?: Array<RelationTag | string> | null
): string[] | null => {
  if (!Array.isArray(value)) return null;

  const result = value
    .map((tag) => {
      if (typeof tag === "string") return tag.trim();
      if (tag && typeof tag === "object" && typeof tag.name === "string")
        return tag.name.trim();
      return null;
    })
    .filter((entry): entry is string => Boolean(entry));

  return result.length ? result : null;
};

const normalizeJob = (rawJob: RawJob): Job => {
  const requirements = toStringArray(rawJob?.requirements);
  const qualifications = toStringArray(rawJob?.qualifications);
  const responsibilities = toStringArray(rawJob?.responsibilities);
  const benefits = toStringArray(rawJob?.benefits);
  const tags = extractTags(rawJob?.tags);

  const createdAt =
    typeof rawJob?.createdAt === "string"
      ? rawJob.createdAt
      : new Date().toISOString();

  const updatedAt =
    typeof rawJob?.updatedAt === "string" ? rawJob.updatedAt : createdAt;

  const minSalary = parseNullableNumber(rawJob?.minSalary);
  const maxSalary = parseNullableNumber(rawJob?.maxSalary);

  const applicationCount =
    typeof rawJob?._count?.applications === "number"
      ? rawJob._count.applications
      : typeof rawJob?.applicationCount === "number"
      ? rawJob.applicationCount
      : undefined;

  return {
    id: rawJob?.id ?? "",
    title: rawJob?.title ?? "",
    companyName:
      rawJob?.companyName ??
      rawJob?.hr?.companyName ??
      rawJob?.hr?.user?.companyName ??
      "",
    location: rawJob?.location ?? "",
    jobType: rawJob?.jobType ?? "",
    workArrangement: rawJob?.workArrangement ?? "",
    duration: rawJob?.duration ?? null,
    minSalary,
    maxSalary,
    application_deadline: rawJob?.application_deadline ?? null,
    email: rawJob?.email ?? null,
    phone_number: rawJob?.phone_number ?? null,
    other_contact_information: rawJob?.other_contact_information ?? null,
    description: rawJob?.description ?? "",
    requirements,
    qualifications,
    responsibilities,
    benefits,
    tags,
    createdAt,
    updatedAt,
    isSaved: typeof rawJob?.isSaved === "boolean" ? rawJob.isSaved : undefined,
    isApplied:
      typeof rawJob?.isApplied === "boolean" ? rawJob.isApplied : undefined,
    _count:
      typeof applicationCount === "number"
        ? { applications: applicationCount }
        : rawJob?._count && typeof rawJob._count.applications === "number"
        ? { applications: rawJob._count.applications }
        : null,
  };
};

const normalizeJobDetail = (rawJob: RawJob): JobDetailResponse => {
  const base = normalizeJob(rawJob);

  const hrData = rawJob?.hr;
  const hr = hrData
    ? {
        id: hrData.id ?? "",
        companyName: hrData.companyName ?? base.companyName,
        description: hrData.description ?? null,
        address: hrData.address ?? "",
        industry: hrData.industry ?? null,
        companySize: hrData.companySize ?? null,
        website: hrData.website ?? null,
      }
    : null;

  const applicationCount =
    typeof rawJob?.applicationCount === "number"
      ? rawJob.applicationCount
      : base._count?.applications ?? 0;

  return {
    ...base,
    hr,
    applicationCount,
    isApplied:
      typeof rawJob?.isApplied === "boolean"
        ? rawJob.isApplied
        : base.isApplied ?? false,
    isSaved:
      typeof rawJob?.isSaved === "boolean"
        ? rawJob.isSaved
        : base.isSaved ?? false,
  };
};

const buildListJobsPayload = (
  filters: JobFilters,
  page: number,
  limit: number
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    page,
    limit,
  };

  const keyword = (filters.keyword ?? filters.search)?.toString().trim();
  if (keyword) payload.keyword = keyword;

  const location = filters.location ?? filters.locations?.[0];
  if (location) payload.location = location;

  const jobType =
    filters.jobType ??
    (Array.isArray(filters.jobTypes) && filters.jobTypes.length === 1
      ? filters.jobTypes[0]
      : undefined);
  if (jobType) payload.jobType = jobType;

  const workArrangement =
    filters.workArrangement ??
    (Array.isArray(filters.workArrangements) &&
    filters.workArrangements.length === 1
      ? filters.workArrangements[0]
      : undefined);
  if (workArrangement) payload.workArrangement = workArrangement;

  if (Array.isArray(filters.tags) && filters.tags.length)
    payload.tags = filters.tags;

  const salaryRange = filters.salaryRange;
  let minSalary: number | undefined;
  let maxSalary: number | undefined;

  if (Array.isArray(salaryRange)) {
    minSalary = Number(salaryRange[0]);
    maxSalary = Number(salaryRange[1]);
  } else if (salaryRange) {
    if (typeof salaryRange.min === "number") minSalary = salaryRange.min;
    if (typeof salaryRange.max === "number") maxSalary = salaryRange.max;
  }

  if (typeof filters.minSalary === "number") minSalary = filters.minSalary;
  if (typeof filters.maxSalary === "number") maxSalary = filters.maxSalary;

  if (
    typeof minSalary === "number" &&
    Number.isFinite(minSalary) &&
    minSalary > 0
  )
    payload.minSalary = minSalary;
  if (
    typeof maxSalary === "number" &&
    Number.isFinite(maxSalary) &&
    maxSalary > 0
  )
    payload.maxSalary = maxSalary;

  if (
    Array.isArray(filters.experienceLevels) &&
    filters.experienceLevels.length
  )
    payload.experienceLevels = filters.experienceLevels;
  if (Array.isArray(filters.companies) && filters.companies.length)
    payload.companies = filters.companies;
  if (filters.datePosted) payload.datePosted = filters.datePosted;
  if (filters.deadline?.before)
    payload.deadlineBefore = filters.deadline.before;
  if (filters.deadline?.after) payload.deadlineAfter = filters.deadline.after;
  if (filters.remoteOnly) payload.remoteOnly = true;
  if (filters.hasBenefits) payload.hasBenefits = true;

  return payload;
};

const extractErrorMessage = (body: unknown): string | null => {
  if (!body || typeof body !== "object") return null;

  const source = body as Record<string, unknown>;

  const directKeys: Array<keyof typeof source> = [
    "message",
    "error",
    "detail",
    "details",
  ];

  for (const key of directKeys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }

  const errors = source.errors;
  if (Array.isArray(errors)) {
    return errors
      .map((entry) =>
        typeof entry === "string" ? entry : JSON.stringify(entry)
      )
      .join(", ");
  }

  if (errors && typeof errors === "object") {
    try {
      return JSON.stringify(errors);
    } catch {
      return null;
    }
  }

  return null;
};

export const createJob = async (
  payload: CreateJobRequest
): Promise<CreatedJobResponse> => {
  console.log("[jobs.createJob] payload:", payload);

  const res = await authorizedFetch(`${BASE_URL}/job`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody: unknown = await res.json();
      const extracted = extractErrorMessage(serverBody);
      if (extracted) serverMsg = `${serverMsg} – ${extracted}`;
    } catch {
      try {
        const text = await res.text();
        if (text) serverMsg = `${serverMsg} – ${text}`;
      } catch {
        /* ignore */
      }
    }

    console.error("[jobs.createJob] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<CreatedJobResponse> = await res.json();
  if (!body.success) {
    console.error("[jobs.createJob] api error body:", body);
    throw new Error(body.message || "Failed to create job");
  }

  return body.data;
};

// GET /api/job/:id - Get job details
export const getJobById = async (jobId: string): Promise<JobDetailResponse> => {
  console.log("[jobs.getJobById] jobId:", jobId);

  const res = await authorizedFetch(`${BASE_URL}/job/${jobId}`);

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody: unknown = await res.json();
      const extracted = extractErrorMessage(serverBody);
      if (extracted) serverMsg = `${serverMsg} – ${extracted}`;
    } catch {
      const text = await res.text();
      if (text) serverMsg = `${serverMsg} – ${text}`;
    }
    console.error("[jobs.getJobById] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<RawJob> = await res.json();
  if (!body.success) {
    console.error("[jobs.getJobById] api error body:", body);
    throw new Error(body.message || "Failed to get job details");
  }

  return normalizeJobDetail(body.data);
};

// POST /api/job/list - List jobs with filters
export const listJobs = async (
  filters: JobFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<JobListResponse> => {
  console.log(
    "[jobs.listJobs] filters:",
    filters,
    "page:",
    page,
    "limit:",
    limit
  );

  const requestBody = buildListJobsPayload(filters, page, limit);

  const res = await authorizedFetch(`${BASE_URL}/job/list`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody: unknown = await res.json();
      const extracted = extractErrorMessage(serverBody);
      if (extracted) serverMsg = `${serverMsg} – ${extracted}`;
    } catch {
      const text = await res.text();
      if (text) serverMsg = `${serverMsg} – ${text}`;
    }
    console.error("[jobs.listJobs] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<ListJobsResponseData> = await res.json();

  if (!body.success) {
    console.error("[jobs.listJobs] api error body:", body);
    throw new Error(body.message || "Failed to fetch jobs");
  }

  const data = body.data ?? {};

  const rawJobs = Array.isArray(data.jobs)
    ? data.jobs
    : Array.isArray(data.items)
    ? data.items
    : Array.isArray(data.results)
    ? data.results
    : [];

  const jobs = rawJobs.map(normalizeJob);

  const pagination = data.pagination ?? {};

  const total =
    typeof data.total === "number"
      ? data.total
      : typeof pagination.total === "number"
      ? pagination.total
      : jobs.length;

  const currentPage =
    typeof data.page === "number"
      ? data.page
      : typeof pagination.page === "number"
      ? pagination.page
      : page;

  const pageSize =
    typeof data.limit === "number"
      ? data.limit
      : typeof pagination.limit === "number"
      ? pagination.limit
      : limit;

  const hasMore =
    typeof data.hasMore === "boolean"
      ? data.hasMore
      : typeof pagination.hasMore === "boolean"
      ? pagination.hasMore
      : currentPage * pageSize < total;

  return {
    jobs,
    total,
    page: currentPage,
    limit: pageSize,
    hasMore,
  };
};

// POST /api/job/:id/save - Save/unsave job
export const toggleSaveJob = async (
  jobId: string
): Promise<{ isSaved: boolean }> => {
  console.log("[jobs.toggleSaveJob] jobId:", jobId);

  const res = await authorizedFetch(`${BASE_URL}/job/${jobId}/save`, {
    method: "POST",
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message)
        serverMsg = `${serverMsg} – ${serverBody.message}`;
    } catch {
      const text = await res.text();
      if (text) serverMsg = `${serverMsg} – ${text}`;
    }
    console.error("[jobs.toggleSaveJob] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<{ isSaved: boolean }> = await res.json();
  if (!body.success) {
    console.error("[jobs.toggleSaveJob] api error body:", body);
    throw new Error(body.message || "Failed to toggle save job");
  }

  return body.data;
};

// GET /api/jobs/saved - Get saved jobs
export const getSavedJobs = async (
  page: number = 1,
  limit: number = 20
): Promise<JobListResponse> => {
  console.log("[jobs.getSavedJobs] page:", page, "limit:", limit);

  const res = await authorizedFetch(
    `${BASE_URL}/jobs/saved?page=${page}&limit=${limit}`
  );

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message)
        serverMsg = `${serverMsg} – ${serverBody.message}`;
    } catch {
      const text = await res.text();
      if (text) serverMsg = `${serverMsg} – ${text}`;
    }
    console.error("[jobs.getSavedJobs] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<{
    jobs: Job[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> = await res.json();

  if (!body.success) {
    console.error("[jobs.getSavedJobs] api error body:", body);
    throw new Error(body.message || "Failed to get saved jobs");
  }

  return {
    jobs: body.data.jobs,
    total: body.data.total,
    page: body.data.page,
    limit: body.data.limit,
    hasMore: body.data.hasMore,
  };
};

// POST /api/job/:id/apply - Apply to job
export const applyToJob = async (
  jobId: string,
  resumeId?: string
): Promise<{ applicationId: string }> => {
  console.log("[jobs.applyToJob] jobId:", jobId, "resumeId:", resumeId);

  const requestBody = resumeId ? { resumeId } : {};

  const res = await authorizedFetch(`${BASE_URL}/job/${jobId}`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message)
        serverMsg = `${serverMsg} – ${serverBody.message}`;
    } catch {
      const text = await res.text();
      if (text) serverMsg = `${serverMsg} – ${text}`;
    }
    console.error("[jobs.applyToJob] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<{ applicationId: string }> = await res.json();
  if (!body.success) {
    console.error("[jobs.applyToJob] api error body:", body);
    throw new Error(body.message || "Failed to apply to job");
  }

  return body.data;
};

// GET /api/jobs/search - Quick search endpoint
export const searchJobs = async (
  query: string,
  limit: number = 10
): Promise<Job[]> => {
  console.log("[jobs.searchJobs] query:", query, "limit:", limit);

  if (!query.trim()) return [];

  const res = await authorizedFetch(
    `${BASE_URL}/jobs/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );

  if (!res.ok) {
    let serverMsg = `HTTP ${res.status}`;
    try {
      const serverBody = await res.json();
      if (serverBody?.message)
        serverMsg = `${serverMsg} – ${serverBody.message}`;
    } catch {
      const text = await res.text();
      if (text) serverMsg = `${serverMsg} – ${text}`;
    }
    console.error("[jobs.searchJobs] server error:", serverMsg);
    throw new Error(serverMsg);
  }

  const body: ApiResponse<Job[]> = await res.json();
  if (!body.success) {
    console.error("[jobs.searchJobs] api error body:", body);
    throw new Error(body.message || "Failed to search jobs");
  }

  return body.data;
};
