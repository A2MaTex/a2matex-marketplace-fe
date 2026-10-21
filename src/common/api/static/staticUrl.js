export const uploadStaticUrl = "/statics/files/upload";
export const getStaticFileUrl = (staticID) => `/statics/files/${staticID}`;
export const uploadImageUrl = "/statics/images/upload";
export const getImageUrl = (imageId, variant) =>
  `/statics/images/${imageId}?variant=${variant}`;
