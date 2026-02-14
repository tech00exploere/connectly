import { useEffect, useState } from "react";
import api from "../utils/api";

const Requests = () => {
  const [reqs, setReqs] = useState([]);

  useEffect(() => {
    api.get("/users/requests").then((res) => setReqs(res.data));
  }, []);

  const accept = async (id) => {
    await api.post(`/users/accept/${id}`);
    setReqs((p) => p.filter((r) => r._id !== id));
  };

  const reject = async (id) => {
    await api.post(`/users/reject/${id}`);
    setReqs((p) => p.filter((r) => r._id !== id));
  };

  return (
    <div className="text-gray-800 dark:text-gray-100">
      {reqs.map((u) => (
        <div key={u._id} className="flex justify-between bg-white dark:bg-gray-800 p-4 mb-2 rounded">
          <span>{u.username}</span>
          <div className="space-x-2">
            <button
              onClick={() => accept(u._id)}
              className="px-3 py-1 rounded bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)]"
            >
              Accept
            </button>
            <button
              onClick={() => reject(u._id)}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Requests;
