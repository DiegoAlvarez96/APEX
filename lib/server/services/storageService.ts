import { env } from "@/lib/server/config/env";

export type StorageObjectInput = {
  userId: string;
  key: string;
  contentType: string;
  body: ArrayBuffer | Uint8Array;
};

export type StorageObjectResult = {
  key: string;
  url: string;
  driver: typeof env.STORAGE_DRIVER;
};

export interface StorageService {
  putObject(input: StorageObjectInput): Promise<StorageObjectResult>;
  getPublicUrl(key: string): string;
}

class DeferredStorageService implements StorageService {
  async putObject(): Promise<StorageObjectResult> {
    throw new Error(`Storage driver '${env.STORAGE_DRIVER}' is configured but no adapter has been enabled yet.`);
  }

  getPublicUrl(key: string) {
    const baseUrl = env.STORAGE_PUBLIC_BASE_URL ?? env.NEXT_PUBLIC_APP_URL;
    return `${baseUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
  }
}

export const storageService: StorageService = new DeferredStorageService();
