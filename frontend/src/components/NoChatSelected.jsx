import { MessageCirclePlus } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import logo from '../assets/nexa.png';

const NoChatSelected = () => {
  const navigate = useNavigate(); // Get navigate function

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-1 sm:p-3 bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200">
      <div className="w-full max-w-xs text-center space-y-3">
        {/* Icon Display */}
        <div className="flex justify-center mb-1">
          <div className="relative group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse shadow-md border border-primary">
              <MessageCirclePlus className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white text-xs rounded-md px-2 py-1">
              Start a Chat
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-2 sm:gap-3 items-center">
          <div className="text-center">
            <img src={logo} width={100} alt="SpotVibe logo" className="mx-auto mb-2 sm:mb-3" />
          </div>

          <div className="w-full text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 mb-1">Welcome to nexa chat!</h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Explore music, events, and chat. There is something for everyone!
            </p>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Need help? Click the icon above to start chatting.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 justify-center">
            <button 
              className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/')}
            >
              Chat with Helpers
            </button>

            <button 
              className="w-full sm:w-auto px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/events')}
            >
              Explore Events
            </button>

            <button 
              className="w-full sm:w-auto px-3 py-1.5 bg-yellow-500 text-white text-xs sm:text-sm rounded-lg hover:bg-yellow-600 transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/products')}
            >
              Shop Products
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-4 max-w-lg mx-auto">
            <p className="text-xs sm:text-sm text-slate-500">
              Start chatting, explore events, or shop for products. Join the nexa community now!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
