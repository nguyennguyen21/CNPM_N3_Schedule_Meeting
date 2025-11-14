import { Route, Routes } from "react-router-dom";

import { PrivateRoutes } from "../Private/PrivateRoutes";

import { PublicRoutes } from "../Public/PublicRoutes";

import { PrivateLayout } from "../../Layouts/PrivateLayout";
import { NotFound } from "../../Pages/NotFound/NotFound";
export const MainRoutes  = () =>{
    return(
        <Routes>
        {PublicRoutes.map((route)=>(
            <Route key={route.path} path={route.path} element={route.element}/>
        ))}
        {PrivateRoutes.map((route)=>(
          <Route key={route.path} path = {route.path} element={
            <PrivateLayout>
                {route.element}
            </PrivateLayout>
          }
          />
        ))}
        <Route path="*" element={<NotFound />} />
        </Routes>
    )
}