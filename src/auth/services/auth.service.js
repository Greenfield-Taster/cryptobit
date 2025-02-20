const API_URL =
  "https://cryptobit-telegram-bot-hxa2gdhufnhtfbfs.germanywestcentral-01.azurewebsites.net/api/auth";

class AuthService {
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
      const token = this.getToken();
      if (!token) {
        return { success: false, message: "Not authenticated" };
      }

      const userId = this.getCurrentUser()?.id;
      if (!userId) {
        return { success: false, message: "User ID not found" };
      }

      const response = await fetch(`${API_URL}/user/${userId}/orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Orders API response:", data);
      return data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      return { success: false, message: error.message };
    }
  }
}

export default new AuthService();
