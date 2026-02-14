import { Link } from "react-router-dom";
import SuggestedTopics from "./SuggestedTopics";

const EmptyFeed = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Your feed is empty — let’s fix that
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Connectly shows posts from people you follow and topics you care
            about. Start by creating your first post or discovering new people.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/create-post"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Create Post
            </Link>
            <Link
              to="/discover"
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
            >
              Discover People
            </Link>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-emerald-900 dark:text-emerald-100">
          <div className="text-sm font-semibold">Quick tip</div>
          <div className="text-sm mt-1">
            Use a clear title to auto‑categorize your post and reach the right
            audience.
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SuggestedTopics />
      </div>
    </div>
  );
};

export default EmptyFeed;
