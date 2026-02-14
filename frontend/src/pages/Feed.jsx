import { useEffect, useState } from "react";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import api from "../utils/api";

const Feed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/posts");
        setPosts(res.data);
      } catch (err) {
        console.error(
          "POSTS FETCH ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
      }
    };

    load();
  }, []);

  const handleCreated = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Left Sidebar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hidden md:block">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Profile</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Frontend Developer</p>
      </div>

      {/* Feed */}
      <div className="md:col-span-2 space-y-4">
        <CreatePost onCreated={handleCreated} />
        {posts.length === 0 ? (
          <div className="bg-white p-4 rounded shadow text-gray-600">
            No posts yet.
          </div>
        ) : (
          posts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default Feed;
