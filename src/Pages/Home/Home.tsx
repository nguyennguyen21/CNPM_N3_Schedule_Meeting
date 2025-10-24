import HOME_1 from '../../assets/HOME_FIRST.png';
import HOME_2 from '../../assets/HOME_SECOND.png';
import { BMO } from './BMO';
import { useNavigate } from 'react-router-dom'
import WeeklyCalendar from '../../Modules/Calander/Calender';

const Home = () => {
   const navigate = useNavigate();
   const RegisterClick = () => {
    // Chuyển hướng đến route mong muốn, ví dụ: 
    navigate('/auth/register');
  };
   const LoginClick = () => {
    // Chuyển hướng đến route mong muốn, ví dụ: 
    navigate('/auth/login');
  };
   const IntroClick = () => {
    // Chuyển hướng đến route mong muốn, ví dụ: 
    navigate('/intro');
  };
  return (
    <div className=" bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-20">
        
        {/* 🎯 Hero Section */}
        <section className="relative bg-gradient-to-r from-primary to-second text-white rounded-3xl overflow-hidden shadow-2xl mt-6">
          <div className="absolute inset-0 opacity-10 bg-[url('../../assets/HOME_FIRST.png')] bg-cover bg-center"></div>
          <div className="relative mx-auto px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/2 text-center md:text-left space-y-6">
              <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium">
                Plan • Focus • Grow
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Master Your Time,<br /> Master Your Life
              </h1>
              <p className="text-xl opacity-90 max-w-lg">
                A simple, private, and powerful weekly planner—built for students, creators, and busy minds who value focus over noise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button onClick={RegisterClick} className="bg-white text-primary font-bold px-8 py-3.5 rounded-xl shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02]">
                  Register
                </button>
                <button onClick={LoginClick} className=" bg-transparent border-2 border-white text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
                  Login
                </button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <img
                  src={HOME_1}
                  alt="Weekly planner interface"
                  className="w-full max-w-md rounded-2xl shadow-2xl border-8 border-white/30"
                />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-yellow-400 rounded-full opacity-70 blur-xl"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500 rounded-full opacity-60 blur-2xl"></div>
              </div>
            </div>
          </div>
        </section>

       
      {/* Features Section */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Why This Works</h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
          Built for students, freelancers, and busy professionals who want control over their time.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Simple & Intuitive',
              desc: 'Drag, drop, and plan in seconds—no learning curve.',
            },
            {
              title: 'Stay Consistent',
              desc: 'Weekly view helps you build lasting habits.',
            },
            {
              title: 'Your Data, Yours',
              desc: 'All schedules saved securely in your browser (localStorage).',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                {i + 1}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

        {/* 💡 Why It Works */}
        <section className="flex flex-col md:flex-row items-center gap-12 bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="md:w-1/2">
            <img
              src={HOME_2}
              alt="Focus and productivity"
              className="rounded-2xl shadow-lg w-full"
            />
          </div>
          <div className="md:w-1/2 space-y-6">
            <h2 className="text-3xl font-bold">Why People Love This Planner</h2>
            <p className="text-gray-600">
              Traditional calendars overwhelm you with options. Ours helps you **simplify**.
            </p>
            <div className="space-y-4">
              {[
                ' Reduce decision fatigue with a clear weekly structure',
                ' Boost consistency by visualizing your routine',
                ' Lower stress—know exactly what to do, when to do it',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-gray-700">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 🧭 How It Works */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Get Started in 3 Simple Steps</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-12">
            No signup. No tutorial. Just pure productivity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Open the planner', desc: 'Visit the app—no login needed.' },
              { step: 2, title: 'Drag & drop tasks', desc: 'Assign activities to days and time slots.' },
              { step: 3, title: 'Follow your plan', desc: 'Stay on track, feel accomplished every day.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 font-bold text-xl">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-600 px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 💬 Testimonials */}
        <section className="bg-gray-50 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Trusted by Students & Creators</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {[
              {
                quote: 'I used to procrastinate all day. Now I plan my week every Sunday—and actually follow it!',
                author: '— Mai, University Student',
              },
              {
                quote: 'Finally, a planner that doesn’t feel like work. Simple, fast, and mine alone.',
                author: '— Linh, Freelance Designer',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 italic"
              >
                <p className="text-gray-700 mb-4">“{item.quote}”</p>
                <p className="text-gray-500 font-medium">{item.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🤖 BMO Assistant */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Your AI-Powered Planning Buddy</h2>
            <p className="text-gray-600 mt-2">Get smart suggestions to balance work, rest, and growth.</p>
          </div>
          <BMO />
        </section>

        {/* 📅 Weekly Calendar */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Your Week, At a Glance</h2>
            <p className="text-gray-600 mt-2">Drag, edit, and organize your life in real time.</p>
          </div>
          <div className="max-w-5xl mx-auto">
            <WeeklyCalendar />
          </div>
        </section>

        {/* 🚀 Final CTA */}
        <section className="text-center py-16 bg-gradient-to-r from-primary/80 to-second/80 rounded-3xl text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Future Self Will Thank You</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
            Start today. Build consistency. Reclaim your time.
          </p>
          <button onClick={IntroClick} className="bg-white text-primary font-bold px-10 py-4 rounded-xl text-lg shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105">
            Create My Free Schedule Now
          </button>
          <p className="mt-4 text-white/70 text-sm">No email. No payment. Forever free.</p>
        </section>
      </div>
    </div>
  );
};

export default Home;