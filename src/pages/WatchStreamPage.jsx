// src/pages/WatchStreamPage.jsx
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams, Link } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

const API_URL = "http://localhost:5000";
const LIVE_URL = "http://localhost:5000/live";

const RTC_CFG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export default function WatchStreamPage() {
  const { streamId } = useParams();
  const me = getUserFromToken();

  const [socket, setSocket] = useState(null);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");

  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const broadcasterIdRef = useRef(null);

  // 🔹 min egen profil (för chatten)
  const [myProfile, setMyProfile] = useState(null);

  // 🔹 broadcasterns profil
  const [broadcasterProfile, setBroadcasterProfile] = useState(null);

  // hämta min egen profil
  useEffect(() => {
    if (me?.id) {
      fetch(`${API_URL}/api/profile/${me.id}`)
        .then((r) => r.json())
        .then((data) => setMyProfile(data))
        .catch((err) => console.error("❌ Failed to load profile", err));
    }
  }, [me?.id]);

  // hämta broadcasterns profil via tavern_streams
  useEffect(() => {
    if (streamId) {
      fetch(`${API_URL}/api/tavern/streams`)
        .then((r) => r.json())
        .then((streams) => {
          const s = streams.find((st) => String(st.id) === String(streamId));
          if (s?.user_id) {
            return fetch(`${API_URL}/api/profile/${s.user_id}`);
          }
        })
        .then((r) => (r ? r.json() : null))
        .then((profile) => setBroadcasterProfile(profile))
        .catch((err) => console.error("❌ Failed to load broadcaster profile", err));
    }
  }, [streamId]);

  useEffect(() => {
    const s = io(LIVE_URL, { path: "/socket.io" });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("viewer:join", { streamId });

    const pc = new RTCPeerConnection(RTC_CFG);
    pcRef.current = pc;

    pc.ontrack = (ev) => {
      if (videoRef.current) {
        videoRef.current.srcObject = ev.streams[0];
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && broadcasterIdRef.current) {
        socket.emit("ice-candidate", {
          to: broadcasterIdRef.current,
          candidate: e.candidate,
        });
      }
    };

    socket.on("offer", async (data) => {
      try {
        broadcasterIdRef.current = data.from;
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: data.from, sdp: answer });
      } catch (err) {
        console.error("Offer error:", err);
      }
    });

    socket.on("ice-candidate", async (data) => {
      try {
        if (data.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("ICE error:", err);
      }
    });

    socket.on("broadcast:ended", () => {
      alert("Stream ended.");
      if (videoRef.current) videoRef.current.srcObject = null;
    });

    const onMsg = (m) => setChat((prev) => [...prev, m]);
    socket.on("chat:message", onMsg);

    return () => {
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("broadcast:ended");
      socket.off("chat:message", onMsg);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [socket, streamId]);

  function sendMsg(e) {
    e.preventDefault();
    if (!msg.trim() || !socket) return;
    socket.emit("chat:message", {
      streamId,
      userId: me?.id,
      user: me?.username || "Anon",
      avatar_url: myProfile?.avatar_url || null,
      text: msg.trim(),
    });
    setMsg("");
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl text-rift-gold mb-2">Watching live</h1>

      {/* 🔹 broadcaster-info */}
      {broadcasterProfile && (
        <div className="flex items-center gap-3 mb-4">
          <Link to={`/profile/${broadcasterProfile.id}`}>
            <img
              src={
                broadcasterProfile.avatar_url
                  ? `${API_URL}${broadcasterProfile.avatar_url}`
                  : "/images/default-avatar.png"
              }
              alt={broadcasterProfile.username}
              className="h-10 w-10 rounded-full object-cover border border-rift-gold/30"
            />
          </Link>
          <Link
            to={`/profile/${broadcasterProfile.id}`}
            className="text-rift-gold font-semibold hover:underline"
          >
            {broadcasterProfile.username}
          </Link>
        </div>
      )}

      {/* Video + chat i grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Video vänster */}
        <div className="md:col-span-2">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-rift-gold/30">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Chat höger */}
        <div className="border border-rift-gold/30 rounded-lg p-3 flex flex-col h-80">
          <div className="flex-1 overflow-auto space-y-2 text-sm">
            {chat.map((m, i) => (
              <div key={i} className="flex items-start gap-2">
                <Link to={`/profile/${m.userId}`}>
                  <img
                    src={
                      m.avatar_url
                        ? `${API_URL}${m.avatar_url}`
                        : "/images/default-avatar.png"
                    }
                    alt={m.user}
                    className="h-7 w-7 rounded-full object-cover border border-rift-gold/30 mt-0.5"
                  />
                </Link>
                <div>
                  <Link
                    to={`/profile/${m.userId}`}
                    className="text-rift-gold font-medium hover:underline"
                  >
                    {m.user}
                  </Link>{" "}
                  <span className="text-white">{m.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* skriv nytt meddelande */}
          <form onSubmit={sendMsg} className="mt-2 flex gap-2">
            <input
              className="flex-1 bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
              placeholder="Say something…"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
            <button className="px-3 py-2 border border-rift-gold/50 rounded-md text-rift-gold hover:bg-rift-card/60">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
