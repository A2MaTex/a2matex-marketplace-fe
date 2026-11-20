import axiosInstance from "@/lib/axios";
import {
  createSubmissionUrl,
  getSubmissionUrl,
  getSubmissionsUrl,
} from "./url";

const getSubmissions = ({
  page = 1,
  limit = 10,
  status,
  productId,
  signal,
} = {}) =>
  axiosInstance.get(getSubmissionsUrl, {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(productId ? { productId } : {}),
    },
    signal,
  });

const getSubmission = (submissionId, { signal } = {}) =>
  axiosInstance.get(getSubmissionUrl(submissionId), { signal });

const createSubmission = (body, { idempotencyKey, signal } = {}) =>
  axiosInstance.post(createSubmissionUrl, body, {
    headers: { "Idempotency-Key": idempotencyKey },
    signal,
  });

export const publisherSubmissionApi = {
  getSubmissions,
  getSubmission,
  createSubmission,
};
