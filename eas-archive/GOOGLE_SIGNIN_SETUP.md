# Google Sign-In Setup Guide

This guide will help you set up Google Sign-In for both web and mobile platforms in your Bazaar app.

## Prerequisites

1. Firebase project with Authentication enabled
2. Google Sign-In provider enabled in Firebase Console

## Setup Steps

### 1. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Google** as a sign-in provider
5. Note down the **Web client ID** from the Google provider configuration

### 2. Environment Variables

Add the following environment variable to your `.env` file:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
```

Replace `your_web_client_id_here` with the Web client ID from Firebase Console.

### 3. Android Configuration (for mobile)

For Android builds, you'll need to:

1. Add your SHA-1 fingerprint to Firebase project settings
2. Download the updated `google-services.json` file
3. Place it in the `android/app/` directory

### 4. iOS Configuration (for mobile)

For iOS builds, you'll need to:

1. Add your iOS bundle ID to Firebase project settings
2. Download the `GoogleService-Info.plist` file
3. Add it to your iOS project

## Testing

### Web Platform
- Google Sign-In should work immediately after environment variable setup
- Uses Firebase's `signInWithPopup` method

### Mobile Platform
- Requires Google Play Services on Android
- Uses `@react-native-google-signin/google-signin` package
- Provides better error handling and user experience

## Error Handling

The implementation includes comprehensive error handling for:
- Cancelled sign-in attempts
- Missing Google Play Services
- Network connectivity issues
- Invalid configuration

## Troubleshooting

### Common Issues

1. **"Google Web Client ID not found"**
   - Ensure `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set in your environment
   - Restart your development server after adding the environment variable

2. **"Google Play Services not available"**
   - Update Google Play Services on the device
   - Test on a device with Google Play Services installed

3. **"No ID token received"**
   - Check Firebase project configuration
   - Verify the Web client ID is correct
   - Ensure Google Sign-In is enabled in Firebase Console

### Development vs Production

- **Development**: Use the Web client ID from Firebase Console
- **Production**: Ensure proper SHA-1/bundle ID configuration for mobile builds

## Security Notes

- Never commit your actual client IDs to version control
- Use environment variables for all sensitive configuration
- Regularly rotate and update your Firebase configuration