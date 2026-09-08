import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const folder = body.folder || "repurpose_brand_assets";
    const timestamp = Math.round(Date.now() / 1000);

    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      "demo";
    const apiKey = process.env.CLOUDINARY_API_KEY || "mock_api_key";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "mock_api_secret";

    // Cloudinary signature parameters must be sorted alphabetically
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    const sortedQueryString = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(sortedQueryString + apiSecret)
      .digest("hex");

    return NextResponse.json({
      success: true,
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
  } catch (error) {
    console.error("Error generating Cloudinary upload signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new Request("http://localhost"));
}
