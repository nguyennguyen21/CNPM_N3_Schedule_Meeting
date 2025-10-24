import Home from "../../Pages/Home/Home";
import { LoginPage } from "../../Pages/Login/Login";
import { RegisterPage } from "../../Pages/Register/Register";
import type { RouteObject } from "react-router-dom";

export const PublicRoutes : RouteObject[] =[
    {
        path:"/",
        element:<Home/>,
    },
    {
         path:"/auth/login",
        element:<LoginPage/>,
    },
    {
         path:"/auth/register",
        element:<RegisterPage/>,
    }
]