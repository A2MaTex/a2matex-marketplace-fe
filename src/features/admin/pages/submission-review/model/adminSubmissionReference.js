import { parseAdminPublisherDetailEnvelope } from "../../publisher-moderation/model/adminPublisherContract.js";
import { parseAdminUserDetailEnvelope } from "../../user-manage/model/adminUserModel.js";
import { parseProjectEnvelope } from "../../../../publisher/pages/projects/model/projectContract.js";

const normalized = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const unavailableReference = (kind) => ({
  name: `${kind} unavailable`,
  secondary: null,
  status: "unavailable",
});

export const loadingReference = (kind) => ({
  name: `Loading ${kind.toLowerCase()}…`,
  secondary: null,
  status: "loading",
});

export const parseSubmissionUserReference = (payload) => {
  const detail = parseAdminUserDetailEnvelope(payload);
  const fullName = normalized(detail.profile?.fullName);
  const username = normalized(detail.identity.username);
  const email = normalized(detail.identity.email);
  return {
    name: fullName ?? username ?? email ?? "User unavailable",
    secondary: fullName && username ? `@${username}` : email,
    status: "ready",
  };
};

export const parseSubmissionPublisherReference = (payload) => {
  const detail = parseAdminPublisherDetailEnvelope(payload);
  const fullName = normalized(detail.profile?.fullName);
  const username = normalized(detail.user.username);
  return {
    name: fullName ?? username ?? "Publisher unavailable",
    secondary: fullName && username ? `@${username}` : null,
    status: "ready",
  };
};

export const parseSubmissionProjectReference = (payload) => {
  const detail = parseProjectEnvelope(payload);
  return {
    name: normalized(detail.name) ?? "Project unavailable",
    secondary: normalized(detail.description),
    status: "ready",
  };
};
