import axios from "@/lib/axios";
import { adminWalletTransactionsUrl } from "./adminWalletTransactionUrl";

const list = ({ params, signal } = {}) =>
  axios.get(adminWalletTransactionsUrl, { params, signal });

export const adminWalletTransactionApi = { list };
