export const uploadStaticUrl = "/statics/files/upload";
export const getStaticFileUrl = (staticID) => `/statics/files/${staticID}`;
export const uploadImageUrl = "/statics/images/upload";
export const getImageUrl = (imageId, variant) =>
  `/statics/images/${imageId}?variant=${variant}`;

export const startMultipartUploadUrl = "/statics/files/multipart/start";
export const getPresignUrlsUrl = "/statics/files/multipart/urls";
export const completeMultipartUploadUrl = "/statics/files/multipart/complete";
export const getDownloadUrlUrl = (staticId) => `/statics/files/${staticId}/download-url`;