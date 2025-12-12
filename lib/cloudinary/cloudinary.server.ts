import "server-only";

import { v2 as cloudinary } from "cloudinary";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  originalFilename?: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function parseCloudinaryUrl(urlStr: string): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} {
  // Expected format: cloudinary://<api_key>:<api_secret>@<cloud_name>
  const u = new URL(urlStr);
  const apiKey = decodeURIComponent(u.username);
  const apiSecret = decodeURIComponent(u.password);
  const cloudName = u.hostname;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Invalid CLOUDINARY_URL format.");
  }

  return { cloudName, apiKey, apiSecret };
}

let configured = false;
function ensureConfigured() {
  if (configured) return;

  // Support either CLOUDINARY_URL or the 3 separate variables.
  // Prefer CLOUDINARY_URL if present.
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    const { cloudName, apiKey, apiSecret } = parseCloudinaryUrl(cloudinaryUrl);
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  } else {
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
  }

  configured = true;
}

export async function uploadDocumentToCloudinary(params: {
  file: File;
  folder: "Contracts" | "Town plans" | "Survey Plans";
  /** Optional prefix to help identify uploads (e.g. project name) */
  publicIdPrefix?: string;
  /** Allow only these content types if provided */
  allowedMimeTypes?: readonly string[];
  /** Hard limit to prevent accidental huge uploads */
  maxBytes?: number;
}): Promise<CloudinaryUploadResult> {
  ensureConfigured();

  const {
    file,
    folder,
    publicIdPrefix,
    allowedMimeTypes,
    maxBytes = 15 * 1024 * 1024, // 15MB
  } = params;

  if (file.size > maxBytes) {
    throw new Error(`File too large (max ${maxBytes} bytes).`);
  }

  if (allowedMimeTypes?.length && !allowedMimeTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const safePrefix = (publicIdPrefix ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 60);

  const publicId = safePrefix
    ? `${safePrefix}-${Date.now()}`
    : `${Date.now()}`;

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "raw",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (err, res) => {
        if (err) return reject(err);
        resolve(res);
      },
    );

    stream.end(buffer);
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
    originalFilename: result.original_filename,
  };
}
