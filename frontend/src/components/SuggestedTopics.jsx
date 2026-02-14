import { Link } from "react-router-dom";

const topics = [
  { key: "tech", title: "Tech", desc: "AI, software, and product updates" },
  { key: "entertainment", title: "Entertainment", desc: "Movies, music, and gaming" },
  { key: "culture", title: "Culture", desc: "Ideas, trends, and community" },
  { key: "skills", title: "Skills", desc: "Learning, mentoring, portfolios" },
  { key: "finance", title: "Finance", desc: "Markets and money tips" },
  { key: "health", title: "Health", desc: "Wellness and routines" }
];

const SuggestedTopics = () => {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
        Suggested topics
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topics.map((t) => (
          <Link
            key={t.key}
            to={`/explore/${t.key}`}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-emerald-300 hover:shadow-sm transition"
          >
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t.title}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t.desc}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SuggestedTopics;
