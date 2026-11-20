import axiosInstance from "@/lib/axios";
import {
  changeTermStatusUrl,
  createTermUrl,
  getCurrentTermsUrl,
  getTermsUrl,
  getTermUrl,
} from "./termUrl";

const getCurrentTerms = (termType, config) =>
  axiosInstance.get(getCurrentTermsUrl(termType), config);

const createNewTerm = (body) => axiosInstance.post(createTermUrl, body);

const getAllTerms = () => axiosInstance.get(getTermsUrl);

const getTerm = (termId) => axiosInstance.get(getTermUrl(termId));

const changeTermStatus = (termId, status) =>
  axiosInstance.put(changeTermStatusUrl(termId), { status });

export const termApi = {
  getCurrentTerms,
  createNewTerm,
  getAllTerms,
  changeTermStatus,
  getTerm,
};
