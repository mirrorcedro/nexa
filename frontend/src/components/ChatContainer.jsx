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
  const [selectedMessageToForward, setSelectedMessageToForward] = useState(null);
  
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

  const handleMessageActions = (messageId) => {
    setMessageActions((prev) => ({
      id: messageId,
      show: prev.id === messageId ? !prev.show : true,
    }));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex items-start gap-3 ${message.senderId === authUser._id ? "justify-end" : "justify-start"}`}
            >
              <img
                src={
                  message.senderId === authUser._id
                    ? authUser.profilePic || "/avatar.png"
                    : selectedUser.profilePic || "/avatar.png"
                }
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="relative max-w-[75%] p-3 rounded-lg shadow-md text-white bg-blue-500">
                {message.text && <p>{message.text}</p>}
                {message.image && <img src={message.image} alt="Message attachment" className="max-w-full rounded-lg mt-2" />}
                {message.voiceNote && <VoiceNotePlayer audioUrl={message.voiceNote} />}
                <time className="block text-xs opacity-70 mt-1">{formatMessageTime(message.createdAt)}</time>
                <button
                  onClick={() => handleMessageActions(message._id)}
                  className="absolute top-2 right-2 text-white opacity-50 hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>
                {messageActions.id === message._id && messageActions.show && (
                  <div className="absolute top-full right-0 mt-1 w-32 bg-white shadow-lg rounded-lg overflow-hidden">
                    <button className="block w-full px-3 py-2 hover:bg-gray-100" onClick={() => setReplyingTo(message)}>
                      <Reply size={14} /> Reply
                    </button>
                    {message.senderId === authUser._id && (
                      <>
                        <button className="block w-full px-3 py-2 hover:bg-gray-100" onClick={() => setEditingMessage(message)}>
                          <Edit size={14} /> Edit
                        </button>
                        <button className="block w-full px-3 py-2 hover:bg-red-100 text-red-500" onClick={() => deleteMessage(message._id)}>
                          <Trash size={14} /> Delete
                        </button>
                      </>
                    )}
                    <button className="block w-full px-3 py-2 hover:bg-gray-100" onClick={() => setSelectedMessageToForward(message)}>
                      <Forward size={14} /> Forward
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
