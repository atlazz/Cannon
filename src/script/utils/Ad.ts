import wx from "./wx";
import ws from "./ws.js";
import Global from "../Global";

let hasVideo = true;

let currentBannerPos: string = null;
let clickBannerCount: number = 0;

export const refreshCurrentBanner = () => {
    clickBannerCount++;
    if (currentBannerPos && clickBannerCount >= Global.config.banner_click_time) {
        clickBannerCount = 0;
        posShowBanner(currentBannerPos, true);
    }
}

export const hasVideoAd = (): boolean => {
    return hasVideo;
}

export const posShowBanner = (pos: string, force: boolean = false) => {
    if (!Laya.Browser.onMiniGame) return;
    let systemInfo = wx.getSystemInfoSync();
    let screenHeight = systemInfo.screenHeight;
    let screenWidth = systemInfo.screenWidth;
    let adWidth = Math.max(300, screenWidth * 300 / 350);// * 0.86
    let adHeight = adWidth * 0.348;
    let top = screenHeight - adHeight;
    let left = (screenWidth - adWidth) / 2;
    currentBannerPos = pos;
    ws.createBanner({
        pos,
        style: {
            left: left,
            top: top,
            width: adWidth,
            height: adHeight,
        },
        force,
    });
};

export const posHideBanner = (pos: string) => {
    if (!Laya.Browser.onMiniGame) return;
    currentBannerPos = null;
    ws.closeBanner(pos);
};

export const posShowVideo = (pos: string, onErrorCallback: Function, onCloseCallback: Function) => {
    if (Laya.Browser.onMiniGame && ws.createVideo) {
        ws.createVideo({
            pos: pos,
            success: (res) => {
                onCloseCallback && onCloseCallback(res);
            },
            fail: (res) => {
                hasVideo = false;
                console.log('NO VIDEO AD');
            }
        });
    } else {
        hasVideo = false;
        console.log('NO VIDEO AD');
        onErrorCallback && onErrorCallback();
    }
}