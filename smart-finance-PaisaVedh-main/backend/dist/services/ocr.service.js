"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrService = exports.OCRService = void 0;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const cloudinary_1 = require("../config/cloudinary");
const logger_1 = __importDefault(require("../utils/logger"));
class OCRService {
    async extractReceiptData(imagePath) {
        try {
            // Upload to cloudinary
            const { url } = await (0, cloudinary_1.uploadToCloudinary)(imagePath, 'receipts');
            // Perform OCR
            const { data: { text } } = await tesseract_js_1.default.recognize(imagePath, 'eng', {
                logger: (m) => console.log(m),
            });
            // Extract information from text
            const merchant = this.extractMerchant(text);
            const amount = this.extractAmount(text);
            const date = this.extractDate(text);
            const items = this.extractItems(text);
            return {
                merchant,
                amount,
                date,
                items,
            };
        }
        catch (error) {
            logger_1.default.error('OCR extraction failed:', error);
            throw new Error('Failed to extract receipt data');
        }
    }
    extractMerchant(text) {
        // Common patterns for merchant names
        const patterns = [
            /MERCHANT:\s*(.+)/i,
            /STORE:\s*(.+)/i,
            /SHOP:\s*(.+)/i,
            /BILL FROM:\s*(.+)/i,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match)
                return match[1].trim();
        }
        // Take first line as potential merchant
        const lines = text.split('\n');
        return lines[0]?.trim() || 'Unknown Merchant';
    }
    extractAmount(text) {
        // Look for amount patterns (Indian Rupees)
        const patterns = [
            /TOTAL\s*(?:RS|₹)?\s*(\d+(?:\.\d{2})?)/i,
            /AMOUNT\s*(?:RS|₹)?\s*(\d+(?:\.\d{2})?)/i,
            /GRAND TOTAL\s*(?:RS|₹)?\s*(\d+(?:\.\d{2})?)/i,
            /NET AMOUNT\s*(?:RS|₹)?\s*(\d+(?:\.\d{2})?)/i,
            /PAYABLE\s*(?:RS|₹)?\s*(\d+(?:\.\d{2})?)/i,
            /(?:RS|₹)\s*(\d+(?:\.\d{2})?)\s*$/im,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return 0;
    }
    extractDate(text) {
        // Look for date patterns (DD/MM/YYYY, DD-MM-YYYY, etc.)
        const patterns = [
            /DATE:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
            /(\d{4}-\d{1,2}-\d{1,2})/,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const dateStr = match[1];
                return new Date(dateStr);
            }
        }
        return new Date();
    }
    extractItems(text) {
        const items = [];
        const lines = text.split('\n');
        // Look for lines that look like items (with amounts)
        const itemPattern = /^(.+?)\s+(\d+(?:\.\d{2})?)\s*$/i;
        for (const line of lines) {
            const match = line.match(itemPattern);
            if (match) {
                items.push(match[1].trim());
            }
        }
        return items.slice(0, 10); // Limit to 10 items
    }
}
exports.OCRService = OCRService;
exports.ocrService = new OCRService();
//# sourceMappingURL=ocr.service.js.map