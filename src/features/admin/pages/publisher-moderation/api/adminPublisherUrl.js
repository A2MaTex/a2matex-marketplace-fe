export const adminPublishersUrl = "/publishers";

export const adminPublisherDetailUrl = (publisherAccountId) =>
  `/publishers/${encodeURIComponent(publisherAccountId)}`;

export const adminPublisherStatusUrl = (publisherAccountId) =>
  `/publishers/${encodeURIComponent(publisherAccountId)}/status`;
