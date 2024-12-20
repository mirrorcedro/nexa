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
  unreadMessages: {}, // Object to track unread messages for each user

  // Fetch users and initialize unread messages state
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      const users = res.data;

      // Initialize unread messages count for each user
      const unreadMessages = users.reduce((acc, user) => {
        acc[user._id] = user.unreadCount || false; // Assume API provides unread count or flag
        return acc;
      }, {});

      set({ users, unreadMessages });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // Fetch messages and reset unread count for selected user
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({
        messages: res.data,
        unreadMessages: {
          ...get().unreadMessages,
          [userId]: false, // Reset unread status for the selected user
        },
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Send a message
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Subscribe to new messages via socket
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, unreadMessages } = get();

      // If the new message is from the selected user, add it to the messages array
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({ messages: [...messages, newMessage] });
      } else {
        // Otherwise, mark the sender as having unread messages
        set({
          unreadMessages: {
            ...unreadMessages,
            [newMessage.senderId]: true,
          },
        });
      }
    });
  },

  // Unsubscribe from messages
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  // Set the selected user
  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      // Reset unread messages when selecting a user
      set({
        unreadMessages: {
          ...get().unreadMessages,
          [selectedUser._id]: false,
        },
      });
    }
  },
}));
