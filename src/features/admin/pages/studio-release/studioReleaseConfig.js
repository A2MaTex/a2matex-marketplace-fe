import { studioReleaseApi } from "./api/api";
import { STUDIO_RELEASES_PREFIX } from "@/constants/static";

const STRICT_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const studioReleaseConfig = {
  api: studioReleaseApi,
  kindLabel: "Studio",
  productName: "Studio",
  description: "Manage Studio release metadata, activation and rollback from one authoritative history.",
  supportsDeactivate: true,
  uploadEnabled: true,
  uploadPrefix: STUDIO_RELEASES_PREFIX,
  artifactContentType: "application/x-msdownload",
  accept: ".exe",
  artifactHint: "Windows .exe · server-validated content type",
  versionPlaceholder: "2.5.0",
  canEditVersion: (release) => !release.isActive,
  validateVersion: (value) =>
    STRICT_SEMVER.test(value.trim())
      ? null
      : "Studio versions must use strict x.y.z format without v, prerelease or build suffixes.",
  validateArtifact: (file) =>
    file.name.toLowerCase().endsWith(".exe")
      ? null
      : "Studio multipart upload currently accepts Windows .exe artifacts only.",
};
