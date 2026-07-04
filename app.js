// ===== AUTH SETUP =====
// Supabase authentication is handled in supabase.js.

// Get Current User Info
function getCurrentUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// Check if User is Authenticated
function isUserAuthenticated() {
    return localStorage.getItem('userInfo') !== null;
}

// Logout User
async function logoutUser() {
    await supabaseSignOut();
    window.location.href = 'index.html';
}


// ===== LOCAL STORAGE UTILITIES =====

// Save Vendor Data
function saveVendorData(vendorData) {
    const userInfo = getCurrentUserInfo();
    if (userInfo) {
        const vendorProfile = {
            userId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            ...vendorData,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(`vendor_${userInfo.sub}`, JSON.stringify(vendorProfile));
        localStorage.setItem('vendorProfile', JSON.stringify(vendorProfile));
        return true;
    }
    return false;
}

// Get Vendor Data
function getVendorData() {
    const vendorProfile = localStorage.getItem('vendorProfile');
    return vendorProfile ? JSON.parse(vendorProfile) : null;
}

// Save Buyer Preferences
function saveBuyerPreferences(preferences) {
    const userInfo = getCurrentUserInfo();
    if (userInfo) {
        const buyerProfile = {
            userId: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            ...preferences,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`buyer_${userInfo.sub}`, JSON.stringify(buyerProfile));
        return true;
    }
    return false;
}

// ===== VENDOR UTILITIES =====

// Get All Vendors from Storage
function getAllVendors() {
    const vendors = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('vendor_')) {
            const vendorData = localStorage.getItem(key);
            vendors.push(JSON.parse(vendorData));
        }
    }
    return vendors;
}

// Save Product
function saveProduct(vendorId, productData) {
    const product = {
        id: generateId(),
        vendorId: vendorId,
        ...productData,
        createdAt: new Date().toISOString()
    };
    let products = JSON.parse(localStorage.getItem(`products_${vendorId}`) || '[]');
    products.push(product);
    localStorage.setItem(`products_${vendorId}`, JSON.stringify(products));
    return product;
}

// Get Vendor Products
function getVendorProducts(vendorId) {
    const products = localStorage.getItem(`products_${vendorId}`);
    return products ? JSON.parse(products) : [];
}

// ===== LOCATION UTILITIES =====

// Get User's Current Location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Reverse geocode to get address
                reverseGeocode(lat, lng);
                
                // Store location
                localStorage.setItem('userLocation', JSON.stringify({ lat, lng }));
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enter it manually.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Reverse Geocode Coordinates to Address
function reverseGeocode(lat, lng) {
    // This would typically use Google Maps API
    // For now, we'll just use the coordinates
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Calculate Distance Between Two Points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ===== UTILITY FUNCTIONS =====

// Generate Unique ID
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format Time
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Show Toast/Notification
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27AE60' : type === 'error' ? '#C0392B' : '#2980B9'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Style animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Filter Vendors by Location
function filterVendorsByLocation(vendors, userLat, userLng, maxDistance) {
    return vendors.filter(vendor => {
        if (!vendor.latitude || !vendor.longitude) return false;
        const distance = calculateDistance(userLat, userLng, vendor.latitude, vendor.longitude);
        return distance <= maxDistance;
    });
}

// Filter Vendors by Category
function filterVendorsByCategory(vendors, category) {
    if (!category) return vendors;
    return vendors.filter(v => v.businessCategory === category);
}

// Filter Vendors by Rating
function filterVendorsByRating(vendors, minRating) {
    if (!minRating) return vendors;
    return vendors.filter(v => (v.rating || 0) >= minRating);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Supabase auth is initialized by supabase.js instead of Google Identity.
});
