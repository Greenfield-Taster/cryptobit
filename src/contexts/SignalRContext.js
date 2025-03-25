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

        registerMessageStatusHandlers();
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

    const registerMessageStatusHandlers = () => {
      chatService.on("MessageStatusUpdated", (messageId, status, userId) => {});

      chatService.on(
        "MessagesStatusUpdated",
        (roomId, messageIds, status, userId) => {}
      );

      chatService.on("MessagesRead", (roomId, messageIds, userId) => {});
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
            if (mounted) {
              setIsConnected(false);
              setConnectionError("Failed to reconnect user");
            }
          });
        }
      }
    });

    chatService.on("onClose", (error) => {
      if (mounted) {
        setIsConnected(false);
        if (error) {
          console.error("Connection closed with error:", error);
          setConnectionError(
            "Connection closed: " + (error.message || "Unknown error")
          );
        }
      }
    });

    chatService.on("Error", (error) => {
      console.error("SignalR Error:", error);
      if (mounted) {
        setConnectionError("SignalR Error: " + error);
      }
    });

    initializeSignalR();

    const intervalId = setInterval(() => {
      if (isAuthenticated && user && user.id && !chatService.isConnected()) {
        console.log("Connection check: reconnecting...");
        initializeSignalR();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);

      chatService.off("onReconnecting");
      chatService.off("onReconnected");
      chatService.off("onClose");
      chatService.off("Error");
      chatService.off("MessageStatusUpdated");
      chatService.off("MessagesStatusUpdated");
      chatService.off("MessagesRead");
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
