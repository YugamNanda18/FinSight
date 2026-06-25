import nodemailer from 'nodemailer';
import logger from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Public method to send emails
  public async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"PaisaVedh" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendMonthlyReport(to: string, data: any): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .summary { display: flex; justify-content: space-around; margin: 20px 0; }
          .summary-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .amount { font-size: 24px; font-weight: bold; color: #667eea; }
          .category-list { list-style: none; padding: 0; }
          .category-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PaisaVedh Monthly Report</h1>
            <p>${data.month} ${data.year}</p>
          </div>
          <div class="content">
            <div class="summary">
              <div class="summary-card">
                <div>Total Income</div>
                <div class="amount">₹${data.totalIncome?.toFixed(2) || '0.00'}</div>
              </div>
              <div class="summary-card">
                <div>Total Expenses</div>
                <div class="amount">₹${data.totalExpenses?.toFixed(2) || '0.00'}</div>
              </div>
              <div class="summary-card">
                <div>Savings</div>
                <div class="amount">₹${data.savings?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            
            <h3>Top Spending Categories</h3>
            <ul class="category-list">
              ${data.topCategories?.map((cat: any) => `
                <li class="category-item">
                  <span>${cat._id}</span>
                  <span>₹${cat.total?.toFixed(2) || '0.00'}</span>
                </li>
              `).join('') || '<li>No data available</li>'}
            </ul>
            
            <p>Total Transactions: ${data.transactionCount || 0}</p>
            <p style="margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL}/reports" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Detailed Report
              </a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from PaisaVedh. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} PaisaVedh. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(to, `Monthly Financial Report - ${data.month} ${data.year}`, html);
  }

  async sendBudgetAlert(to: string, alerts: string[]): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
          .alert-warning { border-left-color: #ff9800; }
          .alert-danger { border-left-color: #f44336; background: #ffebee; }
        </style>
      </head>
      <body>
        <h2>Budget Alert ⚠️</h2>
        <p>You have the following budget alerts:</p>
        ${alerts.map(alert => `<div class="alert">${alert}</div>`).join('')}
        <p><a href="${process.env.FRONTEND_URL}/budgets">Review Your Budgets</a></p>
      </body>
      </html>
    `;

    await this.sendEmail(to, 'Budget Alert - Action Required', html);
  }
}

export const emailService = new EmailService();