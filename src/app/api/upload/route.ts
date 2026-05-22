import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Only image or video uploads are allowed" }, { status: 400 });
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Video too large (max 50MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const resourceType = isVideo ? "video" : "image";

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "kick-info-media/blog",
        resource_type: resourceType,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve({ secure_url: uploadResult.secure_url });
      },
    );

    stream.end(buffer);
  });

  return NextResponse.json({ url: result.secure_url, resource_type: resourceType });
}
