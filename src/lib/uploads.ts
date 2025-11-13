import { UTApi } from "uploadthing/server";

let utapi: UTApi | null = null;

function getUTApi(): UTApi {
  if (!utapi) {
    // Check if UploadThing credentials are configured
    if (!process.env.UPLOADTHING_SECRET) {
      throw new Error("UPLOADTHING_SECRET is not configured");
    }
    utapi = new UTApi();
  }
  return utapi;
}

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
}

export async function uploadSubmissionFile(file: File): Promise<UploadedFile> {
  const api = getUTApi();
  const result = await api.uploadFiles(file);

  if (!result.data) {
    throw new Error(result.error?.message ?? "Failed to upload file");
  }

  return {
    url: result.data.url,
    name: result.data.name,
    size: result.data.size,
  };
}

