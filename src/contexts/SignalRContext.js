import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectUser } from "../store/slices/authSlice";
import chatService from "../services/chat.service";

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const initializeSignalR = async () => {
      if (!isAuthenticated || !user || !user.id) {
        if (chatService.isConnected()) {
          await chatService.stopConnection();
        }
        if (mounted) {
          setIsConnected(false);
          setConnectionError(null);
        }
        return;
      }

      try {
        setConnectionError(null);

        // Начинаем соединение
        await chatService.startConnection();

        // Подключаем пользователя
        if (!chatService.isConnected()) {
          throw new Error("Connection failed");
        }

        await chatService.connectUser(user.id);

        if (mounted) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("SignalR initialization error:", error);
        if (mounted) {
          setConnectionError(
            error.message || "Failed to connect to chat server"
          );
          setIsConnected(false);
        }
      }
    };

    // Регистрируем обработчики событий состояния
    chatService.on("onReconnecting", () => {
      if (mounted) setIsConnected(false);
    });

    chatService.on("onReconnected", () => {
      if (mounted) {
        setIsConnected(true);

        // Повторно подключаем пользователя после переподключения
        if (user && user.id) {
          chatService.connectUser(user.id).catch((err) => {
            console.error("Failed to reconnect user:", err);
          });
        }
      }
    });

    chatService.on("onClose", () => {
      if (mounted) setIsConnected(false);
    });

    initializeSignalR();

    // Проверка соединения каждые 30 секунд
    const intervalId = setInterval(() => {
      if (isAuthenticated && user && !chatService.isConnected()) {
        initializeSignalR();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user]);

  const value = {
    isConnected,
    connectionError,
    chatService,
  };

  return (
    <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
  );
};

export const useSignalR = () => useContext(SignalRContext);

export default SignalRContext;
