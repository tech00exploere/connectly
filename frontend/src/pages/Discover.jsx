import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { BACKEND_URL } from "../utils/config";

const Discover = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/discover");
      setUsers(res.data);
    } catch (err) {
      console.error(
        "DISCOVER FETCH ERROR:",
        err.response?.status,
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for discovery + keep in sync
  useEffect(() => {
    fetchData();

    const refreshOnFocus = () => fetchData();
    window.addEventListener("focus", refreshOnFocus);

    const intervalId = setInterval(fetchData, 15000);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      clearInterval(intervalId);
    };
  }, []);

  // Send connection request
  const connect = async (id) => {
    try {
      await api.post(`/users/connect/${id}`);
      // update UI immediately
      setUsers(prev =>
        prev.map(u =>
          u._id === id ? { ...u, connectionStatus: "pending" } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to connect");
    }
  };

  // Render proper button based on connection status
  const renderButton = (u) => {
    switch (u.connectionStatus) {
      case "connected":
        return (
          <button
            disabled
            className="mt-2 px-3 py-1 rounded bg-gray-400 text-white cursor-not-allowed"
          >
            Connected
          </button>
        );
      case "pending":
        return (
          <button
            disabled
            className="mt-2 px-3 py-1 rounded bg-yellow-400 text-white cursor-not-allowed"
          >
            Requested
          </button>
        );
      case "received":
        return (
          <button
            onClick={() => navigate("/requests")}
            className="mt-2 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Requested You
          </button>
        );
      default:
        return (
          <button
            onClick={() => connect(u._id)}
            className="mt-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Connect
          </button>
        );
    }
  };

  if (loading) return <p className="text-center mt-10">Loading users...</p>;

  if (!users.length)
    return <p className="text-center mt-10">No users to connect with.</p>;

  return (
    <div className="grid grid-cols-3 gap-6">
      {users.map((u) => (
        <div key={u._id} className="bg-white dark:bg-gray-800 p-4 rounded shadow flex flex-col items-center text-gray-800 dark:text-gray-100">
          <img
            src={u.profileImage ? `${BACKEND_URL}${u.profileImage}` : "/avatar.png"}
            alt={u.username}
            className="w-16 h-16 rounded-full mb-2"
          />
          <h3 className="font-semibold">{u.username}</h3>
          {u.institution && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {u.institution}
            </p>
          )}
          {renderButton(u)}
        </div>
      ))}
    </div>
  );
};

export default Discover;
