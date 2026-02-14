import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import EmptyFeed from "../components/EmptyFeed";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [trending, setTrending] = useState([]);
  const [trendingScope, setTrendingScope] = useState("global");
  const [introHidden, setIntroHidden] = useState(false);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        const [feedRes, connectionsRes] = await Promise.all([
          api.get("/posts/feed"),
          api.get("/users/connections")
        ]);
        setPosts(feedRes.data || []);
        setConnectionsCount(Array.isArray(connectionsRes.data) ? connectionsRes.data.length : 0);
      } catch (err) {
        console.error(
          "FEED FETCH ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  useEffect(() => {
    const hidden = localStorage.getItem("connectly_hide_intro") === "1";
    setIntroHidden(hidden);
  }, []);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const scope = connectionsCount > 0 ? "network" : "global";
        setTrendingScope(scope);
        const res = await api.get(`/posts/trending?scope=${scope}`);
        if (Array.isArray(res.data) && res.data.length) {
          setTrending(res.data);
          return;
        }
        if (scope === "network") {
          const fallback = await api.get("/posts/trending?scope=global");
          setTrending(fallback.data || []);
          setTrendingScope("global");
        }
      } catch (err) {
        console.error(
          "TRENDING FETCH ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
        setTrending([]);
      }
    };

    loadTrending();
  }, [connectionsCount]);

  const lowEngagement = useMemo(
    () => posts.length === 0 && connectionsCount === 0,
    [posts.length, connectionsCount]
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-gray-600 dark:text-gray-300">
        Loading your feed...
      </div>
    );
  }

  const handleUpdated = (updated) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updated._id ? updated : p))
    );
  };

  const handleDeleted = (id) => {
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
          👋 Welcome to Connectly{user?.username ? `, ${user.username}` : ""}
        </div>
        <div className="text-gray-600 dark:text-gray-300 mt-1">
          Let’s help you build meaningful connections
        </div>
      </div>

      {lowEngagement && !introHidden ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                New here? Here’s how Connectly works
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Connectly is a platform where you can connect with people, enjoy
                preferred content, and showcase your creativity and skills.
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("connectly_hide_intro", "1");
                setIntroHidden(true);
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            🔥 Trending
          </span>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {trendingScope === "network" ? "Your Network" : "Global"}
          </span>
        </div>
        {trending.length === 0 ? (
          <div className="text-gray-600 dark:text-gray-300">
            No trending posts yet. Be the first to post.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trending.map((post) => (
              <div
                key={post._id}
                className="min-w-[260px] max-w-[260px] bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {post?.author?.username || "Unknown"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {post?.author?.institution || "Member"}
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {post?.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {post?.content}
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex gap-3">
                  <span>👍 {post?.likes?.length || 0}</span>
                  <span>💬 {post?.comments?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!posts.length ? (
        <EmptyFeed />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
