import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import VoiceNotePlayer from "./VoiceNotePlayer";
import { MoreVertical, Reply, Edit, Trash, Forward } from "lucide-react";
import { Search } from "lucide-react";
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

  const filteredUsers = users.filter(user => 
    user._id !== authUser._id && 
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="p-4 border-b">
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
              <div className="chat-image avatar">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                {message.isForwarded && (
                  <span className="text-xs opacity-50 block">Forwarded</span>
                )}
                {message.replyTo && (
                  <div className="bg-base-200 p-2 rounded-lg mb-2 text-sm opacity-75">
                    <span className="block text-xs">Replying to:</span>
                    {message.replyTo.text}
                  </div>
                )}
                <time className="text-xs opacity-50">{formatMessageTime(message.createdAt)}</time>
              </div>

              <div className="chat-bubble relative group">
                {message.text && (
                  <>
                    {message.text}
                    {message.isEdited && (
                      <span className="text-xs opacity-50 ml-2">(edited)</span>
                    )}
                  </>
                )}

                {message.image && (
                  <div className="mb-2 rounded-lg overflow-hidden">
                    <img
                      src={message.image}
                      alt="Message attachment"
                      className="max-w-[300px] max-h-[300px] object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                {message.voiceNote && (
                  <div className="min-w-[240px] max-w-[320px]">
                    <VoiceNotePlayer audioUrl={message.voiceNote} />
                  </div>
                )}

                {message.file && (
                  <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium truncate">{message.file.name}</p>
                      <p className="text-xs opacity-70">{message.file.size}</p>
                    </div>
                    <a
                      href={message.file.url}
                      download
                      className="btn btn-sm btn-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </div>
                )}

                {/* Remove the duplicate voice note player here */}
                
                {/* Message Actions Button and Menu */}
                <div className={`
                  absolute ${message.senderId === authUser._id ? '-left-12' : '-right-12'}
                  top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                  transition-all duration-200 ease-in-out z-10
                  sm:block hidden
                `}>
                  <button
                    onClick={() => handleMessageActions(message._id)}
                    className="btn btn-circle btn-sm bg-base-200 hover:bg-base-300 shadow-md"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Message Actions Button */}
                <div className="sm:hidden absolute -bottom-8 right-0 z-10">
                  <button
                    onClick={() => handleMessageActions(message._id)}
                    className="btn btn-circle btn-xs bg-base-200 hover:bg-base-300 shadow-md"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>

                {/* Enhanced Message Actions Menu */}
                {messageActions.id === message._id && messageActions.show && (
                  <div className={`
                    fixed sm:absolute ${message.senderId === authUser._id 
                      ? 'sm:left-10 left-1/2 -translate-x-1/2 sm:translate-x-0' 
                      : 'sm:right-10 left-1/2 -translate-x-1/2 sm:translate-x-0'
                    }
                    sm:top-0 bottom-16 sm:bottom-auto
                    w-64 sm:w-52 bg-base-100 rounded-xl shadow-xl
                    border border-base-300 backdrop-blur-lg bg-opacity-95
                    z-50 py-1 animate-in fade-in slide-in-from-bottom-5
                    duration-200
                  `}>
                    <button
                      onClick={() => {
                        setReplyingTo(message);
                        setMessageActions({ id: null, show: false });
                      }}
                      className="flex items-center gap-3 w-full p-3 hover:bg-base-200 transition-colors"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
            
                    {message.senderId === authUser._id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessage(message);
                            setMessageActions({ id: null, show: false });
                          }}
                          className="flex items-center gap-3 w-full p-3 hover:bg-base-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            deleteMessage(message._id);
                            setMessageActions({ id: null, show: false });
                          }}
                          className="flex items-center gap-3 w-full p-3 hover:bg-base-200 transition-colors text-error"
                        >
                          <Trash className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
            
                    <button
                      onClick={() => handleForwardMessage(message)}
                      className="flex items-center gap-3 w-full p-3 hover:bg-base-200 transition-colors"
                    >
                      <Forward className="w-4 h-4" />
                      <span>Forward</span>
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
