import { useEffect, useMemo, useState } from "react";
import { adminSubmissionReferenceApi } from "../api/adminSubmissionReferenceApi";
import {
  loadingReference,
  parseSubmissionProjectReference,
  parseSubmissionPublisherReference,
  parseSubmissionUserReference,
  unavailableReference,
} from "../model/adminSubmissionReference";

const SUCCESS_TTL_MS = 5 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;
const caches = {
  user: new Map(),
  publisher: new Map(),
  project: new Map(),
};

const cacheValue = (kind, id) => {
  const entry = caches[kind].get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    caches[kind].delete(id);
    return null;
  }
  return entry.value;
};

const storeValue = (kind, id, value, ttl) => {
  caches[kind].set(id, { value, expiresAt: Date.now() + ttl });
  return value;
};

const uniqueIds = (ids) => [...new Set(ids.filter(Boolean))].sort();

const load = async ({ kind, id, request, parse, label, signal }) => {
  const cached = cacheValue(kind, id);
  if (cached) return cached;
  try {
    const response = await request(id, { signal });
    return storeValue(kind, id, parse(response.data), SUCCESS_TTL_MS);
  } catch (error) {
    if (signal.aborted || error?.code === "ERR_CANCELED") throw error;
    return storeValue(kind, id, unavailableReference(label), FAILURE_TTL_MS);
  }
};

export function useAdminSubmissionReferences({
  userIds = [],
  publisherAccountId = null,
  projectId = null,
} = {}) {
  const userKey = uniqueIds(userIds).join("|");
  const normalizedUserIds = useMemo(
    () => (userKey ? userKey.split("|") : []),
    [userKey],
  );
  const [state, setState] = useState({ users: {}, publisher: null, project: null });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const users = Object.fromEntries(
      normalizedUserIds.map((id) => [id, cacheValue("user", id) ?? loadingReference("User")]),
    );
    const publisher = publisherAccountId
      ? cacheValue("publisher", publisherAccountId) ?? loadingReference("Publisher")
      : null;
    const project = projectId
      ? cacheValue("project", projectId) ?? loadingReference("Project")
      : null;

    queueMicrotask(() => {
      if (active) setState({ users, publisher, project });
    });

    const userRequests = normalizedUserIds.map(async (id) => [
      id,
      await load({
        kind: "user",
        id,
        request: adminSubmissionReferenceApi.user,
        parse: parseSubmissionUserReference,
        label: "User",
        signal: controller.signal,
      }),
    ]);
    const publisherRequest = publisherAccountId
      ? load({
          kind: "publisher",
          id: publisherAccountId,
          request: adminSubmissionReferenceApi.publisher,
          parse: parseSubmissionPublisherReference,
          label: "Publisher",
          signal: controller.signal,
        })
      : Promise.resolve(null);
    const projectRequest = projectId
      ? load({
          kind: "project",
          id: projectId,
          request: adminSubmissionReferenceApi.project,
          parse: parseSubmissionProjectReference,
          label: "Project",
          signal: controller.signal,
        })
      : Promise.resolve(null);

    Promise.all([Promise.all(userRequests), publisherRequest, projectRequest])
      .then(([loadedUsers, loadedPublisher, loadedProject]) => {
        if (!active) return;
        setState({
          users: { ...users, ...Object.fromEntries(loadedUsers) },
          publisher: loadedPublisher,
          project: loadedProject,
        });
      })
      .catch((error) => {
        if (active && error?.code !== "ERR_CANCELED") {
          setState({ users, publisher, project });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [normalizedUserIds, projectId, publisherAccountId]);

  return state;
}
