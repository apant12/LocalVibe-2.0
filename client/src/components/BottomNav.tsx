import { useLocation } from "wouter";

interface BottomNavProps {
  activeTab?: string;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    { id: "home", path: "/", icon: "fas fa-home", label: "Home" },
    { id: "explore", path: "/explore", icon: "fas fa-compass", label: "Explore" },
    { id: "bookings", path: "/bookings", icon: "fas fa-ticket-alt", label: "Bookings" },
    { id: "rewards", path: "/rewards", icon: "fas fa-award", label: "Rewards" },
    { id: "profile", path: "/profile", icon: "fas fa-user", label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-effect border-t border-gray-800 z-40">
      <div className="flex justify-around items-center py-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className="flex flex-col items-center space-y-1 cursor-pointer group"
            >
              <i className={`${item.icon} text-xl transition-colors ${
                isActive 
                  ? "text-primary" 
                  : "text-gray-400 group-hover:text-white"
              }`}></i>
              <span className={`text-xs font-semibold transition-colors ${
                isActive 
                  ? "text-primary" 
                  : "text-gray-400 group-hover:text-white"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
