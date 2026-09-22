import { NextFunction, Request, Response, Router } from 'express';
import AppError from '../../errors/AppError';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import catchAsync from '../../utils/catchAsync';
import { upload, uploadMultipleImagesToCloudinary } from '../../utils/cloudinary';
import { GigController } from './gig.controller';
import { GigValidation } from './gig.validation';

const router = Router();

// Middleware to parse form data JSON and upload image files to Cloudinary
const parseFormDataAndUpload = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (typeof req.body?.data === 'string') {
      try {
        req.body = JSON.parse(req.body.data);
      } catch {
        throw new AppError(400, 'Invalid JSON format in "data" field.');
      }
    }

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const uploadedUrls = await uploadMultipleImagesToCloudinary(files, 'freelance_gigs');
      const existingImages = Array.isArray(req.body?.images) ? req.body.images : [];
      req.body.images = [...existingImages, ...uploadedUrls];
    }

    next();
  }
);

// 1. Standalone Upload 1-4 Gig Images to Cloudinary (PROVIDER only)
router.post(
  '/upload-images',
  auth('PROVIDER'),
  upload.array('images', 6),
  GigController.uploadGigImages
);

// 2. Create Gig with 3 packages and 3-4 images (PROVIDER only)
// Supports both JSON body and Multipart form-data with image files
router.post(
  '/',
  auth('PROVIDER'),
  upload.array('images', 6),
  parseFormDataAndUpload,
  validateRequest(GigValidation.createGigValidationSchema),
  GigController.createGig
);

// 3. Get logged in provider's own gigs
router.get(
  '/my-gigs',
  auth('PROVIDER', 'SUPER_ADMIN'),
  GigController.getMyGigs
);

// 4. Public: Get all gigs with search & filtering
router.get('/', GigController.getAllGigs);

// 4b. Public: Get distinct gig categories
router.get('/categories', GigController.getGigCategories);

// 5. Public: Get single gig with full packages
router.get('/:id', GigController.getSingleGig);

// 6. Update gig, images and packages (PROVIDER only)
router.patch(
  '/:id',
  auth('PROVIDER', 'SUPER_ADMIN'),
  upload.array('images', 6),
  parseFormDataAndUpload,
  validateRequest(GigValidation.updateGigValidationSchema),
  GigController.updateGig
);

// 7. Toggle/Disable/Enable gig status (PROVIDER only)
router.patch(
  '/:id/toggle-status',
  auth('PROVIDER'),
  validateRequest(GigValidation.updateGigStatusValidationSchema),
  GigController.toggleGigStatus
);

// 8. Delete gig (PROVIDER owner or SUPER_ADMIN)
router.delete(
  '/:id',
  auth('PROVIDER', 'SUPER_ADMIN'),
  GigController.deleteGig
);

export const GigRoutes = router;
