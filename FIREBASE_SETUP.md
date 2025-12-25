# Firebase Setup Guide

This document provides a comprehensive guide for setting up and using Firebase in the Bazaar application.

## Overview

The Bazaar application has been migrated from Supabase to Firebase, providing:
- **Authentication**: Email/password and Google OAuth
- **Firestore Database**: NoSQL document database for products, messages, and user data
- **Storage**: File upload and management for images

## Prerequisites

1. Node.js and npm installed
2. Firebase project created at [Firebase Console](https://console.firebase.google.com/)
3. Firebase CLI installed: `npm install -g firebase-tools`

## Installation

Firebase dependencies are already installed:
```bash
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
```

## Configuration

### 1. Environment Variables

Update your `.env.local` file with your Firebase project configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Console Setup

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Enable Google authentication (add your domain to authorized domains)
4. Configure OAuth consent screen if using Google sign-in

#### Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules (see Security Rules section)

#### Storage
1. Go to Storage
2. Get started with default rules
3. Configure security rules (see Security Rules section)

## File Structure

The Firebase integration consists of these key files:

```
lib/
├── firebase.ts      # Main Firebase configuration
├── auth.ts          # Authentication methods
├── firestore.ts     # Database operations
└── storage.ts       # File upload/management
```

## Usage Examples

### Authentication

```typescript
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signOut } from '@/lib/auth';

// Email sign up
const handleSignUp = async () => {
  try {
    const user = await signUpWithEmail('user@example.com', 'password', {
      displayName: 'John Doe',
      phoneNumber: '+1234567890'
    });
    console.log('User created:', user);
  } catch (error) {
    console.error('Sign up error:', error);
  }
};

// Google sign in
const handleGoogleSignIn = async () => {
  try {
    const user = await signInWithGoogle();
    console.log('User signed in:', user);
  } catch (error) {
    console.error('Google sign in error:', error);
  }
};
```

### Firestore Operations

```typescript
import { createProduct, getProducts, createMessage } from '@/lib/firestore';

// Create a product
const handleCreateProduct = async () => {
  try {
    const productId = await createProduct({
      title: 'iPhone 14',
      description: 'Latest iPhone model',
      price: 999,
      category: 'Electronics',
      condition: 'new',
      images: ['https://example.com/image1.jpg'],
      location: 'New York, NY',
      userId: 'user123'
    });
    console.log('Product created:', productId);
  } catch (error) {
    console.error('Error creating product:', error);
  }
};

// Get products
const handleGetProducts = async () => {
  try {
    const products = await getProducts();
    console.log('Products:', products);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};
```

### Storage Operations

```typescript
import { uploadProductImages, uploadAvatarImage } from '@/lib/storage';

// Upload product images
const handleImageUpload = async (files: File[]) => {
  try {
    const imageUrls = await uploadProductImages(
      files,
      'product123',
      'user123',
      (fileIndex, progress) => {
        console.log(`File ${fileIndex}: ${progress.progress}% uploaded`);
      }
    );
    console.log('Images uploaded:', imageUrls);
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

## Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products are readable by all, writable by owner
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Messages in conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
      }
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folders
    match /avatars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /products/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /messages/{conversationId}/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Data Models

### User Profile
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Product
```typescript
interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  location: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### Message
```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  timestamp: Date;
  isRead: boolean;
}
```

## Best Practices

1. **Error Handling**: Always wrap Firebase operations in try-catch blocks
2. **Loading States**: Show loading indicators during async operations
3. **Offline Support**: Firebase provides automatic offline support
4. **Security**: Never expose sensitive data in client-side code
5. **Optimization**: Use pagination for large datasets
6. **Validation**: Validate data before sending to Firebase

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check if authentication methods are enabled in Firebase Console
   - Verify environment variables are correct
   - Ensure domain is added to authorized domains

2. **Permission Denied**
   - Check Firestore security rules
   - Verify user is authenticated
   - Ensure user has proper permissions

3. **Storage Upload Failures**
   - Check file size limits (10MB default)
   - Verify file types are allowed
   - Check storage security rules

### Debug Mode

Enable Firebase debug mode in development:

```typescript
// In firebase.ts
if (process.env.NODE_ENV === 'development') {
  // Enable debug mode
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## Migration Notes

This application was migrated from Supabase to Firebase. Key changes:

1. **Authentication**: Switched from Supabase Auth to Firebase Auth
2. **Database**: Migrated from PostgreSQL to Firestore NoSQL
3. **Storage**: Moved from Supabase Storage to Firebase Storage
4. **Real-time**: Using Firestore real-time listeners instead of Supabase subscriptions

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

For application-specific issues, refer to the main project documentation.