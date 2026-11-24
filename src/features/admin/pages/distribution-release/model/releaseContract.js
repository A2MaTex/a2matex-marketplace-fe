import { z } from "zod";

const isoDate = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "must be an ISO date",
});

const nullableDate = isoDate.nullable();

const releaseListItemSchema = z.object({
  id: z.string().uuid(),
  version: z.string().min(1),
  staticId: z.string().uuid(),
  isActive: z.boolean(),
  publishedAt: nullableDate,
  createdAt: isoDate,
  originalFileName: z.string().min(1),
  size: z.number().int().nonnegative(),
});

const releaseDetailSchema = z.object({
  id: z.string().uuid(),
  version: z.string().min(1),
  staticId: z.string().uuid(),
  releaseNotes: z.string().min(1).nullable(),
  isActive: z.boolean(),
  publishedAt: nullableDate,
  createdAt: isoDate,
  updatedAt: nullableDate,
  static: z.object({
    id: z.string().uuid(),
    originalFileName: z.string().min(1),
    contentType: z.string().min(1),
    size: z.number().int().nonnegative(),
  }),
});

const releaseListSchema = z.object({
  items: z.array(releaseListItemSchema),
  totalItems: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

const createdReleaseSchema = z.object({ id: z.string().uuid() });

export function responseData(response) {
  return response?.data?.data ?? response?.data;
}

export function parseReleaseList(response) {
  return releaseListSchema.parse(responseData(response));
}

export function parseReleaseDetail(response) {
  return releaseDetailSchema.parse(responseData(response));
}

export function parseCreatedRelease(response) {
  return createdReleaseSchema.parse(responseData(response));
}

export function buildCreateReleaseBody({ version, staticId, releaseNotes }) {
  const body = { version: version.trim(), staticId };
  const notes = releaseNotes.trim();
  if (notes) body.releaseNotes = notes;
  return body;
}

export function buildUpdateReleaseBody({
  version,
  initialVersion,
  releaseNotes,
  initialReleaseNotes,
  canEditVersion,
}) {
  const body = {};
  const normalizedVersion = version.trim();
  if (canEditVersion && normalizedVersion !== initialVersion) {
    body.version = normalizedVersion;
  }

  const normalizedNotes = releaseNotes.trim() || null;
  if (normalizedNotes !== initialReleaseNotes) body.releaseNotes = normalizedNotes;
  return body;
}

export function getReleaseError(error, kindLabel = "release") {
  if (error?.name === "ZodError") {
    return {
      status: 0,
      message: `The ${kindLabel} API returned an unsupported response.`,
      retryable: true,
    };
  }

  const status = error?.response?.status ?? 0;
  const payload = error?.response?.data;
  const code = payload?.message ?? payload?.error ?? "";

  if (status === 403) {
    return {
      status,
      message: `Your account does not have permission to manage ${kindLabel} releases.`,
      retryable: false,
    };
  }
  if (status === 409) {
    return {
      status,
      message: "The release changed on the server. The latest state has been reloaded.",
      retryable: true,
      code,
    };
  }
  if (status === 422) {
    return {
      status,
      message: Array.isArray(payload?.message)
        ? payload.message[0]?.message ?? "The submitted release is invalid."
        : payload?.message ?? "The submitted release is invalid.",
      retryable: false,
      code,
    };
  }
  return {
    status,
    message:
      typeof code === "string" && code && !code.startsWith("Error.")
        ? code
        : `Unable to ${status ? "complete the request for" : "reach"} ${kindLabel} releases.`,
    retryable: status === 0 || status >= 500,
    code,
  };
}

