import { ui } from "./../../ui/layaMaxUI";
import * as Const from "../Const";
import Navigator from "../util/Navigator";
import Bullet from "../component/Bullet";
import Target from "../component/Target";
import Guard from "../component/Guard";

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
        this.visible = true;
        // this.state = Const.GameState.READY;
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
    private turretInitPos: Laya.Vector3;
    private isRecoil: boolean = false;
    private recoilTime: number;
    private MaxRecoilTime: number = 8;

    /** bullet */
    private _bullet: Laya.MeshSprite3D;
    private bulletDirection: Laya.Vector3 = new Laya.Vector3();

    /** raycast */
    private mousePoint: Laya.Vector2 = new Laya.Vector2();
    private ray: Laya.Ray = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
    private hitResult: Laya.HitResult = new Laya.HitResult();

    /** game state */
    public state: number = 0;

    constructor() {
        super();

        GameScene.instance = this;

        this.initScene3D();

        this.initCannon();

        this.initBullet();

        // load texture
        Laya.loader.load(Const.StageTexUrl, Laya.Handler.create(this, () => {
            this.stageIdx = 1;
            this.loadGameStage();
        }));


        this.scene3D.physicsSimulation.fixedTimeStep = 0.5 / 60;
    }

    /** initialize scene */
    private initScene3D() {
        // add scene
        this.scene3D = this.scene3DBox.addChild(new Laya.Scene3D()) as Laya.Scene3D;

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
            }
        }));
    }

    /** initialize player */
    private initCannon() {
        Laya.Sprite3D.load(Const.CannonResUrl[0], Laya.Handler.create(this, (res) => {
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

    /** init bullet */
    private initBullet() {
        let radius: number = Const.BulletRadius;
        this._bullet = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(radius));
        this._bullet.name = "_bullet";

        // add rigidbody
        let bulletRigid: Laya.Rigidbody3D = this._bullet.addComponent(Laya.Rigidbody3D);
        bulletRigid.colliderShape = new Laya.SphereColliderShape(radius);
    }

    /** load game stage by index */
    private loadGameStage() {
        // destroy old stage
        if (this.gameStage) {
            this.gameStage.destroyChildren();
            this.gameStage.destroy();
            Laya.stage.off(Laya.Event.CLICK, this, this.onClick);
        }

        // reset
        this.currBulletNum = 0;
        this.winCheckCnt = 0;
        this.isStageStart = false;
        this.isRecoil = false;
        this.recoilTime = this.MaxRecoilTime;

        // load stage
        let satgeResUrl: string = Const.StageResUrl + this.stageIdx + ".lh";
        Laya.Sprite3D.load(satgeResUrl, Laya.Handler.create(this, (res) => {
            this.gameStage = this.scene3D.addChild(res) as Laya.Sprite3D;

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
                    let mat: Laya.PBRSpecularMaterial = new Laya.PBRSpecularMaterial();
                    // 刷新渲染模式，不然其上设置成透明渲染的物体会被遮盖
                    mat.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
                    mat.albedoTexture = Laya.loader.getRes(Const.StageTexUrl[0]);
                    child.meshRenderer.material = mat;
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
                    let mat: Laya.PBRSpecularMaterial = new Laya.PBRSpecularMaterial();
                    // 刷新渲染模式，不然其上设置成透明渲染的物体会被遮盖
                    mat.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
                    mat.albedoTexture = Laya.loader.getRes(Const.StageTexUrl[0]);
                    child.meshRenderer.material = mat;
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
            Laya.timer.frameLoop(1, this, this.stageLooping);
            // mouse click event listen: shoot a bullet
            Laya.stage.on(Laya.Event.CLICK, this, this.onClick);
        }));
    }

    /** game stage looping */
    private stageLooping() {
        /** win check */
        // player win
        if (this.winCheckCnt++ >= Const.MaxWinCheckTime) {
            console.log("You win. Stage: " + this.stageIdx);
            this.nextStage();
            // clear stage looping
            Laya.timer.clear(this, this.stageLooping);
        }
        // player fail: out of ammo
        else if (this.currBulletNum >= this.MaxBulletNum) {
            console.log("out of ammo");
            this.restart();
            Laya.timer.clear(this, this.stageLooping);
        }

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

    /** restart current stage */
    restart() {
        this.loadGameStage();
    }

    /** start next stage */
    nextStage() {
        this.stageIdx++;
        if (this.stageIdx <= Const.StageNum) {
            this.loadGameStage();
        }
        else {
            console.log("通关");
        }
    }

    /** mouse click event: shoot a bullet */
    private onClick() {
        // check res loading complete
        if (!this.gameStage || !this.cannon || !this._bullet) {
            return;
        }

        // get ray
        this.mousePoint.x = Laya.MouseManager.instance.mouseX;
        this.mousePoint.y = Laya.MouseManager.instance.mouseY;
        this.camera.viewportPointToRay(this.mousePoint, this.ray);

        // get bullet shooting direction
        if (this.scene3D.physicsSimulation.rayCast(this.ray, this.hitResult, 30)) {
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
        Laya.Vector3.normalize(this.bulletDirection, this.bulletDirection);

        // create bullet
        this.createBullet(Const.CannonType.DEFAULT, this.bulletDirection);

        // set turret transform
        this.turret.transform.localRotationEuler = Const.TurretInitLocalRot.clone();
        this.turret.transform.localRotationEulerX -= this.bulletDirection.y * 90;
        this.turret.transform.localRotationEulerY -= this.bulletDirection.x * 90;
        this.isRecoil = true;
        this.recoilTime = 0;
    }

    /** create bullet */
    private createBullet(type: number, direction: Laya.Vector3) {
        this.cannonType = type;

        let bullet: Laya.MeshSprite3D = this._bullet.clone();
        bullet.name = "bullet";
        this.scene3D.addChild(bullet);

        // trasform
        bullet.transform.localPosition = this.turretInitPos.clone();
        Laya.Vector3.scale(bullet.transform.localScale, Const.BulletScale[this.cannonType], bullet.transform.localScale);

        // add rigidbody
        let bulletRigid: Laya.Rigidbody3D = bullet.getComponent(Laya.Rigidbody3D);

        // quick moving detecion
        bulletRigid.ccdMotionThreshold = 0.001;
        // 半径越小越精准
        bulletRigid.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[this.cannonType];

        // set physics
        bulletRigid.mass = Const.BulletMass[this.cannonType];

        // set velocity
        let velocity: Laya.Vector3 = direction.clone();
        Laya.Vector3.scale(velocity, Const.BulletVelocity[this.cannonType], velocity);
        bulletRigid.linearVelocity = velocity.clone();


        // hidden bullet for quick moving detection setting start <===========================
        let bulletTrigger: Laya.MeshSprite3D = bullet.clone();
        bulletTrigger.name = "bulletTrigger";
        this.scene3D.addChild(bulletTrigger);
        // set trigger
        (bulletTrigger.getComponent(Laya.Rigidbody3D)).isTrigger = true;
        // quick moving detecion
        (bulletTrigger.getComponent(Laya.Rigidbody3D)).ccdMotionThreshold = 0.001;
        // 半径越小越精准
        (bulletTrigger.getComponent(Laya.Rigidbody3D)).ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[this.cannonType] / 1000;
        // add script
        let triggerScript: Bullet = bulletTrigger.addComponent(Bullet);
        // set type
        triggerScript.type = 999;
        // hidden bullet setting end <========================================================


        // add script
        let bulletScript: Bullet = bullet.addComponent(Bullet);
        // set type
        bulletScript.type = this.cannonType;

        // 开放物体物理受力：玩家有效输入前，子弹发射轨迹形状检测是否有碰撞
        if (!this.isStageStart) {
            var shape = new Laya.SphereColliderShape(Const.BulletRadius * 3);
            var checkHitResult: Laya.HitResult[] = [];
            if (this.scene3D.physicsSimulation.shapeCastAll(shape, this.turretInitPos, velocity, checkHitResult)) {
                for (let i in checkHitResult) {
                    if (checkHitResult[i].collider.owner.name !== "stand") {
                        this.isStageStart = true;
                    }
                }
            }
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