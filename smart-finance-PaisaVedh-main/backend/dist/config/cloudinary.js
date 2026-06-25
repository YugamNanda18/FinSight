"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const logger_1 = __importDefault(require("../utils/logger"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
const uploadToCloudinary = async (filePath, folder = 'paisavedh') => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(filePath, {
            folder,
            resource_type: 'auto',
            allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
        });
        logger_1.default.info(`File uploaded to Cloudinary: ${result.public_id}`);
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
    catch (error) {
        logger_1.default.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to cloud storage');
    }
};
exports.uploadToCloudinary = uploadToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
        logger_1.default.info(`File deleted from Cloudinary: ${publicId}`);
    }
    catch (error) {
        logger_1.default.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete file from cloud storage');
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
exports.default = cloudinary_1.v2;
//# sourceMappingURL=cloudinary.js.map