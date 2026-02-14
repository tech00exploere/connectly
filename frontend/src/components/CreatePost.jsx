import { useEffect, useRef, useState } from "react";
import api from "../utils/api";

const CreatePost = ({ onCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState("none");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const imageRef = useRef(null);
  const baseCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);

  const CANVAS_W = 360;
  const CANVAS_H = 640;

  const submit = async () => {
    if (!title.trim() || !content.trim() || loading) return;
    try {
      setLoading(true);
      const form = new FormData();
      form.append("title", title);
      form.append("content", content);

      if (mediaType === "image" && baseCanvasRef.current) {
        const blob = await new Promise((resolve) => {
          const out = document.createElement("canvas");
          out.width = CANVAS_W;
          out.height = CANVAS_H;
          const ctx = out.getContext("2d");
          ctx.drawImage(baseCanvasRef.current, 0, 0);
          if (drawCanvasRef.current) ctx.drawImage(drawCanvasRef.current, 0, 0);
          out.toBlob(resolve, "image/png", 0.92);
        });
        if (blob) {
          form.append("media", new File([blob], "post.png", { type: "image/png" }));
        }
      } else if (mediaType === "video" && mediaFile) {
        form.append("media", mediaFile);
      }

      const res = await api.post("/posts", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setTitle("");
      setContent("");
      setMediaType("none");
      setMediaFile(null);
      setMediaUrl("");
      setScale(1);
      setOffset({ x: 0, y: 0 });
      if (drawCanvasRef.current) {
        const ctx = drawCanvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      }
      if (onCreated) onCreated(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const onMediaChange = (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert("Only image or video allowed");
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      alert("File size must be 16MB or less");
      return;
    }
    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
  };

  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [mediaUrl]);

  const drawBase = () => {
    const canvas = baseCanvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    const img = imageRef.current;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, offset.x, offset.y, w, h);
  };

  useEffect(() => {
    if (mediaType !== "image" || !mediaUrl) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const baseScale = Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
      setScale(baseScale);
      const x = (CANVAS_W - img.width * baseScale) / 2;
      const y = (CANVAS_H - img.height * baseScale) / 2;
      setOffset({ x, y });

      const baseCanvas = baseCanvasRef.current;
      const drawCanvas = drawCanvasRef.current;
      if (baseCanvas) {
        baseCanvas.width = CANVAS_W;
        baseCanvas.height = CANVAS_H;
      }
      if (drawCanvas) {
        drawCanvas.width = CANVAS_W;
        drawCanvas.height = CANVAS_H;
      }
      drawBase();
    };
    img.src = mediaUrl;
  }, [mediaType, mediaUrl]);

  useEffect(() => {
    if (mediaType === "image") drawBase();
  }, [scale, offset, mediaType]);

  const onMouseDown = (e) => {
    if (drawEnabled) {
      setDrawing(true);
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e) => {
    if (drawEnabled && drawing) {
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      return;
    }
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => {
    setDragging(false);
    setDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <input
        id="create-post-title"
        name="postTitle"
        placeholder="Title (used to auto-categorize)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 mb-2 focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
      />
      <textarea
        id="create-post-text"
        name="postText"
        placeholder="Start a post..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border dark:border-gray-700 rounded-lg p-2 focus:outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
        rows={4}
      />

      <div className="mt-3">
        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
          Add image or video (max 16MB, 9:16 preview)
        </label>
        <input
          id="create-post-media"
          name="postMedia"
          type="file"
          accept="image/*,video/*"
          onChange={(e) => onMediaChange(e.target.files[0])}
        />
      </div>

      {mediaType === "image" && mediaUrl ? (
        <div className="mt-3">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Zoom
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
            <button
              type="button"
              onClick={() => setDrawEnabled((v) => !v)}
              className="text-sm px-3 py-1 rounded border border-gray-200 dark:border-gray-700"
            >
              {drawEnabled ? "Move Image" : "Draw"}
            </button>
            <button
              type="button"
              onClick={clearDrawing}
              className="text-sm px-3 py-1 rounded border border-gray-200 dark:border-gray-700"
            >
              Clear
            </button>
          </div>

          <div
            className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden relative"
            style={{ width: CANVAS_W, height: CANVAS_H }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <canvas ref={baseCanvasRef} />
            <canvas
              ref={drawCanvasRef}
              style={{ position: "absolute", left: 0, top: 0 }}
            />
          </div>
        </div>
      ) : null}

      {mediaType === "video" && mediaUrl ? (
        <div className="mt-3">
          <div
            className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden"
            style={{ width: CANVAS_W, height: CANVAS_H }}
          >
            <video
              src={mediaUrl}
              controls
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      ) : null}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-2 bg-emerald-600 text-white px-4 py-1 rounded hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
};

export default CreatePost;
