import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { connectSocket } from "../utils/socket";

const socket = connectSocket(localStorage.getItem("token"));

const Messages = () => {
  const { user } = useAuth();
  const myId = user?._id;

  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user");

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const activeConversationRef = useRef(null);

  const normalizeConversations = (list) => {
    const safe = Array.isArray(list) ? list : [];
    const byOtherUser = new Map();
    for (const c of safe) {
      const other = c?.participants?.find(
        (p) => String(p?._id) !== String(myId)
      );
      const key = other?._id || c?._id;
      if (!key) continue;

      const existing = byOtherUser.get(String(key));
      if (!existing) {
        byOtherUser.set(String(key), c);
        continue;
      }

      const existingTime = new Date(existing.lastMessageAt || 0).getTime();
      const currentTime = new Date(c.lastMessageAt || 0).getTime();
      if (currentTime > existingTime) {
        byOtherUser.set(String(key), c);
      }
    }
    return [...byOtherUser.values()].sort(
      (a, b) =>
        new Date(b.lastMessageAt || 0).getTime() -
        new Date(a.lastMessageAt || 0).getTime()
    );
  };

  /* ---------------- LOAD CONVERSATIONS ---------------- */
  const loadConversations = async () => {
    const res = await api.get("/messages");
    const normalized = normalizeConversations(res.data);
    setConversations(normalized);
    return normalized;
  };

  useEffect(() => {
    loadConversations().catch(() => {});
  }, []);

  /* ---------------- AUTO OPEN FROM URL ---------------- */
  useEffect(() => {
    if (!userId) return;

    setActiveUserId(userId);

    const convo = conversations.find(c =>
      c.participants?.some(p => String(p._id) === String(userId))
    );

    if (convo) {
      openConversation(convo);
    } else {
      (async () => {
        try {
          const res = await api.get(`/messages/with/${userId}`);
          if (res.data?._id) {
            setConversations(prev =>
              normalizeConversations([res.data, ...prev])
            );
            openConversation(res.data);
          } else {
            setActiveConversation(null);
            setMessages([]);
          }
        } catch {
          setActiveConversation(null);
          setMessages([]);
        }
      })();
    }
  }, [userId, conversations]);

  /* ---------------- OPEN CONVERSATION ---------------- */
  const openConversation = async (conversation) => {
    if (!conversation?._id) return;

    setActiveConversation(conversation);
    activeConversationRef.current = conversation;
    setMessages([]);
    setLoading(true);

    const res = await api.get(`/messages/${conversation._id}`);
    setMessages(res.data || []);
    setLoading(false);
  };

  const getOtherUser = (conversation) =>
    conversation?.participants?.find(
      p => String(p._id) !== String(myId)
    ) || null;

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const receiverId =
      getOtherUser(activeConversation)?._id || activeUserId;
    if (!receiverId) return;

    const res = await api.post(`/messages/send/${receiverId}`, { text });
    const msg = res.data;

    setMessages(prev => [...prev, msg]);

    const convoId = activeConversation?._id;
    if (convoId) {
      setConversations(prev =>
        [
          {
            ...prev.find(c => c._id === convoId),
            lastMessage: msg.text,
            lastMessageAt: msg.createdAt
          },
          ...prev.filter(c => c._id !== convoId)
        ].filter(Boolean)
      );
    } else {
      const list = await loadConversations();
      const convo = list.find(c =>
        c.participants?.some(p => String(p._id) === String(receiverId))
      );
      if (convo) openConversation(convo);
    }

    setText("");
  };

  /* ---------------- SOCKET RECEIVE ---------------- */
  useEffect(() => {
    socket.on("new-message", (msg) => {
      const convo = activeConversationRef.current;
      if (msg.conversation === convo?._id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => socket.off("new-message");
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <div className="flex h-[80vh] bg-white dark:bg-gray-800 rounded shadow text-gray-800 dark:text-gray-100">
      <aside className="w-1/3 border-r overflow-y-auto">
        {conversations.map(c => {
          const other = getOtherUser(c);
          return (
            <div
              key={c._id}
              onClick={() => openConversation(c)}
              className={`p-4 cursor-pointer border-b ${
                activeConversation?._id === c._id ? "bg-gray-100" : ""
              }`}
            >
              <div className="font-semibold">{other?.username}</div>
              <div className="text-sm text-gray-500 truncate">
                {c.lastMessage || "Start a conversation"}
              </div>
            </div>
          );
        })}
      </aside>

      <section className="flex-1 flex flex-col">
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a connection to start messaging
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            Loadingâ€¦
          </div>
        ) : (
          <>
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
              {messages.map(m => {
                const senderId = m?.sender?._id || m?.sender;
                const isMine = String(senderId) === String(myId);
                return (
                <div
                  key={m._id}
                  className={`max-w-xs px-3 py-2 rounded ${
                    isMine ? "ml-auto bg-emerald-600 text-white" : "bg-gray-200"
                  }`}
                >
                  {m.text}
                </div>
              )})}
            </div>

            <div className="p-4 border-t flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a messageâ€¦"
                className="flex-1 border rounded px-3 py-2"
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-emerald-600 text-white px-4 rounded"
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Messages;

// const Messages = () => {
//   const { user } = useAuth();
//   const myId = user?._id;

//   const [searchParams] = useSearchParams();
//   const userId = searchParams.get("user");

//   const [conversations, setConversations] = useState([]);
//   const [activeConversation, setActiveConversation] = useState(null);
//   const [activeUserId, setActiveUserId] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [text, setText] = useState("");
//   const [loading, setLoading] = useState(false);

//   /* Load conversations */
//   const loadConversations = async () => {
//     const res = await api.get("/messages");
//     const safe = Array.isArray(res.data)
//       ? res.data.filter((c) => c && Array.isArray(c.participants))
//       : [];
//     setConversations(safe);
//     return safe;
//   };

//   useEffect(() => {
//     loadConversations().catch(() => {});
//   }, []);

//   /* Auto open conversation from URL */
//   useEffect(() => {
//     if (!userId) return;
//     setActiveUserId(userId);

//     const convo = conversations.find(c =>
//       Array.isArray(c?.participants) &&
//       c.participants.some(p => p && p._id === userId)
//     );

//     if (convo) {
//       openConversation(convo);
//       return;
//     }

//     // No conversation yet for this user
//     setActiveConversation(null);
//     setMessages([]);
//   }, [userId, conversations]);

//   const openConversation = async (conversation) => {
//     if (!conversation?._id) return;
//     setActiveConversation(conversation);
//     setLoading(true);
//     const res = await api.get(`/messages/${conversation._id}`);
//     setMessages(res.data);
//     setLoading(false);
//   };

//   const getOtherUser = (conversation) =>
//     conversation?.participants?.find(p => p && p._id !== myId) || null;

//   const sendMessage = async () => {
//     if (!text.trim()) return;

//     const receiverId =
//       getOtherUser(activeConversation)?._id || activeUserId;
//     if (!receiverId) return;

//     const res = await api.post(`/messages/send/${receiverId}`, {
//       text
//     });

//     if (activeConversation?._id) {
//       setMessages(prev => [...prev, res.data]);
//       setConversations((prev) => {
//         const idx = prev.findIndex((c) => c._id === activeConversation._id);
//         if (idx === -1) return prev;
//         const updated = [...prev];
//         const updatedConversation = {
//           ...updated[idx],
//           lastMessage: res.data.text,
//           lastMessageAt: res.data.createdAt || new Date().toISOString()
//         };
//         return [updatedConversation, ...updated.filter((_, i) => i !== idx)];
//       });
//     } else {
//       // Conversation was just created on the server; reload and open it.
//       const list = await loadConversations();
//       const convo = list.find(c =>
//         Array.isArray(c?.participants) &&
//         c.participants.some(p => p && p._id === receiverId)
//       );
//       if (convo) {
//         await openConversation(convo);
//       } else {
//         setMessages(prev => [...prev, res.data]);
//       }
//     }
//     setText("");
//   };

//   return (
//     <div className="flex h-[80vh] bg-white rounded shadow">
//       {/* Conversations */}
//       <aside className="w-1/3 border-r overflow-y-auto">
//         {conversations.length === 0 && (
//           <div className="p-4 text-gray-500">No conversations yet</div>
//         )}

//         {conversations.map(c => {
//           const other = getOtherUser(c);

//           return (
//             <div
//               key={c._id}
//               onClick={() => openConversation(c)}
//               className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
//                 activeConversation?._id === c._id ? "bg-gray-100" : ""
//               }`}
//             >
//               <div className="font-semibold">{other?.username || "Unknown"}</div>
//               <div className="text-sm text-gray-500 truncate">
//                 {c.lastMessage || "Start a conversation"}
//               </div>
//             </div>
//           );
//         })}
//       </aside>

//       {/* Chat */}
//       <section className="flex-1 flex flex-col">
//         {!activeConversation ? (
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             Select a connection to start messaging
//           </div>
//         ) : loading ? (
//           <div className="flex-1 flex items-center justify-center">
//             Loading messagesÃ¢â‚¬Â¦
//           </div>
//         ) : (
//           <>
//             <div className="flex-1 p-4 overflow-y-auto space-y-2">
//               {messages.map(m => (
//                 <div
//                   key={m._id}
//                   className={`max-w-xs px-3 py-2 rounded ${
//                     m.sender?._id === myId
//                       ? "ml-auto bg-emerald-600 text-white"
//                       : "bg-gray-200"
//                   }`}
//                 >
//                   {m.text}
//                 </div>
//               ))}
//             </div>

//             <div className="p-4 border-t flex gap-2">
//               <input
//                 id="message-text"
//                 name="messageText"
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//                 placeholder="Write a messageâ€¦"
//                 className="flex-1 border rounded px-3 py-2"
//                 onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//               />
//               <button
//                 onClick={sendMessage}
//                 className="bg-emerald-600 text-white px-4 rounded"
//               >
//                 Send
//               </button>
//             </div>
//           </>
//         )}
//       </section>
//     </div>
//   );
// };

// export default Messages;
