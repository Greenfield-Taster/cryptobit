const API_URL =
  "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api/auth";

const API_BASE_URL =
  "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api";

class AuthService {
  // Метод для обновления токена
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
  }

  // Новый метод для выполнения авторизованных запросов с проверкой токена
  async authorizedFetch(url, options = {}) {
    const token = this.getToken();
    if (!token) {
      return { success: false, message: "Не авторизован", statusCode: 401 };
    }

    // Добавляем заголовок авторизации
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      // Проверяем, истек ли токен (код 403 и признак expired)
      if (!response.ok && response.status === 403 && data.expired) {
        console.log("Токен истек, пробуем обновить");

        // Пробуем обновить токен
        const refreshResult = await this.refreshToken(token);

        if (refreshResult.success) {
          // Повторяем запрос с новым токеном
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
          // Если не удалось обновить токен, выходим из системы
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
  }

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
  }

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
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userWallets");

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("wallet_") || key.startsWith("payment_")) {
        localStorage.removeItem(key);
      }
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!localStorage.getItem("token");
  }

  getToken() {
    return localStorage.getItem("token");
  }

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

      console.log("Orders API response:", data);

      if (data.sessionExpired) {
        window.location.href = "/auth";
      }

      return data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return { success: false, message: error.message };
    }
  }

  async exchangeApiRequest(endpoint, method = "GET", body = null) {
    try {
      const options = {
        method,
        headers: {},
      };

      if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }

      // Используем новый метод authorizedFetch
      const data = await this.authorizedFetch(
        `${API_BASE_URL}${endpoint}`,
        options
      );

      if (data.sessionExpired) {
        window.location.href = "/auth";
      }

      return data;
    } catch (error) {
      console.error(`Error in exchange API request to ${endpoint}:`, error);
      return { success: false, message: error.message };
    }
  }
}

export default new AuthService();
