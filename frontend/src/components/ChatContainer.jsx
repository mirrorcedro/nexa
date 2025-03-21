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
  const [messageActions, setMessageActions] = useState({ id: null, show: false });
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden max-w-full sm:max-w-[600px] mx-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isMessagesLoading ? (
          <MessageSkeleton />
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex items-end ${message.senderId === authUser._id ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%] md:max-w-[75%] p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                {message.text && <p className="text-sm">{message.text}</p>}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="w-full h-auto max-w-xs rounded-lg object-cover"
                  />
                )}
                {message.voiceNote && <VoiceNotePlayer audioUrl={message.voiceNote} />}
              </div>
              <button
                className="ml-2 p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 sm:hidden"
                onClick={() => setMessageActions({ id: message._id, show: true })}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
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
