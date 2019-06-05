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
        this.selectType = Global.gameData.cannonType;
        this.refreshText();
    }

    public scene3D: Laya.Scene3D;
    private camera: Laya.Camera;
    private directionLight: Laya.DirectionLight;

    /** cannon */
    private cannon: Laya.MeshSprite3D;
    public selectType: number;
    public isReward: boolean = false;
    public rewardType: number;

    private btnAniFrame: number;

    constructor() {
        super();
        console.log("CannonSelect constructor()");

        CannonSelect.instance = this;
    }

    onAwake() {
        this.initCannonList();

        this.initScene3D();

        this.newCannon();

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
                cell.on(Laya.Event.CLICK, this, this.onIconClick, [iconInfo]);
                let iconBg = cell.getChildByName("iconBg") as Laya.Sprite;
                if (iconBg) {
                    iconBg.loadImage(Const.CannonSelectIconBgUrl);
                    iconBg.width = 180;
                    iconBg.height = 180;
                }
                let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
                if (iconImage) {
                    iconImage.loadImage(iconInfo.icon);
                    iconImage.width = 150;
                    iconImage.height = 150;
                }
            } else {
                cell.visible = false;
            }
        }, [], false);

        this.list_Icon.hScrollBarSkin = "";
        this.list_Icon.array = Const.CannonSelectIconList;
        this.list_Icon.refresh();
    }

    /** list cell icon onclick */
    private onIconClick(iconInfo: any) {
        // update
        this.selectType = iconInfo.index;
        // refresh text
        this.refreshText();
    }

    /** refresh text */
    private refreshText() {
        this.label_name.changeText(Const.CannonSelectTextList[this.selectType]["name"]);
        this.label_feature.changeText(Const.CannonSelectTextList[this.selectType]["feature"]);
        // 未解锁
        if (Global.gameData.stageIndex <= Const.CannonSelectTextList[this.selectType]["unlockLvl"]) {
            this.label_unlockMsg.changeText("完成关卡 " + (Global.gameData.stageIndex - 1) + "/" + Const.CannonSelectTextList[this.selectType]["unlockLvl"] + " 解锁");
            this.btn_select.visible = false;
            this.btn_unlock.visible = true;
            this.btn_try.visible = true;
        }
        else {
            this.label_unlockMsg.changeText("已解锁");
            // 使用状态按钮变灰
            if (this.selectType === Global.gameData.cannonType) {
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

    /** initialize scene */
    private initScene3D() {
        // add scene
        this.scene3D = this.box_scene3D.addChild(new Laya.Scene3D()) as Laya.Scene3D;

        // camera
        this.camera = this.scene3D.addChild(new Laya.Camera()) as Laya.Camera;
        this.camera.transform.localPosition = Const.CameraInitPos.clone();
        this.camera.transform.localRotationEuler = Const.CameraInitRotEuler.clone();
        // this.camera.clearColor = null;

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
        Laya.Sprite3D.load(Const.CannonResUrl[Global.gameData.cannonType], Laya.Handler.create(this, (res) => {
            this.cannon = res;
            this.scene3D.addChild(this.cannon);

            this.cannon.transform.localPosition = Const.CannonInitPos.clone();
            this.cannon.transform.localRotationEuler = Const.CannonInitRot.clone();
            this.cannon.transform.localScale = Const.CannonInitScale.clone();

            // on animation
            this.box_scene3D.timer.frameLoop(1, this, this.cannonAniLoop);
        }));
    }

    /** bind button */
    private bindButtons() {
        // back other scene
        this.btn_back.on(Laya.Event.CLICK, this, () => {
            // clear animation
            this.box_scene3D.timer.clear(this, this.cannonAniLoop);
            this.visible = false;

            // change cannon
            if (this.isReward) {
                GameScene.instance.isRewardCannon = true;
                GameScene.instance.setCannon(this.rewardType);
            }
            if (!this.isReward && GameScene.instance.cannonType !== Global.gameData.cannonType) {
                GameScene.instance.setCannon(Global.gameData.cannonType);
            }

            // jump to other scene
            if (GameScene.instance && GameScene.instance.state === Const.GameState.PAUSE) {
                GameScene.openInstance();
            }
            else {
                HomeView.openInstance();
            }
        });

        // cannon unlock try
        this.btn_try.on(Laya.Event.CLICK, this, () => {
            if (!Laya.Browser.onMiniGame) {
                this.isReward = true;
                this.rewardType = this.selectType;
            }
            else {
                // 1: video
                (Global.config.try_cannon == 1) && Reward.instance.video({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        this.isReward = true;
                        this.rewardType = this.selectType;
                    },
                });
                // 2: share
                (Global.config.try_cannon == 2) && Reward.instance.share({
                    pos: Const.RewardPos.Cannon,
                    success: () => {
                        this.isReward = true;
                        this.rewardType = this.selectType;
                    },
                });
            }
        });
    }

    /** cannon animation loop */
    private cannonAniLoop() {
        this.cannon && (this.cannon.transform.localPositionY += 1);
    }
}