import { NextResponse } from "next/server";

// Brand kits are deprecated in favor of direct template styles
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Brand kits have been deprecated in favor of direct template styling.",
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Brand kits have been deprecated in favor of direct template styling.",
  });
}

export async function PATCH() {
  return NextResponse.json({
    success: true,
    message: "Brand kits have been deprecated in favor of direct template styling.",
  });
}

export async function PUT() {
  return NextResponse.json({
    success: true,
    message: "Brand kits have been deprecated in favor of direct template styling.",
  });
}
