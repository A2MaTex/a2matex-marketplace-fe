export const NO_ACTIVE_STUDIO_RELEASE =
  "Error.ActiveStudioReleaseNotFound";

export const isNoActiveStudioReleaseError = (error) =>
  error?.response?.status === 404 &&
  error?.response?.data?.message === NO_ACTIVE_STUDIO_RELEASE;

export const getCurrentStudioRelease = (response) => {
  const release = response?.data?.data;

  if (
    !release ||
    typeof release.id !== "string" ||
    !release.id.trim() ||
    typeof release.version !== "string" ||
    !release.version.trim() ||
    typeof release.staticId !== "string" ||
    !release.staticId.trim()
  ) {
    return null;
  }

  return release;
};

export const getStudioDownload = (response) => {
  const download = response?.data?.data;
  if (
    !download ||
    typeof download.downloadUrl !== "string" ||
    !download.downloadUrl.trim() ||
    typeof download.fileName !== "string" ||
    !download.fileName.trim()
  ) {
    return null;
  }
  return download;
};
