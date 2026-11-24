import { releaseApi } from "./api/api";
import { LAUNCHER_RELEASES_PREFIX } from "@/constants/static";

export const launcherReleaseConfig = {
  api: releaseApi,
  kindLabel: "Launcher",
  productName: "Launcher",
  description: "Publish installers, inspect artifact metadata and control the active desktop launcher release.",
  supportsDeactivate: false,
  uploadEnabled: true,
  uploadPrefix: LAUNCHER_RELEASES_PREFIX,
  artifactContentType: "application/x-msdownload",
  accept: ".exe",
  artifactHint: "Windows .exe · server-validated content type",
  versionPlaceholder: "2.5.0",
  canEditVersion: () => true,
  validateVersion: (value) => {
    const normalized = value.trim();
    if (!normalized) return "Version is required.";
    if (normalized.length > 100) return "Version must be 100 characters or fewer.";
    return null;
  },
  validateArtifact: (file) =>
    file.name.toLowerCase().endsWith(".exe")
      ? null
      : "Launcher multipart upload currently accepts Windows .exe artifacts only.",
};
