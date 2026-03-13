# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
  You'll need to add these images to your assets folder:
  product-1.jpg to product-4.jpg for the product thumbnails
  back-arrow.png for the back button
  heart.png for the favorite button
  share.png for the share button
  delivery.png for delivery icon
  location.png for location icon
  payment.png for payment icon
  bid.png for bid history icon
  star.png for rating icon
  seller-avatar.jpg for seller profile picture
  Let's create the product details screen:
  Now you'll need to add the following images to your project:
  In assets/images/icons/:
  back-arrow.png - A back arrow icon
  heart.png - A heart icon for favorites
  share.png - A share icon
  clock.png - A clock icon
  bid.png - A bid tag icon
  rupee.png - A rupee currency symbol
  delivery.png - A delivery truck icon
  location.png - A location pin icon
  payment.png - A payment/money icon
  bid-history.png - A history/chart icon
  arrow-up.png - An upward arrow icon
  star.png - A star rating icon
  In assets/images/products/:
  product-1.jpg to product-4.jpg - Product images of the iPhone
  seller-avatar.jpg - A profile picture for the seller
  Update the navigation to handle the product details screen:

Sensitive Keystore information:
Keystore password: 1fc0b50b2366756f2441885d75cff230
Key alias: 36a1a53e02c1705901d07ada9f48479d
Key password: 9ad39e85ae3d2ec0c0d2765275e55d2e

You already have 3 of the 4 required signing inputs (store password, key alias, key password). The missing required piece is the **keystore file itself** (`.jks` / `.keystore`) and its **path**.

- **Keystore file**: something like `release.keystore` or `upload-keystore.jks`
- **Keystore path**: where that file lives on disk (example: `D:\bazaar\android\app\release.keystore`)

Once you have the file, configure signing **without putting secrets into the repo** (don’t paste them into `android/gradle.properties`).

**Option A (recommended): set env vars for the build session**

- `ANDROID_KEYSTORE_PATH` = full path to the keystore file
- `ANDROID_KEYSTORE_PASSWORD` = (your keystore password)
- `ANDROID_KEY_ALIAS` = (your alias)
- `ANDROID_KEY_PASSWORD` = (your key password)

Then build the Play-ready AAB:

- `cd android && ./gradlew :app:bundleRelease`

**Option B: user-level Gradle properties (persistent, not in repo)**

- Put these in `%USERPROFILE%\.gradle\gradle.properties` (Windows):
  - `RELEASE_STORE_FILE=...`
  - `RELEASE_STORE_PASSWORD=...`
  - `RELEASE_KEY_ALIAS=...`
  - `RELEASE_KEY_PASSWORD=...`

**If you don’t have the keystore file yet**

- Either download the existing one from wherever it was generated (EAS credentials / Android Studio / whoever created it), or generate a new upload keystore. If you generate a new one, you must update any dependent configs (notably Firebase SHA-1 for Google sign-in).

**Important**

- You posted real credentials here; treat them as compromised and rotate/regenerate if this chat isn’t strictly private. I won’t store or write them into any files.
