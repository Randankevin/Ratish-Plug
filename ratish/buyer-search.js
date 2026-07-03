// ===== BUYER SEARCH & VENDOR DISCOVERY =====

document.addEventListener('DOMContentLoaded', function() {
    initBuyerSearch();
});

function initBuyerSearch() {
    // Setup buyer authentication (optional)
    setupBuyerAuth();

    // Setup search and filters
    setupSearchFilters();

    // Load vendors on page load
    loadVendors();

    // Initialize map
    initializeBuyerMap();
}

// Setup Buyer Authentication (Optional)
function setupBuyerAuth() {
    const authSection = document.getElementById('buyerAuthSection');
    const profileSection = document.getElementById('buyerProfileSection');
    const userInfo = getCurrentUserInfo();
    const userRole = localStorage.getItem('userRole');

    if (userInfo && userRole === 'buyer') {
        authSection.style.display = 'none';
        profileSection.style.display = 'flex';
        document.getElementById('buyerName').textContent = `Welcome, ${userInfo.name}`;
    } else {
        authSection.style.display = 'flex';
        profileSection.style.display = 'none';
        showGoogleLoginBuyer();
    }
}

// Render Google Sign-In for Buyers
function renderBuyerGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        // Optional sign-in for buyers
        window.google.accounts.id.renderButton(
            document.querySelector('.nav-auth'),
            {
                type: 'standard',
                size: 'small',
                theme: 'outline',
                text: 'signin'
            }
        );
    }
}

// Show Google Login Button for Buyer
function showGoogleLoginBuyer() {
    supabaseSignInWithGoogle('buyer', '/buyer-search.html');
}

// Setup Search and Filters
function setupSearchFilters() {
    const searchBtn = document.querySelector('button[onclick="applyFilters()"]');
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }

    // Allow Enter key to trigger search
    const locationInput = document.getElementById('locationInput');
    if (locationInput) {
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    // Get current location button
    const locationBtn = document.querySelector('button[onclick="getCurrentLocation()"]');
    if (locationBtn) {
        locationBtn.addEventListener('click', getCurrentLocation);
    }
}

// Initialize Buyer Map
function initializeBuyerMap() {
    const mapElement = document.getElementById('buyer-map');
    if (!mapElement || typeof window.google === 'undefined') return;

    // Default map center
    const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York

    const map = new window.google.maps.Map(mapElement, {
        zoom: 12,
        center: defaultCenter,
        styles: [
            {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#2c1810' }]
            }
        ]
    });

    mapElement.mapInstance = map;

    // Add user location marker
    const userMarker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        title: 'Your Location',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });

    mapElement.userMarker = userMarker;
}

// Get Buyer's Current Location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // Update location input
                const locationInput = document.getElementById('locationInput');
                if (locationInput) {
                    locationInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                }

                // Save location
                localStorage.setItem('userLocation', JSON.stringify({ lat, lng }));

                // Update map
                const mapElement = document.getElementById('buyer-map');
                if (mapElement && mapElement.mapInstance) {
                    const location = { lat, lng };
                    mapElement.mapInstance.panTo(location);
                    mapElement.mapInstance.setZoom(14);
                    mapElement.userMarker.setPosition(location);
                }

                // Auto-apply filters
                applyFilters();
                showNotification('Using your current location', 'success');
            },
            (error) => {
                console.error('Geolocation error:', error);
                showNotification('Unable to get your location. Please enter it manually.', 'error');
            }
        );
    } else {
        showNotification('Geolocation is not supported by your browser.', 'error');
    }
}

// Apply Filters and Search Vendors
function applyFilters() {
    const locationInputValue = document.getElementById('locationInput').value.trim();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const radiusFilter = parseInt(document.getElementById('radiusFilter').value);
    const ratingFilter = parseFloat(document.getElementById('ratingFilter').value);
    const sortFilter = document.getElementById('sortFilter').value;

    if (!locationInputValue) {
        showNotification('Please enter a location', 'error');
        return;
    }

    resolveSearchLocation(locationInputValue)
        .then(([lat, lng]) => {
            let vendors = getAllVendors();
            vendors = filterVendorsByLocation(vendors, lat, lng, radiusFilter);
            if (categoryFilter) {
                vendors = filterVendorsByCategory(vendors, categoryFilter);
            }
            if (ratingFilter > 0) {
                vendors = filterVendorsByRating(vendors, ratingFilter);
            }
            vendors = sortVendors(vendors, sortFilter, lat, lng);
            displayVendors(vendors, lat, lng);
            updateVendorMap(vendors, lat, lng);
        })
        .catch(error => {
            showNotification(error, 'error');
        });
}

function resolveSearchLocation(locationInput) {
    const coordMatch = locationInput.match(/^\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
        return Promise.resolve([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
    }

    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
        return new Promise((resolve, reject) => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: locationInput }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    resolve([location.lat(), location.lng()]);
                } else {
                    reject('Unable to locate that address. Please enter coordinates or try a different address.');
                }
            });
        });
    }

    return Promise.reject('Invalid location format. Please enter coordinates or a valid address.');
}

// Sort Vendors
function sortVendors(vendors, sortType, userLat, userLng) {
    const vendorsCopy = [...vendors];

    switch (sortType) {
        case 'distance':
            return vendorsCopy.sort((a, b) => {
                const distA = calculateDistance(userLat, userLng, a.latitude, a.longitude);
                const distB = calculateDistance(userLat, userLng, b.latitude, b.longitude);
                return distA - distB;
            });
        case 'rating':
            return vendorsCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        case 'newest':
            return vendorsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        default:
            return vendorsCopy;
    }
}

// Display Vendors
function displayVendors(vendors, userLat, userLng) {
    const grid = document.getElementById('vendorsGrid');
    const countBadge = document.getElementById('vendorCount');

    if (vendors.length === 0) {
        grid.innerHTML = `
            <div class="loading-placeholder" style="grid-column: 1 / -1;">
                <i class="fas fa-search"></i>
                <p>No vendors found matching your criteria</p>
            </div>
        `;
        countBadge.textContent = '0 vendors';
        return;
    }

    grid.innerHTML = '';
    countBadge.textContent = `${vendors.length} vendor${vendors.length !== 1 ? 's' : ''}`;

    vendors.forEach(vendor => {
        const distance = calculateDistance(userLat, userLng, vendor.latitude, vendor.longitude);
        const rating = vendor.rating || 4.5;
        const reviews = vendor.reviews || Math.floor(Math.random() * 100) + 10;

        const card = document.createElement('div');
        card.className = 'vendor-card';
        card.innerHTML = `
            <div class="vendor-card-header">
                <div class="vendor-card-name">${vendor.businessName}</div>
                <div class="vendor-card-category">${formatCategory(vendor.businessCategory)}</div>
            </div>
            <div class="vendor-card-body">
                <div class="vendor-rating">
                    <span>${rating.toFixed(1)} ⭐</span>
                    <span class="review-count">(${reviews} reviews)</span>
                </div>
                <div class="vendor-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${distance.toFixed(1)} km away</span>
                </div>
                <p class="vendor-description">${vendor.description}</p>
                <div class="vendor-info-row">
                    <label>Delivery Radius:</label>
                    <span>${vendor.deliveryRadius} km</span>
                </div>
                <div class="vendor-info-row">
                    <label>Hours:</label>
                    <span>${formatTime(vendor.openingTime)} - ${formatTime(vendor.closingTime)}</span>
                </div>
            </div>
            <div class="vendor-card-footer">
                <button class="btn btn-primary view-details-btn">View Details</button>
            </div>
        `;

        card.querySelector('.view-details-btn').addEventListener('click', (event) => {
            event.stopPropagation();
            viewVendorDetails(vendor);
        });

        card.addEventListener('click', () => viewVendorDetails(vendor));
        grid.appendChild(card);
    });
}

// View Vendor Details
function viewVendorDetails(vendor) {
    // Store selected vendor
    localStorage.setItem('selectedVendor', JSON.stringify(vendor));

    // Open modal
    const modal = document.getElementById('vendorModal');
    if (!modal) return;

    // Populate modal
    document.getElementById('modalVendorName').textContent = vendor.businessName;
    document.getElementById('modalVendorRating').textContent = `${vendor.rating || 4.5} ⭐`;
    document.getElementById('modalVendorReviews').textContent = `(${vendor.reviews || 50} reviews)`;
    document.getElementById('modalVendorCategory').textContent = formatCategory(vendor.businessCategory);
    document.getElementById('modalVendorDescription').textContent = vendor.description;
    document.getElementById('modalVendorPhone').textContent = vendor.contactPhone;
    document.getElementById('modalVendorEmail').textContent = vendor.contactEmail;
    document.getElementById('modalVendorAddress').textContent = vendor.businessAddress;
    document.getElementById('modalVendorHours').textContent = `${formatTime(vendor.openingTime)} - ${formatTime(vendor.closingTime)}`;
    document.getElementById('modalDeliveryRadius').textContent = vendor.deliveryRadius;
    document.getElementById('modalDeliveryZones').textContent = vendor.zones ? vendor.zones.join(', ') : 'No zones specified';

    const products = getVendorProducts(vendor.userId) || [];
    const productsContainer = document.getElementById('modalVendorProducts');
    if (products.length === 0) {
        productsContainer.innerHTML = '<p>No products listed yet</p>';
    } else {
        productsContainer.innerHTML = products.map((p, index) => `
            <div class="vendor-product-item">
                <div>
                    <strong>${p.name}</strong>
                    <div>${formatCurrency(p.price)}</div>
                </div>
                <div>
                    <label for="orderQty_${p.id}">Qty</label>
                    <input type="number" id="orderQty_${p.id}" class="order-qty-input" value="0" min="0" />
                </div>
            </div>
        `).join('');
    }

    const orderTotal = document.createElement('div');
    orderTotal.id = 'modalOrderTotal';
    orderTotal.className = 'vendor-order-total';
    orderTotal.textContent = 'Total: $0.00';
    const footer = modal.querySelector('.vendor-modal-footer');
    if (footer && !document.getElementById('modalOrderTotal')) {
        footer.insertAdjacentElement('beforebegin', orderTotal);
    }

    updateOrderTotal();
    modal.addEventListener('input', (event) => {
        if (event.target.matches('.order-qty-input')) {
            updateOrderTotal();
        }
    });
    modal.style.display = 'flex';
}

function updateOrderTotal() {
    const modal = document.getElementById('vendorModal');
    if (!modal) return;
    const totalElement = document.getElementById('modalOrderTotal');
    const vendor = JSON.parse(localStorage.getItem('selectedVendor'));
    const products = getVendorProducts(vendor.userId) || [];
    let total = 0;
    products.forEach(p => {
        const qtyInput = document.getElementById(`orderQty_${p.id}`);
        if (qtyInput) {
            const qty = parseInt(qtyInput.value, 10) || 0;
            total += qty * p.price;
        }
    });
    if (totalElement) {
        totalElement.textContent = `Total: ${formatCurrency(total)}`;
    }
}

function placeOrder() {
    const userInfo = getCurrentUserInfo();
    if (!userInfo || localStorage.getItem('userRole') !== 'buyer') {
        showNotification('Please log in as a buyer before placing an order.', 'error');
        return;
    }

    const vendor = JSON.parse(localStorage.getItem('selectedVendor'));
    if (!vendor) {
        showNotification('No vendor selected.', 'error');
        return;
    }

    const products = getVendorProducts(vendor.userId) || [];
    const orderItems = products.map(p => {
        const qtyInput = document.getElementById(`orderQty_${p.id}`);
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 0 : 0;
        return { ...p, quantity: qty };
    }).filter(item => item.quantity > 0);

    if (orderItems.length === 0) {
        showNotification('Please select at least one product quantity.', 'error');
        return;
    }

    const orderTotal = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const newOrder = {
        id: generateId(),
        orderNumber: `#${Math.floor(10000 + Math.random() * 90000)}`,
        customer: userInfo.name,
        total: orderTotal,
        date: new Date().toISOString(),
        status: 'Pending',
        items: orderItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
    };

    const vendorOrders = JSON.parse(localStorage.getItem(`orders_${vendor.userId}`) || '[]');
    vendorOrders.push(newOrder);
    localStorage.setItem(`orders_${vendor.userId}`, JSON.stringify(vendorOrders));

    const buyerOrders = JSON.parse(localStorage.getItem(`buyer_orders_${userInfo.sub}`) || '[]');
    buyerOrders.push({ ...newOrder, vendorId: vendor.userId, vendorName: vendor.businessName });
    localStorage.setItem(`buyer_orders_${userInfo.sub}`, JSON.stringify(buyerOrders));

    showNotification('Order placed successfully!', 'success');
    closeVendorModal();
}

function resolveSearchLocation(locationInput) {
    const coordMatch = locationInput.match(/^\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
        return Promise.resolve([parseFloat(coordMatch[1]), parseFloat(coordMatch[2])]);
    }

    if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
        return new Promise((resolve, reject) => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: locationInput }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    resolve([location.lat(), location.lng()]);
                } else {
                    reject('Unable to locate that address. Please enter coordinates or try a different address.');
                }
            });
        });
    }

    return Promise.reject('Invalid location format. Please enter coordinates or a valid address.');
}

// Close Vendor Modal
function closeVendorModal() {
    const modal = document.getElementById('vendorModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Contact Vendor
function contactVendor() {
    const vendor = JSON.parse(localStorage.getItem('selectedVendor'));
    if (!vendor) return;

    showNotification(`Contacting ${vendor.businessName}...`, 'info');

    // Compose email or messaging logic
    const userInfo = getCurrentUserInfo();
    const subject = `Inquiry from RatishPlug Buyer`;
    const body = `Hello ${vendor.businessName},\n\nI'm interest in your products/services.\n\nBest regards,\n${userInfo ? userInfo.name : 'A RatishPlug User'}`;

    // In a real app, this would send a message through the platform
    closeVendorModal();
}

// Save Vendor (Wishlist)
function saveVendor() {
    const vendor = JSON.parse(localStorage.getItem('selectedVendor'));
    if (!vendor) return;

    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
        showNotification('Please login to save vendors', 'error');
        return;
    }

    let savedVendors = JSON.parse(localStorage.getItem(`savedVendors_${userInfo.sub}`) || '[]');
    if (!savedVendors.find(v => v.userId === vendor.userId)) {
        savedVendors.push(vendor);
        localStorage.setItem(`savedVendors_${userInfo.sub}`, JSON.stringify(savedVendors));
        showNotification('Vendor saved to your wishlist!', 'success');
    } else {
        showNotification('This vendor is already saved', 'info');
    }
}

// Update Vendor Map
function updateVendorMap(vendors, userLat, userLng) {
    const mapElement = document.getElementById('buyer-map');
    if (!mapElement || !mapElement.mapInstance) return;

    const map = mapElement.mapInstance;

    // Clear existing vendor markers
    if (mapElement.vendorMarkers) {
        mapElement.vendorMarkers.forEach(m => m.setMap(null));
    }

    mapElement.vendorMarkers = [];

    // Add vendor markers
    vendors.forEach(vendor => {
        const marker = new window.google.maps.Marker({
            position: { lat: vendor.latitude, lng: vendor.longitude },
            map: map,
            title: vendor.businessName
        });

        marker.infoWindow = new window.google.maps.InfoWindow({
            content: `
                <div style="padding: 10px;">
                    <strong>${vendor.businessName}</strong><br/>
                    ${formatCategory(vendor.businessCategory)}<br/>
                    Rating: ${vendor.rating || 4.5} ⭐
                </div>
            `
        });

        marker.addListener('click', () => {
            // Close other info windows
            mapElement.vendorMarkers.forEach(m => {
                if (m.infoWindow) m.infoWindow.close();
            });
            marker.infoWindow.open(map, marker);
        });

        mapElement.vendorMarkers.push(marker);
    });
}

// Load Vendors Initially
function loadVendors() {
    const vendors = getAllVendors();
    if (vendors.length === 0) {
        document.getElementById('vendorsGrid').innerHTML = `
            <div class="loading-placeholder" style="grid-column: 1 / -1;">
                <i class="fas fa-store"></i>
                <p>No vendors available yet. Use search to find vendors in your area.</p>
            </div>
        `;
    }
}

// Format Category
function formatCategory(category) {
    const categoryMap = {
        'food': 'Food & Beverages',
        'retail': 'Retail & Fashion',
        'electronics': 'Electronics',
        'services': 'Services',
        'grocery': 'Grocery & Supplies',
        'handmade': 'Handmade & Crafts',
        'other': 'Other'
    };
    return categoryMap[category] || category;
}

// Logout Buyer
async function logoutBuyer() {
    if (confirm('Are you sure you want to logout?')) {
        await supabaseSignOut();
        showNotification('You have been logged out', 'info');
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}
