import { httpClient } from "@/lib/api/http-client";

/**
 * Downloads an authenticated file (e.g. a PDF) through the API client so the
 * bearer token is sent, then hands it to the browser as a file save.
 */
export async function downloadAuthenticatedFile(path: string, fallbackName: string) {
  const response = await httpClient.get<Blob>(path, { responseType: "blob" });
  const disposition = String(response.headers["content-disposition"] ?? "");
  const fileName = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(response.data);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Give the browser a moment to start the download before releasing the blob.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
