import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Compass, MessageCircle, Users, Settings, PlusCircle } from "lucide-react";
import api from "../utils/api";
import { BACKEND_URL } from "../utils/config";

const Sidebar = () => {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await api.get("/users/connections");
        setConnections(res.data);
      } catch (err) {
        console.error(
          "CONNECTIONS FETCH ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
      }
    };

    fetchConnections();

    const refreshOnFocus = () => fetchConnections();
    window.addEventListener("focus", refreshOnFocus);
    const intervalId = setInterval(fetchConnections, 15000);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      clearInterval(intervalId);
    };
  }, []);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium
     ${
       isActive
         ? "bg-[var(--primary-100)] text-[var(--primary-700)] dark:bg-[var(--primary-900)] dark:text-[var(--primary-200)]"
         : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
     }`;

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 min-h-[calc(100vh-80px)] p-4">
      <nav className="flex flex-col gap-2">
        <NavLink to="/explore" className={linkClass}>
          <Compass size={20} /> Explore
        </NavLink>

        <NavLink to="/messages" className={linkClass}>
          <MessageCircle size={20} /> Messages
        </NavLink>
        {connections.length ? (
          <div className="ml-4 space-y-2">
            {connections.map((u) => (
              <NavLink
                key={u._id}
                to={`/messages?user=${u._id}`}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-[var(--primary-700)] dark:hover:text-[var(--primary-200)]"
              >
                <img
                  src={u.profileImage ? `${BACKEND_URL}${u.profileImage}` : "/avatar.png"}
                  alt={u.username}
                  className="w-6 h-6 rounded-full"
                />
                <span className="truncate">{u.username}</span>
              </NavLink>
            ))}
          </div>
        ) : null}

        <NavLink to="/discover" className={linkClass}>
          <Users size={20} /> Discover
        </NavLink>

        <NavLink to="/create-post" className={linkClass}>
          <PlusCircle size={20} /> Create Post
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          <Settings size={20} /> Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
