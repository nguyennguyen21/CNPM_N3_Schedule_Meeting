// src/pages/IntroductionPage.tsx
import React from 'react';

const IntroductionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            Trải Nghiệm Tạo Lịch Làm Việc 
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Kết hợp công nghệ và thiết kế để giúp bạn và đội nhóm tổ chức cuộc họp, lên lịch và cộng tác hiệu quả — mọi lúc, mọi nơi.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="space-y-20">
          {/* Meeting Feature */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="md:flex">
              <div className="md:w-2/5 bg-gradient-to-br from-second to-primary flex items-center justify-center p-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-second rounded-full blur-xl opacity-30"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 text-white relative z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                  Tính năng chính
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Quản Lý Cuộc Họp Thông Minh
                </h2>
                <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-green-800">
                  <li>Tạo phòng họp ảo chỉ trong 1 click, hỗ trợ đến người tham gia</li>
                  <li>Chia sẻ màn hình, bật/tắt mic & camera dễ dàng</li>
      
                  <li>Bảo mật end-to-end – dữ liệu không bị rò rỉ</li>
                  <li>Tích hợp AI tóm tắt nội dung sau mỗi cuộc họp</li>
                </ul>
                <button className="mt-6 w-full md:w-auto px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-second transition-colors shadow-md hover:shadow-lg">
                  Bắt đầu cuộc họp ngay
                </button>
              </div>
            </div>
          </div>

          {/* Scheduler Feature */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="md:flex flex-row-reverse">
              <div className="md:w-2/5 bg-gradient-to-br from-second to-primary flex items-center justify-center p-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-second rounded-full blur-xl opacity-30"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 text-white relative z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                  Tự động hóa
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Lập Lịch Tự Động & Thông Minh
                </h2>
                <ul className="space-y-3 text-gray-600 list-disc pl-5 marker:text-green-500">
                  <li>Phân tích lịch biểu của bạn và người tham gia để đề xuất khung giờ tối ưu</li>
                  <li>Đồng bộ thời gian thực với Google Calendar, Outlook và iCal</li>
                  <li>Gửi email nhắc lịch tự động 15 phút trước cuộc họp</li>
                  <li>Hỗ trợ đặt lịch theo múi giờ – không lo lệch giờ quốc tế</li>
                  <li>Cho phép người khác đặt lịch vào thời gian rảnh của bạn qua link chia sẻ</li>
                </ul>
                <button className="mt-6 w-full md:w-auto px-6 py-3 bg-second text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg">
                  Tạo lịch biểu cá nhân
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-gradient-to-r from-primary to-green-700 rounded-2xl p-10 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Sẵn sàng nâng cao hiệu suất làm việc?
            </h3>
            <p className="mb-6 max-w-2xl mx-auto opacity-90">
              Tham gia hàng nghìn đội nhóm đang sử dụng nền tảng của chúng tôi để tổ chức họp và lên lịch mỗi ngày.
            </p>
            <button className="px-8 py-3 bg-white text-second font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
              Dùng thử miễn phí 14 ngày
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage;