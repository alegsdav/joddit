# Joddit Mobile - React Native with Expo

## Setup Instructions

### 1. Get Your Clerk Publishable Key

1. Go to your Clerk dashboard (https://clerk.com)
2. Select your application (or create one for Expo)
3. Go to **API Keys** section
4. Copy your **Publishable Key**

### 2. Add Clerk Key to .env

Open `.env` file and replace `your_clerk_publishable_key_here` with your actual key:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
```

### 3. Install Expo Go on Your iPhone

1. Open App Store on your iPhone
2. Search for "Expo Go"
3. Download and install the app

### 4. Start the Development Server

```bash
cd /Users/alex/Documents/joddit-mobile
npx expo start
```

### 5. Test on Your iPhone

1. Open Expo Go app on your iPhone
2. Scan the QR code shown in your terminal
3. The app will load on your device!

## What's Working

- ✅ Clerk authentication setup
- ✅ AsyncStorage for local data persistence
- ✅ Note types and data structures migrated
- ✅ Basic app structure with auth state

## Next Steps

You'll need to migrate the UI components:
- Onboarding screen
- Home screen with notes list
- Editor screen
- Recording screen

These will use React Native components (`View`, `Text`, `TouchableOpacity`) instead of HTML elements.

## Project Structure

```
joddit-mobile/
├── App.tsx           # Main app with Clerk provider
├── types.ts          # TypeScript interfaces
├── lib/
│   ├── clerk.ts      # Clerk auth configuration
│   └── storage.ts    # AsyncStorage wrapper
└── .env              # Environment variables (add your Clerk key here)
```
