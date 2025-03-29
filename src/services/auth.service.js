const API_URL = `${process.env.REACT_APP_API_BOT_URL}/api/auth`;

const API_BASE_URL = `${process.env.REACT_APP_API_BOT_URL}/api`;

const AuthService = {
  async refreshToken(token) {
    try {
      const response = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        return { success: true, token: data.token };
      }

      return {
        success: false,
        message: data.message || "Не удалось обновить токен",
      };
    } catch (error) {
      console.error("Ошибка при обновлении токена:", error);
      return { success: false, message: "Ошибка сети при обновлении токена" };
    }
  },

  async authorizedFetch(url, options = {}) {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: "Не авторизован", statusCode: 401 };
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok && response.status === 403 && data.expired) {
        console.log("Токен истек, пробуем обновить");

        const refreshResult = await this.refreshToken(token);

        if (refreshResult.success) {
          const newHeaders = {
            ...options.headers,
            Authorization: `Bearer ${refreshResult.token}`,
          };

          const newResponse = await fetch(url, {
            ...options,
            headers: newHeaders,
          });
          return await newResponse.json();
        } else {
          this.logout();
          return {
            success: false,
            message: "Сессия истекла. Пожалуйста, войдите снова.",
            sessionExpired: true,
          };
        }
      }

      return data;
    } catch (error) {
      console.error("Ошибка запроса:", error);
      return { success: false, message: "Ошибка сети при выполнении запроса" };
    }
  },

  async register(email, password, name, phone) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, phone }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error("Ошибка при входе:", error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userWallets");
    localStorage.removeItem("cryptoData");

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("wallet_") || key.startsWith("payment_")) {
        localStorage.removeItem(key);
      }
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  async getUserOrders() {
    try {
      const userId = this.getCurrentUser()?.id;
      if (!userId) {
        return { success: false, message: "User ID not found" };
      }

      const data = await this.authorizedFetch(
        `${API_URL}/user/${userId}/orders`,
        {
          method: "GET",
        }
      );

      if (data.sessionExpired) {
        window.location.href = "/auth";
      }

      return data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return { success: false, message: error.message };
    }
  },

  async validatePromoCode(code) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("Authorization required");
      }

      const response = await fetch(`${API_BASE_URL}/promocodes/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      return await response.json();
    } catch (error) {
      console.error("Error validating promo code:", error);
      throw error;
    }
  },

  async getUserPromoCodes() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error("Authorization required");
      }

      const response = await fetch(`${API_BASE_URL}/promocodes/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error("Error getting user promo codes:", error);
      throw error;
    }
  },
};

export default AuthService;
