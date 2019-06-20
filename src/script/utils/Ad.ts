import wx from "./wx";
import ws from "./ws.js";
import Global from "../Global";

let hasVideo = true;

let currentBannerPos: string = null;
let clickBannerCount: number = 0;

let banners = {};   // list of banner obj
let bannerUid = {};   // list of unit id
let bannerCnt = {};
let currBannerIdx: number;
let banner1;
let banner2;
let banner1Cnt: number = 0;
let banner2Cnt: number = 0;

export const randomlyGetBanner = () => {
    if (!Laya.Browser.onMiniGame) return;
    // 低版本SDK，无此方法返回
    if (!wx.createBannerAd) return;
    // initialize
    if (Object.keys(bannerUid).length === 0) {
        for (let i = 1; i <= Global.config.banner_number; i++) {
            bannerUid[i] = Global.config.banner[i];
            console.log("init uid: ", i, bannerUid[i])
            banners[i] = wxCreatBanner(bannerUid[i]);
            console.log("init bannerAD: ", i, banners[i])
            bannerCnt[i] = 0;

            // onError, 不写上不给show...
            banners[i].onError((errMsg) => {
                console.log("banner onError :", errMsg)
            })
        }
    }
    // randomly select
    currBannerIdx = Math.ceil(Math.random() * Global.config.banner_number);
    // check counter
    if (bannerCnt[currBannerIdx] >= Global.config.show_number) {
        // recreate
        banners[currBannerIdx] && banners[currBannerIdx].destroy();
        banners[currBannerIdx] = wxCreatBanner(bannerUid[currBannerIdx]);
        bannerCnt[currBannerIdx] = 0;
    }
    // update counter
    bannerCnt[currBannerIdx]++;
}

export const wxCreatBanner = (uid: string): any => {
    if (!Laya.Browser.onMiniGame || !wx.createBannerAd) return;
    let systemInfo = wx.getSystemInfoSync();
    let screenHeight = systemInfo.screenHeight;
    let screenWidth = systemInfo.screenWidth;
    let adWidth = Math.max(300, screenWidth * 300 / 350);// * 0.86
    let adHeight = adWidth * 0.348;
    let top = screenHeight - adHeight;
    let left = (screenWidth - adWidth) / 2;
    return wx.createBannerAd({
        adUnitId: uid,
        style: {
            left: left,
            top: top,
            width: adWidth,
            height: adHeight,
        }
    });
}

export const setStyle = (banner, isMini: boolean, bannerTop: number) => {
    if (!Laya.Browser.onMiniGame) return;
    if (!banner) return;
    let systemInfo = wx.getSystemInfoSync();
    let screenHeight = systemInfo.screenHeight;
    let screenWidth = systemInfo.screenWidth;
    let adWidth = screenWidth;
    if (isMini) {
        adWidth = Math.max(300, screenWidth * 300 / 350);// * 0.86
    }
    let adHeight = adWidth * 0.348;
    // defalut at bottom
    let top: number = screenHeight - adHeight;
    // over write
    if (bannerTop !== -1) {
        top = bannerTop / Laya.stage.height * screenHeight;
    }
    let left = (screenWidth - adWidth) / 2;
    console.log("isMini: ", isMini, "top: ", top)
    banner.style.left = left;
    banner.style.top = top;
    banner.style.width = adWidth;
    banner.style.height = adHeight;
}

export const showBanner = (isMini: boolean = false, bannerTop: number = -1) => {
    if (!Laya.Browser.onMiniGame) return;
    setStyle(banners[currBannerIdx], isMini, bannerTop);
    banners[currBannerIdx] && banners[currBannerIdx].show();
    console.log("show banner uid: ", currBannerIdx, "bannerAD: ", banners[currBannerIdx])
}

export const hideBanner = () => {
    if (!Laya.Browser.onMiniGame) return;
    banners[currBannerIdx] && banners[currBannerIdx].hide();
}


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

export const posShowBanner = (pos: string, force: boolean = false): any => {
    if (!Laya.Browser.onMiniGame) return;
    let systemInfo = wx.getSystemInfoSync();
    let screenHeight = systemInfo.screenHeight;
    let screenWidth = systemInfo.screenWidth;
    let adWidth = Math.max(300, screenWidth * 300 / 350);// * 0.86
    let adHeight = adWidth * 0.348;
    let top = screenHeight - adHeight;
    let left = (screenWidth - adWidth) / 2;
    currentBannerPos = pos;
    return ws.createBanner({
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
                console.log("error res: ", res);
                if (Global.gameData.videoCount <= 11) {
                    ws.traceEvent("errVideoCnt_" + Global.gameData.videoCount);
                }
                else {
                    // 11次以上
                    ws.traceEvent("errVideoCnt_11");
                }
                if (res && res.errMsg) {
                    ws.traceEvent("errCode_" + res.errCode);
                    // 扩充记录错误码及错误信息
                    Global.gameData.videoErr["errCode_" + res.errCode] = res.errMsg;
                    console.log("errCode: " + res.errCode);
                    console.log("errMsg: " + res.errMsg);
                }
                onErrorCallback && onErrorCallback();
            }
        });
    } else {
        hasVideo = false;
        console.log('NO VIDEO AD');
        onErrorCallback && onErrorCallback();
    }
}