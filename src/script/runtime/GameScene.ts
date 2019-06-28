import { ui } from "../../ui/layaMaxUI";
import * as Const from "../Const";
import Global from "../Global";
import Navigator from "../utils/Navigator";
import wx from "../utils/wx";
import ws from "../utils/ws.js";
import * as Ad from "../utils/Ad";
import Bullet from "../component/Bullet";
import Target from "../component/Target";
import Guard from "../component/Guard";
import Reward from "../component/Reward";
import HomeView from "./HomeView";
import CannonSelect from "./CannonSelect";
import * as StageConfig from "../StageConfig"

export default class GameScene extends ui.game.GameSceneUI {
    static instance: GameScene;

    private navGame: Navigator;
    private navWin: Navigator;
    private navRevive: Navigator;

    /**
     * 打开该单例页面，触发onOpened
     * @param param  onOpened方法的传参
     */
    static openInstance(param?: any) {
        if (GameScene.instance) {
            GameScene.instance.onOpened(param);
        } else {
            Laya.Scene.open(Const.URL_GameScene, false, param);
        }
    }

    onOpened(param?: any) {
        console.log("GameScene onOpened()");
        this.visible = true;
        this.mouseEnabled = true;

        // 调整钻石及其数量位置居中
        this.text_diamond.changeText("" + Global.gameData.diamond);
        this.icon_diamond.visible = true;

        /** init navigation game icon: 第一次打开时 */
        if (Laya.Browser.onMiniGame && !this.navGame) {
            this.navGame = new Navigator(ws);
        }

        // game playing
        if (this.state === Const.GameState.START) {
            // change bg
            if (Global.gameData.stageIndex > 2 && this.bgIdx != (Global.gameData.stageIndex - 2) % 4) {
                this.bgIdx = (Global.gameData.stageIndex - 2) % 4;
                this.newBackground();
            }
            // change cannon
            if (!this.isRewardCannon && this.cannonType !== Global.gameData.cannonType) {
                this.setCannon(Global.gameData.cannonType);
            }
            this.showUI();
            // reset
            this.stageIdx = Global.gameData.stageIndex;
            this.missionIdx = 1;        // <==== TODO: reset to 1
            for (let i = 1; i <= 5; i++) {
                this.missionRawIdxList[i - 1] = 0;
                this["level" + i].sizeGrid = "0, 96, 0, 0";
            }
            this.newStage();

            /** init navigation: 第一次打开时 */
            if (Laya.Browser.onMiniGame && !this.navWin) {
                // win icon
                this.navWin = new Navigator(ws);
                this.box_winIcon.visible = true;
                this.navWin.createHomeIcons(this.box_winIcon, this.box_winIcon, ["home_icon_1", "home_icon_2", "home_icon_3", "home_icon_4", "home_icon_5", "home_icon_6", "home_icon_7", "home_icon_8", "home_icon_9", "home_icon_10"]);
                // revive icon
                this.navRevive = new Navigator(ws);
                this.box_reviveIcon.visible = true;
                this.navRevive.createHomeIcons(this.box_reviveIcon, this.box_reviveIcon, ["home_icon_1", "home_icon_2", "home_icon_3", "home_icon_4", "home_icon_5", "home_icon_6", "home_icon_7", "home_icon_8", "home_icon_9", "home_icon_10"]);
            }
        }
        // game pause: 大炮选择页面跳转回来
        else if (this.state === Const.GameState.PAUSE) {
            this.state = Const.GameState.START;
        }

        // 测试接口开始 <==========================
        if (HomeView.instance.isTest) {
            this.box_test.visible = true;
            this.reTimes = 1;
            this.MaxReTimes = 1;
            Laya.Stat.show();
        }
        else {
            this.box_test.visible = false;
            Laya.Stat.hide();
        }
        // 测试接口结束 <==========================
    }

    public scene3D: Laya.Scene3D;
    private camera: Laya.Camera;
    private directionLight: Laya.DirectionLight;

    /** background */
    private background: Laya.Sprite3D;
    private bgIdx: number = 0;

    /** stage */
    public gameStage: Laya.Sprite3D;
    // 大关卡索引
    public stageIdx: number;
    // 子关卡索引：[1,5]
    public missionIdx: number;
    // 原始关卡索引
    public rawIdx: number;
    public missionRawIdxList: number[] = [0, 0, 0, 0, 0];
    public MaxBulletNum: number = 100;
    public currBulletNum: number = 0;
    public isStageStart: boolean = false;
    public countdown: number;
    public isRevive: boolean;

    public winCheckCnt: number = 0;
    public flag_missionWin: boolean = false;

    /** treasure */
    public treasureHitCnt: number = 0;
    public treasereMaxHitCnt: number = 20;
    public treasureFrameCnt: number = 0;
    public treasereMaxFrameCnt: number = 90;
    public treasureHitState: number = 0;
    public isTreasureHit: boolean = false;
    public isTreasureMoveStart: boolean = false;
    public isTreasureAdOpen: boolean = false;

    /** cannon */
    public cannonType: number = Const.CannonType.DEFAULT;
    public cannon: Laya.MeshSprite3D;
    private turret: Laya.MeshSprite3D;
    public turretInitPos: Laya.Vector3 = Const.CannonInitPos.clone();
    public turretInitRot: Laya.Vector3;
    private isRecoil: boolean = false;
    private recoilTime: number;
    private MaxRecoilTime: number = 8;
    public isRewardCannon: boolean = false;

    /** cannon ball box */
    public ballBox: Laya.Sprite3D;

    /** bullet */
    public bulletType: number = Const.CannonType.DEFAULT;
    public bulletDirection: Laya.Vector3 = new Laya.Vector3();
    public isRewardBullet: boolean = false;

    /** raycast */
    private mousePoint: Laya.Vector2 = new Laya.Vector2();
    private ray: Laya.Ray = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
    private hitResult: Laya.HitResult = new Laya.HitResult();

    /** glass pieces list */
    public piecesList: Laya.MeshSprite3D[] = [];

    /** game state */
    public state: number = 0;

    /** stage invisible ground */
    public ground: Laya.MeshSprite3D;

    private btnAniFrame: number;

    // 按钮点击处理函数
    public onClick_cannonSelect: Function;
    public onClick_rewardBullet: Function;
    public onClick_rewardCannon: Function;
    // public onClick_rewardTemplate: Function;

    // 测试接口开始 <==========================
    public reTimes: number = 1;
    public MaxReTimes: number = 1;
    // 测试接口结束 <==========================

    constructor() {
        super();
        console.log("GameScene constructor()");

        GameScene.instance = this;
    }

    onAwake() {
        this.initScene3D();

        this.bgIdx = 0;
        this.newBackground();

        this.isRewardCannon = false;
        this.cannonType = Const.CannonType.DEFAULT;
        this.newCannon();

        this.newBallBox();

        // multiple touch input disable
        this.scene3D.input.multiTouchEnabled = false;

        this.scene3D.physicsSimulation.fixedTimeStep = 0.5 / 60;
        // Laya.timer.scale = 0.5;
        // Laya.stage.frameRate = "slow";

        // if (Laya.Browser.onMiniGame) {
        //     wx.setPreferredFramesPerSecond(30);
        // }
    }

    onEnable() {
        this.bindButtons();

        // 动画
        Laya.timer.clear(this, this.rewardBtnAni);
        this.btnAniFrame = 0;
        Laya.timer.frameLoop(1, this, this.rewardBtnAni);
    }

    /** initialize scene */
    private initScene3D() {
        // add scene
        this.scene3D = this.box_scene3D.addChild(new Laya.Scene3D()) as Laya.Scene3D;

        // camera
        this.camera = this.scene3D.addChild(new Laya.Camera()) as Laya.Camera;
        this.camera.transform.localPosition = Const.CameraInitPos.clone();
        this.camera.transform.localRotationEuler = Const.CameraInitRotEuler.clone();

        this.camera.clearFlag = Laya.BaseCamera.CLEARFLAG_SKY;
        let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
        mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
        mat.albedoColor = new Laya.Vector4(1, 1, 1, 0);
        this.camera.skyRenderer.material = mat;
        // this.camera.clearColor = null;
        // 调整fov，适配屏幕分辨率
        let num = 720 / 1280;
        let num2 = Laya.Browser.width / Laya.Browser.height;
        if (num2 < num) {
            let num3 = 60 * 0.01745329;
            let num4 = 2 * Math.atan(Math.tan(num3 / 2) * num);
            this.camera.fieldOfView = (2 * Math.atan(Math.tan(num4 / 2) / num2)) * 57.29578;
        }

        // direction light
        this.directionLight = this.scene3D.addChild(new Laya.DirectionLight()) as Laya.DirectionLight;
        this.directionLight.transform.localPosition = Const.LightInitPos.clone();
        this.directionLight.transform.localRotationEuler = Const.LightInitRotEuler.clone();
        this.directionLight.color = Const.LightInitColor.clone();
    }

    /** new background */
    newBackground() {
        // destroy old
        if (this.background) {
            Laya.timer.clearAll(this.background);
            this.background.destroy();
        }
        if (this.bgIdx > 1) {
            this.bgImg.skin = Const.BgResUrl[this.bgIdx];
            this.scene3D.addChild(this.ground);
        }
        else {
            // new
            Laya.Sprite3D.load(Const.BgResUrl[this.bgIdx], Laya.Handler.create(this, (res) => {
                this.scene3D.removeChildByName("background");
                this.background = this.scene3D.addChild(res) as Laya.Sprite3D;
                this.background.name = "background";
                // transform
                this.background.transform.localPosition = Const.StageInitPos.clone();
                this.background.transform.localRotationEuler = Const.StageInitRot.clone();
                this.background.transform.localScale = Const.StageInitScale.clone();

                // destroy animator component
                let bgAni = (this.background.getComponent(Laya.Animator) as Laya.Animator);
                bgAni && bgAni.destroy();

                if (this.bgIdx === 0) {
                    let cloud0 = this.background.getChildByName("Scenes_02").getChildByName("cloud01") as Laya.Sprite3D;
                    let cloud1 = this.background.getChildByName("Scenes_02").getChildByName("cloud03") as Laya.Sprite3D;
                    let plane: Laya.MeshSprite3D = this.background.getChildByName("Scenes_02").getChildByName("Plane").getChildByName("Plane_0") as Laya.MeshSprite3D;
                    // init invisible ground
                    if (plane && !this.ground) {
                        this.ground = plane.clone();
                        this.scene3D.addChild(this.ground);
                        this.ground.name = "ground";
                        let planeCollider: Laya.PhysicsCollider = this.ground.addComponent(Laya.PhysicsCollider);
                        planeCollider.colliderShape = new Laya.StaticPlaneColliderShape(new Laya.Vector3(0, 1, 0), plane.transform.position.y);
                    }
                    else {
                        this.scene3D.addChild(this.ground);
                    }
                    // plane.name = "ground";
                    // let planeCollider: Laya.PhysicsCollider = plane.addComponent(Laya.PhysicsCollider);
                    // planeCollider.colliderShape = new Laya.StaticPlaneColliderShape(new Laya.Vector3(0, 1, 0), 0);

                    // animation
                    this.background.frameLoop(1, this.background, () => {
                        if (cloud0) {
                            if (cloud0.transform.localPositionX > 0.5) { cloud0.transform.localPositionX = -0.5; }
                            cloud0.transform.localPositionX += 0.0007;
                        }
                        if (cloud1) {
                            if (cloud1.transform.localPositionX < -0.5) { cloud1.transform.localPositionX = 0.5; }
                            cloud1.transform.localPositionX -= 0.0005;
                        }
                    });
                }
                else if (this.bgIdx === 1) {
                    // remove ground
                    this.ground.removeSelf();

                    let island0 = this.background.getChildByName("_0012_Island1_0") as Laya.MeshSprite3D;
                    let island1 = this.background.getChildByName("_0014_Island3_0") as Laya.MeshSprite3D;
                    let island2 = this.background.getChildByName("_0019_Island8_0") as Laya.MeshSprite3D;
                    let plant = this.background.getChildByName("_0006_Plant01_0 1") as Laya.MeshSprite3D;
                    let tmpSky = this.background.getChildByName("_0022_Sky_0") as Laya.MeshSprite3D;

                    if (island0) { island0.meshRenderer.castShadow = false; island0.meshRenderer.receiveShadow = false };
                    if (island1) { island1.meshRenderer.castShadow = false; island1.meshRenderer.receiveShadow = false };
                    if (island2) { island2.meshRenderer.castShadow = false; island2.meshRenderer.receiveShadow = false };
                    if (tmpSky) { tmpSky.meshRenderer.castShadow = false; tmpSky.meshRenderer.receiveShadow = false };

                    // animation
                    let bgFrameCnt: number = 0;
                    let bgFrameCnt2: number = 0;
                    this.background.frameLoop(1, this.background, () => {
                        bgFrameCnt++;
                        bgFrameCnt2++;
                        if (bgFrameCnt > 180) { bgFrameCnt = 0; }
                        if (bgFrameCnt2 > 300) { bgFrameCnt2 = 0; }
                        if (island0) {
                            if (bgFrameCnt <= 90) { island0.transform.localPositionY += 0.0005; }
                            else { island0.transform.localPositionY -= 0.0005; }
                        }
                        if (island1) {
                            if (bgFrameCnt2 <= 150) { island1.transform.localPositionY -= 0.0002; }
                            else { island1.transform.localPositionY += 0.0002; }
                        }
                        if (island2) {
                            if (bgFrameCnt <= 90) { island2.transform.localPositionY += 0.0005; }
                            else { island2.transform.localPositionY -= 0.0005; }
                        }
                        if (plant) {
                            if (bgFrameCnt <= 90) {
                                plant.transform.localRotationEulerX -= 0.2;
                                plant.transform.localPositionX += 0.00018;
                            } else {
                                plant.transform.localRotationEulerX += 0.2;
                                plant.transform.localPositionX -= 0.00018;
                            }
                        }
                    });
                }
            }));
        }
    }

    /** new cannon ball box */
    private newBallBox() {
        Laya.Sprite3D.load(Const.CannonBallBoxUrl, Laya.Handler.create(this, (res) => {
            this.ballBox = this.scene3D.addChild(res.clone()) as Laya.Sprite3D;
            this.ballBox.name = "ball_box";
            this.ballBox.transform.localPosition = Const.CannonBallInitPos.clone();
            this.ballBox.transform.localRotationEuler = Const.CannonInitRot.clone();
            this.ballBox.transform.localScale = Const.CannonBallInitScale.clone();
            // set render mode
            for (let i = 1; i <= 10; i++) {
                if (i <= this.MaxBulletNum) {
                    ((this.ballBox.getChildByName("CannonBall" + i + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).renderMode = Laya.PBRSpecularMaterial.RENDERMODE_TRANSPARENT;
                }
            }
            for (let i = 1; i <= 5; i++) {
                if (i <= this.MaxBulletNum) {
                    ((this.ballBox.getChildByName("chest_wooden_" + i + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
                }
            }
            // clone to right side
            let rightBallBox = this.scene3D.addChild(this.ballBox.clone()) as Laya.Sprite3D;
            for (let i = 1; i <= 10; i++) {
                if (i <= this.MaxBulletNum) {
                    var tmpChild = rightBallBox.getChildByName("CannonBall" + i + "_0") as Laya.MeshSprite3D;
                    tmpChild && tmpChild.destroy();
                }
            }
            rightBallBox.transform.localPositionX = 0.11;
            rightBallBox.transform.localPositionY -= 0.008;
            rightBallBox.transform.localPositionZ += 0.012;
            rightBallBox.transform.localRotationEulerY = 150;
        }));
    }

    /** set cannon */
    setCannon(type: number) {
        this.cannonType = type;
        this.bulletType = this.cannonType;
        this.newCannon();
    }

    /** new cannon */
    newCannon() {
        // destroy old cannon
        this.cannon && this.cannon.destroy();
        // load new cannon
        Laya.Sprite3D.load(Const.CannonResUrl[this.cannonType], Laya.Handler.create(this, (res) => {
            // destroy old
            this.cannon && this.cannon.destroy();
            // add new
            this.cannon = res.clone();
            this.scene3D.addChild(this.cannon);

            this.cannon.transform.localPosition = Const.CannonInitPos.clone();
            this.cannon.transform.localRotationEuler = Const.CannonInitRot.clone();
            this.cannon.transform.localScale = Const.CannonInitScale.clone();

            this.turret = this.cannon.getChildByName("Turret_0") as Laya.MeshSprite3D;
            if (this.turret) {
                this.turretInitPos = this.turret.transform.position.clone();
                this.turretInitRot = this.turret.transform.localRotationEuler.clone();
            }
        }));
    }

    /** show game ui */
    showUI() {
        this.box_UI.visible = true;
    }

    /** hide game ui */
    hideUI() {
        this.box_UI.visible = false;
        this.box_passStage.visible = false;
        this.box_gameIcon.visible = false;
        this.hideReviveUI();
    }

    /** hide revive ui */
    hideReviveUI() {
        Ad.hideBanner();
        this.box_revive.visible = false;
    }

    onClick_rewardTemplate(rewardType: number, rewardPos: string, rewardSuccess: Function) {
        if (!Laya.Browser.onMiniGame) {
            rewardSuccess();
        }
        else {
            // 1: video
            if (rewardType == 1) {
                // 未超过每天视频观看次数
                if (!Reward.instance.isOverVideo()) {
                    this.mouseEnabled = false;
                    Reward.instance.video({
                        pos: rewardPos,
                        success: () => {
                            console.log("video succeed:", rewardType, rewardPos);
                            rewardSuccess();
                        },
                        fail: () => {
                            console.log("video failed:", rewardType, rewardPos);
                            Reward.instance.share({
                                pos: rewardPos,
                                success: () => {
                                    console.log("share succeed:", rewardType, rewardPos);
                                    rewardSuccess();
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
                        pos: rewardPos,
                        success: () => {
                            console.log("share succeed:", rewardType, rewardPos);
                            rewardSuccess();
                        },
                    });
                }
            }
            // 2: share
            else if (rewardType == 2) {
                Reward.instance.share({
                    pos: rewardPos,
                    success: () => {
                        console.log("share succeed:", rewardType, rewardPos);
                        rewardSuccess();
                    },
                });
            }
            // 3: jump to other minigame
            else if (rewardType == 3) {
                this.navWin.randomIconTap("default", /**success*/() => {
                    rewardSuccess();
                }, /**fail*/() => {
                    // 跳转失败播放视频
                    if (!Reward.instance.isOverVideo()) {
                        this.mouseEnabled = false;
                        Reward.instance.video({
                            pos: rewardPos,
                            success: () => {
                                console.log("video succeed:", rewardType, rewardPos);
                                rewardSuccess();
                            },
                            fail: () => {
                                console.log("video failed:", rewardType, rewardPos);
                                Reward.instance.share({
                                    pos: rewardPos,
                                    success: () => {
                                        console.log("share succeed:", rewardType, rewardPos);
                                        rewardSuccess();
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
                            pos: rewardPos,
                            success: () => {
                                console.log("share succeed:", rewardType, rewardPos);
                                rewardSuccess();
                            },
                        });
                    }
                })
            }
        }
    }

    /** bind button */
    private bindButtons() {
        // 测试接口开始 <==========================
        this.btn_test_next.on(Laya.Event.CLICK, this, () => {
            HomeView.instance.testStageIdx++;
            if (this.input_test_lvl.text) {
                HomeView.instance.testStageIdx = parseInt(this.input_test_lvl.text);
                this.input_test_lvl.text = "";
            }
            this.reTimes = 1;
            this.MaxReTimes = 1;
            this.btn_test_restart.visible = false;
            this.btn_test_next.visible = false;
            this.newStage();
        });
        this.btn_test_restart.on(Laya.Event.CLICK, this, () => {
            if (this.input_test_reTimes.text) {
                this.MaxReTimes = parseInt(this.input_test_reTimes.text);
                this.input_test_lvl.text = "";
            }
            else {
                this.MaxReTimes = 1;
            }
            this.reTimes = 1;
            this.btn_test_restart.visible = false;
            this.btn_test_next.visible = false;
            this.newStage();
        });
        // 测试接口结束 <==========================

        // onclick handler
        this.onClick_cannonSelect = () => {
            this.state = Const.GameState.PAUSE;
            this.mouseEnabled = false;
            CannonSelect.openInstance();
        }
        this.onClick_rewardBullet = () => {
            this.isRewardBullet = true;
            this.bulletType = Global.config.bulletRewardType;
            // cannon effect
            if (!this.scene3D.getChildByName("cannon_effect")) {
                Laya.Sprite3D.load(Const.cannonEffectUrl[1], Laya.Handler.create(this, (cannonEff) => {
                    let cannonEffect: Laya.Sprite3D = this.scene3D.addChild(cannonEff) as Laya.Sprite3D;
                    cannonEffect.name = "cannon_effect";
                }));
            }
        }
        this.onClick_rewardCannon = () => {
            this.isRewardCannon = true;
            this.setCannon(Global.config.cannonRewardType);
        }

        // back home
        this.btn_back.on(Laya.Event.CLICK, this, () => {
            this.backCheck.visible = true;
        });
        this.btn_backReturn.on(Laya.Event.CLICK, this, () => {
            this.backCheck.visible = false;
        });
        this.btn_backExit.on(Laya.Event.CLICK, this, () => {
            this.backCheck.visible = false;
            this.state = Const.GameState.OVER;
            this.cleanStage();
            this.hideUI();
            this.mouseEnabled = false;
            // reset cannon rotation
            if (this.turret && this.cannon && !this.cannon.destroyed && this.turretInitRot) {
                this.turret.transform.localRotationEuler = this.turretInitRot.clone();
            }
            // clear reward cannon
            if (this.isRewardCannon) {
                this.setCannon(Global.gameData.cannonType);
                this.isRewardCannon = false;
            }
            // clear timer
            this.clearStageTimer();
            HomeView.openInstance();
        });

        // cannon selection open
        this.btn_cannonOpen.on(Laya.Event.CLICK, this, () => {
            this.onClick_cannonSelect();
        });

        // reward bullet
        this.btn_rewardBullet.on(Laya.Event.MOUSE_DOWN, this, this.onClick_rewardTemplate, [Global.config.try_ball, Const.RewardPos.Bullet, this.onClick_rewardBullet]);

        // reward cannon
        this.btn_rewardCannon.on(Laya.Event.MOUSE_DOWN, this, this.onClick_rewardTemplate, [Global.config.try_cannon, Const.RewardPos.Cannon, this.onClick_rewardCannon]);

        // next stage
        this.btn_passStage.on(Laya.Event.CLICK, this, () => {
            // add diamond
            Global.gameData.diamond += StageConfig.StageReward[(this.stageIdx - 1) > 39 ? 39 : (this.stageIdx - 1)];
            this.text_diamond.changeText("" + Global.gameData.diamond);
            // hide
            Ad.hideBanner();
            this.box_passStage.visible = false;
            // next
            this.nextStage();
        });

        // reward next stage: diamond x3
        this.btn_passStagex3.on(Laya.Event.MOUSE_DOWN, this, this.onClick_rewardTemplate, [Global.config.reward_triple, Const.RewardPos.Treasure, () => {
            // add diamond
            Global.gameData.diamond += StageConfig.StageReward[(this.stageIdx - 1) > 39 ? 39 : (this.stageIdx - 1)] * 3;
            this.text_diamond.changeText("" + Global.gameData.diamond);
            // hide
            Ad.hideBanner();
            this.box_passStage.visible = false;
            // next
            this.nextStage();
        }]);

        // reward revive btn
        this.btn_revive.on(Laya.Event.MOUSE_DOWN, this, this.onClick_rewardTemplate, [Global.config.revive, Const.RewardPos.Revive, () => {
            this.isRevive = true;
            this.hideReviveUI();
            this.currBulletNum -= 3;
            this.label_ballNum.changeText("x3");
            if (this.ballBox) {
                for (let i = 1; i <= 3; i++) {
                    if (i <= this.MaxBulletNum) {
                        ((this.ballBox.getChildByName("CannonBall" + i + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).albedoColorA = 1;
                    }
                }
            }
            this.box_scene3D.on(Laya.Event.CLICK, this, this.onClick);
            this.gameStage.frameLoop(1, this, this.stageLooping);
        }]);

        // revive retry: back home
        this.btn_retry.on(Laya.Event.CLICK, this, () => {
            this.state = Const.GameState.OVER;
            this.cleanStage();
            this.hideUI();
            // reset cannon rotation
            if (this.turret && this.cannon && !this.cannon.destroyed && this.turretInitRot) {
                this.turret.transform.localRotationEuler = this.turretInitRot.clone();
            }
            // clear reward cannon
            if (this.isRewardCannon) {
                this.setCannon(Global.gameData.cannonType);
                this.isRewardCannon = false;
            }
            // clear timer
            this.clearStageTimer();
            this.mouseEnabled = false;
            HomeView.openInstance();
        });

        // treasure ad close
        this.btn_treasureGetExtra.on(Laya.Event.CLICK, this, () => {
            // add diamond
            Global.gameData.diamond += StageConfig.StageReward[this.stageIdx > 39 ? 39 : this.stageIdx];
            this.text_diamond.changeText("" + Global.gameData.diamond);
            // hide
            Ad.hideBanner();
            this.box_treasureAD.visible = false;
        });
    }

    /** reward btn ani */
    private rewardBtnAni() {
        this.btnAniFrame++;
        if (this.btnAniFrame <= 60) {
            this.btn_rewardCannon.scaleX += 0.00625;
            this.btn_rewardCannon.scaleY += 0.00625;
            this.btn_rewardBullet.scaleX += 0.00625;
            this.btn_rewardBullet.scaleY += 0.00625;
        }
        else if (this.btnAniFrame <= 120) {
            this.btn_rewardCannon.scaleX -= 0.00625;
            this.btn_rewardCannon.scaleY -= 0.00625;
            this.btn_rewardBullet.scaleX -= 0.00625;
            this.btn_rewardBullet.scaleY -= 0.00625;
        }
        else {
            this.btnAniFrame = 1;
            this.btn_rewardCannon.scaleX = 1.5;
            this.btn_rewardCannon.scaleY = 1.5;
            this.btn_rewardBullet.scaleX = 1.5;
            this.btn_rewardBullet.scaleY = 1.5;
        }
    }

    /** clean stage */
    private cleanStage() {
        // clean game stage
        if (this.gameStage) {
            this.gameStage.destroy();
            this.gameStage.removeSelf();
            this.clearStageTimer();
            Laya.Browser.onMiniGame && wx.triggerGC && wx.triggerGC();  // todo: 微信触发js垃圾回收
        }
        // clean all bullets
        for (let idx = 0; idx < this.scene3D.numChildren; idx++) {
            var tmpChild = this.scene3D.getChildAt(idx);
            if (tmpChild && tmpChild.name == "bullet") {
                if (tmpChild.getComponent(Bullet)) {
                    tmpChild.getComponent(Bullet).recover();
                }
                else {
                    tmpChild.destroy();
                }
            }
        }
        // clean all glass pieces
        while (this.piecesList && this.piecesList.length !== 0) {
            var tmpPiece = this.piecesList.pop();
            tmpPiece.destroy();
            tmpPiece.removeSelf();
        }
    }

    /** 清除关卡游戏相关循环 */
    private clearStageTimer() {
        Laya.timer.clear(this, this.stageLooping);
        Laya.timer.clear(this, this.stageFailCountDown);
        Laya.timer.clear(this, this.nextStage);
        this.box_countdown.visible = false;
    }

    /** create new stage by index */
    newStage() {
        // invalid check
        if (this.missionIdx < 1 || this.missionIdx > 6) {
            return;
        }


        // 测试接口开始 <========================
        if (!HomeView.instance.isTest) {
            // 测试接口结束 <========================

            // 宝箱关卡广告：preload banner for treasure stage
            if (this.missionIdx === 6) {
                // 宝箱banner预创建
                Ad.randomlyGetBanner("treasure");
                // this.box_gameIcon.visible = false;
                this.box_gameIcon.visible = true;
            }
            // 常规关卡icon广告
            else if (this.missionIdx >= 1 && this.missionIdx <= 5) {
                this.navGame && this.navGame.createGameIcons();
                this.box_gameIcon.visible = true;
            }

            // 测试接口开始 <========================
        }
        // 测试接口结束 <========================

        // destroy old stage
        this.cleanStage();

        // set ui
        this.box_passStage.visible = false;
        this.missionWin.visible = false;
        if (this.missionIdx >= 1 && this.missionIdx <= 5) {
            this["level" + this.missionIdx].sizeGrid = "0,64,0,0";
        }

        // reset
        this.isRewardBullet = false;
        this.scene3D.getChildByName("cannon_effect") && this.scene3D.getChildByName("cannon_effect").destroy();
        this.isRevive = false;
        this.currBulletNum = 0;
        this.winCheckCnt = 0;
        this.flag_missionWin = false;
        this.isStageStart = false;
        this.isRecoil = false;
        this.recoilTime = this.MaxRecoilTime;
        this.bulletType = this.cannonType;
        // reset turret rotation
        if (this.cannon && !this.cannon.destroyed && this.turret && this.turretInitRot) {
            this.turret.transform.localRotationEuler = this.turretInitRot.clone();
        }


        // 测试接口开始 <========================
        if (!HomeView.instance.isTest) {
            // 测试接口结束 <========================

            // 常规关卡
            if (this.missionIdx >= 1 && this.missionIdx <= 5) {
                // get raw stage index
                let tmpStage = StageConfig.Stage[HomeView.instance.systemName][this.stageIdx > Const.StageNum ? Const.StageNum : this.stageIdx][this.missionIdx];
                this.rawIdx = this.missionRawIdxList[0];
                let tryCnt = 0;
                while (tryCnt < 20 && this.missionRawIdxList.indexOf(this.rawIdx) >= 0) {
                    this.rawIdx = StageConfig.Map[HomeView.instance.systemName][Math.round(Math.random() * (tmpStage.max - tmpStage.min)) + tmpStage.min];
                    tryCnt++;
                }
                this.missionRawIdxList[this.missionIdx - 1] = this.rawIdx;
                this.MaxBulletNum = tmpStage.ball_add + StageConfig.StageRaw[this.rawIdx].ball_num;
                this.label_ballNum.changeText("x" + this.MaxBulletNum);

                console.log("stage: " + this.stageIdx + "\tmission: " + this.missionIdx + "\traw stage index: " + this.rawIdx);
                console.log("max ball num: " + this.MaxBulletNum);

                // set ball box
                if (this.ballBox) {
                    for (let i = 1; i <= 10; i++) {
                        if (i <= this.MaxBulletNum) {
                            ((this.ballBox.getChildByName("CannonBall" + i + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).albedoColorA = 1;
                        }
                        else {
                            ((this.ballBox.getChildByName("CannonBall" + i + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).albedoColorA = 0;
                        }
                    }
                }
            }
            // 大关卡后宝箱奖励
            else {
                // 无限炮弹
                this.MaxBulletNum = 999;
                this.label_ballNum.changeText("无限");
                // show all balls in box
                if (this.ballBox) {
                    for (let i = 1; i <= 10; i++) {
                        ((this.ballBox.getChildByName("CannonBall" + i + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).albedoColorA = 1;
                    }
                }
            }


            // 测试接口开始 <========================
        } else {
            this.rawIdx = HomeView.instance.testStageIdx;
            this.MaxBulletNum = 100;
            this.label_ballNum.changeText("x" + this.MaxBulletNum);
            this.label_test_lvl.changeText("关卡：" + HomeView.instance.testStageIdx);
        }
        // 测试接口结束 <========================


        // load stage
        let satgeResUrl: string;
        /** 常规关卡 */
        if (this.missionIdx >= 1 && this.missionIdx <= 5) {
            satgeResUrl = Const.StageResUrl + this.rawIdx + ".lh";
        }
        /** 宝箱关卡 */
        else {
            satgeResUrl = Const.treasureUrl;
        }
        Laya.Sprite3D.load(satgeResUrl, Laya.Handler.create(this, (res) => {
            console.log("load_stage");
            ws.traceEvent("load_stage");

            if (this.scene3D.getChildByName("gameStage")) {
                this.scene3D.getChildByName("gameStage").destroy();
            }
            // 延时显示，避免与前关资源冲突
            Laya.timer.frameOnce(15, this, () => {  // todo: for test, 15 chang to 60
                this.gameStage = this.scene3D.addChild(res.clone()) as Laya.Sprite3D;
                this.gameStage.name = "gameStage";
                //Laya.loader.clearRes(satgeResUrl);

                // hide: 避免banner加载过程中，用户手快点击事件，导致banner hide 在 show 之前
                Ad.hideBanner();

                // change level label
                this.label_level.changeText("" + this.stageIdx);

                // transform
                this.gameStage.transform.localPosition = Const.StageInitPos.clone();
                this.gameStage.transform.localRotationEuler = Const.StageInitRot.clone();
                this.gameStage.transform.localScale = Const.StageInitScale.clone();

                // destroy animator component: 不然会约束物理碰撞效果
                let stageAni = (this.gameStage.getComponent(Laya.Animator) as Laya.Animator);
                stageAni && stageAni.destroy();

                /** 常规关卡 */
                if (this.missionIdx >= 1 && this.missionIdx <= 5) {
                    let child: Laya.MeshSprite3D;
                    for (let i: number = 0; i < this.gameStage.numChildren; i++) {
                        child = this.gameStage.getChildAt(i) as Laya.MeshSprite3D;
                        // 关闭阴影
                        child.meshRenderer.castShadow = false;
                        child.meshRenderer.receiveShadow = false;
                        /** target object */
                        if (child.name.search("Obstacle") >= 0) {
                            // console.log(child.name + " to target")
                            // add scipt
                            let targetScript: Target = child.addComponent(Target);
                            // set type
                            if (child.name.search("Glass") >= 0) {
                                targetScript.setType(Const.TargetType.GLASS);
                            }
                            else if (child.name.search("TNT") >= 0) {
                                targetScript.setType(Const.TargetType.TNT);
                            }
                            else {
                                targetScript.setType(Const.TargetType.DEFAULT);
                            }
                        }
                        /** stand_box */
                        else if (child.name.search("Cube") >= 0) {
                            // console.log(child.name + " to stand")
                            child.name = "stand";
                            // add collider
                            let collider: Laya.PhysicsCollider = child.addComponent(Laya.PhysicsCollider);
                            let boundingBox: Laya.BoundBox = child.meshFilter.sharedMesh.boundingBox.clone();
                            let sizeX: number = boundingBox.max.x - boundingBox.min.x;
                            let sizeY: number = boundingBox.max.y - boundingBox.min.y;
                            let sizeZ: number = boundingBox.max.z - boundingBox.min.z;
                            collider.colliderShape = new Laya.BoxColliderShape(sizeX, sizeY, sizeZ);
                            // set material
                            Laya.Texture2D.load(Const.StageTexUrl[0], Laya.Handler.create(this, (tex) => {
                                let mat: Laya.PBRSpecularMaterial = new Laya.PBRSpecularMaterial();
                                // 刷新渲染模式，不然其上设置成透明渲染的物体会被遮盖
                                mat.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
                                mat.albedoTexture = tex;
                                child.meshRenderer.material = mat;
                            }));
                        }
                        /** stand_cylinder */
                        else if (child.name.search("Cylinder") >= 0) {
                            // console.log(child.name + " to stand")
                            child.name = "stand";
                            // add collider
                            let collider: Laya.PhysicsCollider = child.addComponent(Laya.PhysicsCollider);
                            let colliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
                            colliderShape.mesh = child.meshFilter.sharedMesh;
                            collider.colliderShape = colliderShape;
                            // set material
                            Laya.Texture2D.load(Const.StageTexUrl[0], Laya.Handler.create(this, (tex) => {
                                let mat: Laya.PBRSpecularMaterial = new Laya.PBRSpecularMaterial();
                                // 刷新渲染模式，不然其上设置成透明渲染的物体会被遮盖
                                mat.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
                                mat.albedoTexture = tex;
                                child.meshRenderer.material = mat;
                            }));
                        }
                        /** Guard */
                        else if (child.name.search("Guard") >= 0) {
                            // console.log(child.name + " to guard")
                            // add script
                            let guard: Guard = child.addComponent(Guard);
                        }
                        else {
                            child && child.destroy();
                        }
                    }
                }
                /** 宝箱关卡 */
                else {
                    this.gameStage.name = "treasure";
                    this.gameStage.transform.localPositionZ += 0.3;

                    // reset
                    this.treasureHitCnt = 0;
                    this.treasureFrameCnt = 0;
                    this.treasureHitState = 0;
                    this.isTreasureAdOpen = false;
                    this.isTreasureHit = false;
                    this.isTreasureMoveStart = false;

                    // 宝箱动画循环
                    var isMoveUp: boolean = Math.random() < 0.6;
                    var moveFrameCnt: number = -1;
                    var MaxMoveFrameCnt: number = 60;
                    var tmpCntHit: number = 0;
                    Laya.timer.frameLoop(1, this.gameStage, () => {
                        if (this.isTreasureMoveStart) {
                            // 上下移动
                            moveFrameCnt++;
                            if (moveFrameCnt <= MaxMoveFrameCnt) {
                                if (isMoveUp) {
                                    this.gameStage.transform.localPositionY += 0.01;
                                } else {
                                    this.gameStage.transform.localPositionY -= 0.01;
                                }
                            }
                            else {
                                moveFrameCnt = 0;
                                // 非第一个周期
                                MaxMoveFrameCnt = 120;
                                // 第一次下落最低点显示广告弹窗-宝箱暴击
                                if (!this.isTreasureAdOpen && !isMoveUp) {
                                    // 宝箱banner是否显示
                                    if (!Global.config.deny_banner && Math.random() < Global.config.banner_show_treasure) {
                                        this.label_extraDiamond.changeText("" + StageConfig.StageReward[this.stageIdx > 39 ? 39 : this.stageIdx]);
                                        this.box_treasureAD.visible = true;
                                        this.isTreasureAdOpen = true;
                                        // var offsetY_treasureBanner = -120;
                                        // console.log(this.btn_treasureGetExtra.height)
                                        var top_treasureBanner = this.btn_treasureGetExtra.centerY + this.btn_treasureGetExtra.height / 2 + Laya.stage.height / 2 + 100;
                                        if (Laya.Browser.onMiniGame && ws.isIPhoneX()) {
                                            top_treasureBanner += 40;
                                        }
                                        Ad.showBanner(false, top_treasureBanner);
                                        console.log("t_banner_show");
                                        ws.traceEvent("t_banner_show");
                                    }
                                }
                                isMoveUp = !isMoveUp;
                            }
                            // 击中动画
                            if (this.isTreasureHit) {
                                tmpCntHit++;
                                if (tmpCntHit <= 2) {
                                    this.gameStage.transform.localRotationEulerZ += 4;
                                    this.gameStage.transform.localPositionX += 0.03;
                                }
                                else if (tmpCntHit <= 6) {
                                    this.gameStage.transform.localRotationEulerZ -= 4;
                                    this.gameStage.transform.localPositionX -= 0.03;
                                }
                                else if (tmpCntHit <= 8) {
                                    this.gameStage.transform.localRotationEulerZ += 4;
                                    this.gameStage.transform.localPositionX += 0.03;
                                }
                                else {
                                    // reset
                                    this.isTreasureHit = false;
                                    tmpCntHit = 0;
                                }
                            }
                        }
                    });
                }


                // 测试接口开始 <========================
                if (HomeView.instance.isTest) {
                    // 重来次数
                    this.label_test_reTimes.changeText("reTimes：" + this.reTimes + "/" + this.MaxReTimes);
                    this.label_test_objs.changeText("objNum：" + this.gameStage.numChildren);
                    this.reTimes++;
                    if (this.reTimes <= this.MaxReTimes) {
                        Laya.timer.frameOnce(10, this, () => {
                            // off listener
                            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
                            // clear stage timer
                            this.clearStageTimer();
                            this.newStage();
                        });
                        return;
                    }
                    // else if (!this.btn_test_restart.visible) {
                    //     // test next stage
                    //     Laya.timer.frameOnce(10, this, () => {
                    //         HomeView.instance.testStageIdx++;
                    //         this.reTimes = 0;
                    //         // off listener
                    //         this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
                    //         // clear stage timer
                    //         this.clearStageTimer();
                    //         this.newStage();
                    //     });
                    //     return;
                    // }
                    else {
                        this.btn_test_restart.visible = true;
                        this.btn_test_next.visible = true;
                    }
                }
                // 测试接口结束 <========================



                // set stage listener
                this.gameStage.frameLoop(1, this, this.stageLooping);
                // mouse click event listen: shoot a bullet
                this.box_scene3D.on(Laya.Event.CLICK, this, this.onClick);

                /** 新手引导, show tutorial box */
                if (this.stageIdx === 1) {
                    if (this.missionIdx === 1 && Global.gameData.tutorialStep === 0) {
                        // update
                        Global.gameData.tutorialStep = 1;
                        this.tutorial_shoot.visible = true;
                        this.tutorial_shoot.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
                            console.log("newplayer_1")
                            ws.traceEvent("newplayer_1");
                            this.onClick();
                            this.tutorial_shoot.visible = false;
                            this.tutorial_shoot.getChildByName("inputArea").offAll();
                        });
                    }
                    else if (this.missionIdx === 2 && Global.gameData.tutorialStep === 1) {
                        Global.gameData.tutorialStep = 2;
                        this.btn_rewardBullet.visible = true;
                        this.tutorial_bulletTry.visible = true;
                        var finger: Laya.Image = this.tutorial_bulletTry.getChildByName("finger") as Laya.Image;
                        finger.timer.frameLoop(1, finger, () => {
                            finger.centerY -= 1;
                            if (finger.centerY <= 450) {
                                finger.centerY = 480;
                            }
                        });
                        this.tutorial_bulletTry.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
                            console.log("newplayer_2")
                            ws.traceEvent("newplayer_2");
                            this.onClick_rewardBullet();
                            this.tutorial_bulletTry.visible = false;
                            Laya.timer.clearAll(this.tutorial_bulletTry.getChildByName("finger"));
                            this.tutorial_bulletTry.getChildByName("inputArea").offAll();
                        });
                    }
                    else if (this.missionIdx === 4 && Global.gameData.tutorialStep === 2) {
                        Global.gameData.tutorialStep = 3;
                        this.btn_rewardBullet.visible = true;
                        this.btn_rewardCannon.visible = true;
                        this.tutorial_cannonTry.visible = true;
                        var finger: Laya.Image = this.tutorial_cannonTry.getChildByName("finger") as Laya.Image;
                        finger.timer.frameLoop(1, finger, () => {
                            finger.centerY -= 1;
                            if (finger.centerY <= 450) {
                                finger.centerY = 480;
                            }
                        });
                        this.tutorial_cannonTry.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
                            console.log("newplayer_3")
                            ws.traceEvent("newplayer_3");
                            this.onClick_rewardCannon();
                            this.tutorial_cannonTry.visible = false;
                            Laya.timer.clearAll(this.tutorial_cannonTry.getChildByName("finger"));
                            this.tutorial_cannonTry.getChildByName("inputArea").offAll();
                        });
                    }
                    else if (this.missionIdx === 6 && Global.gameData.tutorialStep === 3) {
                        // update
                        Global.gameData.tutorialStep = 4;
                        this.tutorial_treasure.visible = true;
                        this.tutorial_treasure.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
                            console.log("newplayer_4")
                            ws.traceEvent("newplayer_4");
                            this.onClick();
                            this.tutorial_treasure.visible = false;
                            this.tutorial_treasure.getChildByName("inputArea").offAll();
                        });
                    }
                }
                else if (this.stageIdx === 2 && this.missionIdx === 1 && Global.gameData.tutorialStep === 4) {
                    Global.gameData.tutorialStep = 5;
                    this.btn_cannonOpen.visible = true;
                    this.tutorial_cannonSelect.visible = true;
                    var finger: Laya.Image = this.tutorial_cannonSelect.getChildByName("finger") as Laya.Image;
                    finger.timer.frameLoop(1, finger, () => {
                        finger.bottom += 0.5;
                        if (finger.bottom >= 20) {
                            finger.bottom = 5;
                        }
                    });
                    this.tutorial_cannonSelect.getChildByName("inputArea").on(Laya.Event.CLICK, this, () => {
                        console.log("newplayer_5")
                        ws.traceEvent("newplayer_5");
                        this.onClick_cannonSelect();
                        this.tutorial_cannonSelect.visible = false;
                        Laya.timer.clearAll(this.tutorial_cannonSelect.getChildByName("finger"));
                        this.tutorial_cannonSelect.getChildByName("inputArea").offAll();
                    });
                }

                // show button
                if (Global.gameData.stageIndex > 1 && this.missionIdx >= 1 && this.missionIdx <= 5) {
                    this.btn_rewardCannon.visible = true;
                    this.btn_rewardBullet.visible = true;
                    this.btn_cannonOpen.visible = true;
                }
                else if (Global.gameData.stageIndex === 1) {
                    if (Global.gameData.tutorialStep >= 2) {
                        this.btn_rewardBullet.visible = true;
                    }
                    if (Global.gameData.tutorialStep >= 3) {
                        this.btn_rewardBullet.visible = true;
                        this.btn_rewardCannon.visible = true;
                    }
                }
                else {
                    this.btn_rewardCannon.visible = false;
                    this.btn_rewardBullet.visible = false;
                    this.btn_cannonOpen.visible = false;
                }
            });
        }));
    }

    /** game stage looping */
    private stageLooping() {
        // 游戏中，非停留在大炮选择页
        if (this.state === Const.GameState.START) {
            // 测试接口开始 <==========================
            if (HomeView.instance.isTest) {
                this.testWinCheck();
            }
            else {
                // 测试接口结束 <==========================

                /** win check */
                // 常规关卡
                if (this.missionIdx >= 1 && this.missionIdx <= 5) {
                    this.winCheck();
                }
                // 宝箱关卡
                else {
                    if (this.isTreasureMoveStart) {
                        this.winCheck_treasure();
                    }
                }

                // 测试接口开始 <==========================
            }
            // 测试接口结束 <==========================

            /** cannon recoil playing */
            if (this.isRecoil && this.cannon) {
                if (this.recoilTime < this.MaxRecoilTime) {
                    if (this.recoilTime < this.MaxRecoilTime / 4) {
                        this.cannon.transform.localPositionX += this.bulletDirection.x * 0.01;
                        this.cannon.transform.localPositionY += this.bulletDirection.y * 0.01;
                        this.cannon.transform.localPositionZ += this.bulletDirection.z * 0.01;
                    }
                    else {
                        this.cannon.transform.localPositionX -= this.bulletDirection.x * 0.006;
                        this.cannon.transform.localPositionY -= this.bulletDirection.y * 0.006;
                        this.cannon.transform.localPositionZ -= this.bulletDirection.z * 0.006;
                    }
                    this.recoilTime++;
                }
                else {
                    this.cannon.transform.position = Const.CannonInitPos.clone();
                    this.isRecoil = false;
                    this.recoilTime = this.MaxRecoilTime;
                }
            }
        }
    }

    // 测试接口开始 <==========================
    private testWinCheck() {
        // player win
        if (this.winCheckCnt++ >= Const.MaxWinCheckTime) {
            console.log("player win");
            this.flag_missionWin = true;
            // off listener
            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
            // clear stage timer
            this.clearStageTimer();
            // hide
            this.box_countdown.visible = false;
            this.hideReviveUI();
            // show
            this.missionWin.visible = true;
        }
    }
    // 测试接口结束 <==========================

    /** win check */
    private winCheck() {
        // player win
        if (this.winCheckCnt++ >= Const.MaxWinCheckTime) {
            console.log("player win");
            this.flag_missionWin = true;
            // off listener
            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
            // clear stage timer
            this.clearStageTimer();
            // hide
            this.box_countdown.visible = false;
            this.hideReviveUI();

            // show
            this["level" + this.missionIdx].sizeGrid = "0,32,0,0";
            let idx: number = this.currBulletNum - this.MaxBulletNum + 4;
            idx = idx < StageConfig.StageRaw[this.rawIdx].ball_num ? 0 : idx;
            idx = idx > 4 ? 4 : idx;
            this.missionWin.skin = "res/ui/game/grade_" + idx + "_CN.png";
            this.missionWin.visible = true;

            // win label animation play
            var frameCnt_missionWin: number = 0;
            this.missionWin.centerY = 30;
            this.missionWin.scaleX = 1.5;
            this.missionWin.scaleY = 1.5;
            this.missionWin.timer.frameLoop(1, this.missionWin, () => {
                frameCnt_missionWin++;
                if (frameCnt_missionWin <= 13) {
                    this.missionWin.scaleX += 0.15;
                    this.missionWin.scaleY += 0.15;
                    this.missionWin.centerY -= 3;
                }
                else if (frameCnt_missionWin <= 40) {
                    this.missionWin.scaleX -= 0.07;
                    this.missionWin.scaleY -= 0.07;
                    this.missionWin.centerY -= 10;
                }
                else {
                    // clear mission win animation
                    Laya.timer.clearAll(this.missionWin);
                    // add diamond
                    var diamondAdd: number = StageConfig.Stage[HomeView.instance.systemName][this.stageIdx > Const.StageNum ? Const.StageNum : this.stageIdx][this.missionIdx].reward;
                    diamondAdd -= Math.round(diamondAdd / 2 / 4 * idx);
                    Global.gameData.diamond += diamondAdd;
                    this.text_diamond.changeText("" + Global.gameData.diamond);
                }
            });
            // open next stage
            Laya.timer.frameOnce(90, this, this.nextStage);
        }
    }

    /** treasure win check */
    private winCheck_treasure() {
        this.treasureFrameCnt++;
        // player win
        if (this.treasureFrameCnt >= this.treasereMaxFrameCnt && this.treasureHitCnt >= this.treasereMaxHitCnt && !this.box_treasureAD.visible) {
            this.flag_missionWin = true;
            // off listener
            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
            // clear stage timer
            this.clearStageTimer();
            // hide
            this.box_countdown.visible = false;
            this.hideReviveUI();

            // reset
            this.gameStage.transform.localPositionY = 0;

            // 清除上一轮动画
            Laya.timer.clearAll(this.gameStage);
            Laya.timer.frameOnce(1, this.gameStage, () => {
                // 宝箱抖动动画
                var flag_treasureTweenLeft: boolean = false;
                Laya.timer.frameLoop(1, this.gameStage, () => {
                    if (!flag_treasureTweenLeft) {
                        this.gameStage.transform.localRotationEulerZ += 4;
                        this.gameStage.transform.localPositionX += 0.03;
                    }
                    else {
                        this.gameStage.transform.localRotationEulerZ -= 4;
                        this.gameStage.transform.localPositionX -= 0.03;
                    }
                    // change direction
                    if (!flag_treasureTweenLeft && this.gameStage.transform.localRotationEulerZ > 12) {
                        flag_treasureTweenLeft = true;
                    }
                    else if (flag_treasureTweenLeft && this.gameStage.transform.localRotationEulerZ < -12) {
                        flag_treasureTweenLeft = false;
                    }
                });
                // 宝箱盖子打开动画
                Laya.timer.frameOnce(40, this.gameStage, () => {
                    this.gameStage.transform.localRotationEulerZ = 0;
                    this.gameStage.transform.localPositionX = 0;
                    // 清除上一轮动画
                    Laya.timer.clearAll(this.gameStage);
                    var tmpCnt: number = 0;
                    var posScaleX: number = 0.001;
                    var posScaleZ: number = -0.002;
                    var rotScaleX: number = 30;
                    var rotScaleZ: number = 30;
                    var treasureTop: Laya.MeshSprite3D = this.gameStage.getChildByName("top") as Laya.MeshSprite3D;
                    var treasureBottom: Laya.MeshSprite3D = this.gameStage.getChildByName("bottom") as Laya.MeshSprite3D;
                    var treasureLock: Laya.MeshSprite3D = this.gameStage.getChildByName("lock") as Laya.MeshSprite3D;
                    // 锁解开
                    treasureLock.transform.localRotationEulerX -= 45;
                    Laya.timer.frameLoop(1, this.gameStage, () => {
                        tmpCnt++;
                        // 翻盖
                        if (treasureTop.transform.localRotationEulerX > -100) {
                            treasureTop.transform.localRotationEulerX -= 5;
                        }
                        // 宝箱整体
                        if (tmpCnt <= 20) {
                            this.gameStage.transform.localPositionY -= 0.005;
                        }
                        else if (tmpCnt <= 60) {
                            if (tmpCnt <= 25) {
                                this.gameStage.transform.localPositionY += 0.2;
                            } else if (tmpCnt <= 35) {
                                this.gameStage.transform.localPositionY -= 0.1;
                            }
                            for (let i = 1; i <= 9; i++) {
                                var tmp = this.gameStage.getChildByName("currency_" + i) as Laya.MeshSprite3D;
                                if (tmp) {
                                    if (tmpCnt <= 25) {
                                        tmp.transform.localPositionY += 0.003;
                                    } else if (tmpCnt <= 35) {
                                        tmp.transform.localPositionY += 0.002 + 0.1 / 50;
                                    } else if (tmpCnt <= 40) {
                                        tmp.transform.localPositionY -= 0.001;
                                    } else if (tmpCnt <= 45) {
                                        tmp.transform.localPositionY -= 0.002;
                                    } else if (tmpCnt <= 60) {
                                        tmp.transform.localPositionY -= 0.003;
                                    }
                                    tmp.transform.localPositionX += Const.treasureAngleX[i] * posScaleX;
                                    tmp.transform.localPositionZ += Const.treasureAngleZ[i] * posScaleZ;
                                    tmp.transform.localRotationEulerX += Const.treasureAngleX[i] * rotScaleX;
                                    tmp.transform.localRotationEulerZ += Const.treasureAngleZ[i] * rotScaleZ;
                                }
                            }
                        }
                        else {
                            Laya.timer.clearAll(this.gameStage);
                            // open next stage
                            Laya.timer.frameOnce(90, this, this.nextStage);
                        }
                    });
                });
            });
        }
    }

    /** restart current stage */
    restart() {
        this.newStage();
    }

    /** start next stage */
    nextStage() {
        // clear mission win animation
        Laya.timer.clearAll(this.missionWin);
        // next
        this.missionIdx++;
        if (this.missionIdx > 5 + (Global.config.hasTreasure ? 1 : 0)) {  // 宝箱开启，设置为6
            this.passStage();
        }
        else {
            this.newStage();
        }
    }

    /** 大关卡过关处理 */
    private passStage() {
        console.log("pass_stage" + this.stageIdx);
        if (this.stageIdx <= 10) {
            ws.traceEvent("pass_stage" + this.stageIdx);
        }
        else {
            ws.traceEvent("pass_stage10");
        }
        // clean all bullets
        for (let i = 0; i < this.scene3D.numChildren; i++) {
            var tmpSceneChild = this.scene3D.getChildAt(i);
            if (tmpSceneChild.name === "bullet" || tmpSceneChild.name === "bulletTrigger") {
                tmpSceneChild.destroy();
            }
        }
        // hide
        this.missionWin.visible = false;
        this.box_gameIcon.visible = false;
        // show
        this.label_stage.changeText("" + this.stageIdx);
        this.label_winDiamond.changeText("" + StageConfig.StageReward[this.stageIdx > 39 ? 39 : this.stageIdx]);
        this.box_passStage.visible = true;
        this.showBanner(this.btn_passStage, Global.config.banner_delay_pass, true);
        this.navWin && this.navWin.loadHomeIconInfoList();
        // update
        this.stageIdx++;
        // update to user data
        Global.gameData.stageIndex = this.stageIdx;
        this.missionIdx = 0;
        for (let i = 1; i <= 5; i++) {
            this.missionRawIdxList[i - 1] = 0;
            this["level" + i].sizeGrid = "0, 96, 0, 0";
        }
        // clear reward cannon
        if (this.isRewardCannon) {
            this.setCannon(Global.gameData.cannonType);
            this.isRewardCannon = false;
        }
        CannonSelect.instance && (CannonSelect.instance.isReward = false);
        // update background
        if (Global.gameData.stageIndex > 2) {
            this.bgIdx = (Global.gameData.stageIndex - 2) % 4;
            this.newBackground();
        }
    }

    /** 关卡死亡倒计时 */
    private stageFailCountDown() {
        // 游戏中，非停留在大炮选择页
        if (this.state === Const.GameState.START) {
            this.countdown++;
            if (this.countdown >= 240) {
                // 死亡处理
                this.clearStageTimer();
                this.box_countdown.visible = false;
                this.btn_retry.bottom = 150;
                if (!Global.config.online) {
                    this.btn_retry.bottom = 260;
                }
                if (Laya.Browser.onMiniGame && ws.isIPhoneX()) {
                    this.btn_retry.bottom += Global.config.distance_iphonex || 0;
                }
                this.box_revive.visible = true;
                this.navRevive && this.navRevive.loadHomeIconInfoList();
                // 1秒后显示banner，上跳误点
                this.showBanner(this.btn_retry, Global.config.banner_delay_ratio, true);
            }
            this.label_failTimer.changeText("" + Math.floor(4 - (this.countdown / 60) % 4));
            // 死亡提示显示
            this.failCircle.scaleX += 0.015;
            this.failCircle.scaleY += 0.015;
        }
    }

    /** banner 弹出控制 */
    private showBanner(btn: Laya.Image, delay_ratio: number, isMini: boolean = false) {
        // 1秒后显示banner，上跳误点
        if (!Global.config.deny_banner && Math.random() < delay_ratio) {
            btn.bottom = 150;
            Laya.timer.frameOnce(Global.config.banner_delay * 60, null, () => {
                btn.bottom = 260;
                if (Laya.Browser.onMiniGame && ws.isIPhoneX()) {
                    btn.bottom += Global.config.distance_iphonex || 0;
                }
                Ad.showBanner(isMini);
            });
        }
        else {
            btn.bottom = 260;
            if (Laya.Browser.onMiniGame && ws.isIPhoneX()) {
                btn.bottom += Global.config.distance_iphonex || 0;
            }
            Ad.showBanner(isMini);
        }
    }

    /** mouse click event: shoot a bullet */
    private onClick() {
        // check res loading complete
        if (!this.gameStage || !this.cannon) {
            return;
        }

        // get ray
        this.mousePoint.x = Laya.MouseManager.instance.mouseX;
        this.mousePoint.y = Laya.MouseManager.instance.mouseY;
        this.camera.viewportPointToRay(this.mousePoint, this.ray);

        // get bullet shooting direction
        if (this.scene3D.physicsSimulation.rayCast(this.ray, this.hitResult, 30, 1, 1)) {
            // direction vector: [bullet init point] to [mouse hit point]
            Laya.Vector3.subtract(this.hitResult.point, this.turretInitPos, this.bulletDirection);
        }
        else {
            // direction vector: [camera point] to [mouse hit point]
            var aV3: Laya.Vector3 = new Laya.Vector3();
            // ray direction scale: to depth scaleZ
            let scaleV: number = this.camera.farPlane;
            scaleV = 20;
            Laya.Vector3.scale(this.ray.direction, scaleV, aV3);
            // direction vector: [bullet init point] to [camera point]
            var bV3: Laya.Vector3 = new Laya.Vector3();
            Laya.Vector3.subtract(this.camera.transform.position, this.turretInitPos, bV3);
            // direction vector: [bullet init point] to [mouse hit point]
            Laya.Vector3.add(aV3, bV3, this.bulletDirection);
        }
        // z轴过近>0，会导致仰角过大，屏蔽掉
        var flag_turretDirection: boolean = this.bulletDirection.z < 0;
        Laya.Vector3.normalize(this.bulletDirection, this.bulletDirection);

        // 开放物体物理受力：玩家有效输入前，子弹发射轨迹形状检测是否有碰撞
        this.physicsStartCheck();

        // create bullet
        this.createBullet();

        // set turret transform
        if (this.turret && this.cannon && !this.cannon.destroyed && this.turretInitRot) {
            this.turret.transform.localRotationEuler = this.turretInitRot.clone();
            if (flag_turretDirection) {
                if (this.cannon.name.indexOf("Anti") === -1) {
                    this.turret.transform.localRotationEulerX -= this.bulletDirection.y * 90;
                }
                else {
                    this.turret.transform.localRotationEulerX += this.bulletDirection.y * 90;
                }
                this.turret.transform.localRotationEulerY -= this.bulletDirection.x * 90;
            }
        }
        this.isRecoil = true;
        this.recoilTime = 0;
    }

    /** check physics start
     *  开放物体物理受力：玩家有效输入前，子弹发射轨迹形状检测是否有碰撞
     * */
    private physicsStartCheck() {
        if (!this.isStageStart) {
            var checkShape = new Laya.SphereColliderShape(Const.BulletRadius * Const.BulletScale[+this.isRewardBullet][this.bulletType] * 3);
            var checkHitResult: Laya.HitResult[] = [];
            // get velocity
            var velocity: Laya.Vector3 = this.bulletDirection.clone();
            Laya.Vector3.scale(velocity, 50, velocity);
            if (this.scene3D.physicsSimulation.shapeCastAll(checkShape, this.turretInitPos, velocity, checkHitResult)) {
                // check if target
                for (let i in checkHitResult) {
                    if (checkHitResult[i].collider.owner.name.indexOf("Obstacle") >= 0) {
                        this.isStageStart = true;
                        break;
                    }
                }
            }
        }
    }

    /** create bullet */
    private createBullet() {
        // update counter
        this.currBulletNum++;
        /** 常规关卡 */
        if (this.missionIdx >= 1 && this.missionIdx <= 5) {
            this.label_ballNum.changeText("x" + (this.MaxBulletNum - this.currBulletNum));
            // 测试接口开始 <========================
            if (!HomeView.instance.isTest) {
                // 测试接口结束 <========================
                if (this.ballBox && (this.MaxBulletNum - this.currBulletNum + 1) >= 1 && (this.MaxBulletNum - this.currBulletNum + 1) <= 10) {
                    ((this.ballBox.getChildByName("CannonBall" + (this.MaxBulletNum - this.currBulletNum + 1) + "_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.PBRSpecularMaterial).albedoColorA = 0;
                }
                // 测试接口开始 <========================
            }
            // 测试接口结束 <========================
        }

        // play sound
        if (Laya.Browser.onMiniGame && Global.gameData.soundEnabled) {
            Laya.SoundManager.playSound(Const.soundUrl);
        }
        // vibration
        if (Laya.Browser.onMiniGame && Global.gameData.vibrationEnabled) {
            wx.vibrateShort();
        }

        // 炮弹用尽，死亡倒计时
        if (this.currBulletNum >= this.MaxBulletNum && !this.flag_missionWin) {
            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
            Laya.timer.frameOnce(30, this, () => {
                this.box_countdown.visible = true;
                this.failCircle.scaleX = 1;
                this.failCircle.scaleY = 1;
                this.countdown = 0;
                if (this.isRevive) {
                    this.btn_revive.visible = false;
                }
                else {
                    this.btn_revive.visible = true;
                }
                if (!this.flag_missionWin) {
                    Laya.timer.frameLoop(1, this, this.stageFailCountDown);
                }
            });
        }

        /** reward bullet */
        if (this.isRewardBullet) {
            // bullet effect
            Laya.Sprite3D.load(Const.BulletRewardResUrl[Global.config.bulletRewardType], Laya.Handler.create(this, (bulletEff) => {
                let bullet: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                bullet.name = "bullet";
                let bulletBlackHole: Laya.Sprite3D = bullet.addChild(bulletEff.clone()) as Laya.Sprite3D;
                bulletBlackHole.name = "effect";
                // reset bullet by type
                let bulletScript: Bullet = bullet.addComponent(Bullet);
                bulletScript.reset(Global.config.bulletRewardType, true);
                // add to scene
                this.scene3D.addChild(bullet);

                let trigger: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                trigger.name = "bulletTrigger";
                // reset bullet trigger by type
                let triggerScript: Bullet = trigger.addComponent(Bullet);
                triggerScript.reset(Global.config.bulletRewardType, true);
                // add to scene
                this.scene3D.addChild(trigger);
            }));
            // reset
            this.isRewardBullet = false;
            // clear connon effect
            Laya.timer.frameOnce(30, this, () => {
                this.scene3D.getChildByName("cannon_effect") && this.scene3D.getChildByName("cannon_effect").destroy();
            });
        }
        /** cannon bullet */
        else {
            // shotgun x2
            if (this.cannonType === Const.CannonType.SHOTGUN_X2) {
                let posOffset: number = 0.1 / Const.BulletScale[0][this.cannonType];
                this.createSingleBullet(-posOffset, 0);
                this.createSingleBullet(posOffset, 0);
            }
            // shotgun x4
            else if (this.cannonType === Const.CannonType.SHOTGUN_X4) {
                let posOffset: number = 0.1 / Const.BulletScale[0][this.cannonType];
                this.createSingleBullet(-posOffset, -posOffset);
                this.createSingleBullet(-posOffset, posOffset);
                this.createSingleBullet(posOffset, -posOffset);
                this.createSingleBullet(posOffset, posOffset);
            }
            else if (this.cannonType === Const.CannonType.LIGHTNING) {
                Laya.Sprite3D.load(Const.BulletLightningUrl, Laya.Handler.create(this, (res) => {
                    Laya.Mesh.load(Const.BulletMeshUrl, Laya.Handler.create(this, (mesh) => {
                        let bullet: Laya.MeshSprite3D = new Laya.MeshSprite3D(mesh);
                        bullet.name = "bullet";
                        let bulletLightning: Laya.Sprite3D = bullet.addChild(res.clone()) as Laya.Sprite3D;
                        bulletLightning.name = "effect";
                        // reset bullet by type
                        let bulletScript: Bullet = bullet.addComponent(Bullet);
                        bulletScript.reset(this.bulletType);
                        // add to scene
                        this.scene3D.addChild(bullet);

                        let trigger: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                        trigger.name = "bulletTrigger";
                        // reset bullet trigger by type
                        let triggerScript: Bullet = trigger.addComponent(Bullet);
                        triggerScript.reset(this.bulletType);
                        // add to scene
                        this.scene3D.addChild(trigger);
                    }));
                }));
            }
            else {
                this.createSingleBullet();
            }
        }
    }

    /** create single bullet by offset */
    private createSingleBullet(offsetX: number = 0, offsetY: number = 0) {
        /**************************** bullet **************************/
        // get bullet from pool
        let bullet: Laya.MeshSprite3D = Laya.Pool.getItem("bullet");
        if (bullet) {
            // reset bullet by type
            let bulletScript: Bullet = bullet.getComponent(Bullet);
            if (bulletScript) {
                bulletScript.reset(this.bulletType);
            }
            else {
                bulletScript = bullet.addComponent(Bullet);
                bulletScript.reset(this.bulletType);
            }
            // set position offset
            bullet.transform.localPositionX += offsetX;
            bullet.transform.localPositionY += offsetY;
            // add to scene
            this.scene3D.addChild(bullet);
        }
        // new bullet
        else {
            Laya.Mesh.load(Const.BulletMeshUrl, Laya.Handler.create(this, (mesh) => {
                bullet = new Laya.MeshSprite3D(mesh);
                bullet.name = "bullet";
                // add script
                let bulletScript: Bullet = bullet.addComponent(Bullet);
                bulletScript.reset(this.bulletType);
                // set position offset
                bullet.transform.localPositionX += offsetX;
                bullet.transform.localPositionY += offsetY;
                // add to scene
                this.scene3D.addChild(bullet);
            }));
        }

        /******************* hidden bullet trigger: 防止快速移动碰撞检测丢失（ccd半径越小越精准） *****************/
        // get bullet trigger from pool
        let trigger: Laya.MeshSprite3D = Laya.Pool.getItem("bulletTrigger");
        if (trigger) {
            // reset bullet trigger by type
            let triggerScript: Bullet = trigger.getComponent(Bullet);
            if (triggerScript) {
                triggerScript.reset(this.bulletType);
            }
            else {
                triggerScript = bullet.addComponent(Bullet);
                triggerScript.reset(this.bulletType);
            }
            // set position offset
            trigger.transform.localPositionX += offsetX;
            trigger.transform.localPositionY += offsetY;
            // add to scene
            this.scene3D.addChild(trigger);
        }
        // new bullet trigger
        else {
            Laya.Mesh.load(Const.BulletMeshUrl, Laya.Handler.create(this, (mesh) => {
                trigger = new Laya.MeshSprite3D(mesh);
                trigger.name = "bulletTrigger";
                // add script
                let triggerScript: Bullet = trigger.addComponent(Bullet);
                triggerScript.reset(this.bulletType);
                // set position offset
                trigger.transform.localPositionX += offsetX;
                trigger.transform.localPositionY += offsetY;
                // add to scene
                this.scene3D.addChild(trigger);
            }));
        }
    }

    /** background moving effect */
    private bgMoving() {
    }
}