import Tesseract from 'tesseract.js';
import { uploadToCloudinary } from '../config/cloudinary';
import logger from '../utils/logger';

export class OCRService {
  async extractReceiptData(imagePath: string): Promise<{
    merchant: string;
    amount: number;
    date: Date;
    items: string[];
  }> {
    try {
      // Upload to cloudinary
      const { url } = await uploadToCloudinary(imagePath, 'receipts');
      
      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng',
        {
          logger: (m) => console.log(m),
        }
      );
      
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
    } catch (error) {
      logger.error('OCR extraction failed:', error);
      throw new Error('Failed to extract receipt data');
    }
  }
  
  private extractMerchant(text: string): string {
    // Common patterns for merchant names
    const patterns = [
      /MERCHANT:\s*(.+)/i,
      /STORE:\s*(.+)/i,
      /SHOP:\s*(.+)/i,
      /BILL FROM:\s*(.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    // Take first line as potential merchant
    const lines = text.split('\n');
    return lines[0]?.trim() || 'Unknown Merchant';
  }
  
  private extractAmount(text: string): number {
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
  
  private extractDate(text: string): Date {
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
  
  private extractItems(text: string): string[] {
    const items: string[] = [];
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

export const ocrService = new OCRService();