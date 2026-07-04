// ===== VENDOR DASHBOARD =====

document.addEventListener('DOMContentLoaded', function() {
    initVendorDashboard();
});

function initVendorDashboard() {
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
        window.location.href = 'vendor-register.html';
        return;
    }

    const vendorData = getVendorData();
    if (!vendorData || vendorData.userId !== userInfo.sub) {
        showNotification('Vendor profile not found. Please complete registration.', 'error');
        setTimeout(() => {
            window.location.href = 'vendor-register.html';
        }, 2000);
        return;
    }

    const vendorNameElement = document.getElementById('vendorName');
    if (vendorNameElement) {
        vendorNameElement.textContent = vendorData.businessName || userInfo.name;
    }

    setupSidebarNavigation();
    loadProfileSection(vendorData);
    loadDeliveryZones(vendorData);
    loadProducts(vendorData);
    loadOrders(vendorData);
    loadAnalytics(vendorData);
}

function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const sections = document.querySelectorAll('.dashboard-section');
            sections.forEach(section => section.classList.remove('active'));
            const sectionId = this.getAttribute('data-section') + '-section';
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
            }
        });
    });
}

function loadProfileSection(vendorData) {
    const form = document.getElementById('profileForm');
    if (!form) return;
    document.getElementById('businessName').value = vendorData.businessName || '';
    document.getElementById('businessCategory').value = vendorData.businessCategory || '';
    document.getElementById('description').value = vendorData.description || '';
    document.getElementById('contactPhone').value = vendorData.contactPhone || '';
    document.getElementById('contactEmail').value = vendorData.contactEmail || '';
    document.getElementById('businessAddress').value = vendorData.businessAddress || '';
    document.getElementById('openingTime').value = vendorData.openingTime || '';
    document.getElementById('closingTime').value = vendorData.closingTime || '';
    document.getElementById('deliveryRadius').value = vendorData.deliveryRadius || 5;
    form.removeEventListener('submit', handleProfileUpdate);
    form.addEventListener('submit', handleProfileUpdate);
}

function loadDeliveryZones(vendorData) {
    vendorData.customZones = vendorData.customZones || [];
    const zoneForm = document.getElementById('zoneForm');
    const zonesList = document.querySelector('#delivery-zones-section .zones-list');
    if (!zonesList || !zoneForm) return;
    renderZonesList(vendorData);
    zoneForm.removeEventListener('submit', handleAddZone);
    zoneForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleAddZone(vendorData);
    });
}

function renderZonesList(vendorData) {
    const zonesList = document.querySelector('#delivery-zones-section .zones-list');
    zonesList.innerHTML = '';
    if (!vendorData.customZones || vendorData.customZones.length === 0) {
        zonesList.innerHTML = '<p class="text-center">No delivery zones defined yet.</p>';
        return;
    }
    vendorData.customZones.forEach(zone => {
        const zoneItem = document.createElement('div');
        zoneItem.className = 'zone-item';
        zoneItem.innerHTML = `
            <div class="zone-info">
                <h3>${zone.name}</h3>
                <p>Coverage: ${zone.radius} km radius | Fee: ${formatCurrency(zone.fee || 0)}</p>
            </div>
            <div class="zone-actions">
                <button class="btn btn-small btn-secondary" onclick="editZone('${zone.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteZone('${zone.id}')">Remove</button>
            </div>
        `;
        zonesList.appendChild(zoneItem);
    });
}

function handleAddZone(vendorData) {
    const zoneName = document.getElementById('zoneName').value.trim();
    const zoneRadius = parseFloat(document.getElementById('zoneRadius').value);
    const zoneFee = parseFloat(document.getElementById('zoneFee').value) || 0;
    if (!zoneName || !zoneRadius) {
        showNotification('Please fill in zone name and radius.', 'error');
        return;
    }
    if (!vendorData.customZones) {
        vendorData.customZones = [];
    }
    vendorData.customZones.push({
        id: generateId(),
        name: zoneName,
        radius: zoneRadius,
        fee: zoneFee
    });
    saveVendorData(vendorData);
    showNotification('Delivery zone added.', 'success');
    document.getElementById('zoneForm').reset();
    renderZonesList(vendorData);
}

function editZone(zoneId) {
    const vendorData = getVendorData();
    const zone = vendorData.customZones.find(z => z.id === zoneId);
    if (!zone) {
        showNotification('Zone not found.', 'error');
        return;
    }
    const modal = `
        <div class="modal" id="zoneEditModal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeZoneModal()">&times;</button>
                <div style="padding: 24px;">
                    <h2>Edit Zone</h2>
                    <form id="zoneEditForm" style="margin-top: 20px;">
                        <div class="form-group">
                            <label for="editZoneName">Zone Name</label>
                            <input type="text" id="editZoneName" value="${zone.name}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editZoneRadius">Radius (km)</label>
                                <input type="number" id="editZoneRadius" value="${zone.radius}" min="1" required>
                            </div>
                            <div class="form-group">
                                <label for="editZoneFee">Delivery Fee</label>
                                <input type="number" id="editZoneFee" value="${zone.fee || 0}" step="0.01" min="0">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Update Zone</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    const editForm = document.getElementById('zoneEditForm');
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveZoneUpdates(zoneId);
    });
}

function saveZoneUpdates(zoneId) {
    const vendorData = getVendorData();
    const zone = vendorData.customZones.find(z => z.id === zoneId);
    if (!zone) {
        showNotification('Zone not found.', 'error');
        closeZoneModal();
        return;
    }
    zone.name = document.getElementById('editZoneName').value.trim();
    zone.radius = parseFloat(document.getElementById('editZoneRadius').value);
    zone.fee = parseFloat(document.getElementById('editZoneFee').value) || 0;
    saveVendorData(vendorData);
    renderZonesList(vendorData);
    showNotification('Zone updated successfully.', 'success');
    closeZoneModal();
}

function closeZoneModal() {
    const modal = document.getElementById('zoneEditModal');
    if (modal) {
        modal.remove();
    }
}

function deleteZone(zoneId) {
    const vendorData = getVendorData();
    if (!vendorData || !vendorData.customZones) return;
    if (confirm('Are you sure you want to delete this delivery zone?')) {
        vendorData.customZones = vendorData.customZones.filter(z => z.id !== zoneId);
        saveVendorData(vendorData);
        renderZonesList(vendorData);
        showNotification('Zone removed.', 'success');
    }
}

function loadProducts(vendorData) {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    const products = getVendorProducts(vendorData.userId);
    renderProductRows(products);
}

function renderProductRows(products) {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No products yet. Add your first product!</td></tr>';
        return;
    }
    tableBody.innerHTML = '';
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="editProduct('${product.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteProduct('${product.id}')">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function loadOrders(vendorData) {
    const orders = getVendorOrders(vendorData.userId);
    renderOrders(orders);
}

function getVendorOrders(vendorId) {
    const orders = JSON.parse(localStorage.getItem(`orders_${vendorId}`) || '[]');
    if (orders.length > 0) {
        return orders;
    }
    const sampleOrders = [
        {
            id: generateId(),
            orderNumber: `#${Math.floor(10000 + Math.random() * 90000)}`,
            customer: 'John Doe',
            total: 45.99,
            date: new Date().toISOString(),
            status: 'Pending',
            items: [
                { name: 'Special Sandwich', quantity: 1 },
                { name: 'Lemonade', quantity: 2 }
            ]
        },
        {
            id: generateId(),
            orderNumber: `#${Math.floor(10000 + Math.random() * 90000)}`,
            customer: 'Asha Patel',
            total: 89.20,
            date: new Date().toISOString(),
            status: 'Delivered',
            items: [
                { name: 'Handmade Earrings', quantity: 1 },
                { name: 'Gift Wrap', quantity: 1 }
            ]
        }
    ];
    localStorage.setItem(`orders_${vendorId}`, JSON.stringify(sampleOrders));
    return sampleOrders;
}

function renderOrders(orders) {
    const ordersContainer = document.querySelector('#orders-section .orders-list');
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '';
    if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = '<p class="text-center">No orders yet. Orders will appear here once customers buy from you.</p>';
        return;
    }
    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="order-header">
                <h3>${order.orderNumber}</h3>
                <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span>
            </div>
            <p class="order-meta">Customer: ${order.customer} | Total: ${formatCurrency(order.total)} | Date: ${formatDate(order.date)}</p>
            <p class="order-summary">Items: ${order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}</p>
            <button class="btn btn-small btn-secondary" onclick="viewOrderDetails('${order.id}')">View Details</button>
        `;
        ordersContainer.appendChild(orderItem);
    });
}

function viewOrderDetails(orderId) {
    const vendorData = getVendorData();
    const orders = getVendorOrders(vendorData.userId);
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Order not found.', 'error');
        return;
    }
    const modal = `
        <div class="modal" id="orderDetailModal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeOrderModal()">&times;</button>
                <div style="padding: 24px; max-width: 500px;">
                    <h2>Order Details</h2>
                    <p><strong>Order:</strong> ${order.orderNumber}</p>
                    <p><strong>Customer:</strong> ${order.customer}</p>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
                    <p><strong>Date:</strong> ${formatDate(order.date)}</p>
                    <div style="margin-top: 16px;">
                        <h3>Items</h3>
                        <ul>
                            ${order.items.map(item => `<li>${item.quantity}× ${item.name}</li>`).join('')}
                        </ul>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="closeOrderModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

function loadAnalytics(vendorData) {
    const orders = getVendorOrders(vendorData.userId);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(order => order.customer)).size;
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const rating = vendorData.rating || 4.5;

    setAnalyticsValue('analyticsTotalOrders', totalOrders);
    setAnalyticsValue('analyticsCustomers', uniqueCustomers);
    setAnalyticsValue('analyticsRevenue', formatCurrency(revenue));
    setAnalyticsValue('analyticsRating', `${rating.toFixed(1)}/5`);
}

function setAnalyticsValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function closeOrderModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) {
        modal.remove();
    }
}

function showAddProductModal(product = null) {
    const isEditing = Boolean(product);
    const modal = `
        <div class="modal" id="productModal">
            <div class="modal-content">
                <button class="modal-close" onclick="closeProductModal()">&times;</button>
                <div style="padding: 24px; max-width: 520px;">
                    <h2>${isEditing ? 'Edit Product' : 'Add Product'}</h2>
                    <form id="productFormModal" style="margin-top: 20px;">
                        <div class="form-group">
                            <label for="productName">Product Name</label>
                            <input type="text" id="productName" value="${product ? product.name : ''}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="productCategory">Category</label>
                                <select id="productCategory" required>
                                    <option value="">Select Category</option>
                                    <option value="electronics" ${product && product.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                                    <option value="clothing" ${product && product.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                                    <option value="food" ${product && product.category === 'food' ? 'selected' : ''}>Food</option>
                                    <option value="handmade" ${product && product.category === 'handmade' ? 'selected' : ''}>Handmade</option>
                                    <option value="other" ${product && product.category === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="productPrice">Price</label>
                                <input type="number" id="productPrice" step="0.01" value="${product ? product.price : ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="productDescription">Description</label>
                            <textarea id="productDescription" rows="3">${product ? product.description : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="productStock">Stock</label>
                            <input type="number" id="productStock" value="${product ? product.stock : 1}" min="0" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">
                            ${isEditing ? 'Save Changes' : 'Add Product'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    const productForm = document.getElementById('productFormModal');
    productForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveProductForm(product ? product.id : null);
    });
}

function saveProductForm(productId = null) {
    const userInfo = getCurrentUserInfo();
    const vendorId = userInfo.sub;
    const product = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        description: document.getElementById('productDescription').value.trim(),
        stock: parseInt(document.getElementById('productStock').value, 10)
    };
    if (!product.name || !product.category || isNaN(product.price) || isNaN(product.stock)) {
        showNotification('Please complete all product fields.', 'error');
        return;
    }
    if (productId) {
        updateProduct(vendorId, productId, product);
        showNotification('Product updated successfully!', 'success');
    } else {
        saveProduct(vendorId, product);
        showNotification('Product added successfully!', 'success');
    }
    closeProductModal();
    loadProducts(getVendorData());
}

function updateProduct(vendorId, productId, updates) {
    const products = getVendorProducts(vendorId).map(product => {
        if (product.id === productId) {
            return {
                ...product,
                ...updates,
                updatedAt: new Date().toISOString()
            };
        }
        return product;
    });
    localStorage.setItem(`products_${vendorId}`, JSON.stringify(products));
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.remove();
    }
}

function editProduct(productId) {
    const userInfo = getCurrentUserInfo();
    const products = getVendorProducts(userInfo.sub);
    const product = products.find(item => item.id === productId);
    if (!product) {
        showNotification('Product not found.', 'error');
        return;
    }
    showAddProductModal(product);
}

function deleteProduct(productId) {
    const userInfo = getCurrentUserInfo();
    if (!confirm('Are you sure you want to delete this product?')) return;
    const products = getVendorProducts(userInfo.sub).filter(product => product.id !== productId);
    localStorage.setItem(`products_${userInfo.sub}`, JSON.stringify(products));
    showNotification('Product deleted successfully!', 'success');
    loadProducts(getVendorData());
}

function handleProfileUpdate(e) {
    e.preventDefault();
    const vendorData = getVendorData();
    if (!vendorData) return;
    vendorData.businessName = document.getElementById('businessName').value.trim();
    vendorData.businessCategory = document.getElementById('businessCategory').value;
    vendorData.description = document.getElementById('description').value.trim();
    vendorData.contactPhone = document.getElementById('contactPhone').value.trim();
    vendorData.contactEmail = document.getElementById('contactEmail').value.trim();
    vendorData.businessAddress = document.getElementById('businessAddress').value.trim();
    vendorData.openingTime = document.getElementById('openingTime').value;
    vendorData.closingTime = document.getElementById('closingTime').value;
    vendorData.deliveryRadius = parseInt(document.getElementById('deliveryRadius').value, 10);
    saveVendorData(vendorData);
    const vendorNameElement = document.getElementById('vendorName');
    if (vendorNameElement) {
        vendorNameElement.textContent = vendorData.businessName || vendorData.name;
    }
    showNotification('Profile updated successfully!', 'success');
}

function changePassword() {
    showNotification('Password change feature coming soon!', 'info');
}

async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    const userInfo = getCurrentUserInfo();
    if (!userInfo) return;
    localStorage.removeItem(`vendor_${userInfo.sub}`);
    localStorage.removeItem('vendorProfile');
    localStorage.removeItem('userInfo');
    localStorage.removeItem(`products_${userInfo.sub}`);
    localStorage.removeItem(`orders_${userInfo.sub}`);
    await supabaseSignOut();
    showNotification('Account deleted.', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

async function logoutVendor() {
    if (!confirm('Are you sure you want to logout?')) return;
    await supabaseSignOut();
    localStorage.removeItem('vendorProfile');
    showNotification('You have been logged out.', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}
