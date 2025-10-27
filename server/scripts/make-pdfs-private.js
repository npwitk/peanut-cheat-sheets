/**
 * Script to make all existing PDFs in GCS private
 * Run this once after deploying the security fix
 *
 * This removes public access from any PDFs that were uploaded before the security fix
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Parse GCS credentials
let gcsCredentials;
if (process.env.GCS_CREDENTIALS) {
  try {
    let credString = process.env.GCS_CREDENTIALS.trim();

    // Handle base64 encoding
    if (!credString.startsWith('{') && !credString.startsWith('"') && !credString.startsWith("'")) {
      credString = Buffer.from(credString, 'base64').toString('utf-8');
    } else {
      if (credString.startsWith('"') && credString.endsWith('"')) {
        credString = credString.slice(1, -1);
      }
      if (credString.startsWith("'") && credString.endsWith("'")) {
        credString = credString.slice(1, -1);
      }
      credString = credString.replace(/\\"/g, '"');
      credString = credString.replace(/\\n/g, '\n');
    }

    gcsCredentials = JSON.parse(credString);
  } catch (error) {
    console.error('Failed to parse GCS_CREDENTIALS:', error.message);
    process.exit(1);
  }
}

// Initialize Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: !process.env.GCS_CREDENTIALS ? (process.env.GCS_KEY_FILE || path.join(__dirname, '..', 'gcs-key.json')) : undefined,
  credentials: gcsCredentials
});

const bucketName = process.env.GCS_BUCKET_NAME || 'siit-cheatsheets';
const bucket = storage.bucket(bucketName);

/**
 * Make all PDFs in the cheatsheets/ folder private
 */
async function makeAllPDFsPrivate() {
  console.log('Scanning GCS bucket for PDF files...');
  console.log(`Bucket: ${bucketName}`);
  console.log('');

  try {
    // Get all files in cheatsheets/ folder
    const [files] = await bucket.getFiles({
      prefix: 'cheatsheets/'
    });

    if (files.length === 0) {
      console.log('No files found in cheatsheets/ folder');
      return;
    }

    console.log(`Found ${files.length} files in cheatsheets/ folder`);
    console.log('');

    let successCount = 0;
    let alreadyPrivateCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        // Check if file is currently public
        const [metadata] = await file.getMetadata();
        const isPublic = metadata.acl?.some(acl => acl.entity === 'allUsers');

        if (isPublic) {
          console.log(`Making private: ${file.name}`);

          // Remove public access
          await file.makePrivate();

          console.log(`${file.name} is now private`);
          successCount++;
        } else {
          console.log(`Already private: ${file.name}`);
          alreadyPrivateCount++;
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('Summary:');
    console.log(`   Made private: ${successCount}`);
    console.log(`   Already private: ${alreadyPrivateCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total files: ${files.length}`);
    console.log('═══════════════════════════════════════');
    console.log('');

    if (successCount > 0) {
      console.log('Security fix complete! All PDFs are now private.');
    } else if (alreadyPrivateCount === files.length) {
      console.log('All PDFs were already private. No changes needed.');
    }

    if (errorCount > 0) {
      console.log('Some files had errors. Please check the logs above.');
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * Verify that preview images are still public
 */
async function verifyPreviewsArePublic() {
  console.log('');
  console.log('Verifying preview images are still public...');
  console.log('');

  try {
    const [files] = await bucket.getFiles({
      prefix: 'previews/',
      maxResults: 5 // Just check first 5
    });

    if (files.length === 0) {
      console.log('No preview images found');
      return;
    }

    let publicCount = 0;
    let privateCount = 0;

    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const isPublic = metadata.acl?.some(acl => acl.entity === 'allUsers');

      if (isPublic) {
        console.log(`Public: ${file.name}`);
        publicCount++;
      } else {
        console.log(`Private: ${file.name} (should be public!)`);
        privateCount++;
      }
    }

    console.log('');
    if (privateCount > 0) {
      console.log('  WARNING: Some preview images are private!');
      console.log('   Preview images should be publicly accessible.');
      console.log('   You may need to re-upload them or make them public manually.');
    } else {
      console.log('All preview images are properly configured (public)');
    }

  } catch (error) {
    console.error('Error checking preview images:', error.message);
  }
}

// Run the script
console.log('');
console.log('╔═══════════════════════════════════════╗');
console.log('║   GCS Security Fix - Make PDFs Private  ║');
console.log('╚═══════════════════════════════════════╝');
console.log('');

makeAllPDFsPrivate()
  .then(() => verifyPreviewsArePublic())
  .then(() => {
    console.log('');
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('');
    console.error('Script failed:', error);
    process.exit(1);
  });
