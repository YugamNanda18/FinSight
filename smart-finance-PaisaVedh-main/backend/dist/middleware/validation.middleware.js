"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamValidation = exports.budgetValidation = exports.transactionValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};
exports.validate = validate;
exports.registerValidation = [
    (0, express_validator_1.body)('name')
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    (0, express_validator_1.body)('email')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email')
        .isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .notEmpty().withMessage('Password is required'),
];
exports.transactionValidation = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    (0, express_validator_1.body)('type')
        .isIn(['credit', 'debit']).withMessage('Type must be credit or debit'),
    (0, express_validator_1.body)('category')
        .notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('description')
        .notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('date')
        .optional()
        .isISO8601().withMessage('Invalid date format'),
];
exports.budgetValidation = [
    (0, express_validator_1.body)('category')
        .notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 0 }).withMessage('Amount must be positive'),
];
exports.idParamValidation = [
    (0, express_validator_1.param)('id')
        .isMongoId().withMessage('Invalid ID format'),
];
//# sourceMappingURL=validation.middleware.js.map