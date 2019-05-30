import { ui } from "../../ui/layaMaxUI";
import * as Const from "../Const";
import Global from "../Global";
import Navigator from "../utils/Navigator";
import wx from "../utils/wx";
import Bullet from "../component/Bullet";
import Target from "../component/Target";
import Guard from "../component/Guard";
import HomeView from "./HomeView";

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
            this.lvlLabel.visible = true;
            this.showUI();
            this.stageIdx = 40//Global.gameData.stageIndex;
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
    public stageIdx: number;
    public MaxBulletNum: number = 100;
    public currBulletNum: number = 0;
    public winCheckCnt: number = 0;
    public isStageStart: boolean = false;

    /** cannon */
    public cannonType: number = Const.CannonType.DEFAULT;
    private cannon: Laya.MeshSprite3D;
    private turret: Laya.MeshSprite3D;
    public turretInitPos: Laya.Vector3;
    private isRecoil: boolean = false;
    private recoilTime: number;
    private MaxRecoilTime: number = 8;

    /** bullet */
    public bulletType: number = Const.CannonType.DEFAULT;
    public bulletDirection: Laya.Vector3 = new Laya.Vector3();
    public isRewardBullet: boolean = false;
    public bulletRewardType: number;

    /** raycast */
    private mousePoint: Laya.Vector2 = new Laya.Vector2();
    private ray: Laya.Ray = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
    private hitResult: Laya.HitResult = new Laya.HitResult();

    /** game state */
    public state: number = 0;

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

        this.scene3D.physicsSimulation.fixedTimeStep = 0.5 / 60;
        // Laya.timer.scale = 0.5;
        // Laya.stage.frameRate = "slow";

        // if (Laya.Browser.onMiniGame) {
        //     wx.setPreferredFramesPerSecond(30);
        // }
    }

    onEnable() {
        this.bindButtons();
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
            HomeView.openInstance();
        });
        // change cannon
        this.btn_cannon.on(Laya.Event.CLICK, this, () => {
            if (this.cannonType === Const.CannonType.DEFAULT) {
                this.cannonType = Const.CannonType.FROZEN;
                this.bulletType = this.cannonType;
                this.newCannon();
            }
            else {
                this.cannonType = Const.CannonType.DEFAULT;
                this.bulletType = this.cannonType;
                this.newCannon();
            }
        });
        // reward bullet
        this.btn_rewardBullet.on(Laya.Event.CLICK, this, () => {
            let scaleX: number = this.btn_rewardBullet.scaleX;
            let scaleY: number = this.btn_rewardBullet.scaleY;
            Laya.Tween.to(this.btn_rewardBullet, { scaleX: scaleX * 0.9, scaleY: scaleY * 0.9 }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
                Laya.Tween.to(this.btn_rewardBullet, { scaleX: scaleX, scaleY: scaleY }, 50, Laya.Ease.linearInOut, Laya.Handler.create(this, () => {
                    this.isRewardBullet = true;
                }));
            }));
        });

        // restart
        this.btn_restart.on(Laya.Event.CLICK, this, () => {
            this.restart();
        });
        // next stage
        this.btn_next.on(Laya.Event.CLICK, this, () => {
            this.nextStage();
        });
    }

    /** clean stage */
    private cleanStage() {
        if (this.gameStage) {
            this.gameStage.destroyChildren();
            this.gameStage.destroy();
            this.gameStage.timer.clearAll(this);
        }
    }

    /** create new stage by index */
    newStage() {
        // destroy old stage
        this.cleanStage();

        // hide
        this.winLabel.visible = false;
        this.btn_restart.visible = false;
        this.btn_next.visible = false;

        // reset
        this.currBulletNum = 0;
        this.winCheckCnt = 0;
        this.isStageStart = false;
        this.isRecoil = false;
        this.recoilTime = this.MaxRecoilTime;
        this.winLabel.visible = false;
        this.bulletType = this.cannonType;
        // reset turret rotation
        if (this.turret) {
            this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
        }

        // load stage
        let satgeResUrl: string = Const.StageResUrl + this.stageIdx + ".lh";
        Laya.Sprite3D.load(satgeResUrl, Laya.Handler.create(this, (res) => {
            this.gameStage = this.scene3D.addChild(res) as Laya.Sprite3D;

            // change level label
            this.lvlLabel.changeText("Level " + this.stageIdx);

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

        /** background moving */
        this.background && this.bgMoving();
    }

    /** win check */
    private winCheck() {
        // player win
        if (this.winCheckCnt++ >= Const.MaxWinCheckTime) {
            console.log("You win. Stage: " + this.stageIdx);
            // off shoot
            this.box_scene3D.off(Laya.Event.CLICK, this, this.onClick);
            // show
            this.winLabel.visible = true;
            this.btn_restart.visible = true;
            this.btn_next.visible = true;
            // this.nextStage();
            // clear stage looping
            this.gameStage.timer.clear(this, this.stageLooping);
        }
        // // player fail: out of ammo
        // else if (this.currBulletNum >= this.MaxBulletNum) {
        //     console.log("out of ammo");
        //     this.btn_restart.visible = true;
        //     this.btn_next.visible = true;
        //     this.gameStage.timer.clear(this, this.stageLooping);
        // }
    }

    /** restart current stage */
    restart() {
        this.newStage();
    }

    /** start next stage */
    nextStage() {
        this.stageIdx++;
        if (this.stageIdx <= Const.StageNum) {
            this.newStage();
        }
        else {
            console.log("通关");
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

        this.bulletRewardType = 1;
        /** reward bullet active */
        if (this.isRewardBullet) {
            // add effect sprite
            Laya.Sprite3D.load(Const.BulletRewardResUrl[this.bulletRewardType], Laya.Handler.create(this, (res) => {
                let bullet: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                bullet.name = "bullet";
                let bulletBlackHole: Laya.Sprite3D = bullet.addChild(res) as Laya.Sprite3D;
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
            /**************************** bullet **************************/
            // get bullet from pool
            let bullet: Laya.MeshSprite3D = Laya.Pool.getItem("bullet");
            // new bullet
            if (!bullet) {
                bullet = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                bullet.name = "bullet";
                bullet.addComponent(Bullet);
            }
            // reset bullet by type
            let bulletScript: Bullet = bullet.getComponent(Bullet);
            bulletScript.reset(this.bulletType);
            // add to scene
            this.scene3D.addChild(bullet);

            /******************* hidden bullet trigger: 防止快速移动碰撞检测丢失（ccd半径越小越精准） *****************/
            // get bullet trigger from pool
            let trigger: Laya.MeshSprite3D = Laya.Pool.getItem("bulletTrigger");
            // new bullet trigger
            if (!trigger) {
                trigger = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));
                trigger.name = "bulletTrigger";
                trigger.addComponent(Bullet);
            }
            // reset bullet trigger by type
            let triggerScript: Bullet = trigger.getComponent(Bullet);
            triggerScript.reset(this.bulletType);
            // add to scene
            this.scene3D.addChild(trigger);
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