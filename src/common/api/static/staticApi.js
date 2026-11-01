import axiosInstance from "@lib/axios";
import {
  completeMultipartUploadUrl,
  getImageUrl,
  getPresignUrlsUrl,
  getStaticFileUrl,
  startMultipartUploadUrl,
  uploadImageUrl,
  uploadStaticUrl,
} from "./staticUrl";
import { LAUNCHER_RELEASES_PREFIX } from "./constants";

const uploadStatic = ({ file, prefix }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (prefix) formData.append("prefix", prefix);

  return axiosInstance.post(uploadStaticUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const uploadImage = ({ file, prefix }) => {
  const formData = new FormData();
  formData.append("image", file);
  if (prefix) formData.append("prefix", prefix);

  return axiosInstance.post(uploadImageUrl, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

const getStaticById = (staticId) =>
  axiosInstance.get(getStaticFileUrl(staticId));

const getImageById = ({ imageId, variant = "small" }) =>
  axiosInstance.get(getImageUrl(imageId, variant), { responseType: "blob" });

// request body
// {file, prefix, lastModified, requestedPartNumbers: int[]}

// response body
// {
//   "data": {
//     "sessionId": {
//       "id": "fac0116c-6ef4-4b94-838d-a1539ddddfd8"
//     },
//     "uploadUrls": [
//       {
//         "partNumber": 1,
//         "url": "https://a2matex-staging.92d1a8e157228628990390a2ac39e73c.r2.cloudflarestorage.com/launcher/releases/61/87/99/2b/14/0a/44/b4/a1/46/db/ac/4c/04/43/18?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=a6edd839f284bb1a06eb941f529c8d5a%2F20261027%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20261027T091124Z&X-Amz-Expires=900&X-Amz-Signature=c126fed4a46ab96cd126a070f1f17d0d61581e207d1f7e848c01d41f3b8d0f5f&X-Amz-SignedHeaders=host&partNumber=1&uploadId=APYyrKa7icyiQ0GtARdpim1O9IrcckuboSvgOD9ehQOZmrzTdAEsPEIo6g6NrM90eQtRGJFZx-R-WIVzv0mLia30mJyccYgq36wz8ZBbPTHAbADTd4lUohPMCzf5YGIvA23JWck_7ALGFhO92r-HUkjpItBhAXm_0VmWtqC1jq6e7gwECapqVeoMRcwLUHlj55UuuPV6BbCYk9csmLjpPWQa9rFA9QoIBojyf9kv0VC0Qtiu-33pqI73rOJarTelhcNLAFTTEmYU38Uuv4D9qj5wmvx2QkJYQw-xML1ASxNfjTiXSVo7oc8Oo45jjE6CfTupGWQ1T_YRW6gmJWC7Tsc&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart"
//       },
//       {
//         "partNumber": 2,
//         "url": "https://a2matex-staging.92d1a8e157228628990390a2ac39e73c.r2.cloudflarestorage.com/launcher/releases/61/87/99/2b/14/0a/44/b4/a1/46/db/ac/4c/04/43/18?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=a6edd839f284bb1a06eb941f529c8d5a%2F20261027%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20261027T091124Z&X-Amz-Expires=900&X-Amz-Signature=9dc0daacc2173291376ddfa905680196507c9d36a1b31ac14999beceb5149c94&X-Amz-SignedHeaders=host&partNumber=2&uploadId=APYyrKa7icyiQ0GtARdpim1O9IrcckuboSvgOD9ehQOZmrzTdAEsPEIo6g6NrM90eQtRGJFZx-R-WIVzv0mLia30mJyccYgq36wz8ZBbPTHAbADTd4lUohPMCzf5YGIvA23JWck_7ALGFhO92r-HUkjpItBhAXm_0VmWtqC1jq6e7gwECapqVeoMRcwLUHlj55UuuPV6BbCYk9csmLjpPWQa9rFA9QoIBojyf9kv0VC0Qtiu-33pqI73rOJarTelhcNLAFTTEmYU38Uuv4D9qj5wmvx2QkJYQw-xML1ASxNfjTiXSVo7oc8Oo45jjE6CfTupGWQ1T_YRW6gmJWC7Tsc&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart"
//       }
//     ],
//   },
//   "statusCode": 201
// }
const startMultipartUpload = ({
  originalFileName,
  lastModified,
  contentType,
  size,
  prefix = LAUNCHER_RELEASES_PREFIX,
  requestedPartNumbers,
}) => {
  return axiosInstance.post(startMultipartUploadUrl, {
    originalFileName,
    lastModified,
    contentType,
    size,
    prefix,
    requestedPartNumbers,
  });
};

// request body:
// {
//   "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   "parts": [
//     {
//       "partNumber": 1,
//       "etag": "etag"
//     }
//   ]
// }
const completeMultipartUpload = ({ sessionId, parts }) =>
  axiosInstance.post(completeMultipartUploadUrl, { sessionId, parts });

// request body
// {
//   "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   "partNumbers": [
//     1
//   ]
// }
// response body
// {
//   "uploadUrls": [
//     {
//       "partNumber": 9007199254740991,
//       "url": "string"
//     }
//   ]
// }
const getUrlsForRetry = (body) =>
  axiosInstance.post(getPresignUrlsUrl, body);

export const staticApi = {
  uploadStatic,
  getStaticById,
  uploadImage,
  getImageById,
  startMultipartUpload,
  completeMultipartUpload, 
  getUrlsForRetry
};