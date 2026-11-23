export const NO_ACTIVE_LAUNCHER_RELEASE =
  "Error.ActiveLauncherReleaseNotFound";

export const NO_DOWNLOAD_MESSAGE =
  "No downloadable version is available yet."; // MSG32

export const isNoActiveLauncherReleaseError = (error) =>
  error?.response?.status === 404 &&
  error?.response?.data?.message === NO_ACTIVE_LAUNCHER_RELEASE;

export const getCurrentLauncherRelease = (response) => {
  const release = response?.data?.data;

  if (
    !release ||
    typeof release.version !== "string" ||
    !release.version.trim() ||
    typeof release.staticId !== "string" ||
    !release.staticId.trim()
  ) {
    return null;
  }

  return release;
};
