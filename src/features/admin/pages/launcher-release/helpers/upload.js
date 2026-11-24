import { staticApi } from "@/common/api/static/staticApi";
import { CHUNK_SIZE } from "@/constants/static";

export const MAX_CHUNK_RETRIES = 3; // số lần retry tối đa cho mỗi chunk
export const RETRY_DELAY_MS = 1000; // delay giữa các lần retry (1s)
export const MAX_CONCURRENT_CHUNKS = 4;
export const MAX_RECOVERY_ROUNDS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAbortError = (err) =>
  err?.name === "AbortError" || err?.name === "CanceledError";

/**
 * Cắt đúng chunk dữ liệu ứng với partNumber (1-indexed).
 */
export function getChunkForPart(file, partNumber) {
  const start = (partNumber - 1) * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, file.size);
  return file.slice(start, end);
}

/**
 * PUT một chunk lên S3 qua presigned URL.
 * Tự động retry tối đa MAX_CHUNK_RETRIES lần, mỗi lần cách nhau RETRY_DELAY_MS.
 *
 * @returns {{ partNumber, etag }} nếu thành công
 * @throws nếu bị abort, hoặc vẫn fail sau khi hết số lần retry
 */
export async function uploadChunkWithRetry({ url, chunk, partNumber, signal }) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    // Lần thử lại (attempt > 0) thì chờ RETRY_DELAY_MS trước khi gọi lại
    if (attempt > 0) await sleep(RETRY_DELAY_MS);

    try {
      const res = await fetch(url, { method: "PUT", body: chunk, signal });

      if (!res.ok) {
        throw new Error(`Chunk ${partNumber} upload failed: ${res.status}`);
      }

      // S3 trả ETag trong response header
      const etag = res.headers.get("ETag") ?? res.headers.get("etag") ?? "";
      return { partNumber, etag: etag.replace(/"/g, "") };
    } catch (err) {
      if (isAbortError(err)) throw err; // abort thì dừng ngay, không retry
      lastError = err;
    }
  }

  // Hết số lần retry mà vẫn fail
  throw lastError ?? new Error(`Chunk ${partNumber} upload failed`);
}

/**
 * Upload song song một tập các URL (một "lượt").
 * Không short-circuit khi có chunk fail: chunk thành công được gom vào `parts`,
 * chunk fail (sau khi hết retry) được gom vào `chunksFailed`.
 *
 * @param uploadUrls [{ partNumber, url }]
 * @param onChunkDone callback gọi mỗi khi 1 chunk upload thành công (để update progress)
 * @returns {{ parts: [{partNumber, etag}], chunksFailed: number[] }}
 */
export async function uploadChunks({ file, uploadUrls, signal, onChunkDone }) {
  const parts = [];
  const chunksFailed = [];

  for (let start = 0; start < uploadUrls.length; start += MAX_CONCURRENT_CHUNKS) {
    const group = uploadUrls.slice(start, start + MAX_CONCURRENT_CHUNKS);
    const results = await Promise.allSettled(
      group.map(async ({ partNumber, url }) => {
        const chunk = getChunkForPart(file, partNumber);
        const part = await uploadChunkWithRetry({ url, chunk, partNumber, signal });
        onChunkDone?.(partNumber);
        return part;
      }),
    );

    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    results.forEach((result, index) => {
      if (result.status === "fulfilled") parts.push(result.value);
      else chunksFailed.push(group[index].partNumber);
    });
  }

  return { parts, chunksFailed };
}

/**
 * Upload toàn bộ chunk, tự động xin URL mới và upload lại các chunk fail
 * cho tới khi không còn chunk nào lỗi.
 *
 * @param uploadUrls danh sách URL ban đầu (từ startMultipartUpload)
 * @param onChunkDone callback khi 1 chunk thành công (update progress)
 * @returns parts đầy đủ (đã sort theo partNumber)
 */
export async function uploadAllChunksWithRecovery({
  file,
  sessionId,
  uploadUrls,
  signal,
  onChunkDone,
}) {
  const allParts = [];
  let pendingUrls = uploadUrls;
  let recoveryRound = 0;

  while (pendingUrls.length > 0) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const { parts, chunksFailed } = await uploadChunks({
      file,
      uploadUrls: pendingUrls,
      signal,
      onChunkDone,
    });

    allParts.push(...parts);

    // Không còn chunk fail => xong
    if (chunksFailed.length === 0) break;
    recoveryRound += 1;
    if (recoveryRound > MAX_RECOVERY_ROUNDS) {
      throw new Error(`Upload failed after ${MAX_RECOVERY_ROUNDS} recovery rounds`);
    }

    // Có chunk fail => xin URL mới cho đúng các part đó rồi upload lại
    const retryRes = await staticApi.getUrlsForRetry({
      sessionId,
      partNumbers: chunksFailed,
    });
    const retryData = retryRes?.data?.data ?? retryRes?.data ?? {};
    const retryUrls = retryData?.uploadUrls ?? retryData?.urls ?? [];

    if (retryUrls.length === 0) {
      throw new Error(
        `Failed to obtain retry URLs for chunks: ${chunksFailed.join(", ")}`,
      );
    }

    pendingUrls = retryUrls;
  }

  allParts.sort((a, b) => a.partNumber - b.partNumber);
  return allParts;
}
