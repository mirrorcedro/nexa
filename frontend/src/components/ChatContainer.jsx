import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import VoiceNotePlayer from "./VoiceNotePlayer";
import { MoreVertical, Reply, Edit, Trash, Forward } from "lucide-react";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessageAsRead,
    deleteMessage,
    setReplyingTo,
    setEditingMessage,
    forwardMessage,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [messageActions, setMessageActions] = useState({ id: null, show: false });
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageToForward, setSelectedMessageToForward] = useState(null);
  const { users, getUsers } = useChatStore();

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      const unsubscribe = subscribeToMessages();
      return () => {
        unsubscribeFromMessages();
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedUser?._id]);

  useEffect(() => {
    if (forwardModalOpen) {
      getUsers();
    }
  }, [forwardModalOpen, getUsers]);

  const handleMessageRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleMessageActions = (messageId) => {
    setMessageActions(prev => ({
      id: messageId,
      show: prev.id === messageId ? !prev.show : true
    }));
  };

  const handleForwardMessage = async (message) => {
    setSelectedMessageToForward(message);
    setForwardModalOpen(true);
    setMessageActions({ id: null, show: false });
  };

  const handleForwardToUser = async (userId) => {
    try {
      await forwardMessage(selectedMessageToForward._id, userId);
      toast.success("Message forwarded successfully");
      setForwardModalOpen(false);
      setSelectedMessageToForward(null);
      setSearchQuery("");
    } catch (error) {
      toast.error("Failed to forward message");
    }
  };

  const sortedMessages = messages
    .filter(message => !showUnreadOnly || !message.isRead)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex-1 flex flex-col overflow-auto max-w-4xl mx-auto w-full">
      <ChatHeader />
      <div className="p-4 border-b flex justify-between items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span className="text-sm">Show unread messages only</span>
        </label>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : (
          sortedMessages.map((message) => (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              onMouseEnter={() => {
                if (!message.isRead && message.senderId !== authUser._id) {
                  handleMessageRead(message._id);
                }
              }}
            >
              <div className="chat-image avatar w-10 h-10">
                <img
                  src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="chat-header flex justify-between w-full">
                <time className="text-xs opacity-50">{formatMessageTime(message.createdAt)}</time>
                <button onClick={() => handleMessageActions(message._id)} className="btn btn-xs">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="chat-bubble relative w-auto max-w-[80%] lg:max-w-[50%]">
                {message.text}
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
