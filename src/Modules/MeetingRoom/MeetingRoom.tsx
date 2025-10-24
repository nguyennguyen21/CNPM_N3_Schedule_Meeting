// src/Modules/Meeting/MeetingRoom.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
} from "@microsoft/signalr";

interface ChatMessage {
  user: string;
  text: string;
}

const MeetingRoom = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  if (!meetingId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center text-red-400">
          <h2 className="text-2xl font-bold mb-2">❌ Thiếu mã phòng họp</h2>
          <button
            onClick={() => navigate("/meeting")}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteStreamsRef = useRef<MediaStream[]>([]);

  const token = localStorage.getItem("token");

  const updateTracksForAllPeers = useCallback(() => {
    const currentStream = localStreamRef.current;
    if (!currentStream) return;

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const senders = pc.getSenders();
      const currentTracks = currentStream.getTracks();

      currentTracks.forEach((track) => {
        const sender = senders.find((s) => s.track?.kind === track.kind);
        if (sender) sender.replaceTrack(track);
        else pc.addTrack(track, currentStream);
      });

      senders.forEach((sender) => {
        if (sender.track && !currentTracks.includes(sender.track)) {
          sender.replaceTrack(null);
        }
      });
    });
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    if (peerConnectionsRef.current[peerId]) return peerConnectionsRef.current[peerId];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && connectionRef.current) {
        connectionRef.current.invoke("SendIceCandidate", meetingId, event.candidate, peerId);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream && !remoteStreamsRef.current.some((s) => s.id === stream.id)) {
        remoteStreamsRef.current = [...remoteStreamsRef.current, stream];
        setRemoteStreams([...remoteStreamsRef.current]);
      }
    };

    const stream = localStreamRef.current;
    if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    peerConnectionsRef.current[peerId] = pc;
    return pc;
  }, []);

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    } else {
      console.warn("Không tìm thấy video track để bật/tắt");
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    } else {
      console.warn("Không tìm thấy audio track để bật/tắt");
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;

      const originalStream = localStreamRef.current;
      if (originalStream) {
        localStreamRef.current = originalStream;
        setLocalStream(originalStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = originalStream;
          localVideoRef.current.play().catch(console.warn);
        }
      }
      setIsScreenSharing(false);
      updateTracksForAllPeers();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = screenStream;
        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(console.warn);
        }
        setIsScreenSharing(true);
        updateTracksForAllPeers();
      } catch (err) {
        console.error("Screen share error:", err);
        setError("❌ Không thể chia sẻ màn hình");
      }
    }
  };

  useEffect(() => {
    if (!token) {
      setError("❌ Vui lòng đăng nhập");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const init = async () => {
      try {
        const configStr = sessionStorage.getItem("meetingConfig");
        const config = configStr
          ? JSON.parse(configStr)
          : {
              isVideoEnabled: true,
              isAudioEnabled: true,
              selectedVideoId: "",
              selectedAudioId: "",
            };

        // ✅ LUÔN YÊU CẦU CẢ VIDEO VÀ AUDIO ĐỂ TRACK TỒN TẠI
        const videoConstraint = config.selectedVideoId
          ? { deviceId: { exact: config.selectedVideoId } }
          : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } };

        const audioConstraint = config.selectedAudioId
          ? { deviceId: { exact: config.selectedAudioId } }
          : { echoCancellation: true, noiseSuppression: true };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraint,
          audio: audioConstraint,
        });

        if (!isMounted) return;

        // ✅ ÁP DỤNG TRẠNG THÁI BẬT/TẮT SAU KHI CÓ TRACK
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          videoTrack.enabled = config.isVideoEnabled;
          setIsVideoEnabled(config.isVideoEnabled);
        }

        if (audioTrack) {
          audioTrack.enabled = config.isAudioEnabled;
          setIsAudioEnabled(config.isAudioEnabled);
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        sessionStorage.removeItem("meetingConfig");
      } catch (err: any) {
        console.error("Camera/mic error:", err);
        if (isMounted) {
          setError(`❌ ${err.message || "Không thể truy cập camera/micro"}`);
        }
        setIsLoading(false);
        return;
      }

      // === SignalR Connection ===
      const connection = new HubConnectionBuilder()
        .withUrl(`http://localhost:5030/meetingHub`, {
          accessTokenFactory: () => token,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
        })
        .build();

      connectionRef.current = connection;

      try {
        await connection.start();
        if (!isMounted) {
          connection.stop();
          return;
        }

        await connection.invoke("JoinMeeting", meetingId);

        connection.on("ReceiveChat", (user: string, message: string) => {
          if (isMounted) setChatMessages((prev) => [...prev, { user, text: message }]);
        });

        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error("SignalR error:", err);
        if (isMounted) setError("❌ Không thể kết nối phòng họp");
        setIsLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      connectionRef.current?.stop();
    };
  }, [token, meetingId]);

  const handleSendMessage = () => {
    if (newMessage.trim() && connectionRef.current) {
      const user = localStorage.getItem("username") || "Ẩn danh";
      connectionRef.current.invoke("SendChat", meetingId, user, newMessage);
      setNewMessage("");
    }
  };

  const leaveMeeting = () => {
    navigate("/meeting");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center text-red-400 max-w-md">
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <button
            onClick={() => navigate("/meeting")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
          >
            ← Quay lại phòng chờ
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !localStream) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-white text-lg">
          {isScreenSharing ? "Đang chia sẻ màn hình..." : "Đang khởi tạo camera..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col p-2 md:p-4">
      <div className="flex flex-1 gap-3 mb-4">
        <div className={`flex-1 min-w-0 min-h-0 ${isChatOpen ? "max-w-[calc(100%-320px)]" : "w-full"}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 min-h-0">
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg relative">
              <div className="relative w-full pb-[56.25%]">
                <video
                  ref={(el) => {
                    localVideoRef.current = el;
                    if (el && localStream) {
                      el.srcObject = localStream;
                      el.muted = true;
                      el.play().catch((err) => console.warn("Local video play failed:", err));
                    }
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                {isScreenSharing ? "Đang chia sẻ" : "👤 Bạn"}
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white text-lg">Camera đã tắt</span>
                </div>
              )}
            </div>

            {remoteStreams.map((stream) => (
              <div key={stream.id} className="bg-gray-800 rounded-xl overflow-hidden shadow-lg relative">
                <div className="relative w-full pb-[56.25%]">
                  <video
                    autoPlay
                    playsInline
                    muted
                    ref={(el) => {
                      if (el) {
                        el.srcObject = stream;
                        el.play().catch(console.warn);
                      }
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
                  Người tham gia
                </div>
              </div>
            ))}
          </div>
        </div>

        {isChatOpen && (
          <div className="w-80 flex flex-col bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-white">Trò chuyện</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white"
                title="Ẩn chat"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px]">
              {chatMessages.length === 0 ? (
                <p className="text-gray-400 italic text-sm">Chưa có tin nhắn nào</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className="p-2 bg-gray-700/50 rounded-lg">
                    <div className="font-semibold text-blue-300 text-sm">{msg.user}</div>
                    <div className="text-gray-200 text-sm">{msg.text}</div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Nhắn tin..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded-lg text-sm font-medium"
                >
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 mb-4 flex-wrap">
        <button
          onClick={toggleAudio}
          className={`px-4 py-2.5 rounded-xl font-medium flex flex-col items-center transition-all ${
            isAudioEnabled
              ? "bg-white hover:bg-red-600 text-gray-900"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
        >
          {isAudioEnabled ? " Tắt mic" : " Bật mic"}
        </button>

        <button
          onClick={toggleVideo}
          className={`px-4 py-2.5 rounded-xl font-medium flex flex-col items-center transition-all ${
            isVideoEnabled
              ? "bg-white hover:bg-red-600 text-gray-900"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
        >
          {isVideoEnabled ? " Tắt cam" : " Bật cam"}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`px-4 py-2.5 rounded-xl font-medium flex flex-col items-center transition-all ${
            isScreenSharing
              ? "bg-yellow-500 hover:bg-yellow-600 text-black"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {isScreenSharing ? " Dừng chia sẻ" : " Chia sẻ màn hình"}
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`px-4 py-2.5 rounded-xl font-medium flex flex-col items-center transition-all ${
            isChatOpen
              ? "bg-white hover:bg-gray-600 text-gray-900"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isChatOpen ? " Ẩn chat" : " Hiện chat"}
        </button>

        <button
          onClick={leaveMeeting}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white transition shadow-lg"
        >
          Rời cuộc họp
        </button>
      </div>
    </div>
  );
};

export default MeetingRoom;