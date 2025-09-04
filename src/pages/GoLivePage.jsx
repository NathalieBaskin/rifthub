import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

const API_URL = "http://localhost:5000";
const LIVE_URL = "http://localhost:5000/live";

const RTC_CFG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export default function GoLivePage() {
  const me = getUserFromToken();
  const nav = useNavigate();

  const videoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const pcs = useRef({}); // viewerId -> RTCPeerConnection
  const streamRef = useRef(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [streamId, setStreamId] = useState(null);
  const [live, setLive] = useState(false);

  // chat state
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const s = io(LIVE_URL, { path: "/socket.io" });
    setSocket(s);

    // ta emot inkommande chat
    s.on("chat:message", (m) => {
      setChat((prev) => [...prev, m]);
    });

    return () => s.disconnect();
  }, []);

  async function startLive() {
    if (!title.trim()) return alert("Add a title");

    // skapa stream i DB
    const r = await fetch(`${API_URL}/api/tavern/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.id, title, description: desc }),
    });
    if (!r.ok) return alert("Failed to create stream");
    const { id } = await r.json();
    setStreamId(id);

    // hämta kamera/mic
    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    streamRef.current = media;
    if (videoRef.current) videoRef.current.srcObject = media;

    socket.emit("broadcaster:join", { streamId: id });
    setLive(true);

    // WebRTC signaling
    socket.on("viewer:ready", async ({ viewerId }) => {
      const pc = new RTCPeerConnection(RTC_CFG);
      streamRef.current.getTracks().forEach((t) => pc.addTrack(t, streamRef.current));

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit("ice-candidate", { to: viewerId, candidate: e.candidate });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: viewerId, sdp: offer }); // ✅ fix
      pcs.current[viewerId] = pc;
    });

    socket.on("answer", async ({ from, sdp }) => {
      const pc = pcs.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    socket.on("ice-candidate", async ({ from, candidate }) => {
      const pc = pcs.current[from];
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
  }

  async function stopLive() {
    if (streamId) {
      await fetch(`${API_URL}/api/tavern/streams/${streamId}/stop`, { method: "POST" });
      socket.emit("broadcaster:leave", { streamId });
    }

    Object.values(pcs.current).forEach((pc) => pc.close());
    pcs.current = {};
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setLive(false);

    // redirect tillbaka till tavern
    nav("/tavern");
  }

  function sendMsg(e) {
    e.preventDefault();
    if (!msg.trim() || !socket || !streamId) return;
    socket.emit("chat:message", {
      streamId,
      user: me?.username || "Anon",
      text: msg.trim(),
    });
    setMsg("");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl text-rift-gold">Go Live</h1>

      {!live ? (
        <div className="space-y-3">
          <input
            className="w-full bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
            placeholder="Stream title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full bg-black/30 border border-rift-gold/30 rounded p-2 text-white"
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <button
            onClick={startLive}
            className="px-4 py-2 border border-rift-gold/50 rounded-md text-rift-gold hover:bg-rift-card/60"
          >
            Start live
          </button>
        </div>
      ) : (
        <button
          onClick={stopLive}
          className="px-4 py-2 border border-red-500/60 text-red-400 hover:bg-red-900/30"
        >
          Stop live
        </button>
      )}

      <div className="mt-6">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg border border-rift-gold/30"
        />
      </div>

      {live && (
        <div className="mt-6 border border-rift-gold/30 rounded-lg p-3">
          <div className="h-40 overflow-auto space-y-1 text-sm">
            {chat.map((m, i) => (
              <div key={i}>
                <span className="text-rift-gold font-medium">{m.user}</span>: {m.text}
              </div>
            ))}
          </div>
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
      )}
    </div>
  );
}
