import { ui } from "./../../ui/layaMaxUI";
import GameScene from "./GameScene";
import CannonSelect from "./CannonSelect";
import * as Const from "../Const";
import wx from "../utils/wx";
import ws from "../utils/ws.js";
import Global from "../Global";
import * as Ad from "../utils/Ad";
import Navigator from "../utils/Navigator";
import Loader from "../utils/Loader";

export default class HomeView extends ui.home.HomeViewUI {
    static instance: HomeView;

    private nav: Navigator;

    /**
     * 打开该单例页面，触发onOpened
     * @param param  onOpened方法的传参
     */
    static openInstance(param?: any) {
        if (HomeView.instance) {
            Ad.posShowBanner(Const.BannerPos.HomeView, true);
            HomeView.instance.onOpened(param);
        } else {
            Laya.Scene.open(Const.URL_HomeView, false, param);
        }
    }

    onOpened(param?: any) {
        console.log("HomeView onOpened()");
        this.visible = true;
        this.label_level.changeText("关卡：" + Global.gameData.stageIndex);
        // 刷新 home icon
        this.nav && this.nav.loadHomeIconInfoList();
        // unlock icon
        this.refreshUnlock();
    }

    /**首页图标列表*/
    private iconInfosList: any[] = [];
    /**当前显示首页图标*/
    private currentIconInfoList: any[] = [];

    private isGameDataLoaded: boolean = false;

    private cannonScene3D: Laya.Scene3D;

    // 测试接口开始 <==========================
    public isTest: boolean = false;
    public testStageIdx: number;
    // 测试接口结束 <==========================

    /** 机型系统判断 */
    public systemName;

    constructor() {
        super();
        console.log("HomeView constructor()");
        HomeView.instance = this;
        GameScene.openInstance();
        this.label_version.changeText("v" + Const.VERSION);
    }

    onEnable() {
        console.log("HomeView onEnable()");
        if (Laya.Browser.onMiniGame) {
            this.initWeixin();
        } else {
            this.onGameDataLoaded();
        }
        Loader.loadZip(Const.cdnUrl, "res", Laya.Handler.create(this, (res) => {
            Laya.loader.load(Const.StageTexUrl, Laya.Handler.create(this, () => {
                // CannonSelect.openInstance();
                Laya.timer.frameLoop(1, this, this.onResEnable);
            }));
        }));
    }

    private onResEnable() {
        if (GameScene.instance && GameScene.instance.ballBox && GameScene.instance.cannon) {
            if (GameScene.instance && Global.gameData.cannonType != Const.CannonType.DEFAULT) {
                GameScene.instance.cannonType = Global.gameData.cannonType;
                GameScene.instance.newCannon();
            }
            this.refreshUnlock();
            this.bindButtons();
            Laya.timer.clear(this, this.onResEnable);
        }
    }
    /**绑定按钮 */
    private bindButtons() {
        // start game
        this.btn_start.on(Laya.Event.CLICK, this, () => {
            let scaleX: number = this.btn_start.scaleX;
            let scaleY: number = this.btn_start.scaleY;
            Laya.Tween.to(this.btn_start, { alpha: 0.8, scaleX: scaleX * 0.9, scaleY: scaleY * 0.9 }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
                Laya.Tween.to(this.btn_start, { alpha: 1, scaleX: scaleX, scaleY: scaleY }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
                    if (GameScene.instance && GameScene.instance.state != Const.GameState.START) {
                        ws.traceEvent("Click_Startgame");
                        // hide home view
                        this.hide();
                        // show game scene
                        GameScene.instance.state = Const.GameState.START;
                        GameScene.openInstance();
                    }
                }));
            }));
        });
        // sound control
        this.btn_sound.on(Laya.Event.CLICK, this, () => {
            Global.gameData.soundEnabled = !Global.gameData.soundEnabled;
            this.btn_sound.gray = !Global.gameData.soundEnabled;
            // play sound
            if (Laya.Browser.onMiniGame && Global.gameData.soundEnabled) {
                Laya.SoundManager.playSound(Const.soundUrl);
            }
        });
        // vibration control
        this.btn_vibration.on(Laya.Event.CLICK, this, () => {
            Global.gameData.vibrationEnabled = !Global.gameData.vibrationEnabled;
            this.btn_vibration.gray = !Global.gameData.vibrationEnabled;
            if (Laya.Browser.onMiniGame && Global.gameData.vibrationEnabled) {
                wx.vibrateShort();
            }
        });
        // jump to sence: cannon select
        this.btn_cannon.on(Laya.Event.CLICK, this, this.onclick_cannon);

        // 测试接口开始 <==========================
        this.btn_test.gray = !this.isTest;
        this.btn_test.on(Laya.Event.CLICK, this, () => {
            this.isTest = !this.isTest;
            this.btn_test.gray = !this.isTest;
            this.testStageIdx = 1;
        });
        // 测试接口结束 <==========================
        //抽屉打开
        // this.drawerOpenButton.on(Laya.Event.MOUSE_DOWN, this, () => {
        //     this.drawerOpenAni.play(undefined, false);
        //     this.initDrawerIcons("game_drawer");
        // });
        // //抽屉关闭
        // this.drawerCloseButton.on(Laya.Event.MOUSE_DOWN, this, () => {
        //     this.drawerCloseAni.play(undefined, false);
        //     ws.hideGameAd("game_drawer");
        // });
        // //更多游戏打开
        // this.moreGameOpenButton.on(Laya.Event.MOUSE_DOWN, this, () => {
        //     this.moreGameOpenAni.play(undefined, false);
        //     this.initMoreGameIcons("game_more");
        // });
        // //更多游戏关闭
        // this.moreGameCloseButton.on(Laya.Event.MOUSE_DOWN, this, () => {
        //     this.moreGameCloseAni.play(undefined, false);
        //     ws.hideGameAd("game_more");
        // });
    }

    private onclick_cannon() {
        CannonSelect.openInstance();
        this.hide();
    }

    private hide() {
        Ad.posHideBanner(Const.BannerPos.HomeView);
        this.visible = false;
    }

    /**微信环境初始化*/
    private initWeixin() {
        wx.showShareMenu({
            withShareTicket: true
        });
        wx.onShareAppMessage(() => {
            let option = ws.createShareOptions({ pos: 'ShareAppButton' });
            return {
                title: option.title,
                imageUrl: option.imageUrl,
                query: option.query,
            }
        });
        ws.init({
            host: 'ws.lesscool.cn', // 暂时用这个域名，后面会支持api.websdk.cn这个域名
            version: Const.VERSION, // 当前的小游戏版本号，只能以数字
            appid: 1124, // 此项目在云平台的appid
            secret: '79ce022eb0ca47bfde9bc7e753df2074', // 此项目在云平台的secret, 用于与后端通信签名
            share: {
                title: '全民欢乐，天天游戏！', // 默认分享文案
                image: 'http://oss.lesscool.cn/fcdh/96d172496dbafa4ab9c8335a7133476c.png', // 默认分享图片
            },
        })
        this.loginWs();
    }

    /**登录ws后台*/
    private loginWs() {
        ws.traceEvent('WS_LOGINING');
        wx.showLoading({ title: '登录中', mask: true });
        ws.onLoginComplete(this.onLoginComplete.bind(this));
        ws.login();
    }

    /**登录ws后台完成*/
    private onLoginComplete(res, gameData) {
        if (ws.getLoginStatus() === 'success') {
            ws.traceEvent('WS_LOGINED');
            wx.hideLoading();
            console.log('ws.conf', ws.conf); // 通用配置
            console.log('ws.user', ws.user); // 用户信息
            console.log('ws.data', ws.data); // 本地保存的游戏数据
            this.loadConfig();
            this.loadGameData(gameData);
        } else if (ws.getLoginStatus() === 'fail') {
            ws.traceEvent('WS_LOGIN_FAIL');
            wx.hideLoading();
            wx.showModal({
                title: '登陆失败',
                content: '请允许授权',
                confirmText: '重新登陆',
                cancelText: '关闭',
                success(res) {
                    wx.showLoading({ title: '登录中', mask: true });
                    ws.login();
                }
            });
        }
    }

    /**后台配置加载完成*/
    private loadConfig() {
        (<any>Object).assign(Global.config, ws.conf);
    }

    /**加载后台游戏数据*/
    private loadGameData(gameData) {
        if (gameData && gameData.updateTimestamp) {
            if (ws.data && ws.data.updateTimestamp && ws.data.updateTimestamp > gameData.updateTimestamp) {
                ws.setAllData(ws.data, true);
            } else {
                ws.setAllData(gameData);
            }
        } else if (!ws.data || !ws.data.updateTimestamp) {
            ws.setAllData(Global.gameData, true);
        }
        Global.gameData = (<any>Object).assign(Global.gameData, ws.data);
        //关闭更新游戏数据
        wx.onHide(() => {
            this.updateGameData(true);
        });
        //刷新当前广告banner
        ws.onShow(() => {
            Ad.refreshCurrentBanner();
        });
        // this.initHomeIcons(["home_icon_1", "home_icon_2", "home_icon_3", "home_icon_4", "home_icon_5", "home_icon_6", "home_icon_7", "home_icon_8", "home_icon_9", "home_icon_10"]);

        /** init navigation */
        this.nav = new Navigator(ws);
        // home icon
        this.box_homeIcon.visible = true;
        this.nav.createHomeIcons(this.box_homeIcon, this.box_homeIcon, ["home_icon_1", "home_icon_2", "home_icon_3", "home_icon_4", "home_icon_5", "home_icon_6", "home_icon_7", "home_icon_8", "home_icon_9", "home_icon_10"]);

        this.box_drawer.visible = true;
        // this.btn_moreGameOpen.visible = true;
        this.onGameDataLoaded();
    }

    /**游戏数据加载完成*/
    private onGameDataLoaded() {
        console.log('onGameDataLoaded', Global.gameData);
        this.isGameDataLoaded = true;
        Ad.posShowBanner(Const.BannerPos.HomeView);

        /** unlock icon */
        this.refreshUnlock();

        /** get system name */
        this.systemName = "Android";
        if (Laya.Browser.onMiniGame && wx.getSystemInfoSync().system.indexOf("iOS") >= 0) {
            this.systemName = "IOS";
        }
        /** show */
        // this.label_highScore.visible = true;
        this.label_level.changeText("关卡：" + Global.gameData.stageIndex);
        this.label_level.visible = true;
        // 调整钻石及其数量位置居中
        this.icon_diamond.x = this.stage.width / 2 - (this.text_diamond.text.length * this.text_diamond.fontSize + this.text_diamond.x) / 2;
        this.icon_diamond.visible = true;
    }

    /**提交游戏数据*/
    updateGameData(post: boolean) {
        Global.gameData.updateTimestamp = Date.now();
        post && console.log('updateGameData', Global.gameData);
        Laya.Browser.onMiniGame && ws.setAllData(Global.gameData, post);
    }

    /**图标点击*/
    private onIconClick(pos: string, ad: any, redirect = true) {
        ws.tapGameAd({ pos, ad, redirect, });
    }

    private refreshUnlock() {
        // unlock icon
        if (Global.gameData.tutorialStep < 5 || (Global.gameData.stageIndex === 1 && Global.gameData.tutorialStep === 5)) {
            Global.gameData.tutorialStep = 0;
            this.btn_cannon.alpha = 0.7;
            var lock: Laya.Image = this.btn_cannon.getChildByName("lock") as Laya.Image;
            lock && (lock.visible = true);
            this.btn_cannon.off(Laya.Event.CLICK, this, this.onclick_cannon);
        }
        if (Global.gameData.tutorialStep >= 5 || Global.gameData.stageIndex > 2) {
            Global.gameData.tutorialStep = 5;
            this.btn_cannon.alpha = 1;
            var lock: Laya.Image = this.btn_cannon.getChildByName("lock") as Laya.Image;
            lock && (lock.visible = false);
            this.btn_cannon.on(Laya.Event.CLICK, this, this.onclick_cannon);
        }
        if (GameScene.instance) {
            if (Global.gameData.tutorialStep >= 2) {
                GameScene.instance.btn_rewardBullet.visible = true;
            }
            if (Global.gameData.tutorialStep >= 3) {
                GameScene.instance.btn_rewardCannon.visible = true;
            }
            if (Global.gameData.tutorialStep >= 4) {
                GameScene.instance.btn_cannonOpen.visible = true;
            }
        }
    }

    // /**抽屉图标*/
    // private initDrawerIcons(pos: string) {
    //     this.drawerList.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
    //         let iconInfo = this.drawerList.array[index];
    //         if (iconInfo) {
    //             cell.visible = true;
    //             //注册点击
    //             cell.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, [pos, iconInfo]);
    //             //图片
    //             let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
    //             iconImage && iconImage.loadImage(iconInfo.icon);
    //             //名称
    //             let titleLabel = cell.getChildByName("titleLabel") as Laya.Label;
    //             titleLabel && titleLabel.changeText(iconInfo.title);
    //             //提示
    //             let tips = cell.getChildByName("tips");
    //             if (tips) {
    //                 let tipsLabel = tips.getChildByName("tipsLabel") as Laya.Label;
    //                 tipsLabel && tipsLabel.changeText(Math.random() > 0.5 ? "热门" : "NEW");
    //             }
    //         } else {
    //             cell.visible = false;
    //         }
    //     }, [], false);
    //     ws.getGameAd({
    //         pos: pos,
    //         count: Global.config.games[pos].length,
    //         success: (res: any) => {
    //             let iconInfoList = res.data;
    //             this.drawerList.array = iconInfoList;
    //             this.drawerList.refresh();
    //         }
    //     });
    // }

    // /**更多游戏图标*/
    // private initMoreGameIcons(pos: string) {
    //     this.moreGameList.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
    //         let iconInfo = this.moreGameList.array[index];
    //         if (iconInfo) {
    //             cell.visible = true;
    //             //注册点击
    //             cell.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, [pos, iconInfo]);
    //             //图片
    //             let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
    //             iconImage && iconImage.loadImage(iconInfo.icon);
    //             //名称
    //             let titleLabel = cell.getChildByName("titleLabel") as Laya.Label;
    //             titleLabel && titleLabel.changeText(iconInfo.title);
    //             //提示
    //             let tips = cell.getChildByName("tips");
    //             if (tips) {
    //                 let tipsLabel = tips.getChildByName("tipsLabel") as Laya.Label;
    //                 tipsLabel && tipsLabel.changeText(Math.random() > 0.5 ? "热门" : "NEW");
    //             }
    //         } else {
    //             cell.visible = false;
    //         }
    //     }, [], false);
    //     ws.getGameAd({
    //         pos: pos,
    //         count: Global.config.games[pos].length,
    //         success: (res: any) => {
    //             let iconInfoList = res.data;
    //             this.moreGameList.array = iconInfoList;
    //             this.moreGameList.refresh();
    //         }
    //     });
    // }

    // /**主页图标*/
    // private initHomeIcons(posList: string[]) {
    //     if (!posList || !posList.length) {
    //         return;
    //     }
    //     let fetchParams = [];
    //     for (let pos of posList) {
    //         let list = Global.config.games[pos];
    //         let count = list && list.length ? list.length : 1;
    //         fetchParams.push({ pos, count });
    //     }
    //     this.homeIconList.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
    //         let iconInfo = this.homeIconList.array[index];
    //         if (iconInfo) {
    //             cell.visible = true;
    //             //注册点击
    //             cell.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, [posList[index], iconInfo]);
    //             //图片
    //             let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
    //             iconImage && iconImage.loadImage(iconInfo.icon);
    //             //名称
    //             let titleLabel = cell.getChildByName("titleLabel") as Laya.Label;
    //             titleLabel && titleLabel.changeText(iconInfo.title);
    //             //抖动
    //             Util.shakeOnce(Math.random() * 1000, cell);
    //         } else {
    //             cell.visible = false;
    //         }
    //     }, [], false);
    //     ws.fetchGameAd({
    //         data: fetchParams,
    //         success: (res: any) => {
    //             let data = res.data;
    //             let iconInfosList = [];
    //             for (let pos of posList) {
    //                 iconInfosList.push(data[pos]);
    //             }
    //             this.iconInfosList = iconInfosList;
    //             //当前显示图标
    //             this.currentIconInfoList = [];
    //             this.scheduleRefreshHomeIcons();
    //         },
    //     });
    // }

    // /**每隔三秒刷新一次*/
    // private scheduleRefreshHomeIcons() {
    //     this.refreshHomeIcons();
    //     Laya.timer.loop(3000, this, () => {
    //         if (this.visible) {
    //             this.refreshHomeIcons();
    //         }
    //     });
    // }

    // /**刷新首页图标*/
    // private refreshHomeIcons() {
    //     for (let i = 0; i < this.iconInfosList.length; i++) {
    //         let iconInfos = this.iconInfosList[i];
    //         let iconInfo = Util.getRandom(iconInfos);
    //         this.currentIconInfoList[i] = iconInfo;
    //     }
    //     this.homeIconList.array = this.currentIconInfoList;
    //     this.homeIconList.refresh();
    // }

}