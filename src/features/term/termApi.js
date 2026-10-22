import axiosInstance from "@/lib/axios";
import { getCurrentTermsUrl } from "./termUrl";

const getCurrentTerms = (termType) =>
  axiosInstance.get(getCurrentTermsUrl(termType));

export const termApi = { getCurrentTerms };
