"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_model_1 = require("../models/User.model");
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("../utils/logger"));
class AuthController {
    async register(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { name, email, password } = req.body;
            // Check if user exists
            const existingUser = await User_model_1.User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // Create user
            const user = await User_model_1.User.create({
                name,
                email,
                password,
                preferences: {
                    currency: 'INR',
                    theme: 'light',
                    monthlyBudget: 0,
                    notificationEnabled: true,
                },
            });
            // Generate token
            const token = this.generateToken(user._id.toString());
            const refreshToken = this.generateRefreshToken(user._id.toString());
            return res.status(201).json({
                success: true,
                token,
                refreshToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    preferences: user.preferences,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async login(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { email, password } = req.body;
            // Find user
            const user = await User_model_1.User.findOne({ email }).select('+password');
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            // Check password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            // Generate token
            const token = this.generateToken(user._id.toString());
            const refreshToken = this.generateRefreshToken(user._id.toString());
            // Update last login
            user.set({ lastLogin: new Date() });
            await user.save();
            return res.json({
                success: true,
                token,
                refreshToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    preferences: user.preferences,
                },
            });
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(400).json({ message: 'Refresh token required' });
            }
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_SECRET);
            const user = await User_model_1.User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ message: 'Invalid refresh token' });
            }
            const newToken = this.generateToken(user._id.toString());
            const newRefreshToken = this.generateRefreshToken(user._id.toString());
            return res.json({
                token: newToken,
                refreshToken: newRefreshToken,
            });
        }
        catch (error) {
            logger_1.default.error('Token refresh error:', error);
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
    }
    async logout(req, res) {
        try {
            // In a real app, you might want to blacklist the token
            return res.json({ success: true, message: 'Logged out successfully' });
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async getProfile(req, res) {
        try {
            const user = await User_model_1.User.findById(req.user?.id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json({ success: true, user });
        }
        catch (error) {
            logger_1.default.error('Get profile error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async updateProfile(req, res) {
        try {
            const updates = req.body;
            const user = await User_model_1.User.findByIdAndUpdate(req.user?.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json({ success: true, user });
        }
        catch (error) {
            logger_1.default.error('Update profile error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User_model_1.User.findById(req.user?.id).select('+password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const isValid = await user.comparePassword(currentPassword);
            if (!isValid) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            user.password = newPassword;
            await user.save();
            return res.json({ success: true, message: 'Password changed successfully' });
        }
        catch (error) {
            logger_1.default.error('Change password error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
    generateToken(userId) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn: process.env.JWT_EXPIRE || '7d' });
    }
    generateRefreshToken(userId) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign({ id: userId }, secret, { expiresIn: '30d' });
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map