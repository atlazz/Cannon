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
        // get selected cell and unlock state list
        for (let idx in Const.CannonSelectIconList) {
            // selected cell
            if (Const.CannonSelectIconList[idx]["index"] == this.selectType) {
                let idx_real = (parseInt(idx) + this.list_Icon.cells.length - this.list_Icon.startIndex) % this.list_Icon.cells.length;
                this.selectedCell = this.list_Icon.cells[idx_real];
            }
            // unlock state
            this.unlockState[idx] = false;
            if (Global.gameData.stageIndex > Const.CannonSelectTextList[Const.CannonSelectIconList[idx].index]["unlockLvl"]) {
                this.unlockState[idx] = true;
            }
        }
        this.refreshText();
        this.refreshIcon();
        // show cannon
        this.selectType = Global.gameData.cannonType;
        this.newCannon();
    }

    public scene3D: Laya.Scene3D;
    private camera: Laya.Camera;
    private directionLight: Laya.DirectionLight;

    private cannon: Laya.MeshSprite3D;
    public selectType: number;
    public isReward: boolean = false;
    public rewardType: number;

    private selectedCell: Laya.Box;

    private btnAniFrame: number;

    private unlockState: boolean[] = [];

    private isClick: boolean;

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
            if (iconInfo) {
                cell.visible = true;
                this.selectType = iconInfo.index;
                cell.on(Laya.Event.CLICK, this, this.onIconClick, [cell, iconInfo]);
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

    /** list cell icon onclick */
    private onIconClick(cell: Laya.Box, iconInfo: any) {
        // update
        this.isClick = true;
        this.selectedCell = cell;
        this.selectType = iconInfo.index;
        // refresh text
        this.refreshText();
        // change cannon
        this.newCannon();
    }

    /** refresh text */
    private refreshText() {
        this.label_name.changeText(Const.CannonSelectTextList[this.selectType]["name"]);
        this.label_feature.changeText(Const.CannonSelectTextList[this.selectType]["feature"]);
        // 未解锁
        if (Global.gameData.stageIndex <= Const.CannonSelectTextList[this.selectType]["unlockLvl"]) {
            if (Const.CannonSelectTextList[this.selectType]["unlockLvl"] >= 999) {
                this.label_unlockMsg.changeText("敬请期待");
            }
            else {
                this.label_unlockMsg.changeText("完成关卡 " + (Global.gameData.stageIndex - 1) + "/" + Const.CannonSelectTextList[this.selectType]["unlockLvl"] + " 解锁");
            }
            this.btn_select.visible = false;
            this.btn_unlock.visible = true;
            if (this.isReward && this.rewardType === this.selectType) {
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
            if (!this.isReward && this.selectType === Global.gameData.cannonType) {
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
        for (let idx in this.list_Icon.cells) {
            var iconBg: Laya.Image = this.list_Icon.cells[idx].getChildByName("iconBg") as Laya.Image;
            if (this.list_Icon.cells[idx] == this.selectedCell) {
                if (iconBg) {
                    iconBg.gray = false;
                    iconBg.scaleX = 1;
                    iconBg.scaleY = 1;
                }
            }
            else {
                if (iconBg) {
                    iconBg.gray = true;
                    iconBg.scaleX = 0.85;
                    iconBg.scaleY = 0.85;
                }
            }
            var iconLock = this.list_Icon.cells[idx].getChildByName("lock") as Laya.Image;
            let idx_real = (parseInt(idx) + this.list_Icon.startIndex) % this.list_Icon.cells.length;
            iconLock && (iconLock.visible = true);
            if (this.unlockState[idx_real]) {
                iconLock && (iconLock.visible = false);
            }
            if (this.isReward && this.rewardType == Const.CannonSelectIconList[idx_real].index) {
                iconLock && (iconLock.visible = false);
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
        this.btn_try.on(Laya.Event.CLICK, this, () => {
            if (!Laya.Browser.onMiniGame) {
                if (!(this.isReward && this.rewardType == this.selectType)) {
                    // update
                    this.isReward = true;
                    this.rewardType = this.selectType;
                    this.btn_try.gray = true;
                    this.label_try.changeText("正在试用");
                    this.refreshIcon();
                }
            }
            else {
                // 1: video
                (Global.config.try_cannon == 1) && Reward.instance.video({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        if (!(this.isReward && this.rewardType == this.selectType)) {
                            // update
                            this.isReward = true;
                            this.rewardType = this.selectType;
                            this.btn_try.gray = true;
                            this.label_try.changeText("正在试用");
                            this.refreshIcon();
                        }
                    },
                });
                // 2: share
                (Global.config.try_cannon == 2) && Reward.instance.share({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        if (!(this.isReward && this.rewardType == this.selectType)) {
                            this.refreshIcon();
                            // update
                            this.isReward = true;
                            this.rewardType = this.selectType;
                            this.btn_try.gray = true;
                            this.label_try.changeText("正在试用");
                        }
                    },
                });
            }
        });
    }

    /** cannon animation loop */
    private cannonAniLoop() {
        this.cannon && (this.cannon.transform.localRotationEulerY += 1);
    }
}