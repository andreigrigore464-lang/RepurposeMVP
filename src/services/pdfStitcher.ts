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

  // 1. Concurrently fetch all slide image buffers with timeout
  const imageResults = await Promise.all(
    imageUrls.map(async (imageUrl, idx) => {
      try {
        if (imageUrl.startsWith("data:image")) {
          const base64Data = imageUrl.split(",")[1];
          return { index: idx, buffer: Buffer.from(base64Data, "base64"), url: imageUrl };
        }
        const res = await fetch(imageUrl, {
          headers: { Accept: "image/png, image/jpeg, image/*" },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          return { index: idx, buffer: null, url: imageUrl };
        }
        const arrayBuffer = await res.arrayBuffer();
        return { index: idx, buffer: new Uint8Array(arrayBuffer), url: imageUrl };
      } catch (err) {
        console.warn(`[PdfStitcher] Fetch failed for slide #${idx + 1} (${imageUrl}):`, err);
        return { index: idx, buffer: null, url: imageUrl };
      }
    })
  );

  for (const item of imageResults) {
    let embedded = false;
    if (item.buffer && item.buffer.length > 8) {
      try {
        const bytes = item.buffer;
        const isPng =
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47;
        const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;

        let embeddedImage;
        if (isPng) {
          embeddedImage = await pdfDoc.embedPng(bytes);
        } else if (isJpg) {
          embeddedImage = await pdfDoc.embedJpg(bytes);
        } else {
          // Attempt embedding as PNG or JPG
          try {
            embeddedImage = await pdfDoc.embedPng(bytes);
          } catch {
            embeddedImage = await pdfDoc.embedJpg(bytes);
          }
        }

        if (embeddedImage) {
          const { width, height } = embeddedImage.scale(1.0);
          const page = pdfDoc.addPage([width, height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width,
            height,
          });
          embedded = true;
        }
      } catch (embErr) {
        console.warn(`[PdfStitcher] Image embed fallback for slide #${item.index + 1}:`, embErr);
      }
    }

    if (!embedded) {
      // Fallback blank slide with page number
      const page = pdfDoc.addPage([1080, 1080]);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 1080,
        height: 1080,
      });
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
