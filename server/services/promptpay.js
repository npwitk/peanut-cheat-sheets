const QRCode = require('qrcode');
const generatePayload = require('promptpay-qr');

/**
 * Generate PromptPay QR code for payment
 * @param {string} phoneNumber - PromptPay phone number (10 digits)
 * @param {number} amount - Payment amount in THB
 * @returns {Promise<string>} Base64 encoded QR code image
 */
async function generatePromptPayQR(phoneNumber, amount) {
  try {
    // Remove any non-digit characters from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      throw new Error('Phone number must be 10 digits');
    }

    // Generate PromptPay payload using official library
    // The library handles all EMVCo formatting automatically
    const payload = generatePayload(cleanPhone, { amount });

    console.log('PromptPay payload generated:', payload.substring(0, 50) + '...');

    // Generate QR code as base64 data URL
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('PromptPay QR code generated successfully');
    return qrCodeDataURL;

  } catch (error) {
    console.error('PromptPay QR generation error:', error);
    throw new Error('Failed to generate PromptPay QR code: ' + error.message);
  }
}

module.exports = {
  generatePromptPayQR
};
