import React, { useState } from "react";



// === Main Component ===
const SideBar: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [openSubMenus, setOpenSubMenus] = useState<Set<number>>(new Set());

  // Danh sách menu chính
  const menuItems = [
    {
      label: "Home",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
          <path d="M240-200h120v-200q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400v200h120v-360L480-740 240-560v360Zm-80 0v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H560q-17 0-28.5-11.5T520-160v-200h-80v200q0 17-11.5 28.5T400-120H240q-33 0-56.5-23.5T160-200Zm320-270Z" />
        </svg>
      ),
      active: true,
      path:"/intro",
    },
    {
      label: "Meeting",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
          <path d="M520-640v-160q0-17 11.5-28.5T560-840h240q17 0 28.5 11.5T840-800v160q0 17-11.5 28.5T800-600H560q-17 0-28.5-11.5T520-640ZM120-480v-320q0-17 11.5-28.5T160-840h240q17 0 28.5 11.5T440-800v320q0 17-11.5 28.5T400-440H160q-17 0-28.5-11.5T120-480Zm400 320v-320q0-17 11.5-28.5T560-520h240q17 0 28.5 11.5T840-480v320q0 17-11.5 28.5T800-120H560q-17 0-28.5-11.5T520-160Zm-400 0v-160q0-17 11.5-28.5T160-360h240q17 0 28.5 11.5T440-320v160q0 17-11.5 28.5T400-120H160q-17 0-28.5-11.5T120-160Zm80-360h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z" />
        </svg>
      ),
      path: "/meeting",
    },
    // {
    //   label: "Môn Học",
    //   icon: (
    //     <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
    //       <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Zm400-160v40q0 17 11.5 28.5T600-320q17 0 28.5-11.5T640-360v-40h40q17 0 28.5-11.5T720-440q0-17-11.5-28.5T680-480h-40v-40q0-17-11.5-28.5T600-560q-17 0-28.5 11.5T560-520v40h-40q-17 0-28.5 11.5T480-440q0 17 11.5 28.5T520-400h40Z" />
    //     </svg>
    //   ),
    //   submenu: ["CTDL & GT", "Document", "Project"],
    // },
    
    {
      label: "Schedule list",
      icon: (
        
<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 19H16L18 22H6L8 19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 9V19H14V9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19 3C19 4.5913 18.2625 6.11742 16.9497 7.24264C15.637 8.36786 13.8565 9 12 9C10.1435 9 8.36301 8.36786 7.05025 7.24264C5.7375 6.11742 5 4.5913 5 3L19 3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.625 12C7.96815 12 5.88991 13.2947 4.625 9.5C4.125 8 3.125 6 5.625 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15 12C16.6569 12 18.7351 13.2947 20 9.5C20.5 8 21.5 6 19 6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
        
      ),
      path: "/eventForm",
    },
    {
      label: "Profile",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
          <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-240v-32q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v32q0 33-23.5 56.5T720-160H240q-33 0-56.5-23.5T160-240Zm80 0h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
        </svg>
      ),
      path: "profile.html",
    },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setOpenSubMenus(new Set()); // Close all submenus
  };

  const toggleSubMenu = (index: number) => {
    const newOpenSubMenus = new Set(openSubMenus);
    if (newOpenSubMenus.has(index)) {
      newOpenSubMenus.delete(index);
    } else {
      newOpenSubMenus.clear(); // Close others (like original)
      newOpenSubMenus.add(index);
    }
    setOpenSubMenus(newOpenSubMenus);
  };

  return (
    
      <nav
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } transition-all duration-300 ease-in-out h-screen sticky top-0 self-start bg-primary border-r border-text flex-shrink-0 overflow-hidden`}
      >
        <ul className="p-1">
          {/* Header */}
          <li className="flex justify-between items-center mx-2 mb-4">
            <span
              className={`font-semibold text-lg ${
                sidebarOpen ? "block" : "hidden"
              }`}
            >
              Schedule
            </span>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded hover:bg-[#222533] transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e8eaed"
                className={`transition-transform duration-150 ${
                  !sidebarOpen ? "rotate-180" : ""
                }`}
              >
                <path d="m313-480 155 156q11 11 11.5 27.5T468-268q-11 11-28 11t-28-11L228-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 27.5-11.5T468-692q11 11 11 28t-11 28L313-480Zm264 0 155 156q11 11 11.5 27.5T732-268q-11 11-28 11t-28-11L492-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 27.5-11.5T732-692q11 11 11 28t-11 28L577-480Z" />
              </svg>
            </button>
          </li>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubMenu(index)}
                    className={`w-full flex items-center gap-3 p-3 rounded hover:bg-[#222533] text-text transition-colors ${
                      sidebarOpen ? "justify-start" : "justify-center"
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span
                      className={`${
                        sidebarOpen ? "block" : "hidden"
                      } text-white`}
                    >
                      {item.label}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#e8eaed"
                      className={`transition-transform duration-200 text -${
                        openSubMenus.has(index) ? "rotate-180" : ""
                      } ${sidebarOpen ? "block" : "hidden"}`}
                    >
                      <path d="M480-361q-8 0-15-2.5t-13-8.5L268-556q-11-11-11-28t11-28q11-11 28-11t28 11l156 156 156-156q11-11 28-11t28 11q11 11 11 28t-11 28L508-372q-6 6-13 8.5t-15 2.5Z" />
                    </svg>
                  </button>
                  <ul
                    className={`overflow-hidden transition-all duration-300 ${
                      openSubMenus.has(index) && sidebarOpen
                        ? "max-h-40 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="pl-8">
                      {item.submenu.map((sub, i) => (
                        <li key={i}>
                          <a
                            href="#"
                            className="block py-2 hover:bg-[#222533] rounded"
                          >
                            {sub}
                          </a>
                        </li>
                      ))}
                    </div>
                  </ul>
                </div>
              ) : (
                <a
                  href={item.path}
                  className={`flex items-center gap-3 p-3 rounded hover:bg-[#222533] text-white transition-colors ${
                    sidebarOpen ? "justify-start" : "justify-center"
                  } ${item.active ? "text-" : ""}`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span
                    className={`${
                      sidebarOpen ? "block" : "hidden"
                    } flex-grow`}
                  >
                    {item.label}
                  </span>
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
   
  );
};

export default SideBar;