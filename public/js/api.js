/**
 * Axios API Utility
 * Centralized API calls for frontend-backend communication
 */

// Create Axios instance with default config
const api = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API Methods for Members
const MemberAPI = {
  search: (phone) => api.get(`/members/api/search?phone=${encodeURIComponent(phone)}`),
  getAll: () => api.get('/members/api/all'),
  getById: (id) => api.get(`/members/api/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`)
};

// API Methods for Products
const ProductAPI = {
  getAll: () => api.get('/products/api/all'),
  getById: (id) => api.get(`/products/api/${id}`),
  getByCategory: (category) => api.get(`/products/api/category/${category}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

// API Methods for Sales/POS
const SalesAPI = {
  getHistory: (params) => api.get('/sales/api/history', { params }),
  getReceipt: (id) => api.get(`/sales/api/receipt/${id}`),
  createSale: (data) => api.post('/sales/api/create', data),
  cancelSale: (id) => api.post(`/sales/api/${id}/cancel`),
  getStats: (params) => api.get('/sales/api/stats', { params })
};

// API Methods for Promotions
const PromotionAPI = {
  getAll: () => api.get('/promotions/api/all'),
  getActive: () => api.get('/promotions/api/active'),
  getById: (id) => api.get(`/promotions/api/${id}`),
  create: (data) => api.post('/promotions', data),
  update: (id, data) => api.put(`/promotions/${id}`, data),
  delete: (id) => api.delete(`/promotions/${id}`)
};

// API Methods for Reports
const ReportAPI = {
  getSalesReport: (params) => api.get('/reports/api/sales', { params }),
  getProductReport: (params) => api.get('/reports/api/products', { params }),
  getMemberReport: (params) => api.get('/reports/api/members', { params }),
  getEmployeeReport: (params) => api.get('/reports/api/employees', { params })
};

// API Methods for Dashboard
const DashboardAPI = {
  getStats: () => api.get('/dashboard/api/stats'),
  getChartData: () => api.get('/dashboard/api/chart-data')
};

// Error Handler
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
