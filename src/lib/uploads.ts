import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

export async function uploadSubmissionFile(file: File): Promise<UploadedFile> {
  const result = await utapi.uploadFiles(file);

  if (!result.data) {
    throw new Error(result.error?.message ?? "Failed to upload file");
  }

  return {
    url: result.data.url,
    name: result.data.name,
    size: result.data.size,
  };
}

