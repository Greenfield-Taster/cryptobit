import axios from "axios";

const API_URL = process.env.REACT_APP_API_BOT_URL;

axios.defaults.baseURL = API_URL;

const setupAuthInterceptor = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

setupAuthInterceptor();

const userService = {
  getUsers: async (page = 1, limit = 10, search = "") => {
    return axios.get(`/api/admin/users`, {
      params: { page, limit, search },
    });
  },

  getUserById: async (userId) => {
    return axios.get(`/api/admin/users/${userId}`);
  },

  updateUser: async (userId, userData) => {
    return axios.put(`/api/admin/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return axios.delete(`/api/admin/users/${userId}`);
  },
};

const exchangeService = {
  getRequests: async (params = {}) => {
    return axios.get(`/api/admin/orders`, { params });
  },

  getRequestById: async (requestId) => {
    return axios.get(`/api/admin/orders/${requestId}`);
  },

  updateRequestStatus: async (requestId, statusData) => {
    return axios.put(`/api/admin/orders/${requestId}/status`, statusData);
  },

  getStatistics: async () => {
    return axios.get(`/api/admin/exchange-statistics`);
  },
};

const chatService = {
  getChats: async (status = "active") => {
    return axios.get(`/api/admin/chats`, {
      params: { status },
    });
  },

  getChatMessages: async (chatId) => {
    return axios.get(`/api/admin/chats/${chatId}/messages`);
  },

  sendMessage: async (chatId, message) => {
    return axios.post(`/api/admin/chats/${chatId}/messages`, {
      message,
    });
  },

  createSupportChat: async (orderId, userId, initialMessage) => {
    return axios.post(`/api/admin/chats`, {
      orderId,
      userId,
      initialMessage,
    });
  },

  closeChat: async (chatId) => {
    return axios.post(`/api/admin/chats/${chatId}/close`);
  },

  archiveChat: async (chatId) => {
    return axios.post(`/api/admin/chats/${chatId}/archive`);
  },
};

const promoCodeService = {
  getPromoCodes: async (page = 1, limit = 10, search = "", status = "") => {
    return axios.get(`/api/admin/promocodes`, {
      params: { page, limit, search, status },
    });
  },

  getPromoCodeById: async (promoCodeId) => {
    return axios.get(`/api/admin/promocodes/${promoCodeId}`);
  },

  createPromoCode: async (promoCodeData) => {
    return axios.post(`/api/admin/promocodes`, promoCodeData);
  },

  deletePromoCode: async (promoCodeId) => {
    return axios.delete(`/api/admin/promocodes/${promoCodeId}`);
  },
};

const adminService = {
  userService,
  exchangeService,
  chatService,
  promoCodeService,
};

export default adminService;
