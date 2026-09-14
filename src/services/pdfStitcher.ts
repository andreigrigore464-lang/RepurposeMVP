import { PDFDocument } from "pdf-lib";
import { uploadToCloudinary } from "./cloudinary";
import fs from "fs/promises";
import path from "path";

export interface PdfStitcherOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

export interface PdfStitcherResult {
  pdfUrl: string;
  pageCount: number;
  fileSizeBytes: number;
  pdfBuffer: Buffer;
}

/**
 * Downloads rendered slide images and stitches them into a multi-page LinkedIn carousel PDF document.
 */
export async function stitchSlidesToPdf(
  imageUrls: string[],
  options: PdfStitcherOptions = {}
): Promise<PdfStitcherResult> {
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error("Cannot stitch PDF: No slide image URLs provided.");
  }

  const pdfDoc = await PDFDocument.create();

  // Set standard PDF document metadata
  pdfDoc.setTitle(options.title || "RepurposeAI Carousel Presentation");
  pdfDoc.setAuthor(options.author || "RepurposeAI");
  pdfDoc.setSubject(options.subject || "Social Media Carousel Deck");
  pdfDoc.setCreator("RepurposeAI Content Engine");
  pdfDoc.setProducer("RepurposeAI (pdf-lib)");
  if (options.keywords) {
    pdfDoc.setKeywords(options.keywords);
  }

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    try {
      let imageBytes: Uint8Array;

      // Handle base64 data URLs or HTTP URLs
      if (imageUrl.startsWith("data:image")) {
        const base64Data = imageUrl.split(",")[1];
        imageBytes = Buffer.from(base64Data, "base64");
      } else {
        const res = await fetch(imageUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch image ${imageUrl} (Status: ${res.status})`);
        }
        const arrayBuffer = await res.arrayBuffer();
        imageBytes = new Uint8Array(arrayBuffer);
      }

      // Detect PNG vs JPG by inspecting magic bytes
      const isPng =
        imageBytes[0] === 0x89 &&
        imageBytes[1] === 0x50 &&
        imageBytes[2] === 0x4e &&
        imageBytes[3] === 0x47;

      let embeddedImage;
      if (isPng) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      }

      const { width, height } = embeddedImage.scale(1.0);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      });
    } catch (slideErr) {
      console.warn(`[PdfStitcher] Failed to embed slide image #${i + 1} (${imageUrl}):`, slideErr);
      // Create a fallback text page
      const page = pdfDoc.addPage([1080, 1080]);
      page.drawText(`Slide ${i + 1}`, { x: 50, y: 1000, size: 24 });
    }
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);
  const fileSizeBytes = pdfBuffer.length;

  // Persist PDF to local public directory and/or Cloudinary
  const fileName = `carousel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.pdf`;
  let pdfUrl = `/uploads/${fileName}`;

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.join(uploadsDir, fileName);
    await fs.writeFile(localFilePath, pdfBuffer);
  } catch (fsErr) {
    console.warn("[PdfStitcher] Failed to write local public file:", fsErr);
  }

  // Try uploading to Cloudinary
  try {
    const cloudUrl = await uploadToCloudinary(pdfBuffer, "repurpose_pdfs", {
      publicId: fileName.replace(".pdf", ""),
      resourceType: "raw",
    });
    if (cloudUrl && cloudUrl.startsWith("http")) {
      pdfUrl = cloudUrl;
    }
  } catch (cloudErr) {
    console.warn("[PdfStitcher] Cloudinary upload skipped, using local URL:", cloudErr);
  }

  return {
    pdfUrl,
    pageCount: pdfDoc.getPageCount(),
    fileSizeBytes,
    pdfBuffer,
  };
}
