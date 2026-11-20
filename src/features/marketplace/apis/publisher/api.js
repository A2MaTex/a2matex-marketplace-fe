import publicAxios from "@/lib/publicAxios";
import { getPublicPublisherUrl } from "./url";

const get = (username, { signal } = {}) =>
  publicAxios.get(getPublicPublisherUrl(username), { signal });

export const publicPublisherApi = { get };
