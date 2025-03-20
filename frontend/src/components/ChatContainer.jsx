import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import VoiceNotePlayer from "./VoiceNotePlayer";
import { formatMessageTime } from "../lib/utils";
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
    users,
    getUsers,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [messageActions, setMessageActions] = useState({ id: null, show: false });
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessageToForward, setSelectedMessageToForward] = useState(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      const unsubscribe = subscribeToMessages();
      return () => {
        unsubscribeFromMessages();
        unsubscribe?.();
      };
    }
  }, [selectedUser?._id]);

  useEffect(() => {
    if (forwardModalOpen) getUsers();
  }, [forwardModalOpen]);

  const handleMessageRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const toggleMessageActions = (messageId) => {
    setMessageActions((prev) => ({ id: messageId, show: prev.id === messageId ? !prev.show : true }));
  };

  const handleForwardMessage = (message) => {
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
    } catch {
      toast.error("Failed to forward message");
    }
  };

  const sortedMessages = messages
    .filter((msg) => !showUnreadOnly || !msg.isRead)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="p-4 border-b flex items-center gap-2">
        <input
          type="checkbox"
          checked={showUnreadOnly}
          onChange={(e) => setShowUnreadOnly(e.target.checked)}
          className="checkbox checkbox-sm"
        />
        <span className="text-sm">Show unread messages only</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : (
          sortedMessages.map((message) => (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              onMouseEnter={() => !message.isRead && message.senderId !== authUser._id && handleMessageRead(message._id)}
            >
              <div className="chat-image avatar w-8 h-8 rounded-full overflow-hidden">
                <img src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="chat-header mb-1 flex flex-col gap-1">
                {message.isForwarded && <span className="text-xs opacity-50">Forwarded</span>}
                {message.replyTo && <div className="bg-gray-200 p-2 rounded-lg text-sm">Replying to: {message.replyTo.text}</div>}
                <time className="text-xs opacity-50">{formatMessageTime(message.createdAt)}</time>
              </div>
              <div className="chat-bubble relative group p-3 rounded-lg shadow-md bg-gray-100">
                {message.text && <span>{message.text} {message.isEdited && <span className="text-xs opacity-50 ml-2">(edited)</span>}</span>}
                {message.image && <img src={message.image} alt="attachment" className="max-w-[300px] rounded-lg" />}
                {message.voiceNote && <VoiceNotePlayer audioUrl={message.voiceNote} />}
                {message.file && (
                  <a href={message.file.url} download className="btn btn-sm btn-primary">Download {message.file.name}</a>
                )}
                <button onClick={() => toggleMessageActions(message._id)} className="absolute top-1/2 -right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {messageActions.id === message._id && messageActions.show && (
                  <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg p-2 flex flex-col">
                    <button onClick={() => { setReplyingTo(message); setMessageActions({ id: null, show: false }); }} className="flex items-center gap-2 p-2 hover:bg-gray-100">
                      <Reply className="w-4 h-4" /> Reply
                    </button>
                    {message.senderId === authUser._id && (
                      <>
                        <button onClick={() => { setEditingMessage(message); setMessageActions({ id: null, show: false }); }} className="flex items-center gap-2 p-2 hover:bg-gray-100">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => deleteMessage(message._id)} className="flex items-center gap-2 p-2 text-red-500 hover:bg-gray-100">
                          <Trash className="w-4 h-4" /> Delete
                        </button>
                      </>
                    )}
                    <button onClick={() => handleForwardMessage(message)} className="flex items-center gap-2 p-2 hover:bg-gray-100">
                      <Forward className="w-4 h-4" /> Forward
                    </button>
                  </div>
                )}
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
