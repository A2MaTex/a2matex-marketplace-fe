import axiosInstance from "@/lib/axios";
import {
  activateReleaseUrl,
  createNewReleaseUrl,
  getAllReleaseUrl,
  getDetailReleaseUrl,
  updateReleaseUrl,
} from "./url";

// resposne body:
// {
//   "items": [
//     {
//       "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//       "version": "string",
//       "staticId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//       "isActive": true,
//       "publishedAt": "2026-10-26T07:39:23.193Z",
//       "createdAt": "2026-10-26T07:39:23.193Z",
//       "originalFileName": "string",
//       "size": 9007199254740991
//     }
//   ],
//   "totalItems": 9007199254740991,
//   "page": 9007199254740991,
//   "pageSize": 9007199254740991,
//   "totalPages": 9007199254740991
// }
const getAllRelease = () => axiosInstance.get(getAllReleaseUrl);

// response body
// {
//   "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   "version": "string",
//   "staticId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   "releaseNotes": "string",
//   "isActive": true,
//   "publishedAt": "2026-10-26T07:39:49.181Z",
//   "createdAt": "2026-10-26T07:39:49.181Z",
//   "updatedAt": "2026-10-26T07:39:49.181Z",
//   "static": {
//     "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//     "originalFileName": "string",
//     "contentType": "string",
//     "size": 9007199254740991
//   }
// }
const getDetailRelease = (id) => axiosInstance.get(getDetailReleaseUrl(id));

// request body
// {
//   "version": "string",
//   "staticId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   "releaseNotes": "string"
// }
const createRelease = (body) => axiosInstance.post(createNewReleaseUrl, body);

// request body
// {
//   "version": "string",
//   "staticId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   "releaseNotes": "string"
// }
const updateRelease = (id, body) =>
  axiosInstance.put(updateReleaseUrl(id), body);

const activateRelease = (id) => axiosInstance.put(activateReleaseUrl(id));

export const releaseApi = {
  getAllRelease,
  getDetailRelease,
  createRelease,
  updateRelease,
  activateRelease,
};
