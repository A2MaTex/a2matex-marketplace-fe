import axiosInstance from "@/lib/axios";
import {
  adminSubmissionDetailUrl,
  adminSubmissionReviewUrl,
  adminSubmissionsUrl,
  adminSubmissionScanRetryUrl,
} from "./adminSubmissionUrl";

const list = ({ page = 1, limit = 10, status, productId, signal } = {}) =>
  axiosInstance.get(adminSubmissionsUrl, {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
      ...(productId ? { productId } : {}),
    },
    signal,
  });

const detail = (submissionId, { signal } = {}) =>
  axiosInstance.get(adminSubmissionDetailUrl(submissionId), { signal });

const retryScan = (submissionId) =>
  axiosInstance.post(adminSubmissionScanRetryUrl(submissionId));

const review = (submissionId, body) =>
  axiosInstance.put(adminSubmissionReviewUrl(submissionId), body);

export const adminSubmissionApi = { list, detail, retryScan, review };
