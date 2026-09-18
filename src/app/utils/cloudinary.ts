import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import config from '../config';
import AppError from '../errors/AppError';

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});

// 2. Configure Multer Memory Storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per image
    files: 6, // up to 6 images (typically 3-4 images)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files (JPEG, PNG, WEBP, GIF, etc.) are allowed!'));
    }
  },
});

// 3. Upload a single image buffer to Cloudinary
export const uploadImageToCloudinary = (
  file: Express.Multer.File,
  folder: string = 'freelance_gig_images'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError(500, `Cloudinary upload failed: ${error?.message || 'Unknown error'}`)
          );
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};

// 4. Upload multiple image buffers to Cloudinary in parallel
export const uploadMultipleImagesToCloudinary = async (
  files: Express.Multer.File[],
  folder: string = 'freelance_gig_images'
): Promise<string[]> => {
  if (!files || files.length === 0) return [];
  const uploadPromises = files.map((file) => uploadImageToCloudinary(file, folder));
  return await Promise.all(uploadPromises);
};

export default cloudinary;
