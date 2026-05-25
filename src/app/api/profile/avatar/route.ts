import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/googleAuth";
import { updateUserProfileById } from "@/lib/users";
import { enforceSameOrigin } from "@/lib/security";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sameOriginError = enforceSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
    if (!allowedImageTypes.has(file.type)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image is too large (max 5MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "kick-info-media/profiles",
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
            return;
          }
          resolve({ secure_url: result.secure_url });
        },
      );

      stream.end(buffer);
    });

    const updated = await updateUserProfileById(userId, { profileImageUrl: upload.secure_url });
    if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ profileImageUrl: updated.profileImageUrl || "" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Avatar upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
