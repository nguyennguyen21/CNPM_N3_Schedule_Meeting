import type { RouteObject } from "react-router-dom";
import { EventPage } from "../../Pages/Event/Event";
import MeetingRoom from "../../Modules/MeetingRoom/MeetingRoom";
import MeetingLobby from "../../Modules/MeetingRoom/MeetingLobby";
import IntroductionPage from "../../Pages/Introduction/Itroduction";
import MeetingSetup from "../../Modules/MeetingRoom/MeetingSetup";

export const PrivateRoutes:RouteObject[] = [
    {
        path:"/Intro",
        element:<IntroductionPage/>
    },
    {
        path:"/eventForm",
        element:<EventPage/>
    },
    {
        path: "/meeting/:meetingId", // 1. Sửa chính tả + thêm :meetingId
        element: <MeetingRoom />,
    },
    {
         path:"/meeting/setup/:meetingId",
         element:<MeetingSetup /> ,
    },
    {
    path: "/meeting",
    element: <MeetingLobby />, // ← Trang lobby (không có :meetingId)
  },
]