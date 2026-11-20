import axios from "axios";
import { API_BASE_URL } from "./apiBaseUrl";

const publicAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

export default publicAxios;
