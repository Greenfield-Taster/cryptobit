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

        try {
          await chatService.authenticateUser({
            Id: user.id,
            Email: user.email,
            Name: user.name,
            Nickname: user.nickname,
            Role: user.role || "user",
          });
          console.log("User authenticated in chat system");
        } catch (authError) {
          console.warn("User authentication error:", authError);
        }

        await chatService.startConnection();

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

    chatService.on("onReconnecting", () => {
      if (mounted) setIsConnected(false);
    });

    chatService.on("onReconnected", () => {
      if (mounted) {
        setIsConnected(true);

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

    const intervalId = setInterval(() => {
      if (isAuthenticated && user && !chatService.isConnected()) {
        initializeSignalR();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);

      chatService.off("onReconnecting");
      chatService.off("onReconnected");
      chatService.off("onClose");
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
