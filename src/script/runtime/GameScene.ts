import { ui } from "../../ui/layaMaxUI";
import * as Const from "../Const";
import Global from "../Global";
import Navigator from "../utils/Navigator";
import wx from "../utils/wx";
import Bullet from "../component/Bullet";
import Target from "../component/Target";
import Guard from "../component/Guard";
import Reward from "../component/Reward";
import HomeView from "./HomeView";
import * as StageConfig from "../StageConfig"

export default class GameScene extends ui.game.GameSceneUI {
    static instance: GameScene;

    /**
     * 打开该单例页面，触发onOpened
     * @param param  onOpened方法的传参
     */
    static openInstance(param?: any) {
        if (GameScene.instance) {
            GameScene.instance.onOpened(param);
            // GameScene.instance.showTutorial();
        } else {
            Laya.Scene.open(Const.URL_GameScene, false, param);
        }
    }

    onOpened(param?: any) {
        console.log("GameScene onOpened()");
        this.visible = true;

        if (this.state === Const.GameState.START) {
            this.showUI();
            // todo: 玩家进度记录进Global
            this.stageIdx = Global.gameData.stageIndex;
            this.missionIdx = 1;
            for (let i = 1; i <= 5; i++) {
                this.missionRawIdxList[i - 1] = 0;
                this["level" + i].sizeGrid = "0, 96, 0, 0";
            }
            this.newStage();
        }
    }

    public scene3D: Laya.Scene3D;
    private camera: Laya.Camera;
    private directionLight: Laya.DirectionLight;

    /** background */
    private background: Laya.Sprite3D;
    private bgIdx: number = 0;
    private cloud0: Laya.Sprite3D;
    private cloud1: Laya.Sprite3D;

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
    public winCheckCnt: number = 0;
    public isStageStart: boolean = false;
    public countdown: number;
    public isRevive: boolean;

    /** cannon */
    public cannonType: number = Const.CannonType.DEFAULT;
    private cannon: Laya.MeshSprite3D;
    private turret: Laya.MeshSprite3D;
    public turretInitPos: Laya.Vector3;
    private isRecoil: boolean = false;
    private recoilTime: number;
    private MaxRecoilTime: number = 8;
    public isRewardCannon: boolean = false;
    public cannonRewardType: number = Const.CannonType.SHOTGUN_X4;

    /** bullet */
    public bulletType: number = Const.CannonType.DEFAULT;
    public bulletDirection: Laya.Vector3 = new Laya.Vector3();
    public isRewardBullet: boolean = false;
    public bulletRewardType: number = Const.BulletRewardType.BLACKHOLE;

    /** raycast */
    private mousePoint: Laya.Vector2 = new Laya.Vector2();
    private ray: Laya.Ray = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
    private hitResult: Laya.HitResult = new Laya.HitResult();

    /** game state */
    public state: number = 0;

    private btnAniFrame: number;

    constructor() {
        super();
        console.log("GameScene constructor()");

        GameScene.instance = this;

        this.initScene3D();

        this.newCannon();

        // preload texture
        Laya.loader.load(Const.StageTexUrl);
        // Laya.loader.load(Const.StageTexUrl, Laya.Handler.create(this, () => {
        //     this.stageIdx = 1;
        //     this.newStage();
        // }));

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
        this.btnAniFrame = 0;
        this.btn_rewardBullet.scaleX += 0.01 * 60;
        this.btn_rewardBullet.scaleY += 0.01 * 60;
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
        this.camera.clearColor = null;
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

        // background
        Laya.Sprite3D.load(Const.BgResUrl[this.bgIdx], Laya.Handler.create(this, (res) => {
            this.background = this.scene3D.addChild(res) as Laya.Sprite3D;
            // transform
            this.background.transform.localPosition = Const.StageInitPos.clone();
            // sceneSp.transform.localPositionZ -= 3;
            this.background.transform.localRotationEuler = Const.StageInitRot.clone();
            this.background.transform.localScale = Const.StageInitScale.clone();

            // destroy animator component
            let bgAni = (this.background.getComponent(Laya.Animator) as Laya.Animator);
            bgAni && bgAni.destroy();

            if (this.bgIdx === 0) {
                this.cloud0 = this.background.getChildByName("Scenes_02").getChildByName("cloud01") as Laya.Sprite3D;
                this.cloud1 = this.background.getChildByName("Scenes_02").getChildByName("cloud03") as Laya.Sprite3D;
                let plane: Laya.MeshSprite3D = this.background.getChildByName("Scenes_02").getChildByName("Plane").getChildByName("Plane_0") as Laya.MeshSprite3D;
                plane.name = "ground";
                let planeCollider: Laya.PhysicsCollider = plane.addComponent(Laya.PhysicsCollider);
                planeCollider.colliderShape = new Laya.StaticPlaneColliderShape(new Laya.Vector3(0, 1, 0), 0);
            }

            // set stage listener
            this.background.frameLoop(1, this, this.bgMoving);
        }));
    }

    /** create new cannon */
    private newCannon() {
        // destroy old cannon
        if (this.cannon) {
            this.cannon.destroy();
        }
        // load new cannon
        Laya.Sprite3D.load(Const.CannonResUrl[this.cannonType], Laya.Handler.create(this, (res) => {
            this.cannon = res;
            this.scene3D.addChild(this.cannon);
            this.cannon.name = "player";

            this.cannon.transform.localPosition = Const.CannonInitPos.clone();
            this.cannon.transform.localRotationEuler = Const.CannonInitRot.clone();
            this.cannon.transform.localScale = Const.CannonInitScale.clone();

            this.turret = this.cannon.getChildByName("Turret_0") as Laya.MeshSprite3D;
            this.turretInitPos = this.turret.transform.position.clone();
        }));
    }

    /** show game ui */
    showUI() {
        this.box_UI.visible = true;
    }

    /** hide game ui */
    hideUI() {
        this.box_UI.visible = false;
        this.box_win.visible = false;
        this.box_revive.visible = false;
    }

    /** bind button */
    private bindButtons() {
        // back home
        this.btn_back.on(Laya.Event.CLICK, this, () => {
            this.state = Const.GameState.OVER;
            this.cleanStage();
            this.hideUI();
            // reset cannon rotation
            if (this.turret) {
                this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
            }
            // clear timer
            this.clearStageTimer();
            HomeView.openInstance();
        });
        // change cannon
        this.btn_cannon.on(Laya.Event.CLICK, this, () => {
            this.cannonType = this.cannonType % 6 + 1;
            this.bulletType = this.cannonType;
            Global.gameData.cannonType = this.cannonType;
            this.newCannon();
        });
        // reward bullet
        this.btn_rewardBullet.on(Laya.Event.MOUSE_DOWN, this, () => {
            Reward.instance.share({
                pos: Const.RewardPos.Bullet,
                success: () => {
                    this.isRewardBullet = true;
                    this.bulletType = this.bulletRewardType;
                },
                complete: () => {
                }
            });
            // let scaleX: number = this.btn_rewardBullet.scaleX;
            // let scaleY: number = this.btn_rewardBullet.scaleY;
            // Laya.Tween.to(this.btn_rewardBullet, { scaleX: scaleX * 0.9, scaleY: scaleY * 0.9 }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
            //     Laya.Tween.to(this.btn_rewardBullet, { scaleX: scaleX, scaleY: scaleY }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
            //         this.isRewardBullet = true;
            //         this.bulletType = this.bulletRewardType;
            //     }));
            // }));
        });
        // reward cannon
        this.btn_rewardCannon.on(Laya.Event.MOUSE_DOWN, this, () => {
            Reward.instance.share({
                pos: Const.RewardPos.Cannon,
                success: () => {
                    this.isRewardCannon = true;
                    this.cannonType = this.cannonRewardType;
                    this.bulletType = this.cannonType;
                    this.newCannon();
                },
                complete: () => {
                }
            });
            // let scaleX: number = this.btn_rewardCannon.scaleX;
            // let scaleY: number = this.btn_rewardCannon.scaleY;
            // Laya.Tween.to(this.btn_rewardCannon, { scaleX: scaleX * 0.9, scaleY: scaleY * 0.9 }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
            //     Laya.Tween.to(this.btn_rewardCannon, { scaleX: scaleX, scaleY: scaleY }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
            //         this.isRewardCannon = true;
            //         this.cannonType = this.cannonRewardType;
            //         this.bulletType = this.cannonType;
            //         this.newCannon();
            //     }));
            // }));
        });
        // next stage
        this.btn_next.on(Laya.Event.CLICK, this, () => {
            this.nextStage();
        });
        // revive btn
        this.btn_revive.on(Laya.Event.MOUSE_DOWN, this, () => {
            Reward.instance.share({
                pos: Const.RewardPos.Revive,
                success: () => {
                    this.isRevive = true;
                    this.box_revive.visible = false;
                    this.currBulletNum -= 3;
                    this.label_ballNum.changeText("剩余炮弹：3");
                    this.box_scene3D.on(Laya.Event.CLICK, this, this.onClick);
                },
                complete: () => {
                }
            });
        });
        // revive retry: back home
        this.btn_retry.on(Laya.Event.CLICK, this, () => {
            this.state = Const.GameState.OVER;
            this.cleanStage();
            this.hideUI();
            // reset cannon rotation
            if (this.turret) {
                this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
            }
            // clear timer
            this.clearStageTimer();
            HomeView.openInstance();
        });
    }

    /** reward btn ani */
    private rewardBtnAni() {
        this.btnAniFrame++;
        if (this.btnAniFrame <= 60) {
            this.btn_rewardCannon.scaleX += 0.01;
            this.btn_rewardCannon.scaleY += 0.01;
            this.btn_rewardBullet.scaleX -= 0.01;
            this.btn_rewardBullet.scaleY -= 0.01;
        }
        else if (this.btnAniFrame <= 120) {
            this.btn_rewardCannon.scaleX -= 0.01;
            this.btn_rewardCannon.scaleY -= 0.01;
            this.btn_rewardBullet.scaleX += 0.01;
            this.btn_rewardBullet.scaleY += 0.01;
        }
        else {
            this.btnAniFrame = 1;
            this.btn_rewardCannon.scaleX = 1.5;
            this.btn_rewardCannon.scaleY = 1.5;
            this.btn_rewardBullet.scaleX = 1.5 + 0.01 * 60;
            this.btn_rewardBullet.scaleY = 1.5 + 0.01 * 60;
        }
    }

    /** clean stage */
    private cleanStage() {
        if (this.gameStage) {
            this.gameStage.destroyChildren();
            this.gameStage.destroy();
            this.clearStageTimer();
        }
    }

    /** 清除关卡游戏相关循环 */
    private clearStageTimer() {
        Laya.timer.clear(this, this.stageLooping);
        Laya.timer.clear(this, this.stageFailCountDown);
        this.box_countdown.visible = false;
    }

    /** create new stage by index */
    newStage() {
        // destroy old stage
        this.cleanStage();

        // set ui
        this.box_win.visible = false;
        this.missionWin.visible = false;
        this["level" + this.missionIdx].sizeGrid = "0,64,0,0";

        // reset
        this.isRevive = false;
        this.isRewardBullet = false;
        this.currBulletNum = 0;
        this.winCheckCnt = 0;
        this.isStageStart = false;
        this.isRecoil = false;
        this.recoilTime = this.MaxRecoilTime;
        this.bulletType = this.cannonType;
        // reset turret rotation
        if (!this.cannon.destroyed && this.turret) {
            this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
        }

        // get raw stage index
        let tmpStage = StageConfig.Stage[HomeView.instance.systemName][this.stageIdx][this.missionIdx];
        this.rawIdx = this.missionRawIdxList[0];
        let tryCnt = 0;
        while (tryCnt < 20 && this.missionRawIdxList.indexOf(this.rawIdx) >= 0) {
            this.rawIdx = Math.round(Math.random() * (tmpStage.max - tmpStage.min)) + tmpStage.min;
            tryCnt++;
        }
        this.missionRawIdxList[this.missionIdx - 1] = this.rawIdx;
        this.MaxBulletNum = tmpStage.ball_add + StageConfig.StageRaw[this.rawIdx].ball_num;
        this.label_ballNum.changeText("剩余炮弹：" + this.MaxBulletNum);

        console.log("stage: " + this.stageIdx + "\tmission: " + this.missionIdx + "\traw stage index: " + this.rawIdx);
        console.log("max ball num: " + this.MaxBulletNum);

        // load stage
        let satgeResUrl: string = Const.StageResUrl + this.rawIdx + ".lh";
        Laya.Sprite3D.load(satgeResUrl, Laya.Handler.create(this, (res) => {
            console.log("stage loaded");
            this.gameStage = this.scene3D.addChild(res) as Laya.Sprite3D;
            Laya.loader.clearRes(satgeResUrl);

            // change level label
            this.label_level.changeText("" + this.stageIdx);

            // transform
            this.gameStage.transform.localPosition = Const.StageInitPos.clone();
            this.gameStage.transform.localRotationEuler = Const.StageInitRot.clone();
            this.gameStage.transform.localScale = Const.StageInitScale.clone();

            // destroy animator component: 不然会约束物理碰撞效果
            let stageAni = (this.gameStage.getComponent(Laya.Animator) as Laya.Animator);
            stageAni && stageAni.destroy();

            let child: Laya.MeshSprite3D;
            for (let i: number = 0; i < this.gameStage.numChildren; i++) {
                child = this.gameStage.getChildAt(i) as Laya.MeshSprite3D;
                // 关闭阴影
                child.meshRenderer.castShadow = false;
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
                    child.destroy();
                }
            }

            // set stage listener
            this.gameStage.frameLoop(1, this, this.stageLooping);
            // mouse click event listen: shoot a bullet
            this.box_scene3D.on(Laya.Event.CLICK, this, this.onClick);
        }));
    }

    /** game stage looping */
    private stageLooping() {
        /** win check */
        this.winCheck();

        /** cannon recoil playing */
        if (this.isRecoil) {
            if (this.recoilTime < this.MaxRecoilTime) {
                if (this.recoilTime < this.MaxRecoilTime / 4) {
                    this.turret.transform.localPositionX += this.bulletDirection.x * 0.0005;
                    this.turret.transform.localPositionY += this.bulletDirection.y * 0.0005;
                    this.turret.transform.localPositionZ += this.bulletDirection.z * 0.0005;
                }
                else {
                    this.turret.transform.localPositionX -= this.bulletDirection.x * 0.0003;
                    this.turret.transform.localPositionY -= this.bulletDirection.y * 0.0003;
                    this.turret.transform.localPositionZ -= this.bulletDirection.z * 0.0003;
                }
                this.recoilTime++;
            }
            else {
                this.turret.transform.position = this.turretInitPos.clone();
                this.isRecoil = false;
                this.recoilTime = this.MaxRecoilTime;
            }
        }
    }

    /** win check */
    private winCheck() {
        // player win
        if (this.winCheckCnt++ >= Const.MaxWinCheckTime) {
            console.log("player win");
            // off shoot
            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
            // hide
            this.box_countdown.visible = false;
            this.box_revive.visible = false;
            // show
            this["level" + this.missionIdx].sizeGrid = "0,32,0,0";
            let idx: number = this.currBulletNum - this.MaxBulletNum + 4;
            idx = idx < StageConfig.StageRaw[this.rawIdx].ball_num ? 0 : idx;
            idx = idx > 4 ? 4 : idx;
            this.missionWin.skin = "res/ui/game/grade_" + idx + "_CN.png";
            this.missionWin.visible = true;
            Laya.timer.frameOnce(120, this, () => {
                this.nextStage();
            })
            // clear stage timer
            this.clearStageTimer();
        }
    }

    /** restart current stage */
    restart() {
        this.newStage();
    }

    /** start next stage */
    nextStage() {
        this.missionIdx++;
        if (this.missionIdx > 5) {
            this.passStage();
        }
        else {
            this.newStage();
        }
    }

    /** 大关卡过关处理 */
    private passStage() {
        // hide
        this.missionWin.visible = false;
        // show
        this.label_lvlPass.changeText("" + this.stageIdx);
        this.box_win.visible = true;
        // update
        this.stageIdx++;
        if (this.stageIdx > Const.StageNum) {
            console.log("通关");
            // 通关处理
            this.stageIdx = 1;
            this.state = Const.GameState.OVER;
            this.cleanStage();
            this.hideUI();
            // reset cannon rotation
            if (this.turret) {
                this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
            }
            // clear timer
            this.clearStageTimer();
            HomeView.openInstance();
            return;
        }
        // update to user data
        Global.gameData.stageIndex = this.stageIdx;
        this.missionIdx = 0;
        for (let i = 1; i <= 5; i++) {
            this.missionRawIdxList[i - 1] = 0;
            this["level" + i].sizeGrid = "0, 96, 0, 0";
        }
        // clear reward cannon
        if (this.cannonType !== Global.gameData.cannonType) {
            this.cannonType = Global.gameData.cannonType;
            this.bulletType = this.cannonType;
            this.newCannon();
        }
    }

    /** 关卡死亡倒计时 */
    private stageFailCountDown() {
        this.countdown++;
        if (this.countdown >= 240) {
            // 死亡处理
            this.clearStageTimer();
            this.box_countdown.visible = false;
            this.box_revive.visible = true;
        }
        this.label_failTimer.changeText("" + Math.round(3 - (this.countdown / 80) % 3));
        // 死亡提示显示
        this.failCircle.scaleX += 0.015;
        this.failCircle.scaleY += 0.015;
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
        this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
        if (flag_turretDirection) {
            this.turret.transform.localRotationEulerX -= this.bulletDirection.y * 90;
            this.turret.transform.localRotationEulerY -= this.bulletDirection.x * 90;
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
        this.label_ballNum.changeText("剩余炮弹：" + (this.MaxBulletNum - this.currBulletNum));

        // 炮弹用尽，死亡倒计时
        if (this.currBulletNum >= this.MaxBulletNum) {
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
                Laya.timer.frameLoop(1, this, this.stageFailCountDown);
            });
        }

        /** reward bullet */
        if (this.isRewardBullet) {
            // add effect sprite
            Laya.Sprite3D.load(Const.BulletRewardResUrl[this.bulletRewardType], Laya.Handler.create(this, (res) => {
                let bullet: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                bullet.name = "bullet";
                let bulletBlackHole: Laya.Sprite3D = bullet.addChild(res.clone()) as Laya.Sprite3D;
                bulletBlackHole.name = "effect";
                // reset bullet by type
                let bulletScript: Bullet = bullet.addComponent(Bullet);
                bulletScript.reset(this.bulletRewardType, true);
                // add to scene
                this.scene3D.addChild(bullet);

                let trigger: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                trigger.name = "bulletTrigger";
                // reset bullet trigger by type
                let triggerScript: Bullet = trigger.addComponent(Bullet);
                triggerScript.reset(this.bulletRewardType, true);
                // add to scene
                this.scene3D.addChild(trigger);
            }));
            // reset
            this.isRewardBullet = false;
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
                        let bulletBlackHole: Laya.Sprite3D = bullet.addChild(res.clone()) as Laya.Sprite3D;
                        bulletBlackHole.name = "effect";
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
            bulletScript.reset(this.bulletType);
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
            triggerScript.reset(this.bulletType);
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
        if (this.bgIdx === 0) {
            if (this.cloud0.transform.localPositionX > 0.5) { this.cloud0.transform.localPositionX = -0.5; }
            this.cloud0.transform.localPositionX += 0.0007;
            if (this.cloud1.transform.localPositionX < -0.5) { this.cloud1.transform.localPositionX = 0.5; }
            this.cloud1.transform.localPositionX -= 0.0005;
        }
    }
}