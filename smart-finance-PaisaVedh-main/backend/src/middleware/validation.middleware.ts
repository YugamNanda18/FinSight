import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const registerValidation = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];

export const loginValidation = [
  body('email')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const transactionValidation = [
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('type')
    .isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
  body('category')
    .notEmpty().withMessage('Category is required'),
  body('description')
    .notEmpty().withMessage('Description is required'),
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
];

export const budgetValidation = [
  body('category')
    .notEmpty().withMessage('Category is required'),
  body('amount')
    .isFloat({ min: 0 }).withMessage('Amount must be positive'),
];

export const idParamValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
];