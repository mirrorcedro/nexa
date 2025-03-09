import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const users = res.data;

      const unreadMessages = users.reduce((acc, user) => {
        acc[user._id] = user.unreadCount || false;
        return acc;
      }, {});

      set({ users, unreadMessages });
      return users;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch users";
      toast.error(errorMessage);
      throw error;
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    if (!userId) {
      toast.error("Invalid user ID");
      return;
    }

    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({
        messages: res.data,
        unreadMessages: {
          ...get().unreadMessages,
          [userId]: false,
        },
      });
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to fetch messages";
      toast.error(errorMessage);
      throw error;
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser?._id || !messageData) {
      toast.error("Invalid message data or no user selected");
      return;
    }

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      return res.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send message";
      toast.error(errorMessage);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket?.connected) {
      console.error("Socket not connected");
      return;
    }

    const handleNewMessage = (newMessage) => {
      if (!newMessage?.senderId) return;

      const { selectedUser, messages, unreadMessages } = get();
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
      } else {
        set({
          unreadMessages: {
            ...unreadMessages,
            [newMessage.senderId]: true,
          },
        });
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket?.connected) {
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser?._id) {
      set({
        unreadMessages: {
          ...get().unreadMessages,
          [selectedUser._id]: false,
        },
      });
    }
  },

  markMessageAsRead: async (messageId) => {
    if (!messageId) {
      console.error("Invalid message ID");
      return;
    }

    try {
      const res = await axiosInstance.put(`/messages/read/${messageId}`);
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId ? { ...message, isRead: true } : message
        ),
      }));
      return res.data;
    } catch (error) {
      console.error("Error marking message as read:", error);
      const errorMessage = error.response?.data?.message || "Failed to mark message as read";
      toast.error(errorMessage);
      throw error;
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting message");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
        editingMessage: null,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Error editing message");
    }
  },

  forwardMessage: async (messageId, receiverId) => {
    try {
      const res = await axiosInstance.post(`/messages/forward/${messageId}/${receiverId}`);
      if (receiverId === get().selectedUser?._id) {
        set((state) => ({
          messages: [...state.messages, res.data],
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error forwarding message");
    }
  },

  setReplyingTo: (message) => set({ replyingTo: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),
}));



