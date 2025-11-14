// src/Modules/Meeting/MeetingLobby.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Client from "../../Configs/CNAPI/CNAPI";

const MeetingLobby = () => {
  const [meetingId, setMeetingId] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId"); // ← BẮT BUỘC PHẢI CÓ

  // Tạo phòng mới → chuyển đến setup
  const handleCreateMeeting = async () => {
    if (!userId) {
      setError("❌ Vui lòng đăng nhập để tạo phòng họp.");
      return;
    }

    if (isCreating) return;
    setIsCreating(true);
    setError("");

    try {
      const response = await Client.post("/api/meetings", {
        title: "Cuộc họp mới",
        userId: userId,
        leaveUrl: window.location.origin + "/dashboard",
      });

      const newMeetingId = response.data.id;
      setMeetingId(newMeetingId);
      // ✅ Điều hướng đến trang cài đặt THIẾT BỊ trước khi vào phòng
      navigate(`/meeting/setup/${newMeetingId}`);
    } catch (err: any) {
      console.error("Tạo phòng thất bại:", err);
      setError("❌ Không thể tạo phòng họp. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  // Tham gia phòng → cũng qua setup
  const handleJoinMeeting = () => {
    const code = joinCode.trim();
    if (!code) {
      setError("Vui lòng nhập mã phòng");
      return;
    }

    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(code)) {
      setError("Mã phòng không hợp lệ (phải là định dạng GUID)");
      return;
    }

    // ✅ Cũng chuyển qua setup trước khi vào phòng
    navigate(`/meeting/setup/${code}`);
  };

  const copyToClipboard = async () => {
    if (meetingId) {
      try {
        await navigator.clipboard.writeText(meetingId);
        alert(" Đã sao chép mã phòng!");
      } catch {
        setError("Không thể sao chép. Vui lòng chọn và sao chép thủ công.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-600 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Họp Trực Tuyến</h1>

        {/* Tạo phòng mới */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Tạo phòng họp mới</h2>
          <button
            onClick={handleCreateMeeting}
            disabled={isCreating}
            className={`w-full py-3 rounded-lg font-medium ${
              isCreating
                ? "bg-blue-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isCreating ? "Đang tạo..." : "Tạo phòng mới"}
          </button>

          {meetingId && (
            <div className="mt-4 p-3 bg-gray-700 rounded">
              <p className="text-sm text-gray-300">Mã phòng của bạn:</p>
              <div className="flex items-center mt-1">
                <code className="bg-gray-900 px-2 py-1 rounded text-sm flex-1 break-all">
                  {meetingId}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                  title="Sao chép"
                >
                  📋
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tham gia phòng có sẵn */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Tham gia phòng có sẵn</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value);
                setError("");
              }}
              placeholder="Nhập mã phòng (GUID)"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
            />
            <button
              onClick={handleJoinMeeting}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium whitespace-nowrap"
            >
              Tham gia
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default MeetingLobby;