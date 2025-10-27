const { Storage } = require('@google-cloud/storage');
const path = require('path');
require('dotenv').config();

// Parse GCS credentials from environment variable
let gcsCredentials;
if (process.env.GCS_CREDENTIALS) {
  try {
    let credString = process.env.GCS_CREDENTIALS.trim();

    // Check if it's base64 encoded (doesn't start with { or ")
    if (!credString.startsWith('{') && !credString.startsWith('"') && !credString.startsWith("'")) {
      // Assume it's base64 encoded
      // DEBUG: Uncomment for troubleshooting (SECURITY: Remove in production)
      // console.log('Detected base64-encoded GCS_CREDENTIALS, decoding...');
      credString = Buffer.from(credString, 'base64').toString('utf-8');
    } else {
      // Handle JSON string format
      // Remove surrounding quotes if Railway added them
      if (credString.startsWith('"') && credString.endsWith('"')) {
        credString = credString.slice(1, -1);
      }
      if (credString.startsWith("'") && credString.endsWith("'")) {
        credString = credString.slice(1, -1);
      }

      // Handle escaped quotes that might appear after removing outer quotes
      credString = credString.replace(/\\"/g, '"');

      // Replace escaped newlines (\n) with actual newline characters for the private key
      credString = credString.replace(/\\n/g, '\n');
    }

    // Parse the JSON
    gcsCredentials = JSON.parse(credString);
    // DEBUG: Uncomment for troubleshooting (SECURITY: Remove in production)
    // console.log('GCS credentials parsed successfully');
  } catch (error) {
    console.error('Failed to parse GCS_CREDENTIALS:', error.message);
    // DEBUG: Uncomment for troubleshooting (SECURITY: Shows sensitive data - Remove in production)
    // console.error('GCS_CREDENTIALS starts with:', process.env.GCS_CREDENTIALS?.substring(0, 50));
    throw new Error('Invalid GCS_CREDENTIALS format. Please check your Railway environment variable.');
  }
}

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  // For local development with service account key file
  keyFilename: !process.env.GCS_CREDENTIALS ? (process.env.GCS_KEY_FILE || path.join(__dirname, '..', 'gcs-key.json')) : undefined,
  // For production (Railway) with credentials JSON
  credentials: gcsCredentials
});

const bucketName = process.env.GCS_BUCKET_NAME || 'siit-cheatsheets';
const bucket = storage.bucket(bucketName);

/**
 * Upload a file to Google Cloud Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} destination - Destination path in bucket (e.g., 'cheatsheets/file.pdf')
 * @param {string} contentType - File MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToGCS(fileBuffer, destination, contentType) {
  const file = bucket.file(destination);

  await file.save(fileBuffer, {
    metadata: {
      contentType: contentType,
    },
    resumable: false,
  });

  // SECURITY: Do NOT make PDFs public! Only accessible via signed URLs
  // Preview images can be public (handled separately)
  if (destination.startsWith('previews/')) {
    // Make preview images publicly accessible
    await file.makePublic();
    return `https://storage.googleapis.com/${bucketName}/${destination}`;
  }

  // For PDFs and other sensitive files, return the GCS path (not public URL)
  // These will be accessed via signed URLs only
  return destination;
}

/**
 * Upload a file from local path to GCS
 * @param {string} localPath - Local file path
 * @param {string} destination - Destination path in bucket
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadFileToGCS(localPath, destination) {
  await bucket.upload(localPath, {
    destination: destination,
  });

  const file = bucket.file(destination);

  // SECURITY: Only make preview images public, keep PDFs private
  if (destination.startsWith('previews/')) {
    // Make preview images publicly accessible
    await file.makePublic();
    return `https://storage.googleapis.com/${bucketName}/${destination}`;
  }

  // For PDFs, return the GCS path (will be accessed via signed URLs)
  return destination;
}

/**
 * Download a file from GCS
 * @param {string} filePath - File path in bucket
 * @returns {Promise<Buffer>} - File buffer
 */
async function downloadFromGCS(filePath) {
  const file = bucket.file(filePath);
  const [contents] = await file.download();
  return contents;
}

/**
 * Delete a file from GCS
 * @param {string} filePath - File path in bucket
 * @returns {Promise<void>}
 */
async function deleteFromGCS(filePath) {
  const file = bucket.file(filePath);
  await file.delete();
}

/**
 * Get a signed URL for temporary access (for private files)
 * @param {string} filePath - File path in bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
async function getSignedUrl(filePath, expiresIn = 3600) {
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresIn * 1000,
  });

  return url;
}

/**
 * Check if a file exists in GCS
 * @param {string} filePath - File path in bucket
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  return exists;
}

module.exports = {
  storage,
  bucket,
  uploadToGCS,
  uploadFileToGCS,
  downloadFromGCS,
  deleteFromGCS,
  getSignedUrl,
  fileExists
};
