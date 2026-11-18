import axiosInstance from "@/lib/axios";
import {
  changeProductLifecycleUrl,
  createProductUrl,
  getProductUrl,
  getProductsUrl,
  updateProductUrl,
} from "./url";

const getProducts = ({ page = 1, limit = 10, status, signal } = {}) =>
  axiosInstance.get(getProductsUrl, {
    params: {
      page,
      limit,
      ...(status ? { status } : {}),
    },
    signal,
  });

const getProduct = (id, { signal } = {}) =>
  axiosInstance.get(getProductUrl(id), { signal });

const createProduct = (body) => axiosInstance.post(createProductUrl, body);

const updateProduct = (id, body) =>
  axiosInstance.patch(updateProductUrl(id), body);

const changeProductLifecycle = (id, body) =>
  axiosInstance.put(changeProductLifecycleUrl(id), body);

const getAllProducts = () => getProducts();

export const publisherProductApi = {
  getProducts,
  getProduct,
  getAllProducts,
  createProduct,
  updateProduct,
  changeProductLifecycle,
};
