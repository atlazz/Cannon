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
        // set selected type at first time open
        if (!this.selectType || !GameScene.instance.isRewardCannon) {
            this.selectType = Global.gameData.cannonType;
        }
        // 游戏页激励大炮，非该页面选择出来，该页面同步
        else if (!this.isReward && GameScene.instance.isRewardCannon) {
            this.selectType = Global.config.cannonRewardType;
        }
        // get selected index and unlock state list
        for (let idx = 1; idx <= Const.CannonSelectIconList.length - 2; idx++) {
            // unlock state
            this.unlockState[idx] = false;
            if (Global.gameData.stageIndex > Const.CannonSelectTextList[Const.CannonSelectIconList[idx].index]["unlockLvl"]) {
                this.unlockState[idx] = true;
            }
            // selected index
            if (Const.CannonSelectIconList[idx]["index"] === this.selectType) {
                this.list_Icon.selectedIndex = idx;
            }
        }
        this.updateScroll();
        this.updateUI();

        // show tutorial
        if (GameScene.instance && GameScene.instance.stageIdx === 2 && GameScene.instance.missionIdx === 1 && Global.gameData.tutorialStep === 4) {
            Global.gameData.tutorialStep = 5;
            this.tutorial_slide.visible = true;
            var finger: Laya.Image = this.tutorial_slide.getChildByName("finger") as Laya.Image;
            finger.timer.frameLoop(1, finger, () => {
                finger.right += 3;
                finger.alpha = 1 - (finger.right - 80) / 210;
                if (finger.right >= 280) {
                    finger.right = 50;
                    finger.alpha = 1;
                }
            });
        }
    }

    public scene3D: Laya.Scene3D;
    private camera: Laya.Camera;
    private directionLight: Laya.DirectionLight;

    private cannon: Laya.MeshSprite3D;
    public selectType: number;
    public isReward: boolean = false;

    private btnAniFrame: number;

    private unlockState: boolean[] = [];

    private isClick: boolean;

    /** 输入x坐标记录，用于左右滑动 */
    private downMouseX: number;
    private downFlag: boolean = false;
    private startIdx: number = 0;

    /** 选中icon缩放scale */
    private selectedScaleAdd: number = 0.35;

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
        this.cannon && this.cannon.removeSelf() && this.cannon.destroy();
        // load new cannon
        Laya.Sprite3D.load(Const.CannonResUrl[Const.CannonSelectIconList[this.list_Icon.selectedIndex].index], Laya.Handler.create(this, (res) => {
            this.cannon = res.clone();
            this.cannon.name = "cannon";
            this.scene3D.removeChildByName("cannon");
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
        idx = this.list_Icon.selectedIndex;
        if (idx < 1 || idx > Const.CannonSelectIconList.length - 2) {
            return;
        }
        var cannonIdx: number = Const.CannonSelectIconList[idx].index;
        this.label_name.changeText(Const.CannonSelectTextList[cannonIdx]["name"]);
        this.label_feature.changeText(Const.CannonSelectTextList[cannonIdx]["feature"]);
        // 未解锁
        if (!this.unlockState[idx]) {
            if (Const.CannonSelectTextList[cannonIdx]["unlockLvl"] >= 999) {
                this.label_unlockMsg.changeText("敬请期待");
                this.btn_try.visible = false;
            }
            else {
                this.label_unlockMsg.changeText("完成关卡 " + (Global.gameData.stageIndex - 1) + "/" + Const.CannonSelectTextList[cannonIdx]["unlockLvl"] + " 解锁");
                this.btn_try.visible = true;
            }
            this.btn_select.visible = false;
            this.btn_unlock.visible = true;
            if (this.isReward && this.selectType === cannonIdx) {
                this.btn_try.gray = true;
                this.label_try.changeText("正在试用");
            }
            else {
                this.btn_try.gray = false;
                this.label_try.changeText("免费试用");
            }
        }
        else {
            this.label_unlockMsg.changeText("已解锁");
            // 使用状态按钮变灰
            if (!this.isReward && this.selectType === cannonIdx) {
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
        var iconImg: Laya.Image;
        var iconBg: Laya.Image;
        var iconLock: Laya.Image;
        var idx: number = this.list_Icon.selectedIndex;
        if (idx < 1 || idx > Const.CannonSelectIconList.length - 2) {
            return;
        }
        this.arrowLeft.visible = true;
        this.arrowRight.visible = true;
        for (let i = 0; i <= 2; i++) {
            // 左右箭头显示设置
            if (idx + i - 1 <= 0) {
                this.arrowLeft.visible = false;
                continue;
            }
            else if (idx + i - 1 >= Const.CannonSelectIconList.length - 1) {
                this.arrowRight.visible = false;
                continue;
            }
            // mouse_move滑动时，滑动方向更新开放
            if (this.downFlag) {
                if (this.list_Icon.startIndex === this.startIdx) {
                    continue;
                }
            }
            // icon 更新
            var cannonIdx: number = Const.CannonSelectIconList[idx + i - 1].index;
            iconImg = this.list_Icon.cells[i].getChildByName("iconImage") as Laya.Image;
            if (iconImg && !this.downFlag) {
                // center
                if (i === 1) {
                    iconImg.scaleX = 1 + this.selectedScaleAdd;
                    iconImg.scaleY = 1 + this.selectedScaleAdd;
                }
                // two side
                else {
                    iconImg.scaleX = 1;
                    iconImg.scaleY = 1;
                }
            }
            iconBg = this.list_Icon.cells[i].getChildByName("iconBg") as Laya.Image;
            if (iconBg) {
                if (cannonIdx === this.selectType) {
                    iconBg.gray = false;
                }
                else {
                    iconBg.gray = true;
                }
                if (!this.downFlag) {
                    // center
                    if (i === 1) {
                        iconBg.scaleX = 1 + this.selectedScaleAdd;
                        iconBg.scaleY = 1 + this.selectedScaleAdd;
                    }
                    // two side
                    else {
                        iconBg.scaleX = 1;
                        iconBg.scaleY = 1;
                    }
                }
            }
            iconLock = this.list_Icon.cells[i].getChildByName("lock") as Laya.Image;
            if (iconLock) {
                iconLock.visible = true;
                if (this.unlockState[idx + i - 1]) {
                    iconLock && (iconLock.visible = false);
                }
                if (this.isReward && this.selectType === cannonIdx) {
                    iconLock && (iconLock.visible = false);
                }
                if (!this.downFlag) {
                    // center
                    if (i === 1) {
                        iconLock.scaleX = 1 + this.selectedScaleAdd;
                        iconLock.scaleY = 1 + this.selectedScaleAdd;
                    }
                    // two side
                    else {
                        iconLock.scaleX = 1;
                        iconLock.scaleY = 1;
                    }
                }
            }
        }
    }

    /** bind button */
    private bindButtons() {
        /** cannon list slide */
        // mouse down: start slide
        this.list_Icon.on(Laya.Event.MOUSE_DOWN, this, () => {
            if (GameScene.instance && GameScene.instance.stageIdx === 2 && GameScene.instance.missionIdx === 1 && Global.gameData.tutorialStep === 5) {
                console.log("newplayer_5")
                ws.traceEvent("newplayer_5");
            }
            this.downMouseX = this.mouseX;
            this.downFlag = true;
            this.startIdx = this.list_Icon.startIndex;
        });
        // mouse move: sliding
        this.list_Icon.on(Laya.Event.MOUSE_MOVE, this, () => {
            // 手指松开后不进入
            if (!this.downFlag) {
                return;
            }
            // update when: list icon当前选择到头尾，不产生变化
            if (this.downMouseX - this.mouseX > 0 && this.list_Icon.selectedIndex >= Const.CannonSelectIconList.length - 2) {
                this.downMouseX = this.mouseX;
                this.arrowRight.visible = false;
            }
            else if (this.downMouseX - this.mouseX < 0 && this.list_Icon.selectedIndex <= 1) {
                this.downMouseX = this.mouseX;
                this.arrowLeft.visible = false;
            }
            // 左滑
            else if (this.downMouseX - this.mouseX > 0) {
                var currCell = this.list_Icon.getCell(this.list_Icon.selectedIndex);
                var nextCell = this.list_Icon.getCell(this.list_Icon.selectedIndex + 1);
                if (currCell && nextCell) {
                    for (let i = 0; i < currCell.numChildren; i++) {
                        var currChild: Laya.Image = currCell.getChildAt(i) as Laya.Image;
                        var nextChild: Laya.Image = nextCell.getChildAt(i) as Laya.Image;
                        if (currChild && nextChild) {
                            currChild.scaleX = 1 + this.selectedScaleAdd * (1 - Math.abs(this.downMouseX - this.mouseX) / 230);
                            currChild.scaleY = 1 + this.selectedScaleAdd * (1 - Math.abs(this.downMouseX - this.mouseX) / 230);
                            nextChild.scaleX = 1 + Math.abs(this.downMouseX - this.mouseX) * this.selectedScaleAdd / 230;
                            nextChild.scaleY = 1 + Math.abs(this.downMouseX - this.mouseX) * this.selectedScaleAdd / 230;
                        }
                    }
                }
                // update when: 超出滑动阈值，更新至 next icon
                this.arrowRight.visible = true;
                if (this.downMouseX - this.mouseX > 115) {
                    this.list_Icon.selectedIndex++;
                    if (this.list_Icon.selectedIndex >= Const.CannonSelectIconList.length - 2) {
                        this.arrowRight.visible = false;
                    }
                    this.downMouseX = this.mouseX - 115;
                    this.updateUI();

                    // 新手引导中
                    if (this.tutorial_slide.visible) {
                        // reset
                        this.downFlag = false;
                        // update
                        this.updateScroll();
                        this.refreshIcon();
                        this.openTutorial();
                    }
                }
            }
            // 右滑
            else if (this.downMouseX - this.mouseX < 0) {
                var currCell = this.list_Icon.getCell(this.list_Icon.selectedIndex);
                var nextCell = this.list_Icon.getCell(this.list_Icon.selectedIndex - 1);
                if (currCell && nextCell) {
                    for (let i = 0; i < currCell.numChildren; i++) {
                        var currChild: Laya.Image = currCell.getChildAt(i) as Laya.Image;
                        var nextChild: Laya.Image = nextCell.getChildAt(i) as Laya.Image;
                        if (currChild && nextChild) {
                            currChild.scaleX = 1 + this.selectedScaleAdd * (1 - Math.abs(this.downMouseX - this.mouseX) / 230);
                            currChild.scaleY = 1 + this.selectedScaleAdd * (1 - Math.abs(this.downMouseX - this.mouseX) / 230);
                            nextChild.scaleX = 1 + Math.abs(this.downMouseX - this.mouseX) * this.selectedScaleAdd / 230;
                            nextChild.scaleY = 1 + Math.abs(this.downMouseX - this.mouseX) * this.selectedScaleAdd / 230;
                        }
                    }
                }
                this.arrowLeft.visible = true;
                if (this.downMouseX - this.mouseX < -115) {
                    this.list_Icon.selectedIndex--;
                    if (this.list_Icon.selectedIndex <= 1) {
                        this.arrowLeft.visible = false;
                    }
                    this.downMouseX = this.mouseX + 115;
                    this.updateUI();
                }
            }
        });
        // mouse up: end slide
        this.list_Icon.on(Laya.Event.MOUSE_UP, this, () => {
            if (this.downFlag) {
                // reset
                this.downFlag = false;
                // update
                this.updateScroll();
                this.refreshIcon();
            }
        });
        // mouse out: end slide
        this.list_Icon.on(Laya.Event.MOUSE_OUT, this, () => {
            if (this.downFlag) {
                // reset
                this.downFlag = false;
                // update
                this.updateScroll();
                this.refreshIcon();
            }
        });

        /** list arrow */
        // left
        this.arrowLeft.on(Laya.Event.CLICK, this, () => {
            this.downFlag = false;
            // update
            this.list_Icon.selectedIndex--;
            this.updateScroll();
            this.updateUI();
            if (this.list_Icon.selectedIndex <= 1) {
                this.arrowLeft.visible = false;
            }
            this.arrowRight.visible = true;
        });
        // right
        this.arrowRight.on(Laya.Event.CLICK, this, () => {
            this.downFlag = false;
            // update
            this.list_Icon.selectedIndex++;
            this.updateScroll();
            this.updateUI();
            if (this.list_Icon.selectedIndex >= Const.CannonSelectIconList.length - 2) {
                this.arrowRight.visible = false;
            }
            this.arrowLeft.visible = true;

            // 新手引导中
            if (this.tutorial_slide.visible) {
                this.openTutorial();
            }
        });

        /** cannon select */
        this.btn_select.on(Laya.Event.CLICK, this, () => {
            if (this.isReward || Global.gameData.cannonType !== Const.CannonSelectIconList[this.list_Icon.selectedIndex].index) {
                // update
                this.isClick = true;
                this.btn_select.gray = true;
                this.isReward = false;
                this.selectType = Const.CannonSelectIconList[this.list_Icon.selectedIndex].index;
                Global.gameData.cannonType = this.selectType;
                this.refreshIcon();
            }
        });

        /** cannon reward try */
        this.btn_try.on(Laya.Event.MOUSE_DOWN, this, () => {
            if (!Laya.Browser.onMiniGame) {
                this.onClick_try();
            }
            else {
                // 1: video
                if (Global.config.revive == 1) {
                    // 未超过每天视频观看次数
                    if (!Reward.instance.isOverVideo()) {
                        Reward.instance.video({
                            pos: Const.RewardPos.Cannon,
                            success: () => {
                                this.onClick_try();
                            },
                            fail: () => {
                                Reward.instance.share({
                                    pos: Const.RewardPos.Cannon,
                                    success: () => {
                                        this.onClick_try();
                                    },
                                });
                            }
                        });
                    }
                    else {
                        Reward.instance.share({
                            pos: Const.RewardPos.Cannon,
                            success: () => {
                                this.onClick_try();
                            },
                        });
                    }
                }
                // 2: share
                (Global.config.try_cannon == 2) && Reward.instance.share({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        this.onClick_try();
                    },
                });
            }
        });

        /** back to other scene */
        this.btn_back.on(Laya.Event.CLICK, this, this.onClick_back);
    }

    private onClick_back() {
        // clear animation
        this.box_scene3D.timer.clear(this, this.cannonAniLoop);
        this.visible = false;

        // change cannon
        if (this.isClick) {
            if (GameScene.instance.cannonType !== this.selectType) {
                if (this.isReward) {
                    GameScene.instance.isRewardCannon = true;
                }
                GameScene.instance.setCannon(this.selectType);
            }
        }

        // jump to other scene
        if (GameScene.instance && GameScene.instance.state === Const.GameState.PAUSE) {
            GameScene.openInstance();
        }
        else {
            HomeView.openInstance();
        }
    }

    private onClick_try() {
        if (!(this.isReward && this.selectType === Const.CannonSelectIconList[this.list_Icon.selectedIndex].index)) {
            // update
            this.isClick = true;
            this.isReward = true;
            this.selectType = Const.CannonSelectIconList[this.list_Icon.selectedIndex].index;
            this.btn_try.gray = true;
            this.label_try.changeText("正在试用");
            this.refreshIcon();
        }
    }

    /** 新手引导链条 */
    private openTutorial() {
        this.tutorial_slide.visible = false;
        Laya.timer.clearAll(this.tutorial_slide.getChildByName("finger"));
        this.tutorial_try.visible = true;
        var finger: Laya.Image = this.tutorial_try.getChildByName("finger") as Laya.Image;
        finger.timer.frameLoop(1, finger, () => {
            finger.bottom += 0.5;
            if (finger.bottom >= 20) {
                finger.bottom = 10;
            }
        });
        this.tutorial_try.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
            console.log("newplayer_6")
            ws.traceEvent("newplayer_6");
            this.onClick_try();
            this.tutorial_try.visible = false;
            this.tutorial_try.getChildByName("inputArea").offAll();
            Laya.timer.clearAll(this.tutorial_try.getChildByName("finger"));
            // open tutorial: back
            this.tutorial_back.visible = true;
            var finger: Laya.Image = this.tutorial_back.getChildByName("finger") as Laya.Image;
            finger.timer.frameLoop(1, finger, () => {
                finger.top -= 0.5;
                if (finger.top <= 100) {
                    finger.top = 120;
                }
            });
            this.tutorial_back.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
                console.log("newplayer_7")
                ws.traceEvent("newplayer_7");
                this.onClick_back();
                this.tutorial_back.visible = false;
                this.tutorial_back.getChildByName("inputArea").offAll();
                Laya.timer.clearAll(this.tutorial_back.getChildByName("finger"));
            });
        });
    }

    /** scroll to curr icon (by selected index) */
    private updateScroll() {
        // 停止滚动条滑动
        this.list_Icon.scrollBar.stopScroll();
        // 设置滚动落点位置
        this.list_Icon.scrollTo(this.list_Icon.selectedIndex - 1);
    }

    /** update ui */
    private updateUI() {
        this.refreshIcon();
        this.refreshText();
        this.newCannon();
    }

    /** cannon animation loop */
    private cannonAniLoop() {
        this.cannon && (this.cannon.transform.localRotationEulerY += 1);
    }
}