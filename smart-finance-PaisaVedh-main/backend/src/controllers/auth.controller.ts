import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.model';
import { validationResult } from 'express-validator';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user
      const user = await User.create({
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
    } catch (error) {
      logger.error('Registration error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password');
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
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const newToken = this.generateToken(user._id.toString());
      const newRefreshToken = this.generateRefreshToken(user._id.toString());

      return res.json({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  async logout(req: Request, res: Response): Promise<Response> {
    try {
      // In a real app, you might want to blacklist the token
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const user = await User.findById(req.user?.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ success: true, user });
    } catch (error) {
      logger.error('Get profile error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const updates = req.body;
      const user = await User.findByIdAndUpdate(
        req.user?.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ success: true, user });
    } catch (error) {
      logger.error('Update profile error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user?.id).select('+password');

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
    } catch (error) {
      logger.error('Change password error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

 private generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(
    { id: userId }, 
    secret, 
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
  );
}

private generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign(
    { id: userId }, 
    secret, 
    { expiresIn: '30d' } as jwt.SignOptions
  );
}
  }


export const authController = new AuthController();