import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  withCredentials: true, // Important for session cookies
  timeout: 30000, // 30 second timeout to prevent hanging requests on mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  loginWithGoogle: () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  },

  getCurrentUser: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

// Cheat Sheets API
export const cheatSheetsAPI = {
  getAll: (params) => api.get('/api/cheatsheets', { params }),

  getById: (id) => api.get(`/api/cheatsheets/${id}`),

  create: (formData) => api.post('/api/cheatsheets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  update: (id, data) => api.put(`/api/cheatsheets/${id}`, data),

  edit: (id, formData) => api.patch(`/api/cheatsheets/${id}/edit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  delete: (id) => api.delete(`/api/cheatsheets/${id}`),

  downloadFree: (id) => api.get(`/api/cheatsheets/${id}/download-free`, {
    responseType: 'blob',
  }),
};

// Payments API
export const paymentsAPI = {
  createPayment: (cheatsheetId) =>
    api.post('/api/payments/create', { cheatsheet_id: cheatsheetId }),

  getPaymentStatus: (orderId) =>
    api.get(`/api/payments/status/${orderId}`),

  createBundlePayment: (bundle_order_id) =>
    api.post('/api/payments/create-bundle', { bundle_order_id }),

  getBundleStatus: (bundleOrderId) =>
    api.get(`/api/payments/bundle-status/${bundleOrderId}`),

  getQRCode: (orderId) =>
    api.get(`/api/payments/qr/${orderId}`),
};

// Purchases API
export const purchasesAPI = {
  getMyPurchases: () => api.get('/api/purchases/my'),

  getPurchaseById: (orderId) => api.get(`/api/purchases/${orderId}`),

  downloadCheatSheet: (orderId) => {
    return api.get(`/api/purchases/${orderId}/download`, {
      responseType: 'blob',
    });
  },

  checkAccess: (cheatsheetId) =>
    api.get(`/api/purchases/check/${cheatsheetId}`),
};

// Admin API
export const adminAPI = {
  getPendingPayments: () => api.get('/api/admin/payments/pending'),

  approvePayment: (orderId, paymentId) =>
    api.post(`/api/admin/payments/${orderId}/approve`, { payment_id: paymentId }),

  rejectPayment: (orderId, reason) =>
    api.post(`/api/admin/payments/${orderId}/reject`, { reason }),

  getAllPurchases: (params) => api.get('/api/admin/purchases', { params }),

  getStats: () => api.get('/api/admin/stats'),

  getAllTickets: (params) => api.get('/api/support/tickets/all', { params }),

  updateTicketStatus: (ticketId, status) =>
    api.patch(`/api/support/tickets/${ticketId}/status`, { ticket_status: status }),

  // Cheat sheet approvals
  getPendingCheatsheets: (params) => api.get('/api/admin/cheatsheets/pending', { params }),

  approveCheatsheet: (cheatsheetId) =>
    api.post(`/api/admin/cheatsheets/${cheatsheetId}/approve`),

  rejectCheatsheet: (cheatsheetId, rejectionReason) =>
    api.post(`/api/admin/cheatsheets/${cheatsheetId}/reject`, { rejection_reason: rejectionReason }),

  // User management
  getAllUsers: (params) => api.get('/api/admin/users', { params }),

  updateUserRoles: (userId, roles) =>
    api.patch(`/api/admin/users/${userId}/roles`, roles),

  // All cheat sheets management
  getAllCheatSheets: () => api.get('/api/admin/cheatsheets/all'),

  updateCheatSheetStatus: (cheatsheetId, isActive) =>
    api.patch(`/api/admin/cheatsheets/${cheatsheetId}/status`, { is_active: isActive }),
};

// Support API
export const supportAPI = {
  submitTicket: (ticketData) => api.post('/api/support/tickets', ticketData),

  getMyTickets: () => api.get('/api/support/tickets'),

  deleteAccount: () => api.delete('/api/support/account'),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/api/cart'),

  addToCart: (cheatsheet_id) => api.post('/api/cart/add', { cheatsheet_id }),

  removeFromCart: (cart_id) => api.delete(`/api/cart/${cart_id}`),

  clearCart: () => api.delete('/api/cart'),

  getCartCount: () => api.get('/api/cart/count'),

  checkout: () => api.post('/api/cart/checkout'),
};

// Reviews API
export const reviewsAPI = {
  createOrUpdateReview: (cheatsheetId, rating, comment) =>
    api.post('/api/reviews', {
      cheatsheet_id: cheatsheetId,
      rating,
      comment,
    }),

  getReviewsForCheatSheet: (cheatsheetId, params) =>
    api.get(`/api/reviews/cheatsheet/${cheatsheetId}`, { params }),

  getMyReview: (cheatsheetId) =>
    api.get(`/api/reviews/my-review/${cheatsheetId}`),

  deleteReview: (reviewId) => api.delete(`/api/reviews/${reviewId}`),

  // Admin
  getAllReviews: (params) => api.get('/api/reviews/admin/all', { params }),

  updateReviewApproval: (reviewId, isApproved) =>
    api.patch(`/api/reviews/${reviewId}/approval`, { is_approved: isApproved }),
};

// Seller Applications API
export const sellerApplicationAPI = {
  submit: (data) => api.post('/api/seller-applications', data),

  getMy: () => api.get('/api/seller-applications/my'),

  // Admin
  getAll: (params) => api.get('/api/seller-applications/admin/all', { params }),

  approve: (id, adminNotes) =>
    api.post(`/api/seller-applications/${id}/approve`, { admin_notes: adminNotes }),

  reject: (id, adminNotes) =>
    api.post(`/api/seller-applications/${id}/reject`, { admin_notes: adminNotes }),
};

// Analytics API
export const analyticsAPI = {
  // Track an event
  track: (eventType, data = {}) =>
    api.post('/api/analytics/track', {
      event_type: eventType,
      ...data
    }),

  // Get analytics summary (admin only)
  getSummary: () => api.get('/api/analytics/summary'),

  // Get cheat sheet analytics (admin only)
  getCheatSheetAnalytics: (id) => api.get(`/api/analytics/cheatsheet/${id}`),
};

export default api;
