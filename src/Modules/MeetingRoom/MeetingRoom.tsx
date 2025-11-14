import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaCamera } from "react-icons/fa";
import { FiCameraOff } from "react-icons/fi";
import { LiaMicrophoneSolid, LiaMicrophoneSlashSolid } from "react-icons/lia";
import { PiChatCenteredLight, PiChatCenteredSlash } from "react-icons/pi";
import { TbDeviceDesktopShare } from "react-icons/tb";
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

  // === INSTANCE ID CHO TAB NÀY (duy nhất) ===
  const currentInstanceId = useRef<string>(Date.now().toString());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const [isKicked, setIsKicked] = useState(false);

  // === NGĂN MULTI-TAB: TỰ ĐỘNG KICK TAB CŨ ===
  useEffect(() => {
    if (!meetingId) return;

    const userId = localStorage.getItem("userId") || localStorage.getItem("username") || "anonymous";
    const channel = new BroadcastChannel("meeting-tab-guard");
    broadcastChannelRef.current = channel;

    // Thông báo: "Tôi (tab này) đang active"
    const announceSelf = () => {
      channel.postMessage({
        type: "TAB_ACTIVE",
        meetingId,
        userId,
        instanceId: currentInstanceId.current,
        timestamp: Date.now(),
      });
    };

    // Gửi ngay khi mount
    announceSelf();

    // Gửi định kỳ mỗi 5s để đảm bảo tab mới nhất luôn "sống"
    const interval = setInterval(announceSelf, 5000);

    // Lắng nghe từ các tab khác
    channel.onmessage = (event) => {
      const data = event.data;
      if (
        data?.type === "TAB_ACTIVE" &&
        data.meetingId === meetingId &&
        data.userId === userId &&
        data.instanceId !== currentInstanceId.current
      ) {
        // Nếu tab khác mới hơn → tự động rời
        if (data.timestamp > Date.now() - 2000) {
          setIsKicked(true);
        }
      }
    };

    return () => {
      clearInterval(interval);
      channel.close();
    };
  }, [meetingId]);

  // === XỬ LÝ KHI BỊ KICK ===
  useEffect(() => {
    if (isKicked) {
      // Cleanup sẽ được gọi tự động khi component unmount
      navigate("/meeting", { replace: true });
    }
  }, [isKicked, navigate]);

  if (isKicked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center text-yellow-400 max-w-md">
          <h2 className="text-2xl font-bold mb-4">🔄 Đang chuyển sang tab khác...</h2>
          <p className="text-gray-300">Bạn đã mở cuộc họp ở tab mới.</p>
        </div>
      </div>
    );
  }

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

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<HubConnection | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteStreamsRef = useRef<MediaStream[]>([]);

  const token = localStorage.getItem("token");

  const stopStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      if (track.readyState === "live") track.stop();
    });
  }, []);

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
    const stream = cameraStreamRef.current;
    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    const stream = cameraStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopStream(screenStreamRef.current);
      screenStreamRef.current = null;

      const cameraStream = cameraStreamRef.current;
      if (cameraStream) {
        localStreamRef.current = cameraStream;
        setLocalStream(cameraStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = cameraStream;
          localVideoRef.current.play().catch(console.warn);
        }
      } else {
        setLocalStream(null);
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
      }

      setIsScreenSharing(false);
      setError(null);
      updateTracksForAllPeers();
    } else {
      try {
        setError(null);
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

        stopStream(screenStreamRef.current);
        screenStreamRef.current = screenStream;
        localStreamRef.current = screenStream;
        setLocalStream(screenStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(console.warn);
        }

        setIsScreenSharing(true);
        updateTracksForAllPeers();
      } catch (err: any) {
        console.error("Screen share error:", err);
        setIsScreenSharing(false);
        const cameraStream = cameraStreamRef.current;
        if (cameraStream) {
          localStreamRef.current = cameraStream;
          setLocalStream(cameraStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = cameraStream;
            localVideoRef.current.play().catch(console.warn);
          }
        }
        if (!(err.name === "NotAllowedError" || err.name === "AbortError")) {
          setError("❌ Không thể chia sẻ màn hình");
          setTimeout(() => setError(null), 3000);
        }
      }
    }
  };

  // === KHỞI TẠO CAMERA/MIC VÀ SIGNALR ===
  useEffect(() => {
    if (!token) {
      setError("❌ Vui lòng đăng nhập");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const init = async () => {
      stopStream(screenStreamRef.current);
      stopStream(cameraStreamRef.current);
      stopStream(localStreamRef.current);

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

        if (!isMounted) {
          stopStream(stream);
          return;
        }

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

        cameraStreamRef.current = stream;
        localStreamRef.current = stream;
        setLocalStream(stream);
        sessionStorage.removeItem("meetingConfig");
      } catch (err: any) {
        console.error("MediaDevices error:", err);
        let errorMsg = "❌ Không thể truy cập camera/micro";

        if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMsg = "❌ Thiết bị đang được sử dụng ở nơi khác. Vui lòng đóng tab/app khác và thử lại.";
        } else if (err.name === "NotAllowedError") {
          errorMsg = "❌ Bạn đã từ chối quyền truy cập camera/micro.";
        } else if (err.name === "NotFoundError") {
          errorMsg = "❌ Không tìm thấy camera hoặc micro.";
        }

        if (isMounted) setError(errorMsg);
        setIsLoading(false);
        return;
      }

      // SignalR
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

      // Dừng mọi stream
      stopStream(screenStreamRef.current);
      stopStream(cameraStreamRef.current);
      stopStream(localStreamRef.current);

      // Đóng kết nối
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      connectionRef.current?.stop();
    };
  }, [token, meetingId, stopStream]);

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
                {isScreenSharing ? "Đang chia sẻ" : " Bạn"}
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <FiCameraOff className="text-white text-2xl" />
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
          className={`px-4 py-2.5 rounded-full font-medium flex flex-col items-center transition-all ${
            isAudioEnabled
              ? "bg-white hover:bg-red-600 text-2xl text-gray-900 py-4"
              : "bg-gray-700 hover:bg-gray-600 text-2xl text-gray-200 py-4"
          }`}
        >
          {isAudioEnabled ? <LiaMicrophoneSlashSolid /> : <LiaMicrophoneSolid />}
        </button>

        <button
          onClick={toggleVideo}
          className={`px-4 py-2.5 rounded-full font-medium flex flex-col items-center transition-all ${
            isVideoEnabled
              ? "bg-white hover:bg-red-600 text-2xl text-gray-900 py-4"
              : "bg-gray-700 hover:bg-gray-600 text-2xl text-gray-200 py-4"
          }`}
        >
          {isVideoEnabled ? <FiCameraOff /> : <FaCamera />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`px-4 py-2.5 rounded-full font-medium flex flex-col items-center transition-all ${
            isScreenSharing
              ? "bg-yellow-500 hover:bg-yellow-600 text-2xl text-black py-4"
              : "bg-purple-600 hover:bg-purple-700 text-2xl text-white py-4"
          }`}
        >
          {isScreenSharing ? " Dừng chia sẻ" : <TbDeviceDesktopShare />}
        </button>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`px-4 py-2.5 rounded-full font-medium flex flex-col items-center transition-all ${
            isChatOpen
              ? "bg-white hover:bg-red-600 text-2xl text-gray-900 py-4"
              : "bg-gray-700 hover:bg-gray-600 text-2xl text-white py-4"
          }`}
        >
          {isChatOpen ? <PiChatCenteredSlash /> : <PiChatCenteredLight />}
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