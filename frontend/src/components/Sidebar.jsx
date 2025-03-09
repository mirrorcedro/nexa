import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Menu } from "lucide-react"; // Added Menu icon for the toggle button

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, unreadMessages } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when user selects a contact on mobile
  useEffect(() => {
    if (selectedUser && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [selectedUser]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Filter users based on online status, search query, or show all users
  // Sort and filter users
  // Updated sorting logic
  const sortedAndFilteredUsers = users
    .filter((user) => {
      const fullName = user.fullName || "";
      const username = user.username || "";
      const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && (showOnlineOnly ? onlineUsers.includes(user._id) : true);
    })
    .sort((a, b) => {
      // First priority: last message timestamp
      const aLastMessage = a.lastMessage?.createdAt || 0;
      const bLastMessage = b.lastMessage?.createdAt || 0;
      const timeComparison = new Date(bLastMessage) - new Date(aLastMessage);
      
      // If timestamps are different, use them for sorting
      if (timeComparison !== 0) return timeComparison;
      
      // Second priority: unread messages
      if (unreadMessages[a._id] && !unreadMessages[b._id]) return -1;
      if (!unreadMessages[a._id] && unreadMessages[b._id]) return 1;
      
      // Third priority: online status
      if (onlineUsers.includes(a._id) && !onlineUsers.includes(b._id)) return -1;
      if (!onlineUsers.includes(a._id) && onlineUsers.includes(b._id)) return 1;
      
      return 0;
    });

  // Handle loading state
  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      {/* Improved toggle button */}
      <button
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-focus transition-all"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Enhanced sidebar with smooth transitions */}
      <aside
        id="sidebar"
        className={`fixed lg:relative h-[calc(100vh-5rem)] w-72 bg-base-100 border-r border-base-300 
        flex flex-col transition-all duration-300 ease-in-out z-40
        ${isSidebarOpen ? "left-0" : "-left-72 lg:left-0"}`}
      >
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium">Contacts</span> {/* Always visible on all screen sizes */}
          </div>

          {/* Online filter toggle */}
          <div className="mt-3 flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length} online)</span>
          </div>

          {/* Search input */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 rounded-lg border border-base-300 text-sm"
            />
          </div>
        </div>

        <div className="overflow-y-auto w-full py-3">
          {sortedAndFilteredUsers.length > 0 ? (
            sortedAndFilteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors relative
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt={user.name}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100" />
                  )}
                </div>

                <div className="text-left min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    {user.fullName}
                    {unreadMessages[user._id] && (
                      <span className="inline-flex items-center justify-center size-5 text-xs font-medium bg-primary text-primary-content rounded-full animate-pulse">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-400 flex items-center gap-2">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    {user.lastMessage && (
                      <span className="text-xs opacity-60">
                        • {new Date(user.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-zinc-500 py-4">
              {showOnlineOnly ? "No online users" : "No users found"}
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
