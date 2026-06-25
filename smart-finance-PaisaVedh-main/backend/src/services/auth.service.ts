import { User, IUser } from '../models/User.model';
import * as jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailService } from './email.service';
import { cacheService } from '../config/redis';
import logger from '../utils/logger';

interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: Partial<IUser>;
  message?: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export class AuthService {
  
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: 'User already exists with this email',
        };
      }

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        preferences: {
          currency: 'INR',
          theme: 'light',
          monthlyBudget: 0,
          notificationEnabled: true,
        },
      });

      // Generate email verification token
      const verificationToken = this.generateVerificationToken();
      user.set('verificationToken', verificationToken);
      await user.save();

      // Send verification email
      await this.sendVerificationEmail(user.email, verificationToken);

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token in Redis
      await cacheService.set(
        `refresh_token:${user._id}`,
        refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      return {
        success: true,
        token,
        refreshToken,
        user: userResponse,
      };
    } catch (error) {
      logger.error('Registration service error:', error);
      throw new Error('Failed to register user');
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
        };
      }

      // Check if account is locked
      if (user.isLocked && user.lockUntil && user.lockUntil > new Date()) {
        const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / (1000 * 60));
        return {
          success: false,
          message: `Account is locked. Please try again after ${waitMinutes} minutes`,
        };
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.handleFailedLogin(user);
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLogins(user);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token
      await cacheService.set(
        `refresh_token:${user._id}`,
        refreshToken,
        7 * 24 * 60 * 60
      );

      // Remove password from response
      const userResponse = user.toObject();
      delete (userResponse as any).password;
      delete (userResponse as any).verificationToken;

      return {
        success: true,
        token,
        refreshToken,
        user: userResponse,
      };
    } catch (error) {
      logger.error('Login service error:', error);
      throw new Error('Failed to login');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as TokenPayload;
      
      // Check if refresh token exists in Redis
      const storedToken = await cacheService.get(`refresh_token:${decoded.id}`);
      if (!storedToken || storedToken !== refreshToken) {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      // Get user
      const user = await User.findById(decoded.id);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Generate new access token
      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update refresh token in Redis
      await cacheService.set(
        `refresh_token:${user._id}`,
        newRefreshToken,
        7 * 24 * 60 * 60
      );

      return {
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return {
        success: false,
        message: 'Invalid or expired refresh token',
      };
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // Remove refresh token from Redis
      await cacheService.del(`refresh_token:${userId}`);
      
      // Blacklist current access token (optional, would require token storage)
      logger.info(`User ${userId} logged out successfully`);
    } catch (error) {
      logger.error('Logout service error:', error);
      throw new Error('Failed to logout');
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return false;
      }

      user.isEmailVerified = true;
      user.verificationToken = undefined;
      await user.save();

      return true;
    } catch (error) {
      logger.error('Email verification error:', error);
      return false;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Return true even if user not found for security
        return true;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = resetTokenExpiry;
      await user.save();

      // Send reset email
      await this.sendPasswordResetEmail(user.email, resetToken);

      return true;
    } catch (error) {
      logger.error('Forgot password error:', error);
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() },
      });

      if (!user) {
        return false;
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      // Invalidate all refresh tokens for this user
      await cacheService.del(`refresh_token:${user._id}`);

      return true;
    } catch (error) {
      logger.error('Reset password error:', error);
      return false;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return false;
      }

      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        return false;
      }

      user.password = newPassword;
      await user.save();

      // Invalidate all sessions
      await cacheService.del(`refresh_token:${userId}`);

      return true;
    } catch (error) {
      logger.error('Change password error:', error);
      return false;
    }
  }

  async updateProfile(
    userId: string,
    updates: Partial<IUser>
  ): Promise<Partial<IUser> | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password -verificationToken -resetPasswordToken');

      if (!user) {
        return null;
      }

      return user.toObject();
    } catch (error) {
      logger.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  }

  async getUserById(userId: string): Promise<Partial<IUser> | null> {
    try {
      const user = await User.findById(userId).select(
        '-password -verificationToken -resetPasswordToken'
      );
      return user ? user.toObject() : null;
    } catch (error) {
      logger.error('Get user error:', error);
      return null;
    }
  }

private generateAccessToken(user: IUser): string {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  } as jwt.SignOptions);
}

private generateRefreshToken(user: IUser): string {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  } as jwt.SignOptions);
}

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to PaisaVedh! 🎉</h2>
          <p>Please verify your email address to start managing your finances.</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy this link: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        </div>
      </body>
      </html>
    `;
    
    await emailService.sendEmail(email, 'Verify Your Email - PaisaVedh', html);
  }

  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;
    
    await emailService.sendEmail(email, 'Reset Your Password - PaisaVedh', html);
  }

  private async handleFailedLogin(user: IUser): Promise<void> {
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    
    if (failedAttempts >= 5) {
      user.isLocked = true;
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      user.failedLoginAttempts = failedAttempts;
      
      // Send lock notification
      await this.sendAccountLockNotification(user.email);
    } else {
      user.failedLoginAttempts = failedAttempts;
    }
    
    await user.save();
  }

  private async resetFailedLogins(user: IUser): Promise<void> {
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lockUntil = undefined;
    await user.save();
  }

  private async sendAccountLockNotification(email: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert { background: #fee; border-left: 4px solid #f44336; padding: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h3>Account Temporarily Locked</h3>
            <p>Your account has been locked due to multiple failed login attempts.</p>
            <p>Please try again after 30 minutes.</p>
          </div>
          <p>If this wasn't you, please contact support immediately.</p>
        </div>
      </body>
      </html>
    `;
    
    await emailService.sendEmail(email, 'Account Security Alert - PaisaVedh', html);
  }
}

export const authService = new AuthService();