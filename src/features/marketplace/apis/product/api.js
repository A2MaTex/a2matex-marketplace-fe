import publicAxios from "@/lib/publicAxios";
import { buildMarketplaceListParams } from "../../utils/marketplaceQuery";
import { getProductDetailUrl, getProductListUrl } from "./url";

const list = ({ page = 1, limit = 10, q, signal } = {}) =>
  publicAxios.get(getProductListUrl, {
    params: buildMarketplaceListParams({ page, limit, q }),
    signal,
  });

const get = (productId, { signal } = {}) =>
  publicAxios.get(getProductDetailUrl(productId), { signal });

export const marketplaceProductApi = {
  list,
  get,
};
