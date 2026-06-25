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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const BudgetSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    category: {
        type: String,
        required: true,
        enum: ['food', 'groceries', 'shopping', 'entertainment', 'transportation',
            'utilities', 'healthcare', 'education', 'travel', 'rent',
            'insurance', 'subscriptions', 'other'],
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    spent: {
        type: Number,
        default: 0,
        min: 0
    },
    remaining: {
        type: Number,
        default: 0
    },
    percentageUsed: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['on_track', 'warning', 'exceeded'],
        default: 'on_track'
    },
    month: {
        type: Number,
        required: true,
        min: 0,
        max: 11
    },
    year: {
        type: Number,
        required: true
    },
    alerts: {
        type: Boolean,
        default: true
    },
    alertThreshold: {
        type: Number,
        default: 80,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});
// Pre-save middleware
BudgetSchema.pre('save', function (next) {
    this.remaining = this.amount - this.spent;
    this.percentageUsed = this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
    if (this.percentageUsed >= 100) {
        this.status = 'exceeded';
    }
    else if (this.percentageUsed >= 80) {
        this.status = 'warning';
    }
    else {
        this.status = 'on_track';
    }
    next();
});
// Compound unique index
BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });
exports.Budget = mongoose_1.default.model('Budget', BudgetSchema);
//# sourceMappingURL=Budget.model.js.map