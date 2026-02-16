import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../utils/config";

const PostCard = ({ post, onUpdated, onDeleted }) => {
  const { user } = useAuth();
  const author = post?.author;
  const mediaSrc = post?.mediaUrl
    ? post.mediaUrl.startsWith("http")
      ? post.mediaUrl
      : `${BACKEND_URL}${post.mediaUrl}`
    : "";
  const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post?.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(post?.title || "");
  const [draftContent, setDraftContent] = useState(post?.content || "");
  const [deleted, setDeleted] = useState(false);

  const isOwner = user?._id && author?._id && user._id === author._id;

  const toggleLike = async () => {
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to like post");
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${post._id}/comment`, {
        text: commentText
      });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
      setShowComments(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  const saveEdit = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;
    try {
      const res = await api.put(`/posts/${post._id}`, {
        title: draftTitle,
        content: draftContent
      });
      setEditing(false);
      if (onUpdated) onUpdated(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update post");
    }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      if (onDeleted) onDeleted(post._id);
      else setDeleted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post");
    }
  };

  if (deleted) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-100">
            {author?.username || "Unknown"}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {author?.institution || "Member"}
          </p>
        </div>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
          {post?.category || "general"}
        </span>
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <input
            id={`edit-title-${post._id}`}
            name={`edit-title-${post._id}`}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          />
          <textarea
            id={`edit-content-${post._id}`}
            name={`edit-content-${post._id}`}
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="bg-emerald-600 text-white px-3 py-1 rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="mt-3 font-semibold text-gray-800 dark:text-gray-100">
            {post?.title}
          </h3>
          <p className="text-gray-700 dark:text-gray-200 mt-1">
            {post?.content}
          </p>
        </>
      )}

      {post?.mediaType && post.mediaType !== "none" && mediaSrc ? (
        <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
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

      <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
        <button onClick={toggleLike}>
          {liked ? "Liked" : "Like"} ({likesCount})
        </button>
        <button onClick={() => setShowComments((v) => !v)}>
          Comment ({comments.length})
        </button>
        {isOwner ? (
          <>
            <button onClick={() => setEditing((v) => !v)}>
              {editing ? "Editing" : "Edit"}
            </button>
            <button onClick={deletePost}>Delete</button>
          </>
        ) : null}
      </div>

      {showComments ? (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="space-y-2">
            {comments.map((c) => (
              <div key={c._id || c.createdAt} className="text-sm">
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {c.user?.username || "User"}:
                </span>{" "}
                <span className="text-gray-700 dark:text-gray-200">{c.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <input
              id={`comment-${post._id}`}
              name={`comment-${post._id}`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded px-3 py-1 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            />
            <button
              onClick={addComment}
              className="bg-emerald-600 text-white px-3 rounded text-sm"
            >
              Post
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PostCard;
