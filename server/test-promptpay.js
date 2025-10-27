// Quick test script for PromptPay QR generation
require('dotenv').config();
const { generatePromptPayQR } = require('./services/promptpay');

async function test() {
  try {
    console.log('Testing PromptPay QR generation...');
    console.log('Phone:', process.env.PROMPTPAY_PHONE_NUMBER);
    console.log('Amount: 50 THB');

    const qrCode = await generatePromptPayQR(process.env.PROMPTPAY_PHONE_NUMBER || '0812345678', 50);

    console.log('✓ QR Code generated successfully!');
    console.log('QR Code length:', qrCode.length);
    console.log('QR Code preview:', qrCode.substring(0, 100) + '...');

    if (qrCode.startsWith('data:image/png;base64,')) {
      console.log('✓ QR Code is in correct format (base64 data URL)');
    } else {
      console.log('✗ QR Code is NOT in data URL format');
    }

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
  }
}

test();
