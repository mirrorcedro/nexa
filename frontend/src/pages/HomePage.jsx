import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="container mx-auto flex items-center justify-center pt-16 px-4 h-full">
        <div className="bg-base-100 rounded-lg shadow-xl w-full h-[calc(100vh-5rem)] max-w-7xl">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <ChatContainer />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
