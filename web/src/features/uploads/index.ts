import { useMutation } from "@tanstack/react-query";
import { httpClient } from "@/lib/api/http-client";

export type UploadFolder = "assignments" | "documents" | "general";

export interface UploadedFile {
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

/** Mirrors backend/src/modules/uploads (type allowlist and 15 MB limit). */
export const UPLOAD_ACCEPT = ".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg,.webp";
export const UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
export const UPLOAD_HINT = "PDF, Word, ZIP or image, up to 15 MB.";

export async function uploadFile(file: File, folder: UploadFolder): Promise<UploadedFile> {
  if (file.size > UPLOAD_MAX_BYTES) throw new Error("This file is larger than 15 MB.");
  const form = new FormData();
  form.append("file", file);
  return (await httpClient.post(`/uploads?folder=${folder}`, form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 120_000 })).data;
}

export function useUploadFile(folder: UploadFolder) {
  return useMutation({ mutationFn: (file: File) => uploadFile(file, folder) });
}
