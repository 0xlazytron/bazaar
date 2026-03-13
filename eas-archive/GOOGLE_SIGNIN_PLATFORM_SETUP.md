# Google Sign-In Platform Setup Guide

This guide provides detailed instructions for setting up Google Sign-In for both Android and iOS platforms, including SHA-1 fingerprint generation and configuration file downloads.

## Prerequisites

- Firebase project created and configured
- Google Cloud Console project with OAuth 2.0 credentials
- Android Studio installed (for Android setup)
- Xcode installed (for iOS setup)

## Android Setup

### Step 1: Generate SHA-1 Fingerprint

#### Method 1: Using Expo CLI (Recommended for Expo projects)

```bash
# Install Expo CLI if not already installed
npm install -g @expo/cli

# Generate SHA-1 for development
eas credentials
# Select "Android" → "Keystore" → "Generate new keystore"
# Note down the SHA-1 fingerprint displayed

# Alternative: Get SHA-1 from existing keystore
eas credentials -p android
```

#### Method 2: Using Android Studio

1. Open Android Studio
2. Go to **Build** → **Generate Signed Bundle / APK**
3. Select **APK** and click **Next**
4. If you don't have a keystore:
   - Click **Create new...**
   - Fill in the required information
   - Remember the keystore path and passwords
5. If you have a keystore, select it and enter passwords
6. Click **Next** and **Finish**

#### Method 3: Using Command Line (Windows)

```bash
# Navigate to your Java installation directory
cd "C:\Program Files\Java\jdk-[version]\bin"

# For debug keystore (development)
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

# For release keystore (production)
keytool -list -v -keystore "path\to\your\release.keystore" -alias your_alias_name
```

#### Method 4: Using Command Line (macOS/Linux)

```bash
# For debug keystore (development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore (production)
keytool -list -v -keystore /path/to/your/release.keystore -alias your_alias_name
```

### Step 2: Add SHA-1 to Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Click on your Android app (or add one if it doesn't exist)
6. In the **SHA certificate fingerprints** section, click **Add fingerprint**
7. Paste your SHA-1 fingerprint
8. Click **Save**

### Step 3: Download google-services.json

1. In the same Firebase project settings page
2. Find your Android app in the **Your apps** section
3. Click the **Download google-services.json** button
4. Save the file to your computer

### Step 4: Place google-services.json in Your Project

1. Navigate to your project directory
2. Copy the downloaded `google-services.json` file
3. Place it in the `android/app/` directory of your project
4. The file structure should look like:
   ```
   your-project/
   ├── android/
   │   ├── app/
   │   │   ├── google-services.json  ← Place here
   │   │   ├── build.gradle
   │   │   └── src/
   │   └── build.gradle
   ```

## iOS Setup

### Step 1: Get Your iOS Bundle ID

#### Method 1: From app.json/app.config.js

1. Open your `app.json` or `app.config.js` file
2. Look for the `ios.bundleIdentifier` field
3. Note down the bundle ID (e.g., `com.yourcompany.yourapp`)

#### Method 2: From Expo CLI

```bash
# View your app configuration
eas build:configure
# The bundle ID will be displayed in the configuration
```

### Step 2: Add iOS App to Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Project Settings** (gear icon)
4. In the **Your apps** section, click **Add app**
5. Select the **iOS** icon
6. Enter your iOS bundle ID
7. Enter an app nickname (optional)
8. Enter your App Store ID (optional, can be added later)
9. Click **Register app**

### Step 3: Download GoogleService-Info.plist

1. After registering the iOS app, you'll see a download button
2. Click **Download GoogleService-Info.plist**
3. Save the file to your computer

### Step 4: Add GoogleService-Info.plist to Your Project

#### For Expo Managed Workflow:

1. Create an `ios` folder in your project root if it doesn't exist
2. Place the `GoogleService-Info.plist` file in the `ios/` directory
3. Update your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./ios/GoogleService-Info.plist"
    }
  }
}
```

#### For Expo Bare Workflow:

1. Open your project in Xcode
2. Right-click on your project name in the navigator
3. Select **Add Files to "[ProjectName]"**
4. Navigate to and select the `GoogleService-Info.plist` file
5. Make sure **Add to target** is checked for your main app target
6. Click **Add**

## Google Cloud Console Configuration

### Step 1: Add Platform-Specific OAuth Clients

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**

#### For Android:

1. Select **Android** as application type
2. Enter a name for your OAuth client
3. Enter your package name (same as bundle ID)
4. Enter your SHA-1 fingerprint
5. Click **Create**

#### For iOS:

1. Select **iOS** as application type
2. Enter a name for your OAuth client
3. Enter your bundle ID
4. Click **Create**

### Step 2: Update Environment Variables

Make sure your `.env.local` file includes:

```env
# Web Client ID (for both platforms)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# Optional: Platform-specific client IDs
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

## Testing Your Setup

### Android Testing

1. Build your app for Android:
   ```bash
   eas build --platform android
   ```

2. Install the APK on a physical device or emulator
3. Test the Google Sign-In functionality

### iOS Testing

1. Build your app for iOS:
   ```bash
   eas build --platform ios
   ```

2. Install on a physical device or simulator
3. Test the Google Sign-In functionality

## Troubleshooting

### Common Issues

1. **"Sign-in failed" on Android**
   - Verify SHA-1 fingerprint is correct
   - Ensure `google-services.json` is in the right location
   - Check package name matches exactly

2. **"Sign-in failed" on iOS**
   - Verify bundle ID matches exactly
   - Ensure `GoogleService-Info.plist` is properly added
   - Check URL schemes are configured

3. **"Developer Error" message**
   - Usually indicates SHA-1 fingerprint mismatch
   - Regenerate and re-add SHA-1 fingerprint

### Debug Steps

1. Check Firebase project settings
2. Verify configuration files are in correct locations
3. Ensure environment variables are loaded
4. Test on physical devices (Google Sign-In may not work on some emulators)

## Security Notes

- Never commit `google-services.json` or `GoogleService-Info.plist` to public repositories
- Use different Firebase projects for development and production
- Regularly rotate your OAuth client secrets
- Keep your keystores secure and backed up

## Next Steps

After completing this setup:

1. Test Google Sign-In on both platforms
2. Implement proper error handling
3. Add sign-out functionality
4. Consider implementing additional OAuth providers

For more detailed information, refer to:
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Google Sign-In Documentation](https://developers.google.com/identity/sign-in)