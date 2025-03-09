import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  if (!selectedUser) return null;

  return (
    <div className="bg-base-100 border-b border-base-300 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between p-4 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="size-14 rounded-full ring-2 ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
              <img 
                src={selectedUser?.profilePic || "/avatar.png"} 
                alt={selectedUser?.fullName || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            {selectedUser?._id && onlineUsers.includes(selectedUser._id) && (
              <span className="absolute bottom-0 right-0 size-4 bg-green-500 rounded-full ring-2 ring-base-100" />
            )}
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-lg lg:text-xl">{selectedUser?.fullName}</h3>
            <p className="text-sm lg:text-base text-base-content/70">
              {selectedUser?._id && onlineUsers.includes(selectedUser._id) ? "Active now" : "Offline"}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setSelectedUser(null)}
          className="btn btn-ghost btn-circle hover:bg-base-200"
        >
          <X className="size-6" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
