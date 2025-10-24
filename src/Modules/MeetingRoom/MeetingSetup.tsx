// src/Modules/Meeting/MeetingSetup.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const MeetingSetup = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Lấy danh sách thiết bị
  useEffect(() => {
    const getDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        stream.getTracks().forEach((track) => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));

        const firstVideo = devices.find((d) => d.kind === "videoinput");
        const firstAudio = devices.find((d) => d.kind === "audioinput");

        setSelectedVideoId(firstVideo?.deviceId || "");
        setSelectedAudioId(firstAudio?.deviceId || "");
      } catch (err) {
        console.error("Không thể truy cập thiết bị", err);
        setError("❌ Vui lòng cho phép truy cập camera và micro.");
      }
    };
    getDevices();
  }, []);

  // Cập nhật stream khi thay đổi thiết bị hoặc bật/tắt
  useEffect(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (!isVideoEnabled && !isAudioEnabled) {
      setLocalStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }

    const constraints: MediaStreamConstraints = {
      video: isVideoEnabled
        ? selectedVideoId
          ? { deviceId: { exact: selectedVideoId } }
          : true
        : false,
      audio: isAudioEnabled
        ? selectedAudioId
          ? { deviceId: { exact: selectedAudioId } }
          : true
        : false,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        setLocalStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Lỗi khi tạo stream", err);
        setError("❌ Không thể truy cập thiết bị đã chọn.");
        setLocalStream(null);
        if (videoRef.current) videoRef.current.srcObject = null;
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedVideoId, selectedAudioId, isVideoEnabled, isAudioEnabled]);

  const handleJoin = () => {
    if (!localStream && !isVideoEnabled && !isAudioEnabled) {
      alert("Vui lòng bật ít nhất camera hoặc micro.");
      return;
    }

    // ✅ Lưu cấu hình vào sessionStorage
    sessionStorage.setItem(
      "meetingConfig",
      JSON.stringify({
        isVideoEnabled,
        isAudioEnabled,
        selectedVideoId,
        selectedAudioId,
      })
    );

    navigate(`/meeting/${meetingId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Thiết lập thiết bị</h1>

        {/* Preview */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Xem trước</h2>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {localStream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                {isVideoEnabled ? "Đang tải camera..." : "Camera đã tắt"}
              </div>
            )}
          </div>
          <audio ref={audioRef} autoPlay muted style={{ display: "none" }} />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2">Camera</label>
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
              disabled={!isVideoEnabled}
            >
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={isVideoEnabled}
                onChange={(e) => setIsVideoEnabled(e.target.checked)}
                className="mr-2"
              />
              Bật camera
            </label>
          </div>

          <div>
            <label className="block mb-2">Micro</label>
            <select
              value={selectedAudioId}
              onChange={(e) => setSelectedAudioId(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded"
              disabled={!isAudioEnabled}
            >
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Micro ${d.deviceId.substring(0, 5)}`}
                </option>
              ))}
            </select>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={isAudioEnabled}
                onChange={(e) => setIsAudioEnabled(e.target.checked)}
                className="mr-2"
              />
              Bật micro
            </label>
          </div>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/meeting")}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleJoin}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
          >
            Vào phòng họp
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingSetup;