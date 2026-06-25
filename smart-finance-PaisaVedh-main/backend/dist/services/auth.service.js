"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const User_model_1 = require("../models/User.model");
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const email_service_1 = require("./email.service");
const redis_1 = require("../config/redis");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    async register(userData) {
        try {
            // Check if user exists
            const existingUser = await User_model_1.User.findOne({ email: userData.email });
            if (existingUser) {
                return {
                    success: false,
                    message: 'User already exists with this email',
                };
            }
            // Create user
            const user = await User_model_1.User.create({
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
            await redis_1.cacheService.set(`refresh_token:${user._id}`, refreshToken, 7 * 24 * 60 * 60 // 7 days
            );
            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;
            return {
                success: true,
                token,
                refreshToken,
                user: userResponse,
            };
        }
        catch (error) {
            logger_1.default.error('Registration service error:', error);
            throw new Error('Failed to register user');
        }
    }
    async login(email, password) {
        try {
            // Find user with password field
            const user = await User_model_1.User.findOne({ email }).select('+password');
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
            await redis_1.cacheService.set(`refresh_token:${user._id}`, refreshToken, 7 * 24 * 60 * 60);
            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;
            delete userResponse.verificationToken;
            return {
                success: true,
                token,
                refreshToken,
                user: userResponse,
            };
        }
        catch (error) {
            logger_1.default.error('Login service error:', error);
            throw new Error('Failed to login');
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            // Check if refresh token exists in Redis
            const storedToken = await redis_1.cacheService.get(`refresh_token:${decoded.id}`);
            if (!storedToken || storedToken !== refreshToken) {
                return {
                    success: false,
                    message: 'Invalid refresh token',
                };
            }
            // Get user
            const user = await User_model_1.User.findById(decoded.id);
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
            await redis_1.cacheService.set(`refresh_token:${user._id}`, newRefreshToken, 7 * 24 * 60 * 60);
            return {
                success: true,
                token: newToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            logger_1.default.error('Token refresh error:', error);
            return {
                success: false,
                message: 'Invalid or expired refresh token',
            };
        }
    }
    async logout(userId) {
        try {
            // Remove refresh token from Redis
            await redis_1.cacheService.del(`refresh_token:${userId}`);
            // Blacklist current access token (optional, would require token storage)
            logger_1.default.info(`User ${userId} logged out successfully`);
        }
        catch (error) {
            logger_1.default.error('Logout service error:', error);
            throw new Error('Failed to logout');
        }
    }
    async verifyEmail(token) {
        try {
            const user = await User_model_1.User.findOne({ verificationToken: token });
            if (!user) {
                return false;
            }
            user.isEmailVerified = true;
            user.verificationToken = undefined;
            await user.save();
            return true;
        }
        catch (error) {
            logger_1.default.error('Email verification error:', error);
            return false;
        }
    }
    async forgotPassword(email) {
        try {
            const user = await User_model_1.User.findOne({ email });
            if (!user) {
                // Return true even if user not found for security
                return true;
            }
            // Generate reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpiry = resetTokenExpiry;
            await user.save();
            // Send reset email
            await this.sendPasswordResetEmail(user.email, resetToken);
            return true;
        }
        catch (error) {
            logger_1.default.error('Forgot password error:', error);
            return false;
        }
    }
    async resetPassword(token, newPassword) {
        try {
            const user = await User_model_1.User.findOne({
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
            await redis_1.cacheService.del(`refresh_token:${user._id}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Reset password error:', error);
            return false;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User_model_1.User.findById(userId).select('+password');
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
            await redis_1.cacheService.del(`refresh_token:${userId}`);
            return true;
        }
        catch (error) {
            logger_1.default.error('Change password error:', error);
            return false;
        }
    }
    async updateProfile(userId, updates) {
        try {
            const user = await User_model_1.User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-password -verificationToken -resetPasswordToken');
            if (!user) {
                return null;
            }
            return user.toObject();
        }
        catch (error) {
            logger_1.default.error('Update profile error:', error);
            throw new Error('Failed to update profile');
        }
    }
    async getUserById(userId) {
        try {
            const user = await User_model_1.User.findById(userId).select('-password -verificationToken -resetPasswordToken');
            return user ? user.toObject() : null;
        }
        catch (error) {
            logger_1.default.error('Get user error:', error);
            return null;
        }
    }
    generateAccessToken(user) {
        const payload = {
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
        });
    }
    generateRefreshToken(user) {
        const payload = {
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
        });
    }
    generateVerificationToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    async sendVerificationEmail(email, token) {
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
        await email_service_1.emailService.sendEmail(email, 'Verify Your Email - PaisaVedh', html);
    }
    async sendPasswordResetEmail(email, token) {
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
        await email_service_1.emailService.sendEmail(email, 'Reset Your Password - PaisaVedh', html);
    }
    async handleFailedLogin(user) {
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        if (failedAttempts >= 5) {
            user.isLocked = true;
            user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
            user.failedLoginAttempts = failedAttempts;
            // Send lock notification
            await this.sendAccountLockNotification(user.email);
        }
        else {
            user.failedLoginAttempts = failedAttempts;
        }
        await user.save();
    }
    async resetFailedLogins(user) {
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        user.lockUntil = undefined;
        await user.save();
    }
    async sendAccountLockNotification(email) {
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
        await email_service_1.emailService.sendEmail(email, 'Account Security Alert - PaisaVedh', html);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map