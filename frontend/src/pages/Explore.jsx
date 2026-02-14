const categories = [
  {
    key: "tech",
    title: "Tech",
    subtitle: "New tools, builds, and product drops",
    items: ["AI tooling", "Frontend tips", "OSS releases"]
  },
  {
    key: "entertainment",
    title: "Entertainment",
    subtitle: "Movies, music, gaming, and creators",
    items: ["New trailers", "Top charts", "Creator highlights"]
  },
  {
    key: "culture",
    title: "Culture",
    subtitle: "Ideas, trends, and community moments",
    items: ["Trending topics", "Local stories", "Opinion threads"]
  },
  {
    key: "skills",
    title: "Skills",
    subtitle: "Learn, teach, and show your craft",
    items: ["Quick lessons", "Portfolios", "Mentor offers"]
  },
  {
    key: "finance",
    title: "Finance",
    subtitle: "Markets, side hustles, and money tips",
    items: ["Personal finance", "Market notes", "Startup funding"]
  },
  {
    key: "health",
    title: "Health",
    subtitle: "Wellness, routines, and performance",
    items: ["Fitness plans", "Mental health", "Nutrition basics"]
  }
];

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import api from "../utils/api";

const Explore = () => {
  const { category } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/posts?category=${category}`);
        setPosts(res.data);
      } catch (err) {
        console.error(
          "CATEGORY POSTS ERROR:",
          err.response?.status,
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  return (
    <div className="rounded-xl p-6 bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
        <p className="text-gray-600">
          Choose a feed to focus your timeline by topic.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div
            key={c.key}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {c.title}
                </h2>
                <p className="text-sm text-gray-600">{c.subtitle}</p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Feed
              </span>
            </div>

            <div className="mt-4 flex-1">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                What you will see
              </div>
              <div className="mt-2 space-y-2">
                {c.items.map((item) => (
                  <div
                    key={item}
                    className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <Link
              to={`/explore/${c.key}`}
              className="mt-4 w-full text-center bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
            >
              View {c.title} Feed
            </Link>
          </div>
        ))}
      </div>

      {category ? (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {category} Feed
            </h2>
            <Link
              to="/explore"
              className="text-sm text-emerald-700 hover:text-emerald-800"
            >
              Back to all categories
            </Link>
          </div>

          {loading ? (
            <div className="bg-white p-4 rounded shadow text-gray-600">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white p-4 rounded shadow text-gray-600">
              No posts in this category yet.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Explore;
