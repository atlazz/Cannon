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
import Reward from "../component/Reward";

export default class HomeView extends ui.home.HomeViewUI {
    static instance: HomeView;

    public nav: Navigator;

    /**
     * 打开该单例页面，触发onOpened
     * @param param  onOpened方法的传参
     */
    static openInstance(param?: any) {
        if (HomeView.instance) {
            Ad.randomlyGetBanner("home");
            Ad.showBanner(true);
            // Ad.posShowBanner(Const.BannerPos.HomeView, true);
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
        this.nav && this.nav.loadIconInfoList(true);
        // unlock icon
        this.refreshUnlock();
        // refresh diamond
        this.text_diamond.changeText("" + Global.gameData.diamond);
        this.icon_diamond.visible = true;
        // update trail
        this.updateTrailUnlock();
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

        // // todo: delete it
        // this.btn_test.visible = true;
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

    /**刷新getDiamond弹窗状态：手势指引&按钮动画二择 */
    private refresh_getDiamond() {
        // 启动判断场景值（来源我的小程序：1104），获取钻石奖励
        if (Global.gameData.getDiamond == 2) {
            // hide
            this.finger_getDiamond.visible = false;
            Laya.timer.clearAll(this.finger_getDiamond);
            // show
            this.btn_getDiamondYes.gray = false;
            // off animation
            Laya.timer.clearAll(this.btn_getDiamondYes);
            // play animation
            Laya.timer.frameLoop(1, this.btn_getDiamondYes, () => {
                this.btn_getDiamondYes.scaleX += 0.005;
                this.btn_getDiamondYes.scaleY += 0.005;
                if (this.btn_getDiamondYes.scaleX >= 1.1) {
                    this.btn_getDiamondYes.scaleX = 1;
                    this.btn_getDiamondYes.scaleY = 1;
                }
            });
            // listen
            this.btn_getDiamondYes.on(Laya.Event.MOUSE_DOWN, this, () => {
                // refresh
                Global.gameData.diamond += 2000;
                this.text_diamond.changeText("" + Global.gameData.diamond);
                Global.gameData.getDiamond = 3;
                // off listener
                this.btn_getDiamond.offAll();
                this.btn_getDiamondYes.offAll();
                this.btn_getDiamondExit.offAll();
                // off animation
                Laya.timer.clearAll(this.btn_getDiamondYes);
                // hide
                this.box_getDiamond.visible = false;
                this.btn_getDiamond.visible = false;
                this.finger_getDiamond.visible = false;
            });
        }
        // 未达成获取资格
        else {
            this.btn_getDiamondYes.gray = true;
            this.finger_getDiamond.visible = true;
            // off
            Laya.timer.clearAll(this.finger_getDiamond);
            Laya.timer.clearAll(this.btn_getDiamondYes);
            // 手势指引动画开启
            Laya.timer.frameLoop(1, this.finger_getDiamond, () => {
                this.finger_getDiamond.right -= 2;
                if (this.finger_getDiamond.right <= 160) {
                    this.finger_getDiamond.right = 220;
                }
            });
        }
    }
    /**解锁getDiamond按钮 */
    private bindButton_getDiamond() {
        // 未曾领取钻石
        if (Global.gameData.getDiamond !== 3) {
            // 如果弹窗已打开，刷新
            this.box_getDiamond.visible && this.refresh_getDiamond();
            // 监听首页获取钻石按钮
            this.btn_getDiamond.visible = true;
            this.btn_getDiamond.on(Laya.Event.MOUSE_DOWN, this, () => {
                // show
                this.box_getDiamond.visible = true;
                this.refresh_getDiamond();
            });
            // 获取钻石弹窗退出按钮
            this.btn_getDiamondExit.on(Laya.Event.MOUSE_DOWN, this, () => {
                this.box_getDiamond.visible = false;
                this.finger_getDiamond.visible = false;
                // off animation
                Laya.timer.clearAll(this.finger_getDiamond);
                Laya.timer.clearAll(this.btn_getDiamondYes);
            });
        }
        else {
            this.box_getDiamond.visible = false;
            this.btn_getDiamond.visible = false;
            this.finger_getDiamond.visible = false;
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
                        console.log("click_startgame")
                        ws.traceEvent("click_startgame");
                        // wx.aldSendEvent("click_startgame");
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
                Laya.SoundManager.playSound(Const.soundUrl[0]);
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
        // trail select open
        this.btn_trail.on(Laya.Event.CLICK, this, () => {
            this.box_trail.visible = true;
            this.box_UI.visible = false;
        });
        // trail selece close
        this.btn_trailBack.on(Laya.Event.MOUSE_DOWN, this, () => {
            this.box_trail.visible = false;
            this.box_UI.visible = true;
        });
        // trail unlock
        for (let i = 1; i <= Object.keys(Const.TrailUnlock).length; i++) {
            this['btn_trailUnlock' + i].on(Laya.Event.MOUSE_DOWN, this, () => {
                // 1: video
                if (Global.config.get_trail == 1) {
                    // 未超过每天视频观看次数
                    if (!Reward.instance.isOverVideo()) {
                        this.mouseEnabled = false;
                        Reward.instance.video({
                            pos: Const.RewardPos.Trail,
                            success: () => {
                                Global.gameData.trailUnlockState[i]++;
                                this.updateTrailUnlock();
                            },
                            fail: () => {
                                Reward.instance.share({
                                    pos: Const.RewardPos.Trail,
                                    success: () => {
                                        Global.gameData.trailUnlockState[i]++;
                                        this.updateTrailUnlock();
                                    },
                                });
                            },
                            complete: () => {
                                this.mouseEnabled = true;
                            }
                        });
                    }
                    else {
                        Reward.instance.share({
                            pos: Const.RewardPos.Trail,
                            success: () => {
                                Global.gameData.trailUnlockState[i]++;
                                this.updateTrailUnlock();
                            },
                        });
                    }
                }
                // 2: share
                else if (Global.config.get_trail == 2) {
                    Reward.instance.share({
                        pos: Const.RewardPos.Trail,
                        success: () => {
                            Global.gameData.trailUnlockState[i]++;
                            this.updateTrailUnlock();
                        },
                    });
                }
            });
        }

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
        Ad.hideBanner();
        // Ad.posHideBanner(Const.BannerPos.HomeView);
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
        wx.showLoading({ title: '登录中', mask: true });
        ws.onLoginComplete(this.onLoginComplete.bind(this));
        ws.login();
    }

    /**登录ws后台完成*/
    private onLoginComplete(res, gameData) {
        if (ws.getLoginStatus() === 'success') {
            console.log("login_succeed")
            ws.traceEvent('login_succeed');
            wx.hideLoading();
            console.log('ws.conf', ws.conf); // 通用配置
            console.log('ws.user', ws.user); // 用户信息
            console.log('ws.data', ws.data); // 本地保存的游戏数据
            wx.getSystemInfoSync && console.log('wx.getSystemInfoSync()', wx.getSystemInfoSync());
            this.loadConfig();
            this.loadGameData(gameData);
            // 判断接入阿拉丁sdk
            if (ws.user.can_record) {
                window["require"]("libs/common.js");
                //调用上传openid
                wx.aldSendOpenid(ws.user.openid);
                // console.log("ald method", window['wx'])
            }
        } else if (ws.getLoginStatus() === 'fail') {
            console.log("login_failed")
            ws.traceEvent('login_failed');
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
        console.log("treasure banner hit from ws", Global.gameData.treasureBannerHit);
        //关闭更新游戏数据
        wx.onHide(() => {
            this.updateGameData(true);
        });
        //刷新当前广告banner
        ws.onShow((res) => {
            // Ad.randomlyGetBanner("home");
            // Ad.showBanner(true);
            // console.log("onShow scene", res.scene)
            // 未曾领取钻石，判断来源场景值是否1104（我的小程序）
            if (Global.gameData.getDiamond != 3 && res.scene == "1104") {
                Global.gameData.getDiamond = 2;
            }
            this.bindButton_getDiamond();

            // 宝箱暴击页误点banner
            if (GameScene.instance && GameScene.instance.state == Const.GameState.BANNER_TOUCH) {
                GameScene.instance.state = Const.GameState.START;
                Global.gameData.treasureBannerHit++;
                Global.gameData.lastTreasureBannerHitTimestamp = Date.now();
                console.log("treasure banner hit", Global.gameData.treasureBannerHit);
            }
        });

        this.box_drawer.visible = true;
        // this.btn_moreGameOpen.visible = true;
        this.onGameDataLoaded();
    }

    /**游戏数据加载完成*/
    private onGameDataLoaded() {
        console.log('onGameDataLoaded', Global.gameData);
        
		//强制更新
		if (Laya.Browser.onMiniGame) {
			const updateManager = wx.getUpdateManager();
			updateManager.onUpdateReady(() => {
				wx.showModal({
					title: '更新提示',
					content: '新版本已经准备好，是否重启应用？',
					success: (res) => {
						if (res.confirm) {
							updateManager.applyUpdate();
						}
					}
				});
			});
        }
        
        /** init navigation */
        this.nav = new Navigator(ws);
        // home icon
        this.box_homeIcon.visible = true;
        this.nav.createIcons(this.box_homeIcon, this.box_homeIcon);
        
        this.isGameDataLoaded = true;
        Ad.randomlyGetBanner("home");
        Ad.showBanner(true);
        // Ad.posShowBanner(Const.BannerPos.HomeView);

        /** unlock icon */
        this.refreshUnlock();

        let now = new Date();
        /** reset trail show flag */
        let todayBeginTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        console.log('todayBeginTimestamp', todayBeginTimestamp)
        console.log('lastTrailShowTimestamp', Global.gameData.lastTrailShowTimestamp)
        if (!Global.gameData.lastTrailShowTimestamp || Global.gameData.lastTrailShowTimestamp < todayBeginTimestamp) {
            Global.gameData.trailShowToday = false;
            console.log('reset trail show')
        }
        /** reset banner hit cnt */
        console.log('lastTreasureBannerHitTimestamp', Global.gameData.lastTreasureBannerHitTimestamp)
        if (!Global.gameData.lastTreasureBannerHitTimestamp || Global.gameData.lastTreasureBannerHitTimestamp < todayBeginTimestamp) {
            Global.gameData.treasureBannerHit = 0;
            console.log('reset banner hit')
        }
        /** update unlock state */
        this.updateTrailUnlock();

        /** show get diamond btn */
        if (Global.gameData.getDiamond != 3 && Laya.Browser.onMiniGame && wx.getLaunchOptionsSync && wx.getLaunchOptionsSync().scene == "1104") {
            Global.gameData.getDiamond = 2;
        }
        this.bindButton_getDiamond();

        /** get system name */
        this.systemName = "Android";
        if (Laya.Browser.onMiniGame && wx.getSystemInfoSync().system.indexOf("iOS") >= 0) {
            this.systemName = "IOS";
        }
        console.log(this.systemName)
        /** show */
        // this.label_highScore.visible = true;
        this.label_level.changeText("关卡：" + Global.gameData.stageIndex);
        this.label_level.visible = true;
        // 调整钻石及其数量位置居中
        this.text_diamond.changeText("" + Global.gameData.diamond);
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
        // cannon
        if (Global.gameData.tutorialStep < 6 || (Global.gameData.stageIndex === 1 && Global.gameData.tutorialStep === 6)) {
            Global.gameData.tutorialStep = 0;
            this.lock_cannon.visible = true;
            this.btn_cannon.visible = false;
            this.btn_cannon.off(Laya.Event.CLICK, this, this.onclick_cannon);
        }
        if (Global.gameData.tutorialStep >= 6 || Global.gameData.stageIndex > 2) {
            this.lock_cannon.visible = false;
            this.btn_cannon.visible = true;
            this.btn_cannon.on(Laya.Event.CLICK, this, this.onclick_cannon);
        }
        // trail
        if (Global.gameData.stageIndex < 2) {
            this.lock_trail.visible = true;
            this.btn_trail.visible = false;
            this.btn_trail.offAll(Laya.Event.CLICK);
        }
        else {
            this.lock_trail.visible = false;
            this.btn_trail.visible = true;
            this.btn_trail.on(Laya.Event.CLICK, this, () => {
                this.box_trail.visible = true;
            });
        }
    }

    private updateTrailUnlock() {
        for (let i = 1; i <= Object.keys(Const.TrailUnlock).length; i++) {
            // init
            if (Global.gameData.trailUnlockState[i] == undefined) {
                Global.gameData.trailUnlockState[i] = 0;
            }
            // 敬请期待
            if (Const.TrailUnlock[i] == -1) {
                this['btn_trailUnlock' + i].visible = false;
                this['btn_trailSelect' + i].visible = false;
                this['trailUsing' + i].visible = false;
                this['trailWait' + i].visible = true;
            }
            // 已解锁
            else if (Global.gameData.trailUnlockState[i] >= Const.TrailUnlock[i]) {
                this['btn_trailUnlock' + i].visible = false;
                this['trailWait' + i].visible = false;
                if (Global.gameData.trailType == i) {
                    this['btn_trailSelect' + i].visible = false;
                    this['trailUsing' + i].visible = true;
                }
                else {
                    this['btn_trailSelect' + i].visible = true;
                    this['trailUsing' + i].visible = false;
                }
            }
            // 未解锁
            else {
                this['label_trailUnlockMsg' + i].changeText("观看视频" + Global.gameData.trailUnlockState[i] + "/" + Const.TrailUnlock[i]);
                this['btn_trailUnlock' + i].visible = true;
                this['btn_trailSelect' + i].visible = false;
                this['trailUsing' + i].visible = false;
                this['trailWait' + i].visible = false;
            }
            // bind btn select
            this['btn_trailSelect' + i].on(Laya.Event.MOUSE_DOWN, this, () => {
                this['btn_trailSelect' + Global.gameData.trailType].visible = true;
                this['trailUsing' + Global.gameData.trailType].visible = false;
                Global.gameData.trailType = i;
                this['btn_trailSelect' + i].visible = false;
                this['trailWait' + i].visible = false;
                this['trailUsing' + i].visible = true;
                GameScene.instance && GameScene.instance.newTrail();
            });
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