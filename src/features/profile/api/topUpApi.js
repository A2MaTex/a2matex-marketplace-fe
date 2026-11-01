import axios from "@lib/axios";
import { createTopUpUrl } from "./topUpUrl";

export const topUpApi = {
  createTopUp: async (amount) => {
    const res = await axios.post(createTopUpUrl, { amount });
    return res.data.data;
  },
};
