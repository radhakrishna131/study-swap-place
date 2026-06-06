// Cloudinary unsigned upload helper.
// Uses an unsigned upload preset so no secret is exposed to the browser.
export const CLOUDINARY_CLOUD_NAME = "dbdi6tfmq";
export const CLOUDINARY_UPLOAD_PRESET = "ml_default";

export async function uploadToCloudinary(
  file: File,
  folder?: string,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  if (folder) fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }
  const json = (await res.json()) as { secure_url: string };
  return json.secure_url;
}
