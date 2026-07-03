# RatishPlug - Google API Configuration Guide

## Required Google Services

### 1. Google Cloud Console Setup

#### Create Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **RatishPlug Marketplace**
3. Wait for project creation (2-3 minutes)

#### Enable Required APIs
In the Cloud Console:
1. Go to **APIs & Services** > **Library**
2. Search and enable these APIs:
   - ✅ **Google+ API** (People API v1) - for sign-in
   - ✅ **Maps JavaScript API** - for vendor/buyer map features
   - ✅ **Places API** - for address autocomplete
   - ✅ **Geolocation API** - for location services

### 2. Create OAuth 2.0 Credentials

#### Generate Client ID
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Choose **Web application**
4. Name it: "RatishPlug Vendor & Buyer Platform"

#### Configure Redirect URIs
Add these authorized redirect URIs:
```
http://localhost:3000
http://localhost:8000
http://localhost:8080
http://127.0.0.1:8000
https://yourdomain.com
https://www.yourdomain.com
```

#### Configure Authorized Origins
Add these authorized JavaScript origins:
```
http://localhost:3000
http://localhost:8000
http://localhost:8080
http://127.0.0.1:8000
https://yourdomain.com
https://www.yourdomain.com
```

### 3. Create Google Maps API Key

#### Generate API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Name it: "RatishPlug Maps"

#### Restrict API Key
1. Click the key to open restrictions
2. Set **Application restrictions** to **HTTP referrers (websites)**
3. Add referrers:
```
http://localhost:3000/*
http://localhost:8000/*
http://localhost:8080/*
http://127.0.0.1:8000/*
https://yourdomain.com/*
https://www.yourdomain.com/*
```

4. Under **API restrictions**, select:
   - Maps JavaScript API
   - Places API
   - Geolocation API

## Implementation in RatishPlug

### Step 1: Update app.js
```javascript
// Line ~5 in app.js
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

Replace with your actual Client ID from Google Cloud Console.

### Step 2: Update HTML Files

#### In vendor-register.html (Line ~8)
```html
<!-- BEFORE -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>

<!-- AFTER -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>
```

#### In buyer-search.html (Line ~8)
```html
<!-- BEFORE -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>

<!-- AFTER -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places"></script>
```

### Step 3: Environment Setup (Production)

#### Create .env file (if using Node.js backend)
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_MAPS_API_KEY=your-maps-api-key
GOOGLE_CLIENT_SECRET=your-client-secret
NODE_ENV=production
```

#### Load environment variables in app.js
```javascript
// For Node.js with dotenv
require('dotenv').config();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
```

## Testing Google Integration

### Test Vendor Sign-In
1. Navigate to [Vendor Registration](vendor-register.html)
2. Click Google Sign-In button
3. Select a Google account
4. Verify you're redirected to the vendor form
5. Check browser console for any errors

### Test Buyer Sign-In (Optional)
1. Navigate to [Buyer Search](buyer-search.html)
2. Click "Sign In (Optional)"
3. Sign in with Google
4. Verify account name appears in navbar

### Test Maps Functionality
1. In vendor registration, enter a business address
2. Verify map loads and shows the address
3. Try dragging the marker
4. In buyer search, try location search with map display

## API Quota & Limits

### Free Tier Quotas (as of 2024)
| API | Free Monthly | Pricing |
|-----|--------------|---------|
| Google Sign-In | Unlimited | Free |
| Maps JS | 28,000 requests/day | $7 per 1000 after quota |
| Places API | 1000 requests/month | $7 per 1000 after quota |
| Geolocation | Unlimited | Free |

### Monitor Usage
1. Go to **APIs & Services** > **Quotas**
2. Check realtime usage
3. Set up billing alerts in **Billing** section

## Troubleshooting

### Google Sign-In Button Not Appearing
```javascript
// Check in browser console
console.log(google);  // Should show google object
google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID });
```

**Solution:**
- Verify `<script src="https://accounts.google.com/gsi/client"></script>` is in HTML
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Maps Not Loading
```
Error: Google Maps API error: MissingKeyMapError
```

**Solution:**
- Verify Maps API is enabled in Google Cloud Console
- Check API key is correctly set in HTML
- Verify API key restrictions allow your domain
- Wait 5-10 minutes for new API keys to activate

### Places Autocomplete Not Working
```
Error: AutocompleteService is not defined
```

**Solution:**
- Ensure `libraries=places` is in script URL
- Check Places API is enabled
- Verify API key has Places API access

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution (for local dev):**
- CORs issues don't affect client-side APIs
- Issues usually with backend API calls
- Add proper CORS headers to backend

## Best Practices

### Security
✅ **DO:**
- Keep Client ID in client-side code (public)
- Keep API Keys restricted by domain
- Use Client Secret only in backend
- Rotate keys regularly

❌ **DON'T:**
- Commit API keys to git
- Share Client Secret with frontend
- Use unrestricted API keys
- Log sensitive credentials

### Performance
- Cache map instances to reduce API calls
- Use API key restrictions to prevent abuse
- Monitor quota usage
- Implement request throttling

### Error Handling
```javascript
// Always wrap Google calls in try-catch
try {
    google.accounts.id.initialize({ /* ... */ });
} catch (error) {
    console.error('Google Auth init failed:', error);
    showNotification('Authentication service unavailable', 'error');
}
```

## Integration with Backend (Future)

### Validate Google Token on Backend
```python
# Python/Django example
from google.auth.transport import requests
from google.oauth2 import id_token

def verify_google_token(token):
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        return idinfo
    except ValueError:
        return None
```

### Backend Authentication Flow
```
1. Frontend sends Google token to backend
2. Backend verifies token signature
3. Backend creates session/JWT
4. Frontend uses session for subsequent requests
5. Backend validates session on each request
```

## Common API Limits by Use Case

### Small Business (< 100 vendors)
- Maps API: ~1000 requests/month ✅ Free tier enough
- Places API: ~500 requests/month ✅ Free tier enough
- Geolocation: Unlimited ✅

### Medium Platform (100-1000 vendors)
- Estimated costs: $50-200/month
- Consider caching for cost savings

### Large Platform (1000+ vendors)
- Dedicated Google Account Manager
- Custom pricing negotiation
- Consider self-hosted map alternative

## Summary Configuration Checklist

- [ ] Create Google Cloud Project
- [ ] Enable Google+ API
- [ ] Enable Maps JavaScript API
- [ ] Enable Places API
- [ ] Create OAuth 2.0 Client ID
- [ ] Create Google Maps API Key
- [ ] Add redirect URIs to Client ID
- [ ] Add origins to Client ID
- [ ] Restrict API key to domains
- [ ] Update GOOGLE_CLIENT_ID in app.js
- [ ] Update GOOGLE_MAPS_API_KEY in HTML files
- [ ] Test vendor sign-in
- [ ] Test maps loading
- [ ] Test Places autocomplete
- [ ] Monitor API usage quota

## Support Resources

- [Google Cloud Console Help](https://cloud.google.com/docs)
- [Google Sign-In Docs](https://developers.google.com/identity/protocols)
- [Google Maps API Docs](https://developers.google.com/maps)
- [Google Places API Docs](https://developers.google.com/maps/documentation/places)

---

**Last Updated:** July 2024
