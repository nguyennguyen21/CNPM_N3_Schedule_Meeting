import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, RefreshCw, Mic, Image as ImageIcon, X } from 'lucide-react';

// --- Các kiểu dữ liệu ---
type Expression = 'happy' | 'confused' | 'love' | 'winking' | 'serious' | 'loading';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  expression?: Expression;
};

// --- Cấu hình API Gemini ---
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const apiKey = 'AIzaSyAgYWu1aw_94PZ0LCAgCqGFruk_2rEiqtw';
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
const systemPrompt =
  'Act as a dedicated and supportive schedule consultant. Your goal is to help the user organize their time, plan your week, set goals, and manage tasks effectively. Respond in Vietnamese. ' +
  'When providing structured plans (e.g., schedule, tasks), use Markdown-style tables with clear headers and a separator row (|---|---|). ' +
  'Example: \n| Thời gian | Mục tiêu |\n|---|---|\n| 60 phút | Học Intent Actions |';

const randomExpressions: Expression[] = ['happy', 'love', 'winking', 'serious', 'confused'];
const getRandomExpression = (): Expression => randomExpressions[Math.floor(Math.random() * randomExpressions.length)];

const expressionImageMap: Record<Expression, string> = {
  happy: 'https://cdn-icons-png.freepik.com/512/6134/6134346.png',
  confused: 'https://cdn-icons-png.freepik.com/512/6134/6134346.png',
  love: 'https://cdn-icons-png.freepik.com/512/6134/6134346.png',
  winking: 'https://cdn-icons-png.freepik.com/512/6134/6134346.png',
  serious: 'https://cdn-icons-png.freepik.com/512/6134/6134346.png',
  loading: 'https://cdn-icons-png.freepik.com/512/6134/6134346.png',
};

// --- Bot Avatar ---
const BotAvatar = ({ expression }: { expression: Expression }) => {
  const imageUrl = expressionImageMap[expression] || expressionImageMap.happy;
  return (
    <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12">
      <img
        src={imageUrl}
        alt={`Bot expression: ${expression}`}
        className="w-full h-full object-contain rounded-full shadow-md"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = expressionImageMap.happy;
          target.onerror = null;
        }}
      />
    </div>
  );
};

// --- Parser & Renderer bảng đơn giản từ Markdown-style ---
const parseSimpleTable = (text: string) => {
  const lines = text.trim().split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  // Kiểm tra: dòng đầu và dòng thứ hai phải có `|`
  if (!lines[0].startsWith('|') || !lines[1].startsWith('|')) return null;

  // Dòng thứ hai phải chứa dấu phân cách (---)
  if (!lines[1].includes('---')) return null;

  const headers = lines[0]
    .split('|')
    .map(h => h.trim())
    .filter(h => h !== '');

  const rows = lines.slice(2)
    .filter(line => line.startsWith('|'))
    .map(line => {
      return line
        .split('|')
        .map(cell => cell.trim())
        .slice(1, -1); // bỏ phần đầu & cuối nếu là `|`
    });

  return { headers, rows };
};

const MessageContent = ({ text }: { text: string }) => {
  const tableData = parseSimpleTable(text);

  if (tableData && tableData.headers.length > 0) {
    return (
      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {tableData.headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-gray-800 border-b border-gray-200"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="text-gray-800 break-words whitespace-pre-wrap">{text}</div>;
};

// --- Component chính ---
const ScheduleConsultantChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Xin chào! Tôi là Trợ lý Lịch trình Gemini 🌟\nHãy cho tôi biết bạn muốn sắp xếp công việc gì? (Ví dụ: "Lập lịch học 3 môn trong tuần này" hoặc gửi ảnh thời khóa biểu để tôi gợi ý cải thiện!)',
      sender: 'bot',
      expression: 'happy',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentBotExpression =
    isLoading ? 'loading' : messages.length > 0 && messages[messages.length - 1].sender === 'bot'
      ? messages[messages.length - 1].expression
      : 'happy';

  const callGeminiAPI = useCallback(async (prompt: string, imageFile: File | null = null, maxRetries = 3): Promise<string> => {
    setIsLoading(true);
    let lastError = 'Không thể kết nối đến AI.';

    try {
      let payload;
      if (imageFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        const imageData = base64.split(',')[1];

        payload = {
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: imageData,
                  },
                },
              ],
            },
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        };
      } else {
        payload = {
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
        };
      }

      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const data = await response.json();

          if (response.ok) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return typeof text === 'string' ? text.trim() : 'AI không thể trả lời câu hỏi này.';
          } else {
            lastError = `Lỗi ${response.status}: ${data.error?.message || 'Không xác định.'}`;
            console.error('API Error:', lastError, data);
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        } catch (error) {
          lastError = `Lỗi mạng: ${error instanceof Error ? error.message : String(error)}`;
          console.error('Network Error:', error);
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    } catch (err) {
      return `Lỗi xử lý hình ảnh: ${err instanceof Error ? err.message : 'Không rõ'}`;
    }

    return lastError;
  }, []);

  const handleSend = useCallback(async () => {
    if ((inputValue.trim() === '' && !uploadedImage) || isLoading) return;

    const userMsgText = inputValue.trim() || (uploadedImage ? '[Đã gửi một hình ảnh]' : '');
    const userMsg: Message = { id: Date.now(), text: userMsgText, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    const imageToSend = uploadedImage;
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const loadingMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: loadingMsgId, text: '', sender: 'bot', expression: 'loading' }]);

    const finalPrompt = inputValue.trim() || 'Hãy mô tả hình ảnh này và đề xuất cách sắp xếp lịch trình liên quan.';
    const botReply = await callGeminiAPI(finalPrompt, imageToSend);

    setMessages((prev) => {
      const filteredPrev = prev.filter((msg) => msg.id !== loadingMsgId);
      const botMsg: Message = {
        id: Date.now() + 2,
        text: botReply,
        sender: 'bot',
        expression: getRandomExpression(),
      };
      return [...filteredPrev, botMsg];
    });
    setIsLoading(false);
  }, [inputValue, uploadedImage, isLoading, callGeminiAPI]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  }, [handleSend]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận giọng nói.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
    };

    recognition.onerror = () => {
      alert('Lỗi khi nhận giọng nói. Vui lòng thử lại.');
    };

    recognition.onend = () => {
      if (inputValue.trim()) handleSend();
    };
  }, [inputValue, handleSend]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh.');
        return;
      }
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const removeImage = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="bg-white flex flex-col font-inter h-screen">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          .font-inter { font-family: 'Inter', sans-serif; }
          .bg-primary { background-color: #0d9488; }
          .bg-second { background-color: #0f766e; }
          .text-primary { color: #0d9488; }
        `}
      </style>

      <div className="flex-1 w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 sm:p-5 font-bold flex items-center space-x-3 shadow-md flex-shrink-0">
          <BotAvatar expression={currentBotExpression || 'happy'} />
          <h1 className="text-xl sm:text-2xl tracking-wide">Trợ lý Tư vấn Lịch trình AI</h1>
          <div className="ml-auto text-sm opacity-80 flex items-center space-x-1">
            <RefreshCw className="w-4 h-4" />
            <span>{MODEL_NAME.replace('-preview-09-2025', '')}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`py-5 px-4 sm:px-6 ${
                msg.sender === 'user' ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="max-w-3xl mx-auto flex items-start space-x-4">
                <div className="flex-shrink-0 pt-1">
                  {msg.sender === 'bot' ? (
                    <BotAvatar expression={msg.expression || 'happy'} />
                  ) : (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      B
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold mb-1 text-gray-700">
                    {msg.sender === 'bot' ? 'Gemini Consultant' : 'Bạn'}
                  </div>
                  {msg.expression === 'loading' && msg.sender === 'bot' ? (
                    <div className="flex items-center space-x-2 py-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang suy nghĩ...</span>
                    </div>
                  ) : (
                    <MessageContent text={msg.text} />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-200 flex-shrink-0 shadow-lg">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-end gap-3">
            {imagePreview && (
              <div className="relative w-full sm:w-auto max-w-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-20 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                  aria-label="Xóa ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center w-full space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isLoading
                    ? 'Đang xử lý...'
                    : uploadedImage
                    ? 'Mô tả hình ảnh (tùy chọn)...'
                    : 'Bạn muốn sắp xếp công việc gì?'
                }
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all duration-300 disabled:opacity-70 disabled:bg-gray-100 text-gray-700 shadow-inner"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-primary disabled:opacity-50"
                aria-label="Đính kèm hình ảnh"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={startListening}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-primary disabled:opacity-50"
                aria-label="Nói để nhập"
              >
                <Mic className="w-6 h-6" />
              </button>

              <button
                onClick={handleSend}
                disabled={isLoading || (!inputValue.trim() && !uploadedImage)}
                className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-second focus:outline-none focus:ring-4 focus:ring-primary/40 disabled:opacity-60 transition-all duration-200 shadow-md hover:shadow-lg"
                aria-label="Gửi"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleConsultantChat;