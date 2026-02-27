# Firebase Authentication Setup Guide

## Current Issue: Permission Denied ❌

You're seeing: **"Missing or insufficient permissions"**

✅ Good news: Authentication is working!  
❌ Problem: Firestore security rules need to be deployed to Firebase Console.

## ⚡ URGENT ACTION REQUIRED

**Update Firestore rules in Firebase Console (2 minutes):**

1. **Go to:** https://console.firebase.google.com/
2. **Sign in with your Google account**
3. **Select your Firebase project**
4. **Click:** `Firestore Database` in left sidebar
5. **Click the blue "Rules" tab** (at the top)
6. **Delete everything** in the editor
7. **Copy and paste the rules** from the `firestore.rules` file in your project root
8. **Click the blue "Publish" button**
9. **Wait for the success message** ✅
10. **Go back to your app and refresh** (F5)

---

## Initial Setup (If Starting Fresh)

### Problem: 400 Errors
If you're getting **400 errors** from Firebase Authentication API, it means Email/Password authentication is not enabled.

## Solution: Enable Email/Password Authentication

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project

### Step 2: Enable Email/Password Authentication
1. In the left sidebar, click **Authentication**
2. Click on the **Sign-in method** tab
3. Find **Email/Password** in the providers list
4. Click on it to expand
5. Toggle **Enable** to ON
6. Click **Save**

### Step 3: Verify Setup
1. Refresh your app
2. Check the browser console for these messages:
   - ✅ "Admin account created successfully" or "Admin exists"
   - ✅ "Login successful"

## Additional Firebase Setup (If Needed)

### Enable Firestore Database
1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Test mode** (for development) or **Production mode**
4. Select your preferred location
5. Click **Enable**

### Configure Firestore Security Rules

After enabling Firestore, you need to deploy security rules:

1. In **Firestore Database**, click the **Rules** tab
2. Replace the existing rules with the content from [firestore.rules](firestore.rules)
3. Click **Publish**

---

## Current Security Rules Structure

The updated security rules file uses a function-based approach to verify admin role. Updated rules file includes:

- ✅ Authenticated admin users can read/write to all collections
- ✅ Users can read/write their own profile  
- ✅ Collections covered: events, userEvents, vendors, tasks, tickets, guests, media, sections, budgets

**Function used:**
```javascript
function isAdmin(uid) {
  return get(/databases/$(database)/documents/users/$(uid)).data.role == 'admin';
}
```

---

## Default Admin Credentials

After setup is complete, you can log in with:
- **Email:** admin@evora.com
- **Password:** Admin@123456

---

  }
}
```

**Note:** These rules allow:
- ✅ Authenticated admin users to access all data
- ✅ Users to read their own profile (needed during login)
- ❌ Unauthenticated access

## Default Admin Credentials

After setup is complete, you can log in with:
- **Email:** admin@evora.com
- **Password:** Admin@123456

## Troubleshooting

### Error: "Missing or insufficient permissions" (permission-denied)

**You're seeing:** Multiple errors like `FirebaseError: [code=permission-denied]: Missing or insufficient permissions`

**This means:** Your Firestore security rules have not been deployed to Firebase Console yet.

**Solution (2 minutes):**
1. Go to https://console.firebase.google.com/
2. Select your Firebase project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top
5. **Delete all existing content** in the editor
6. **Copy the entire content** from [firestore.rules](firestore.rules) file in your project
7. **Paste it** into the Firebase Console Rules editor
8. Click the blue **Publish** button
9. Wait for the success message ✅
10. **Refresh your app** in the browser (F5)

✅ **The permission errors should disappear!**

### Still getting errors after publishing rules?
1. Check that you clicked the **Publish** button (not just Save)
2. Wait 30 seconds for rules to propagate
3. Clear your browser cache (Ctrl+Shift+Delete) and refresh
4. Check that you copied the **entire** firestore.rules file content

### Error: "operation-not-allowed"
This means **Email/Password authentication is not enabled** in Firebase.

**Solution:**
1. Go to https://console.firebase.google.com/
2. Click **Authentication** in the left sidebar
3. Click **Sign-in method** tab
4. Find **Email/Password** and click it
5. Toggle **Enable** to ON
6. Click **Save**
7. Refresh your app

###  Network errors or "Cannot reach Firebase"
1. Check your internet connection
2. Verify Firebase config in [src/firebase/config.js](src/firebase/config.js)
3. Make sure your Firebase project ID and API key are correct

### Console Logs to Watch For
- ✅ "Admin exists" → Setup is working
- ✅ "Login successful" → Authentication is working  
- 🔴 "Missing or insufficient permissions" → Deploy Firestore rules (see above)
- ❌ "operation-not-allowed" → Enable Email/Password auth (see above)
