import { ui } from "../../ui/layaMaxUI";
import * as Const from "../Const";
import Global from "../Global";
import Navigator from "../utils/Navigator";
import wx from "../utils/wx";
import ws from "../utils/ws.js";
import * as Ad from "../utils/Ad";
import Reward from "../component/Reward";
import HomeView from "./HomeView";
import GameScene from "./GameScene";

export default class CannonSelect extends ui.cannonSelect.CannonSelectUI {
    static instance: CannonSelect;

    /**
     * 打开该单例页面，触发onOpened
     * @param param  onOpened方法的传参
     */
    static openInstance(param?: any) {
        if (CannonSelect.instance) {
            CannonSelect.instance.onOpened(param);
        } else {
            Laya.Scene.open(Const.URL_CannnonSelect, false, param);
        }
    }

    onOpened(param?: any) {
        console.log("CannonSelect onOpened()");
        this.visible = true;
        this.isClick = false;
        // get selected type
        if (this.isReward) {
            this.selectType = this.rewardType;
        } else {
            this.selectType = Global.gameData.cannonType;
        }
        // get selected index and unlock state list
        for (let idx = 1; idx < Const.CannonSelectIconList.length - 1; idx++) {
            // selected index
            if (Const.CannonSelectIconList[idx]["index"] === this.selectType) {
                this.list_Icon.selectedIndex = idx;
            }
            // unlock state
            this.unlockState[idx] = false;
            if (Global.gameData.stageIndex > Const.CannonSelectTextList[Const.CannonSelectIconList[idx].index]["unlockLvl"]) {
                this.unlockState[idx] = true;
            }
        }
        this.refreshText();
        this.refreshIcon();
        this.newCannon();

        // show tutorial
        if (GameScene.instance.stageIdx === 2 && GameScene.instance.missionIdx === 1) {
            this.tutorial_slide.visible = true;
        }
    }

    public scene3D: Laya.Scene3D;
    private camera: Laya.Camera;
    private directionLight: Laya.DirectionLight;

    private cannon: Laya.MeshSprite3D;
    public selectType: number;
    public isReward: boolean = false;
    public rewardType: number;

    private btnAniFrame: number;

    private unlockState: boolean[] = [];

    private isClick: boolean;

    /** 输入x坐标记录，用于左右滑动 */
    private downMouseX: number;

    constructor() {
        super();
        console.log("CannonSelect constructor()");

        CannonSelect.instance = this;
    }

    onAwake() {
        this.initCannonList();

        this.initScene3D();

        // multiple touch input disable
        this.scene3D.input.multiTouchEnabled = false;
    }

    onEnable() {
        this.bindButtons();
    }

    /** initialize cannon select list */
    private initCannonList() {
        this.list_Icon.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
            let iconInfo = this.list_Icon.array[index];
            // 去掉头部不显示，标记为 index = -1
            if (iconInfo && iconInfo.index !== -1) {
                cell.visible = true;
                let iconBg = cell.getChildByName("iconBg") as Laya.Image;
                if (iconBg) {
                    iconBg.skin = Const.CannonSelectIconBgUrl;
                }
                let iconImage = cell.getChildByName("iconImage") as Laya.Image;
                if (iconImage) {
                    iconImage.skin = iconInfo.icon;
                }
            } else {
                cell.visible = false;
            }
        }, [], false);

        this.list_Icon.hScrollBarSkin = "";
        this.list_Icon.array = Const.CannonSelectIconList;
        this.list_Icon.refresh();
    }

    /** initialize scene */
    private initScene3D() {
        // add scene
        this.scene3D = this.box_scene3D.addChild(new Laya.Scene3D()) as Laya.Scene3D;

        // camera
        this.camera = this.scene3D.addChild(new Laya.Camera()) as Laya.Camera;
        this.camera.transform.localPosition = new Laya.Vector3(0, 0, 0);
        this.camera.transform.localRotationEuler = new Laya.Vector3(-30, 0, 0);
        this.camera.clearColor = new Laya.Vector4(239 / 255, 169 / 255, 171 / 255, 1);

        // direction light
        this.directionLight = this.scene3D.addChild(new Laya.DirectionLight()) as Laya.DirectionLight;
        this.directionLight.transform.localPosition = Const.LightInitPos.clone();
        this.directionLight.transform.localRotationEuler = Const.LightInitRotEuler.clone();
        this.directionLight.color = Const.LightInitColor.clone();
    }

    /** new cannon */
    newCannon() {
        // clear animation
        this.box_scene3D.timer.clear(this, this.cannonAniLoop);
        // destroy old cannon
        this.cannon && this.cannon.destroy();
        // load new cannon
        Laya.Sprite3D.load(Const.CannonResUrl[this.selectType], Laya.Handler.create(this, (res) => {
            this.cannon = res.clone();
            this.scene3D.addChild(this.cannon);

            this.cannon.transform.localPosition = new Laya.Vector3(0, -0.23, -0.5);
            this.cannon.transform.localRotationEuler = new Laya.Vector3(0, -135, 0);
            this.cannon.transform.localScale = Const.CannonInitScale.clone();

            // on animation
            this.box_scene3D.timer.frameLoop(1, this, this.cannonAniLoop);
        }));
    }

    /** refresh text */
    private refreshText() {
        var idx: number;
        idx = this.list_Icon.selectedIndex + 1;
        if (idx < 1) {
            return;
        }
        var cannonIdx: number = Const.CannonSelectIconList[idx].index;
        this.label_name.changeText(Const.CannonSelectTextList[cannonIdx]["name"]);
        this.label_feature.changeText(Const.CannonSelectTextList[cannonIdx]["feature"]);
        // 未解锁
        if (Global.gameData.stageIndex <= Const.CannonSelectTextList[cannonIdx]["unlockLvl"]) {
            if (Const.CannonSelectTextList[cannonIdx]["unlockLvl"] >= 999) {
                this.label_unlockMsg.changeText("敬请期待");
            }
            else {
                this.label_unlockMsg.changeText("完成关卡 " + (Global.gameData.stageIndex - 1) + "/" + Const.CannonSelectTextList[cannonIdx]["unlockLvl"] + " 解锁");
            }
            this.btn_select.visible = false;
            this.btn_unlock.visible = true;
            if (this.isReward && this.rewardType === cannonIdx) {
                this.btn_try.gray = true;
                this.label_try.changeText("正在试用");
            }
            else {
                this.btn_try.gray = false;
                this.label_try.changeText("免费试用");
            }
            this.btn_try.visible = true;
        }
        else {
            this.label_unlockMsg.changeText("已解锁");
            // 使用状态按钮变灰
            if (!this.isReward && Global.gameData.cannonType === cannonIdx) {
                this.btn_select.gray = true;
            }
            else {
                this.btn_select.gray = false;
            }
            this.btn_select.visible = true;
            this.btn_unlock.visible = false;
            this.btn_try.visible = false;
        }
    }

    /** refresh icon */
    private refreshIcon() {
        var iconBg: Laya.Image;
        var iconLock: Laya.Image;
        var idx: number = this.list_Icon.selectedIndex + 1;
        if (idx < 1) {
            return;
        }
        var cannonIdx: number = Const.CannonSelectIconList[idx].index;
        for (let i = 0; i <= 2; i++) {
            if (idx + i > 0 && idx + i < Const.CannonSelectIconList.length) {
                iconBg = this.list_Icon.cells[i].getChildByName("iconBg") as Laya.Image;
                if (iconBg) {
                    if (cannonIdx === this.selectType) {
                        iconBg.gray = false;
                    }
                    else {
                        iconBg.gray = true;
                    }
                    // center
                    if (i === 1) {
                        iconBg.scaleX = 1.2;
                        iconBg.scaleY = 1.2;
                    }
                    // two side
                    else {
                        iconBg.scaleX = 0.85;
                        iconBg.scaleY = 0.85;
                    }
                }
                iconLock = this.list_Icon.cells[i].getChildByName("lock") as Laya.Image;
                if (iconLock) {
                    iconLock.visible = true;
                    if (this.unlockState[idx + i]) {
                        iconLock && (iconLock.visible = false);
                    }
                    if (this.isReward && this.rewardType === cannonIdx) {
                        iconLock && (iconLock.visible = false);
                    }
                }
            }
        }
    }

    /** bind button */
    private bindButtons() {
        // back other scene
        this.btn_back.on(Laya.Event.CLICK, this, () => {
            // clear animation
            this.box_scene3D.timer.clear(this, this.cannonAniLoop);
            this.visible = false;

            // change cannon
            if (this.isClick) {
                if (this.isReward) {
                    GameScene.instance.isRewardCannon = true;
                    GameScene.instance.setCannon(this.rewardType);
                }
                if (!this.isReward && GameScene.instance.cannonType !== Global.gameData.cannonType) {
                    GameScene.instance.setCannon(Global.gameData.cannonType);
                }
            }

            // jump to other scene
            if (GameScene.instance && GameScene.instance.state === Const.GameState.PAUSE) {
                GameScene.openInstance();
            }
            else {
                HomeView.openInstance();
            }
        });

        // cannon list slide
        this.list_Icon.on(Laya.Event.MOUSE_MOVE, this, () => {
            !this.downMouseX && (this.downMouseX = this.mouseX);
            // 左滑
            if (this.downMouseX - this.mouseX > 200 && this.list_Icon.selectedIndex + 1 < Const.CannonSelectIconList.length - 1) {
                this.list_Icon.selectedIndex++;
                this.downMouseX = this.mouseX;
                console.log("idx", this.list_Icon.selectedIndex)
            }
            // 右滑
            else if (this.downMouseX - this.mouseX < -200 && this.list_Icon.selectedIndex - 1 >= 0) {
                this.list_Icon.selectedIndex--;
                this.downMouseX = this.mouseX;
                console.log("idx", this.list_Icon.selectedIndex)
            }
        });
        this.list_Icon.on(Laya.Event.MOUSE_UP, this, () => {
            if (this.downMouseX) {
                this.list_Icon.scrollTo(this.list_Icon.selectedIndex);
                this.refreshIcon();
                this.refreshText();
                // reset
                this.downMouseX = undefined;
            }
        });
        this.list_Icon.on(Laya.Event.MOUSE_OUT, this, () => {
            if (this.downMouseX) {
                this.list_Icon.scrollTo(this.list_Icon.selectedIndex);
                this.refreshIcon();
                this.refreshText();
                // reset
                this.downMouseX = undefined;
            }
        });

        // cannon select
        this.btn_select.on(Laya.Event.CLICK, this, () => {
            if (this.isReward || Global.gameData.cannonType != this.selectType) {
                // update
                this.btn_select.gray = true;
                Global.gameData.cannonType = this.selectType;
                this.isReward = false;
                this.refreshIcon();
            }
        });

        // cannon unlock try
        this.btn_try.on(Laya.Event.MOUSE_DOWN, this, () => {
            if (!Laya.Browser.onMiniGame) {
                this.onClick_try();
            }
            else {
                // 1: video
                (Global.config.try_cannon == 1) && Reward.instance.video({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        this.onClick_try();
                    },
                });
                // 2: share
                (Global.config.try_cannon == 2) && Reward.instance.share({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        this.onClick_try();
                    },
                });
            }
        });
    }

    private onClick_try() {
        if (!(this.isReward && this.rewardType == this.selectType)) {
            this.refreshIcon();
            // update
            this.isReward = true;
            this.rewardType = this.selectType;
            this.btn_try.gray = true;
            this.label_try.changeText("正在试用");
            this.refreshIcon();
        }
    }

    /** cannon animation loop */
    private cannonAniLoop() {
        this.cannon && (this.cannon.transform.localRotationEulerY += 1);
    }
}