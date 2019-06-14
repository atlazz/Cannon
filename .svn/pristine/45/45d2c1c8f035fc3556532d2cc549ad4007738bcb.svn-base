import wx from "../utils/wx";
import ws from "../utils/ws.js";
import * as Ad from "../utils/Ad";
import Global from "../Global";

export default class Reward extends Laya.Script {
    static instance: Reward;

    private shareTimestampMap = {};
    private lastShareTimestamp: number = 0;
    private shareArgs: IArguments;

    constructor() {
        super();
        console.log("Reward constructor()");
        Reward.instance = this;
    }

    onAwake() {
        console.log("Reward onAwake()");
        Laya.Browser.onMiniGame && wx.onShow((e) => {
            let shareArgs = this.shareArgs;
            if (shareArgs && shareArgs.length) {
                let option = shareArgs[0] || {};
                let pos = option.pos;
                let success = option.success;
                let fail = option.fail;
                let complete = option.complete;
                try {
                    let now = Date.now();
                    if (success || fail) {
                        if (now - this.lastShareTimestamp > ((Global.config.share_delay || 5) * 1000)) {
                            Global.gameData.shareCount++;
                            Global.gameData.lastShareTimestamp = now;
                            this.shareTimestampMap[pos] = now;
                            success && success(e);
                            complete && complete(e);
                        } else {
                            this.shareTimestampMap[pos] = 0;
                            wx.showModal({
                                title: '提示',
                                content: Global.config.share_fail,
                                cancelText: '知道了',
                                confirmText: '重新发送',
                                success: (res) => {
                                    if (res.confirm) {
                                        this.share.apply(this, shareArgs);
                                    } else {
                                        fail && fail(e);
                                        complete && complete(e);
                                    }
                                }
                            });
                        }
                    } else {
                        this.shareTimestampMap[pos] = 0;
                        complete && complete(e);
                    }
                } finally {
                    this.lastShareTimestamp = 0;
                    this.shareArgs = null;
                }
            }
        });
    }

    reward({ pos, query, success, fail, complete }: { pos: string, query?: string, success?: Function, fail?: Function, complete?: Function }) {
        if (this.isShareState(pos)) {
            this.share({ pos, query, success, fail, complete });
        } else {
            this.video({ pos, success, fail, complete });
        }
    }

    share({ pos, query, success, fail, complete }: { pos: string, query?: string, success?: Function, fail?: Function, complete?: Function }) {
        if (!Laya.Browser.onMiniGame) {
            console.log('Laya.Browser.onMiniGame = false');
            fail && fail();
            complete && complete();
            return;
        }

        if (!this.isOnline() || !this.allowShare(pos)) {
            console.log('今日视频已看完');
            fail && fail();
            complete && complete();
            return;
        }

        let now = Date.now();
        let shareTimestamp = Number(this.shareTimestampMap[pos]);
        if (shareTimestamp && (now - shareTimestamp < Global.config.share_time * 1000)) {
            console.log('请稍等一会再操作');
            fail && fail();
            complete && complete();
            return;
        }
        if (success || fail) {
            this.shareTimestampMap[pos] = now;
        }
        this.lastShareTimestamp = Date.now();
        this.shareArgs = arguments;
        ws.share({ pos, query });
    }

    video({ pos, success, fail, complete }: { pos: string, success?: Function, fail?: Function, complete?: Function }) {
        if (!Laya.Browser.onMiniGame) {
            console.log('Laya.Browser.onMiniGame = false');
            fail && fail();
            complete && complete();
            return;
        }

        Ad.posShowVideo(pos, () => {
            console.log('今日视频已看完');
            fail && fail();
            complete && complete();
        }, (res) => {
            if ((res && res.isEnded) || res === undefined) {
                Global.gameData.videoCount++;
                Global.gameData.lastVideoTimestamp = Date.now();
                success && success();
            } else {
                fail && fail();
            }
            complete && complete();
        });
    }

    //允许转发
    allowShare(pos?: string): boolean {
        let flag = Global.config[pos + '_allow_share'];
        if ('boolean' === typeof flag) {
            return flag;
        } else {
            return Global.config.allow_share;
        }
    }

    //允许视频
    allowVideo(pos?: string): boolean {
        let flag = Global.config[pos + '_allow_video'];
        if ('boolean' === typeof flag) {
            return flag;
        } else {
            return Global.config.allow_video;
        }
    }

    //是否线上版本
    isOnline(): boolean {
        return Global.config.online;
    }

    //分享优先
    isShareFirst(pos?: string): boolean {
        let flag = Global.config[pos + '_share_first'];
        if ('boolean' === typeof flag) {
            return flag;
        } else {
            return Global.config.share_first;
        }
    }

    //分享次数
    getShareCount(): number {
        let now = new Date();
        let todayBeginTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (!Global.gameData.lastShareTimestamp || Global.gameData.lastShareTimestamp < todayBeginTimestamp) {
            Global.gameData.shareCount = 0;
        }
        return Global.gameData.shareCount;
    }

    //分享超过次数
    isOverShare(): boolean {
        return Global.config.share_number && Global.config.share_number <= this.getShareCount();
    }

    //视频次数
    getVideoCount(): number {
        let now = new Date();
        let todayBeginTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (!Global.gameData.lastVideoTimestamp || Global.gameData.lastVideoTimestamp < todayBeginTimestamp) {
            Global.gameData.videoCount = 0;
        }
        return Global.gameData.videoCount;
    }

    //视频超过次数
    isOverVideo(): boolean {
        return Global.config.video_number && Global.config.video_number <= this.getVideoCount();
    }

    //是否有视频可观看
    hasVideo(): boolean {
        return Ad.hasVideoAd();
    }

    isShareState(pos?: string): boolean {
        if (!this.isOnline() || !this.allowShare(pos)) {
            return false;
        } else if (this.allowVideo(pos) && this.hasVideo()) {
            if (this.isShareFirst(pos)) {
                if (this.isOverShare()) {
                    return this.isOverVideo();
                } else {
                    return true;
                }
            } else {
                return this.isOverVideo();
            }
        } else {
            return true;
        }
    }

}