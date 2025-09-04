import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { getUserFromToken } from "../utils/auth.js";

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

  useEffect(() => {
    const s = io(LIVE_URL, { transports: ["websocket"] });
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
        socket.emit("ice-candidate", { to: broadcasterIdRef.current, candidate: e.candidate });
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
      user: me?.username || "Anon",
      text: msg.trim(),
    });
    setMsg("");
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl text-rift-gold mb-4">Watching live</h1>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls
        className="w-full rounded-lg border border-rift-gold/30"
      />

      <div className="mt-4 border border-rift-gold/30 rounded-lg p-3">
        <div className="h-48 overflow-auto space-y-1 text-sm">
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
    </div>
  );
}
