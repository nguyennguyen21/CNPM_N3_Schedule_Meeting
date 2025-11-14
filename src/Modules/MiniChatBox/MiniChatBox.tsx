    import { useState, useRef, useEffect } from 'react';
    import { LuBotMessageSquare } from "react-icons/lu";
    import { RiMessageLine } from "react-icons/ri";
    type Message = {
      id: number;
      text: string;
      sender: 'user' | 'bot';
    };

    // --- Hằng số được cập nhật ---
    const MODEL_NAME = 'gemini-2.5-flash'; // Đã sửa lỗi 404

    // Đọc Key API từ biến môi trường (ví dụ: REACT_APP_GEMINI_API_KEY)
    // Thay thế hoàn toàn cho các biến hardcode và placeholder trước đó.
    const GEMINI_API_KEY =  'AIzaSyAgYWu1aw_94PZ0LCAgCqGFruk_2rEiqtw'; 

    const MiniChatBox = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Xin chào! Tôi là trợ lý AI Gemini. Bạn cần giúp gì?', sender: 'bot' }
      ]);
      const [inputValue, setInputValue] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const messagesEndRef = useRef<HTMLDivElement>(null);

      const toggleChat = () => setIsOpen(!isOpen);

      /**
       * @function callGeminiAPI
       * @description Gọi API Gemini để lấy câu trả lời từ prompt.
       */
      const callGeminiAPI = async (prompt: string): Promise<string> => {
    // Kiểm tra Key API đã được tải từ Biến Môi Trường hay chưa.
    if (!GEMINI_API_KEY) {
     // Đây là thông báo lỗi mới khi Key chưa được tải.
     return 'Lỗi: Không tìm thấy API Key. Vui lòng kiểm tra file .env.local và khởi động lại server.';
    }

    setIsLoading(true);
    try {
     const response = await fetch(
       // URL dùng MODEL_NAME mới: gemini-2.5-flash
       `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
       {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
     })
       }
     );

     const data = await response.json();

     if (!response.ok) {
       console.error('HTTP Error (API):', data);
       return `Lỗi ${response.status}: ${data.error?.message || 'Không xác định. (Có thể Key API bị sai/hết hạn)'}`;
     }

     const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
     return typeof text === 'string' ? text.trim() : 'AI không thể trả lời câu hỏi này.';
    } catch (error) {
     console.error('Lỗi mạng/kết nối:', error);
     return 'Không thể kết nối đến AI. Vui lòng kiểm tra mạng và thử lại.';
    } finally {
     setIsLoading(false);
    }
      };

      /**
       * @function handleSend
       * @description Xử lý việc gửi tin nhắn người dùng và nhận câu trả lời từ bot.
       */
      const handleSend = async () => {
    if (inputValue.trim() === '' || isLoading) return;

    const userMsgText = inputValue;

    const userMsg: Message = {
     id: Date.now(),
     text: userMsgText,
     sender: 'user'
    };
    // Cập nhật tin nhắn người dùng và làm sạch input
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Gọi API và thêm tin nhắn bot
    const botReply = await callGeminiAPI(userMsgText);
    const botMsg: Message = {
     id: Date.now() + 1,
     text: botReply,
     sender: 'bot'
    };
    setMessages((prev) => [...prev, botMsg]);
      };

      useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]);

      const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
      };

      return (
    <>
     {/* Nút mở/đóng chat */}
     <button
       onClick={toggleChat}
       className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-second focus:outline-none flex items-center justify-center text-xl z-50 transition-transform hover:scale-105"
       aria-label="Mở chat"
     >
       {isOpen ? <RiMessageLine/> : <LuBotMessageSquare />}
     </button>

     {/* Khung chat */}
     {isOpen && (
       <div className="fixed bottom-24 right-6 w-80 h-[500px] bg-white rounded-xl shadow-xl flex flex-col z-50 overflow-hidden border border-gray-200">
     <div className="bg-second text-white p-4 font-semibold rounded-t-xl flex justify-between items-center">
      <span>Trợ lý AI (Gemini)</span>
      <button
      onClick={toggleChat}
      className="text-white hover:text-gray-200 text-lg font-bold"
      aria-label="Đóng chat"
      >
      &times;
      </button>
     </div>

     <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      {messages.map((msg) => (
      <div
        key={msg.id}
        className={`mb-3 max-w-[85%] p-3 rounded-lg break-words whitespace-pre-wrap ${
      msg.sender === 'user'? 'ml-auto bg-primary text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        {msg.text}
      </div>
      ))}
      {isLoading && (
      <div className="mb-3 max-w-[85%] p-3 bg-gray-200 text-gray-800 rounded-lg">
        <div className="flex space-x-1">
      {/* Hiệu ứng loading */}
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
      )}
      <div ref={messagesEndRef} />
     </div>

     <div className="p-3 bg-white border-t border-gray-200 flex">
      <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder="Nhập tin nhắn..."
      disabled={isLoading}
      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-second disabled:opacity-70"
      />
      <button
      onClick={handleSend}
      disabled={isLoading || !inputValue.trim()}
      className="ml-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-second focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
      Gửi
      </button>
     </div>
       </div>
     )}
    </>
      );
    };

    export default MiniChatBox;