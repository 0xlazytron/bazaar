import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from 'firebase/storage';
import { storage } from './firebase';

// Test Firebase Storage connectivity
export const testStorageConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Firebase Storage connectivity...');
    
    // Try to list items in the root directory
    const rootRef = ref(storage, '/');
    await listAll(rootRef);
    
    console.log('✅ Firebase Storage is accessible');
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage connectivity test failed:', error);
    return false;
  }
};

// Validate Firebase Storage URL
export const validateStorageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const isFirebaseStorage = urlObj.hostname.includes('firebasestorage.googleapis.com');
    
    // Check if it's a valid Firebase Storage URL format
    // Either the hostname contains the bucket domain, or the path contains a valid bucket reference
    const hasCorrectDomain = urlObj.hostname.includes('.appspot.com') || 
                            urlObj.hostname.includes('.firebasestorage.app') ||
                            (isFirebaseStorage && (urlObj.pathname.includes('.appspot.com') || urlObj.pathname.includes('.firebasestorage.app')));
    
    console.log('🔍 URL Validation:', {
      url,
      hostname: urlObj.hostname,
      pathname: urlObj.pathname,
      isFirebaseStorage,
      hasCorrectDomain,
      isValid: isFirebaseStorage && hasCorrectDomain
    });
    
    return isFirebaseStorage && hasCorrectDomain;
  } catch (error) {
    console.error('❌ Invalid URL format:', url, error);
    return false;
  }
};

// Fix URL encoding for existing Firebase Storage URLs
export const fixStorageUrlEncoding = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Check if this is a Firebase Storage URL
    if (!urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      return url; // Not a Firebase Storage URL, return as-is
    }
    
    // Extract the path part after '/o/'
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    if (!pathMatch) {
      return url; // No path found, return as-is
    }
    
    const currentPath = pathMatch[1];
    
    // Check if the path contains unencoded forward slashes (but not %2F)
    if (currentPath.includes('/') && !currentPath.includes('%2F')) {
      // Re-encode the path properly
      const encodedPath = encodeURIComponent(currentPath);
      const fixedUrl = url.replace(`/o/${currentPath}`, `/o/${encodedPath}`);
      
      console.log('🔧 Fixed URL encoding:', {
        original: url,
        fixed: fixedUrl,
        originalPath: currentPath,
        encodedPath: encodedPath
      });
      
      return fixedUrl;
    }
    
    return url; // Already properly encoded
  } catch (error) {
    console.error('❌ Error fixing URL encoding:', url, error);
    return url; // Return original URL if there's an error
  }
};

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

// Upload image to Firebase Storage
export const uploadImage = async (
  file: File | Blob,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    
    if (onProgress) {
      // Use resumable upload for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } else {
      // Simple upload without progress tracking
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: (File | Blob)[],
  basePath: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<string[]> => {
  try {
    const uploadPromises = files.map((file, index) => {
      const fileName = `image_${index}_${Date.now()}`;
      const filePath = `${basePath}/${fileName}`;
      
      return uploadImage(file, filePath, onProgress ? (progress) => onProgress(index, progress) : undefined);
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

// Upload product images
export const uploadProductImages = async (
  files: (File | Blob)[],
  productId: string,
  userId: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<string[]> => {
  const basePath = `products/${userId}/${productId}`;
  return uploadMultipleImages(files, basePath, onProgress);
};

// Upload avatar image
export const uploadAvatarImage = async (
  file: File | Blob,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = `avatar_${Date.now()}`;
  const filePath = `avatars/${userId}/${fileName}`;
  return uploadImage(file, filePath, onProgress);
};

// Upload message image
export const uploadMessageImage = async (
  file: File | Blob,
  conversationId: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = `message_${Date.now()}`;
  const filePath = `messages/${conversationId}/${userId}/${fileName}`;
  return uploadImage(file, filePath, onProgress);
};

// Upload listing image
export const uploadListingImage = async (
  file: File | Blob,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const fileName = Date.now().toString();
  const filePath = `listings/${fileName}`;
  
  console.log('📤 Uploading listing image with path:', filePath);
  
  // Upload the image and get the download URL
  const downloadURL = await uploadImage(file, filePath, onProgress);
  
  console.log('📥 Received download URL:', downloadURL);
  
  // Fix the URL encoding to ensure forward slashes are properly encoded
  const fixedURL = fixStorageUrlEncoding(downloadURL);
  
  console.log('🔧 Fixed URL:', fixedURL);
  
  return fixedURL;
};

// Delete image from Firebase Storage
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Delete multiple images
export const deleteMultipleImages = async (imageUrls: string[]): Promise<void> => {
  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw error;
  }
};

// Get all images in a folder
export const getImagesInFolder = async (folderPath: string): Promise<string[]> => {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    
    const urlPromises = result.items.map(itemRef => getDownloadURL(itemRef));
    return await Promise.all(urlPromises);
  } catch (error) {
    console.error('Error getting images in folder:', error);
    throw error;
  }
};

// Generate unique filename
export const generateUniqueFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${userId}_${timestamp}_${randomString}.${extension}`;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.',
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Please upload images smaller than 10MB.',
    };
  }
  
  return { isValid: true };
};

// Validate multiple image files
export const validateMultipleImageFiles = (files: File[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  files.forEach((file, index) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      errors.push(`File ${index + 1}: ${validation.error}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};