import express from "express";
import auth from "../middleware/auth.js";
import mediaUpload from "../middleware/mediaUpload.js";
import Post from "../models/Post.js";
import Connection from "../models/Connection.js";

const router = express.Router();

const CATEGORIES = [
  "tech",
  "entertainment",
  "culture",
  "skills",
  "finance",
  "health",
  "general"
];

const CATEGORY_KEYWORDS = [
  {
    category: "tech",
    keywords: [
      "tech",
      "ai",
      "software",
      "coding",
      "developer",
      "programming",
      "app",
      "startup",
      "cloud",
      "devops"
    ]
  },
  {
    category: "entertainment",
    keywords: [
      "movie",
      "music",
      "song",
      "album",
      "game",
      "gaming",
      "series",
      "film",
      "tv",
      "show",
      "concert",
      "trailer"
    ]
  },
  {
    category: "culture",
    keywords: [
      "culture",
      "society",
      "community",
      "tradition",
      "art",
      "design",
      "history"
    ]
  },
  {
    category: "skills",
    keywords: [
      "skill",
      "learn",
      "learning",
      "course",
      "tutorial",
      "mentor",
      "mentorship",
      "practice",
      "portfolio",
      "resume"
    ]
  },
  {
    category: "finance",
    keywords: [
      "finance",
      "money",
      "invest",
      "stock",
      "stocks",
      "market",
      "crypto",
      "budget",
      "saving",
      "funding",
      "revenue",
      "profit"
    ]
  },
  {
    category: "health",
    keywords: [
      "health",
      "fitness",
      "workout",
      "gym",
      "mental",
      "nutrition",
      "diet",
      "wellness",
      "sleep"
    ]
  }
];

const inferCategory = (title) => {
  const lower = (title || "").toLowerCase();
  for (const group of CATEGORY_KEYWORDS) {
    if (group.keywords.some((k) => lower.includes(k))) {
      return group.category;
    }
  }
  return "general";
};

const scorePost = (post) => {
  const likes = Array.isArray(post.likes) ? post.likes.length : 0;
  const comments = Array.isArray(post.comments) ? post.comments.length : 0;
  const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
  const ageHours = Math.max(
    1,
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
  );
  const recency = 24 / ageHours;
  return likes * 2 + comments * 3 + recency;
};

/* CREATE POST */
router.post("/", auth, mediaUpload.single("media"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const category = inferCategory(title);
    let mediaUrl = "";
    let mediaType = "none";

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;
      mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    }

    const post = await Post.create({
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      category,
      mediaUrl,
      mediaType
    });

    const populated = await post.populate("author", "username image institution");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

/* LIST POSTS */
router.get("/", auth, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};

    if (category && category !== "all") {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .populate("author", "username image institution")
      .populate("comments.user", "username image institution")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

/* FEED */
router.get("/feed", auth, async (_req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author", "username image institution")
      .populate("comments.user", "username image institution")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch feed" });
  }
});

/* TRENDING (GLOBAL OR NETWORK) */
router.get("/trending", auth, async (req, res) => {
  try {
    const scope = req.query.scope === "network" ? "network" : "global";
    let authorFilter = {};

    if (scope === "network") {
      const me = req.user._id;
      const connections = await Connection.find({
        status: "connected",
        $or: [{ requester: me }, { recipient: me }]
      }).select("requester recipient");

      const ids = connections.map((c) =>
        c.requester.equals(me) ? c.recipient : c.requester
      );

      if (!ids.length) {
        return res.json([]);
      }
      authorFilter = { author: { $in: ids } };
    }

    const recent = await Post.find(authorFilter)
      .populate("author", "username image institution")
      .populate("comments.user", "username image institution")
      .sort({ createdAt: -1 })
      .limit(200);

    const scored = recent
      .map((p) => ({ post: p, score: scorePost(p) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((p) => p.post);

    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch trending posts" });
  }
});

/* TOGGLE LIKE */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const idx = post.likes.findIndex((id) => id.equals(userId));
    let liked = false;
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(userId);
      liked = true;
    }
    await post.save();
    res.json({ liked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to like post" });
  }
});

/* ADD COMMENT */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user._id, text: text.trim() });
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("comments.user", "username image institution")
      .select("comments");

    const newComment = populated.comments[populated.comments.length - 1];
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: "Failed to add comment" });
  }
});

/* UPDATE POST (AUTHOR ONLY) */
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    post.title = title.trim();
    post.content = content.trim();
    post.category = inferCategory(title);
    await post.save();

    const populated = await post.populate("author", "username image institution");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update post" });
  }
});

/* DELETE POST (AUTHOR ONLY) */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete post" });
  }
});

export default router;
