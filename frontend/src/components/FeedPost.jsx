import { BACKEND_URL } from "../utils/config";

const FeedPost = ({ post }) => {
  const author = post?.author;
  const mediaSrc = post?.mediaUrl
    ? post.mediaUrl.startsWith("http")
      ? post.mediaUrl
      : `${BACKEND_URL}${post.mediaUrl}`
    : "";

  return (
    <article className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          src={author?.image ? `${BACKEND_URL}${author.image}` : "/avatar.png"}
          alt={author?.username || "User"}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {author?.username || "Unknown"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {author?.institution || "Member"}
          </div>
        </div>
        <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
          {post?.category || "general"}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {post?.title}
      </h3>
      <p className="mt-2 text-gray-700 dark:text-gray-200">{post?.content}</p>

      {post?.mediaType && post.mediaType !== "none" && mediaSrc ? (
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          {post.mediaType === "image" ? (
            <img
              src={mediaSrc}
              alt={post?.title || "Post media"}
              style={{ width: "100%", aspectRatio: "9 / 16", objectFit: "cover" }}
            />
          ) : (
            <video
              src={mediaSrc}
              controls
              style={{ width: "100%", aspectRatio: "9 / 16", objectFit: "cover" }}
            />
          )}
        </div>
      ) : null}
    </article>
  );
};

export default FeedPost;
