import { BASE_URL, imgUrl } from "@/constants/config";
import { CourtInfo } from "@/models/court";
import { fetchCourtInfo } from "@/services/ground_service";
import { checkIsOpen } from "@/utils/date-utils";
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
  showOAWidget,
} from "zmp-sdk/apis";
import { Button, Icon, Page, Spinner, Text } from "zmp-ui";

export default function HomePage() {
  const isCalled = useRef(false);
  const [loading, setLoading] = useState(true);
  const [courtData, setCourtData] = useState<CourtInfo | null>(null);
  const [oaIdFromParams, setOaIdFromParams] = useState("");
  const renderOA = (id: string | null = null) => {
    const targetOaId = id || oaIdFromParams;
    setTimeout(() => {
      showOAWidget({
        id: "oaWidget",
        oaId: targetOaId,
        guidingText: "Nhận thông báo trải nghiệm tốt hơn",
        color: "#0068FF",
        onStatusChange: (status) => console.log("OA Status:", status),
      });
    }, 100);
  };
  const getAuthData = async () => {
    const { authSetting } = await getSetting();
    const hasUserInfo = authSetting["scope.userInfo"];
    const hasPhone = authSetting["scope.userPhonenumber"];
    if (!hasUserInfo && !hasPhone) {
      await authorize({
        scopes: ["scope.userInfo", "scope.userPhonenumber"],
      });
    }
    const tokenZalo = await getAccessToken();
    const phoneRes = await getPhoneNumber();
    return { tokenZalo, tokenPhone: phoneRes.token ?? "" };
  };
  const openBooking = async (isAuto = false) => {
    setLoading(true);
    try {
      const params = await getRouteParams();
      const code = params?.code || "";
      const booking = params?.bk === "true";
      let finalPaths = "";
      let authData = { tokenZalo: "", tokenPhone: "" };
      if (booking || code !== null || code !== "") {
        authData = await getAuthData();
        finalPaths = `s/${code}`;
      } else {
        authData = await getAuthData();
        finalPaths = `space/0001125`;
      }
      const targetUrl = `${BASE_URL}/${finalPaths}?zalo="MiniApp"&tokenName=${authData.tokenZalo}&tokenPhone=${authData.tokenPhone}`;
      openWebview({
        url: targetUrl,
        config: { style: "normal" },
        fail: (err) => {
          console.error("Mở webview thất bại:", err);
          setLoading(false);
          if (isAuto) closeApp();
        },
      });
    } catch (e) {
      console.error("Lỗi:", e);
      setLoading(false);
    }
  };
  const isOpen = checkIsOpen(courtData?.OpenTime, courtData?.CloseTime);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isCalled.current) {
        setLoading(false);
        renderOA();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const handleAppShow = () => {
      if (isCalled.current) {
        closeApp();
      }
    };
    events.on("appShow", handleAppShow);

    const checkAutoInit = async () => {
      const params = await getRouteParams();
      const comId = params?.comId ? params?.comId : "0001125";
      const customOaId = params?.oaId;
      if (comId) {
        const data = await fetchCourtInfo(comId);
        if (data.Message === "Success") {
          setCourtData(data);
        }
      }
      if (customOaId) {
        setOaIdFromParams(customOaId);
      }
      if (params?.bk === "true") {
        openBooking(true);
      } else {
        setLoading(false);
        renderOA(customOaId);
      }
    };
    if (!isCalled.current) {
      checkAutoInit();
      isCalled.current = true;
    }

    return () => {
      events.off("appShow", handleAppShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  if (loading || !courtData) {
    return (
      <Page
        className="flex items-center justify-center h-screen"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Spinner />
      </Page>
    );
  }
  return (
    <Page className="bg-gray-100 min-h-screen relative">
      <div
        className="h-60 w-full"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="flex items-center text-white">
          <img src={imgUrl} alt="Logo" />
        </div>
      </div>
      <div className="px-4 -mt-12 space-y-4 relative z-10">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h1 className="text-xl font-bold uppercase mb-4">
            {courtData.ComName}
          </h1>
          <div className="space-y-3 text-gray-600 text-sm">
            <div className="flex items-center">
              <Icon icon="zi-location" className="mr-2 text-blue-500" />
              <span>{courtData.Address}</span>
            </div>
            <div className="flex items-center">
              <Icon icon="zi-call" className="mr-2 text-blue-500" />
              <span>Hotline: {courtData?.Phone}</span>
            </div>
            <div className="flex items-center">
              <Icon icon="zi-clock-1" className="mr-2 text-blue-500" />
              <span>
                Mở cửa: {courtData.OpenTime} - {courtData.CloseTime}
              </span>
            </div>
            <div
              className={`inline-block text-white px-3 py-1 rounded text-xs font-bold ${
                isOpen ? "bg-green-500" : "bg-red-500"
              }`}
            >
              ● {isOpen ? "Đang mở cửa" : "Đã đóng cửa"}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-700 mb-4">
            Đăng nhập bằng số điện thoại để đặt lịch hẹn
          </p>
          <Button
            className="bg-green-600"
            onClick={() => openBooking(false)}
            fullWidth
          >
            Tiếp tục với Zalo
          </Button>
          {oaIdFromParams !== null && oaIdFromParams !== "" && (
            <div id="oaWidget" className="my-2" />
          )}
          <p className="text-[10px] text-gray-400 mt-4 px-4 leading-tight">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng của chúng tôi.
          </p>
        </div>
      </div>
    </Page>
  );
}
