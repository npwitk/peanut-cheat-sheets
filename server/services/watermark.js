const { PDFDocument, rgb, degrees } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Add watermark to PDF file
 * @param {string} inputPath - Path to original PDF
 * @param {string} outputPath - Path to save watermarked PDF
 * @param {object} userInfo - User information for watermark
 * @returns {Promise<string>} Path to watermarked PDF
 */
async function addWatermarkToPDF(inputPath, outputPath, userInfo) {
  try {
    // Read the existing PDF
    const existingPdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Get watermark configuration from environment
    const baseOpacity = parseFloat(process.env.WATERMARK_OPACITY) || 0.3;
    const rotation = parseInt(process.env.WATERMARK_ROTATION) || 45;

    // Create watermark text
    const watermarkText = `${userInfo.name} - ${userInfo.email}\nPersonal Use Only - Do Not Share or Distribute`;

    const pages = pdfDoc.getPages();

    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();

      // Calculate dynamic font size based on page dimensions
      // Standard A4 is ~595x842 points, scale accordingly
      const pageArea = width * height;
      const standardA4Area = 595 * 842; // ~501,190
      const scaleFactor = Math.sqrt(pageArea / standardA4Area);

      // Center watermark: scale from base size of 16
      const centerFontSize = Math.max(12, Math.min(32, Math.round(16 * scaleFactor)));

      // Corner watermark: scale from base size of 10
      const cornerFontSize = Math.max(8, Math.min(16, Math.round(10 * scaleFactor)));

      // Calculate text width approximation for centering
      // Rough estimate: each character is ~60% of font size
      const textWidth = watermarkText.split('\n')[0].length * (centerFontSize * 0.6);

      // Add watermark in center
      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: centerFontSize,
        color: rgb(0.5, 0.5, 0.5),
        opacity: baseOpacity,
        rotate: degrees(rotation)
      });

      // Add watermark in corners for extra security
      const cornerText = `${userInfo.email.split('@')[0]}`;
      const cornerTextWidth = cornerText.length * (cornerFontSize * 0.6);

      // Top-right corner
      page.drawText(cornerText, {
        x: width - cornerTextWidth - 20,
        y: height - cornerFontSize - 10,
        size: cornerFontSize,
        color: rgb(0.7, 0.7, 0.7),
        opacity: baseOpacity
      });

      // Bottom-left corner
      page.drawText(cornerText, {
        x: 10,
        y: 10,
        size: cornerFontSize,
        color: rgb(0.7, 0.7, 0.7),
        opacity: baseOpacity
      });
    }

    // Save the watermarked PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;

  } catch (error) {
    console.error('Watermark error:', error);
    throw new Error('Failed to add watermark to PDF');
  }
}

module.exports = {
  addWatermarkToPDF
};
