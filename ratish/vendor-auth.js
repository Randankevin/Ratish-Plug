// ===== VENDOR AUTHENTICATION & REGISTRATION =====

document.addEventListener('DOMContentLoaded', function() {
    initVendorRegistration();
});

function initVendorRegistration() {
    // Render Google Sign-In Button for Vendors (Required)
    if (document.getElementById('google_signin_button')) {
        renderVendorGoogleSignIn();
    }

    // Handle vendor form submission
    const vendorForm = document.getElementById('vendorForm');
    if (vendorForm) {
        vendorForm.addEventListener('submit', handleVendorRegistration);
    }

    // Handle zone form submission
    const zoneForm = document.getElementById('zoneForm');
    if (zoneForm) {
        zoneForm.addEventListener('submit', handleAddZone);
    }

    // Handle business address search for map
    const addressInput = document.getElementById('businessAddress');
    if (addressInput) {
        addressInput.addEventListener('change', showMapContainer);
    }

    // Check if user is already logged in as vendor
    const userInfo = getCurrentUserInfo();
    if (userInfo) {
        showVendorForm();
    }
}

// Render Supabase Google Sign-In for Vendors
function renderVendorGoogleSignIn() {
    const buttonContainer = document.getElementById('google_signin_button');
    if (!buttonContainer) return;

    buttonContainer.innerHTML = `
        <button type="button" id="supabaseVendorLoginButton" class="btn btn-primary">
            <i class="fab fa-google"></i> Sign in with Google
        </button>
    `;

    const loginButton = document.getElementById('supabaseVendorLoginButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            supabaseSignInWithGoogle('vendor', '/vendor-register.html');
        });
    }
}

// Handle Vendor Sign-In via Supabase (if callback is needed)
async function handleVendorGoogleAuth() {
    await supabaseSignInWithGoogle('vendor', '/vendor-register.html');
}

// Show Vendor Registration Form
function showVendorForm() {
    const form = document.getElementById('vendorForm');
    const googleButton = document.querySelector('.google-auth-section');
    const successMessage = document.getElementById('registrationSuccess');

    if (form) form.style.display = 'block';
    if (googleButton) googleButton.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';

    // Pre-fill email if available
    const userInfo = getCurrentUserInfo();
    if (userInfo && document.getElementById('contactEmail')) {
        document.getElementById('contactEmail').value = userInfo.email;
    }
}

// Show Map Container
function showMapContainer() {
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
        mapContainer.style.display = 'block';
        initializeVendorMap();
    }
}

// Initialize Vendor Map
function initializeVendorMap() {
    const mapElement = document.getElementById('vendor-map');
    if (!mapElement || mapElement.instance) return;

    // Default map center
    const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York

    // Create map instance
    const map = new window.google.maps.Map(mapElement, {
        zoom: 13,
        center: defaultCenter,
        styles: [
            {
                featureType: 'all',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#2c1810' }]
            }
        ]
    });

    // Create marker for vendor location
    const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        draggable: true
    });

    // Store coordinates when marker is moved
    marker.addListener('dragend', () => {
        const position = marker.getPosition();
        document.getElementById('vendorLat').value = position.lat();
        document.getElementById('vendorLng').value = position.lng();
    });

    // Store reference to map
    mapElement.instance = { map, marker };

    // Search for address
    const addressInput = document.getElementById('businessAddress');
    if (addressInput) {
        const searchBox = new window.google.maps.places.SearchBox(addressInput);

        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;

            const place = places[0];
            const location = place.geometry.location;

            marker.setPosition(location);
            map.panTo(location);
            map.setZoom(15);

            // Hidden inputs for coordinates
            if (!document.getElementById('vendorLat')) {
                const latInput = document.createElement('input');
                latInput.type = 'hidden';
                latInput.id = 'vendorLat';
                latInput.value = location.lat();
                document.getElementById('vendorForm').appendChild(latInput);

                const lngInput = document.createElement('input');
                lngInput.type = 'hidden';
                lngInput.id = 'vendorLng';
                lngInput.value = location.lng();
                document.getElementById('vendorForm').appendChild(lngInput);
            } else {
                document.getElementById('vendorLat').value = location.lat();
                document.getElementById('vendorLng').value = location.lng();
            }
        });
    }
}

// Handle Vendor Registration
function handleVendorRegistration(e) {
    e.preventDefault();

    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
        showNotification('Please log in with Google first', 'error');
        return;
    }

    // Collect form data
    const formData = {
        businessName: document.getElementById('businessName').value,
        businessCategory: document.getElementById('businessCategory').value,
        description: document.getElementById('description').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactEmail: document.getElementById('contactEmail').value,
        businessAddress: document.getElementById('businessAddress').value,
        deliveryRadius: parseInt(document.getElementById('deliveryRadius').value),
        openingTime: document.getElementById('openingTime').value,
        closingTime: document.getElementById('closingTime').value,
        businessLicense: document.getElementById('businessLicense').value,
        website: document.getElementById('website').value,
        latitude: parseFloat(document.getElementById('vendorLat')?.value || 0),
        longitude: parseFloat(document.getElementById('vendorLng')?.value || 0),
        zones: getSelectedZones()
    };

    // Save vendor data
    if (saveVendorData(formData)) {
        showNotification('Vendor profile created successfully!', 'success');
        showSuccessMessage();
        setTimeout(() => {
            window.location.href = 'vendor-dashboard.html';
        }, 2000);
    } else {
        showNotification('Error creating vendor profile. Please try again.', 'error');
    }
}

// Get Selected Zones
function getSelectedZones() {
    const checkboxes = document.querySelectorAll('input[name="zones"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Show Success Message
function showSuccessMessage() {
    const form = document.getElementById('vendorForm');
    const successMessage = document.getElementById('registrationSuccess');

    if (form) form.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
}

// Handle Add Zone
function handleAddZone(e) {
    e.preventDefault();

    const zoneName = document.getElementById('zoneName').value;
    const zoneRadius = document.getElementById('zoneRadius').value;
    const zoneFee = document.getElementById('zoneFee').value;

    if (!zoneName || !zoneRadius) {
        showNotification('Please fill all zone fields', 'error');
        return;
    }

    const vendorData = getVendorData();
    if (!vendorData) {
        showNotification('Vendor profile not found', 'error');
        return;
    }

    if (!vendorData.customZones) {
        vendorData.customZones = [];
    }

    vendorData.customZones.push({
        id: generateId(),
        name: zoneName,
        radius: parseFloat(zoneRadius),
        fee: parseFloat(zoneFee)
    });

    saveVendorData(vendorData);
    showNotification('Zone added successfully!', 'success');

    // Reset form
    document.getElementById('zoneForm').reset();
}

async function logoutVendor() {
    if (confirm('Are you sure you want to logout?')) {
        await supabaseSignOut();
        localStorage.removeItem('vendorProfile');
        showNotification('You have been logged out', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}
