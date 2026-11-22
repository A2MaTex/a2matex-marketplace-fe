import axios from "@/lib/axios";
import {
  createOrderUrl,
  getMyOrdersUrl,
  getOrderDetailUrl,
} from "./orderUrl";
import { buildCreateOrderRequest } from "../model/orderRequest";

const create = ({ productOfferId }, { idempotencyKey, signal } = {}) => {
  const request = buildCreateOrderRequest(productOfferId, idempotencyKey);
  return axios.post(createOrderUrl, request.body, {
    ...request.config,
    signal,
  });
};

const getMine = ({ page = 1, limit = 10, signal } = {}) =>
  axios.get(getMyOrdersUrl, { params: { page, limit }, signal });

const getById = (orderId, { signal } = {}) =>
  axios.get(getOrderDetailUrl(orderId), { signal });

export const orderApi = { create, getMine, getById };
