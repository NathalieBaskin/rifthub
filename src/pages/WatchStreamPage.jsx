// src/pages/WatchStreamPage.jsx
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const LIVE_URL = "http://localhost:5000/live";

export default function WatchStreamPage() {
  const { streamId } = useParams();
  const [socket, setSocket] = useState(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const streamRef = useRef(new MediaStream());

  useEffect(() => {
    const s = io(LIVE_URL);
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("viewer:join", { streamId });

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (ev) => {
      ev.streams[0].getTracks().forEach((t) => streamRef.current.addTrack(t));
      if (videoRef.current) videoRef.current.srcObject = streamRef.current;
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("ice-candidate", { to: "broadcaster", candidate: e.candidate });
    };

    socket.on("offer", async ({ from, sdp }) => {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, sdp: answer });
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on("broadcast:ended", () => {
      alert("Stream ended.");
    });

    return () => {
      pc.close();
    };
  }, [socket, streamId]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl text-rift-gold mb-4">Watching live</h1>
      <video ref={videoRef} autoPlay playsInline controls className="w-full rounded-lg border border-rift-gold/30" />
    </div>
  );
}
