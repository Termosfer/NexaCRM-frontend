import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  Briefcase,
  Settings,
  LogOut,
  Zap,
  Users,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const { logout, user } = useAuth();

  const menuItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/departments", icon: Building2, label: "Şöbələr" },
    { path: "/team", icon: Users, label: "Komanda" },
    { path: "/customers", icon: UserCircle, label: "Müştərilər" },
    { path: "/leads", icon: Briefcase, label: "Satışlar" },
    { path: "/settings", icon: Settings, label: "Ayarlar" },
  ];

  return (
    <aside className="w-72 bg-[#0f172a] text-white flex flex-col h-full shadow-2xl z-20">
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-10">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Zap size={24} fill="white" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic">
            NexaCRM
          </span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`
              }
            >
              <item.icon
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-bold text-sm tracking-wide">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-slate-800/50">
        <div className="flex items-center space-x-3 mb-6">
          <div className="size-10 bg-slate-700 rounded-full flex items-center justify-center font-black text-indigo-400">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-white truncate">
              {user?.companyName || "Nexa User"}
            </p>
            <p className="text-[10px] font-bold text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 text-rose-400 hover:text-rose-300 font-black text-xs uppercase tracking-widest transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Sistemdən Çıx</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
