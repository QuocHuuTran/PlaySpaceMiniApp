import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  ZMPRouter,
} from "zmp-ui";
import SnackbarProvider from "zmp-ui/snackbar-provider";
import { AppProps } from "zmp-ui/app";
import { Navigate } from "react-router-dom";
import HomePage from "@/pages/index";
import { Suspense } from "react";
const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <ZMPRouter>
          <Suspense fallback={<div />}>
          <AnimationRoutes> 
            {/* <Route path="/" element={<LoadingPage/>}/> */}
            <Route path="/" element={<HomePage/>}/>
            <Route path="*" element={<Navigate to="/" />} />
          </AnimationRoutes>
          </Suspense>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
