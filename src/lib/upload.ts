import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const ALLOWED_DOC_TYPES = ["application/pdf"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50 MB

interface UploadResult {
  url: string;
  filename: string;
}

function generateFilename(originalName: string): string {
  const ext = extname(originalName);
  const id = randomBytes(16).toString("hex");
  return `${id}${ext}`;
}

function validateFile(
  file: File,
  type: "image" | "document"
): string | null {
  const allowedTypes =
    type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

  if (!allowedTypes.includes(file.type)) {
    return `Недопустимый тип файла: ${file.type}`;
  }

  if (file.size > maxSize) {
    const maxMb = maxSize / (1024 * 1024);
    return `Файл слишком большой. Максимум ${maxMb} МБ`;
  }

  return null;
}

export async function uploadFile(
  file: File,
  leagueId: string,
  type: "image" | "document" = "image"
): Promise<UploadResult> {
  const error = validateFile(file, type);
  if (error) throw new Error(error);

  const filename = generateFilename(file.name);
  const dir = join(process.cwd(), "public", "uploads", leagueId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  return {
    url: `/uploads/${leagueId}/${filename}`,
    filename,
  };
}

export async function uploadLeagueLogo(
  file: File,
  leagueId: string
): Promise<string> {
  const result = await uploadFile(file, leagueId, "image");
  return result.url;
}

export { validateFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, MAX_DOC_SIZE };
