import { Outlet } from "react-router-dom";
// import SideBar ;
import SideBar from "../Modules/User/Sibebar/Sidebar";
interface PrivateLayoutProps{
    children: React.ReactNode;
}
export const PrivateLayout = ({children}: PrivateLayoutProps) =>{
     const token = localStorage.getItem("token");
    if (!token){
        return false;
    }
    else{
        return(
         <div className="flex w-full h-min-screen">
            {/* side bar */}
            <SideBar/>
            <main className="flex-1 w-full p-4 md:p-6 lg:p-8"> 
            {/* children of side bar */}
           {children ? children : <Outlet />}
           </main>
         </div>   
        )
    }
}