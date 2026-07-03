# RatishPlug - E-Commerce Platform Setup Guide

## Overview
RatishPlug is a vendor-buyer e-commerce platform where:
- **Vendors** create profiles with their business details, locations, and delivery zones
- **Buyers** search for and discover vendors near them
- **Google Authentication** is required for vendors, optional for buyers

## ✅ Features Included

### For Vendors
- ✅ Google OAuth authentication (required)
- ✅ Complete business profile creation
- ✅ Location-based business setup with map integration
- ✅ Multiple delivery zone management
- ✅ Product/service listing
- ✅ Business hours management
- ✅ Vendor dashboard with analytics
- ✅ Order management

### For Buyers
- ✅ Optional Google authentication
- ✅ Location-based vendor search
- ✅ Vendor filtering (category, distance, rating)
- ✅ Vendor details modal with contact options
- ✅ Interactive map view
- ✅ Wishlist/save vendors feature

### Common Features
- ✅ Responsive design
- ✅ Local storage for data persistence
- ✅ Modern UI with smooth animations
- ✅ Notification system
- ✅ Search and filter functionality

## 🚀 Setup Instructions

### 1. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the following APIs:
   - Google+ API
   - Maps JavaScript API
   - Places API
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000` (local development)
   - Your production domain
6. Copy your Client ID

### 2. Configure Google API Keys
Find and replace the following in your HTML files:

**In `vendor-register.html`, `buyer-search.html`:**
```html
<!-- Find this line -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>

<!-- Replace YOUR_GOOGLE_MAPS_API_KEY with your actual key -->
```

**In `app.js`:**
```javascript
// Find this line
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// Replace with your actual Client ID
const GOOGLE_CLIENT_ID = 'your-actual-client-id.apps.googleusercontent.com';
```

### 3. File Structure
```
ratish/
├── index.html                 # Homepage
├── vendor-register.html       # Vendor registration/signup
├── vendor-dashboard.html      # Vendor control panel
├── buyer-search.html         # Buyer vendor search
├── styles.css                # Main stylesheet
├── app.js                    # Core app logic & Google Auth
├── vendor-auth.js            # Vendor authentication
├── vendor-dashboard.js       # Vendor dashboard logic
├── buyer-search.js           # Buyer search functionality
└── README.md                 # This file
```

### 4. Running the Application

#### Option A: Local Development Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit: `http://localhost:8000`

#### Option B: Deploy to Hosting
1. Netlify
   - Connect your git repository
   - Set environment variables for Google API keys

2. Vercel, GitHub Pages, or any static hosting

## 📋 User Flows

### Vendor Registration
1. Navigate to "For Vendors" or click "Join as Vendor"
2. Click Google Sign-In button
3. Complete vendor profile:
   - Business name & category
   - Description
   - Contact information
   - Business address (with map location)
   - Delivery radius and zones
   - Operating hours
4. Submit and view dashboard

### Vendor Dashboard
After login, vendors can:
- View/edit business profile
- Manage delivery zones
- Add/edit products
- View analytics
- Manage orders

### Buyer Search
1. Navigate to "For Buyers"
2. Enter location (or use current location)
3. Filter by:
   - Category
   - Distance
   - Rating
   - Sort preference
4. Click "Search" or "Find Vendors"
5. View vendors on map
6. Click vendor card to see details
7. Save vendors or contact them

### Optional Buyer Login
- Buyers can sign in with Google to:
  - Save favorite vendors
  - Access order history (future feature)
  - Get personalized recommendations

## 💾 Data Storage

### Current Implementation (Local Storage)
Data is stored in browser's localStorage (client-side):
- **Max size**: ~5-10MB per domain
- **Persistence**: Survives browser sessions
- **Access**: JavaScript only

**Storage Keys:**
```
- userInfo                          # Current user info
- googleAuthToken                  # Google auth token
- vendorProfile                    # Current vendor profile
- vendor_[userId]                  # Individual vendor data
- products_[userId]                # Vendor products
- buyer_[userId]                   # Buyer preferences
- userLocation                     # User location
- selectedVendor                   # Selected vendor for modal
```

### For Production Use
Replace localStorage with:
- Firebase Firestore
- MongoDB + Node.js backend
- PostgreSQL + Express.js
- AWS DynamoDB

Example Firebase integration:
```javascript
// Add to app.js for Firebase Realtime Database
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
```

## 🗺️ Maps Integration

### Google Maps Setup
1. Ensure you have Google Maps API enabled
2. Add API key to HTML files
3. Maps are used in:
   - Vendor registration (set business location)
   - Buyer search (view vendor locations)

### Features
- Drag-and-drop marker to set precise location
- Address search and autocomplete
- Distance calculation
- Multi-marker display on buyer map

## 🔐 Security Notes

### Current Implementation
- ⚠️ Uses localStorage (browser storage)
- ✅ Google OAuth for secure authentication
- ⚠️ No backend validation
- ⚠️ No encryption for localStorage data

### For Production
1. **Implement Backend Validation**
   - Verify Google tokens on server
   - Validate all user inputs
   - Implement CORS

2. **Add HTTPS**
   - Required for Google Authentication
   - Protects sensitive data in transit

3. **Secure Storage**
   - Move from localStorage to server-side sessions
   - Use secure, HTTP-only cookies
   - Encrypt sensitive data

4. **Environment Variables**
   - Never commit API keys to git
   - Use environment files (.env)
   - Rotate keys regularly

## 📱 Responsive Design
- Mobile-first approach
- Breakpoints:
  - 768px (tablets)
  - 1024px (desktops)
- Touch-friendly buttons and inputs
- Scrollable tables and lists

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #C26D0B;        /* Orange */
    --secondary: #2D5A27;      /* Green */
    --danger: #C0392B;         /* Red */
    --success: #27AE60;        /* Green */
    --info: #2980B9;          /* Blue */
    /* ... more colors */
}
```

### Fonts
Change font family in `styles.css`:
```css
body {
    font-family: 'Your Font', system-ui, sans-serif;
}
```

### Content
Update business name, contact info in HTML files:
- `index.html` - Company name, contact
- Footer sections in all files
- Help/FAQ content

## 🧪 Testing

### Test Scenarios

#### Vendor Flow
1. ✅ Vendor registration with Google
2. ✅ Profile creation with location
3. ✅ Add delivery zones
4. ✅ Add products
5. ✅ Update profile
6. ✅ View dashboard analytics

#### Buyer Flow
1. ✅ Search vendors by location
2. ✅ Filter by category/distance
3. ✅ View vendor details
4. ✅ Optional Google login
5. ✅ Save vendors
6. ✅ Sort results

#### Browser Testing
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚨 Troubleshooting

### Google Sign-In Not Working
- Verify Client ID is correct
- Check authorized redirect URIs
- Clear browser cache and cookies
- Check browser console for errors

### Maps Not Displaying
- Verify Google Maps API key is set
- Ensure Places library is loaded
- Check API usage quota in Google Cloud Console
- Verify authorized domains

### Location Not Working
- Enable geolocation in browser permissions
- Use HTTPS (required for geolocation)
- Check if browser supports Geolocation API
- Verify location permissions for localhost

### Data Not Persisting
- Check if localStorage is enabled
- Verify browser is in normal mode (not incognito)
- Check storage quota usage
- Clear browser cache if corrupted

## 📊 Future Enhancements

1. **Backend Integration**
   - Node.js/Express or Django
   - Real database (PostgreSQL, MongoDB)
   - User authentication sessions

2. **Payment Processing**
   - Stripe/PayPal integration
   - Vendor commission system
   - Transaction history

3. **Advanced Features**
   - Real-time messaging
   - Order tracking
   - Vendor ratings and reviews
   - Advanced analytics

4. **Mobile App**
   - React Native
   - Native iOS/Android

5. **Admin Panel**
   - Vendor management
   - User moderation
   - Analytics dashboard
   - Dispute resolution

## 📞 Support
For questions or issues, contact: support@ratishplug.com

## 📄 License
All rights reserved. RatishPlug © 2024

---

## Quick Links
- 🏠 [Homepage](index.html)
- 🏪 [Vendor Registration](vendor-register.html)
- 🛍️ [Buyer Search](buyer-search.html)
- 📊 [Vendor Dashboard](vendor-dashboard.html)
