import axiosInstance from "@/lib/axios";
import { getNodeCatalogUrl } from "./url";

const getNodeCatalog = ({ runtimeVersion, signal } = {}) =>
  axiosInstance.get(getNodeCatalogUrl, {
    params: { runtimeVersion },
    signal,
  });

export const publisherNodeCatalogApi = { getNodeCatalog };
