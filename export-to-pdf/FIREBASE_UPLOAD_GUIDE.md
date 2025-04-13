# Guide to Upload Plugin to Firebase Storage

This guide will help you upload the packaged plugin to Firebase Storage.

## Prerequisites

1. A Firebase project with Storage enabled
2. Firebase CLI installed (`npm install -g firebase-tools`)
3. Logged in to Firebase (`firebase login`)

## Steps to Upload

### Option 1: Using the Firebase Console (Easiest)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to "Storage" in the left sidebar
4. Click "Upload file"
5. Select the `export-to-pdf-1.0.0.zip` file
6. Wait for the upload to complete
7. Once uploaded, click on the file and copy the download URL

### Option 2: Using Firebase CLI

1. Initialize Firebase in your project (if not already done):
   ```
   firebase init storage
   ```

2. Create a simple script to upload the file:
   ```javascript
   // upload-to-firebase.js
   const { initializeApp } = require('firebase/app');
   const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
   const fs = require('fs');

   // Your Firebase configuration
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };

   // Initialize Firebase
   const app = initializeApp(firebaseConfig);
   const storage = getStorage(app);

   // File to upload
   const file = fs.readFileSync('export-to-pdf-1.0.0.zip');
   const storageRef = ref(storage, 'plugins/export-to-pdf-1.0.0.zip');

   // Upload the file
   uploadBytes(storageRef, file).then((snapshot) => {
     console.log('Uploaded plugin to Firebase Storage!');
     
     // Get the download URL
     getDownloadURL(snapshot.ref).then((downloadURL) => {
       console.log('Download URL:', downloadURL);
     });
   });
   ```

3. Install required dependencies:
   ```
   npm install firebase
   ```

4. Run the script:
   ```
   node upload-to-firebase.js
   ```

## After Uploading

Once you have the download URL, you can:

1. Share it with users who want to install your plugin
2. Add it to your plugin documentation
3. Use it in your plugin manager or marketplace

## Security Considerations

- Consider setting up Firebase Storage Rules to control access to your plugin
- You might want to add versioning to your plugin URLs
- Consider adding metadata to your file in Firebase Storage

## Distribution

To distribute your plugin, provide users with:

1. The download URL
2. Installation instructions from the README.md
3. Any specific configuration needed for their text editor
