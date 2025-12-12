import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export type R2Folder = "Contracts" | "Town plans" | "Survey Plans";

export type R2UploadResult = {
  key: string;
  bytes: number;
  contentType: string;
  originalFilename?: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function getR2Config() {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");
  const bucketName = requireEnv("R2_BUCKET_NAME");

  const endpoint =
    process.env.R2_ENDPOINT ?? `https://${accountId}.r2.cloudflarestorage.com`;

  return { endpoint, accessKeyId, secretAccessKey, bucketName };
}

let clientSingleton: S3Client | null = null;
function r2Client(): S3Client {
  if (clientSingleton) return clientSingleton;
  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();

  clientSingleton = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // R2 is S3-compatible; path-style avoids DNS edge cases.
    forcePathStyle: true,
  });

  return clientSingleton;
}

function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120);
}

export async function uploadPdfToR2(params: {
  file: File;
  folder: R2Folder;
  projectId?: string;
  /** Optional prefix to help identify uploads (e.g. project name) */
  namePrefix?: string;
  maxBytes?: number;
}): Promise<R2UploadResult> {
  const { bucketName } = getR2Config();
  const {
    file,
    folder,
    projectId,
    namePrefix,
    maxBytes = 15 * 1024 * 1024,
  } = params;

  if (file.size > maxBytes) {
    throw new Error(`File too large (max ${maxBytes} bytes).`);
  }

  // Restrict to PDFs for sensitive docs.
  const contentType = file.type || "application/octet-stream";
  if (contentType !== "application/pdf") {
    throw new Error(`Unsupported file type: ${contentType}. Only PDF allowed.`);
  }

  const originalFilename = file.name ? sanitizeFilename(file.name) : undefined;
  const safePrefix = namePrefix ? sanitizeFilename(namePrefix) : undefined;

  const id = crypto.randomUUID();
  const keyParts: string[] = [folder];
  if (projectId) keyParts.push(projectId);
  keyParts.push(`${safePrefix ? safePrefix + "-" : ""}${id}.pdf`);

  const key = keyParts.join("/");

  const body = Buffer.from(await file.arrayBuffer());

  const put: PutObjectCommandInput = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: "application/pdf",
    // Helps downloads keep filename in the browser.
    ContentDisposition: originalFilename
      ? `attachment; filename=\"${originalFilename}\"`
      : "attachment",
    Metadata: originalFilename
      ? {
          "original-filename": originalFilename,
        }
      : undefined,
  };

  await r2Client().send(new PutObjectCommand(put));

  return {
    key,
    bytes: file.size,
    contentType: "application/pdf",
    originalFilename,
  };
}

export async function deleteR2Object(key: string | null | undefined) {
  if (!key) return;
  const { bucketName } = getR2Config();

  await r2Client().send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
}

export async function getPresignedGetUrl(params: {
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const { bucketName } = getR2Config();
  const { key, expiresInSeconds = 60 * 5 } = params;

  // Keep expiry short for sensitive documents.
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(r2Client(), command, { expiresIn: expiresInSeconds });
}
