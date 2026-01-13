import React, { useEffect, useRef, useState } from "react";
import {
  openWebview,
  closeApp,
  getRouteParams,
  getAccessToken,
  getPhoneNumber,
  getSetting,
  authorize,
  events,
} from "zmp-sdk/apis";
import { Button, Page, Spinner, Text } from "zmp-ui";
import background from "@/static/bg.svg";
export default function HomePage() {
  const isCalled = useRef(false);
  const [loading, setLoading] = useState(true);
  const generateTargetUrl = async () => {
    const params = await getRouteParams();
    const code = params?.code || "";
    const booking = params?.bk;
    let finalPaths = "";
    let tokenZalo = "";
    let tokenPhone = ""; 
    
    if (booking === "true") {
      tokenZalo = await getAccessToken();
      const phoneRes = await getPhoneNumber();
      tokenPhone = phoneRes.token ?? "";
      finalPaths = `s/${code}`;
    } else {
      finalPaths = `space/0001096`;
    }

    return `https://b.datlich.net/${finalPaths}?tokenName=${tokenZalo}&tokenPhone=${tokenPhone}`;
  };
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Khi người dùng bấm Back từ Webview, Mini App sẽ Visible trở lại
      if (document.visibilityState === "visible" && isCalled.current) {
        // TẮT LOADING để hiển thị giao diện Logo/Button của Mini App
        setLoading(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const handleAppShow = () => {
      if (isCalled.current) {
        closeApp();
      }
    };
    events.on("appShow", handleAppShow);
    const initApp = async () => {
      try {
        const { authSetting } = await getSetting();
        const hasUserInfo = authSetting["scope.userInfo"];
        const hasPhone = authSetting["scope.userPhonenumber"];
        if (!hasUserInfo && !hasPhone) {
          await authorize({
            scopes: ["scope.userInfo", "scope.userPhonenumber"],
          });
        }
        const targetUrl = await generateTargetUrl();
        openWebview({
          url: targetUrl,
          config: { style: "normal" },
          fail: (err) => {
            console.error("Mở webview thất bại:", err);
            closeApp();
            setLoading(false);
          },
        });
      } catch (error) {
        console.error("Lỗi khởi tạo:", error);
        closeApp();
      }
    };

    if (!isCalled.current) {
      initApp();
      isCalled.current = true;
    }

    return () => {
      events.off("appShow", handleAppShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const openBooking = async () => {
    setLoading(true);
    try {
      const url = await generateTargetUrl();
      openWebview({
        url,
        config: { style: "normal" },
        fail: () => setLoading(false)
      });
    } catch (e) {
      setLoading(false);
    }
  };
  const logoUrl = "https://app.playspace.vn/playspace_assets/img/PlaySpace.png";
  if (loading) {
    return (
      <Page
        className="flex items-center justify-center h-screen"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: "cover", // Phủ kín màn hình
          backgroundPosition: "center", // Căn giữa ảnh
          backgroundRepeat: "no-repeat",
        }}
      >
        <Spinner />
      </Page>
    );
  }
  return (
    <Page
      className="flex flex-col items-center justify-center h-screen space-y-4 text-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover", // Phủ kín màn hình
        backgroundPosition: "center", // Căn giữa ảnh
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="px-16 py-4">
        <img src={logoUrl} alt="Logo" />
      </div>
      <div className="flex flex-col space-y-2 w-full px-8">
        <Button className="bg-green-600" onClick={openBooking} fullWidth>
          Mở ứng dụng
        </Button>

        <Button variant="secondary" onClick={() => closeApp()} fullWidth>
          Thoát
        </Button>
      </div>
    </Page>
  );
}
