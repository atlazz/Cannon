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

    /** stage */
    public gameStage: Laya.Sprite3D;
    public stageIdx: number;
    public MaxBulletNum: number = 100;
    public currBulletNum: number = 0;
    public winCheckCnt: number = 0;
    public isStageStart: boolean = false;

    /** bullet */
    private _bullet: Laya.MeshSprite3D;
    public bulletType: number = Const.BulletType.DEFAULT;

    /** cannon */
    private player: Laya.MeshSprite3D;
    private playerAni: Laya.Animator;
    private shootTime: number = -1;;

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

        this.initPlayer();

        this.initBullet();

        this.stageIdx = 25;
        this.loadGameStage();
    }

    /** initialize scene */
    private initScene3D() {
        // add scene
        this.scene3D = Laya.stage.addChild(new Laya.Scene3D()) as Laya.Scene3D;

        // camera
        this.camera = this.scene3D.addChild(new Laya.Camera()) as Laya.Camera;
        this.camera.transform.localPosition = Const.CameraInitPos.clone();
        this.camera.transform.localRotationEuler = Const.CameraInitRotEuler.clone();

        // direction light
        this.directionLight = this.scene3D.addChild(new Laya.DirectionLight()) as Laya.DirectionLight;
        this.directionLight.transform.localPosition = Const.LightInitPos.clone();
        this.directionLight.transform.localRotationEuler = Const.LightInitRotEuler.clone();
    }

    /** initialize player */
    private initPlayer() {
        Laya.Sprite3D.load(Const.PlayerResUrl, Laya.Handler.create(this, (res) => {
            this.player = res;
            this.scene3D.addChild(this.player);
            this.playerAni = this.player.getComponent(Laya.Animator);
            this.player.transform.localPosition = Const.PlayerInitPos.clone();
            this.player.transform.localRotationEuler = Const.PlayerInitRot.clone();
            this.player.transform.localScale = Const.PlayerInitScale.clone();

            this.player.name = "player";

            let shadowMat: Laya.BlinnPhongMaterial = (this.player.getChildByName("shadow_0") as Laya.MeshSprite3D).meshRenderer.material as Laya.BlinnPhongMaterial;
            shadowMat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            shadowMat.albedoColorA = 0.2;

            // set shooting animation
            this.playerAni.getDefaultState().clip.islooping = true;
            this.playerAni.play();
            Laya.timer.frameLoop(1, this, () => {
                // play shooting animation
                this.shootTime--;
                if (this.shootTime < 0) {
                    // stop playing
                    this.playerAni.speed = 0;
                }
            });
        }));
    }

    /** init bullet */
    private initBullet() {
        let radius: number = Const.BulletRadius;
        this._bullet = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(radius));
        this._bullet.name = "_bullet";

        // trasform
        this._bullet.transform.localPosition = Const.BulletInitPos.clone();
        this._bullet.transform.localRotationEuler = Const.BulletInitRot.clone();

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

        // load stage
        let satgeResUrl: string = Const.StageResUrl + this.stageIdx + ".lh";
        Laya.Sprite3D.load(satgeResUrl, Laya.Handler.create(this, (res) => {
            this.gameStage = this.scene3D.addChild(res) as Laya.Sprite3D;

            // set pos
            this.gameStage.transform.localPosition = Const.StageInitPos.clone();
            this.gameStage.transform.localRotationEuler = Const.StageInitRot.clone();
            this.gameStage.transform.localScale = Const.StageInitScale.clone();

            // destroy animator component: 不然会约束物理碰撞效果
            (this.gameStage.getComponent(Laya.Animator) as Laya.Animator).destroy();

            let child: Laya.MeshSprite3D;
            for (let i: number = 0; i < this.gameStage.numChildren; i++) {
                child = this.gameStage.getChildAt(i) as Laya.MeshSprite3D;
                /** target object */
                if (child.name.search("Obstacle") >= 0) {
                    console.log(child.name + " to target")
                    // add scipt
                    let targetScript: Target = child.addComponent(Target);
                    // set type
                    if (child.name.search("Glass") >= 0) {
                        targetScript.setType(Const.TargetType.GLASS);
                    }
                    else {
                        targetScript.setType(Const.TargetType.DEFAULT);
                    }
                }
                /** stand_box */
                else if (child.name.search("Cube") >= 0) {
                    console.log(child.name + " to stand")
                    child.name = "stand";
                    // add collider
                    let collider: Laya.PhysicsCollider = child.addComponent(Laya.PhysicsCollider);
                    let boundingBox: Laya.BoundBox = child.meshFilter.sharedMesh.boundingBox.clone();
                    let sizeX: number = boundingBox.max.x - boundingBox.min.x;
                    let sizeY: number = boundingBox.max.y - boundingBox.min.y;
                    let sizeZ: number = boundingBox.max.z - boundingBox.min.z;
                    collider.colliderShape = new Laya.BoxColliderShape(sizeX, sizeY, sizeZ);
                }
                /** stand_cylinder */
                else if (child.name.search("Cylinder") >= 0) {
                    console.log(child.name + " to stand")
                    child.name = "stand";
                    // add collider
                    let collider: Laya.PhysicsCollider = child.addComponent(Laya.PhysicsCollider);
                    let colliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
                    colliderShape.mesh = child.meshFilter.sharedMesh;
                    collider.colliderShape = colliderShape;
                }
                /** Guard */
                else if (child.name.search("Guard") >= 0) {
                    console.log(child.name + " to guard")
                    // add script
                    let guard: Guard = child.addComponent(Guard);
                }
                else {
                    child.destroy();
                }
            }

            // set stage listener
            Laya.timer.frameLoop(1, this, this.stageListener);
            // mouse click event listen: shoot a bullet
            Laya.stage.on(Laya.Event.CLICK, this, this.onClick);
        }));
    }

    /** game stage listener */
    private stageListener() {
        // player win
        if (this.winCheckCnt++ >= Const.MaxWinCheckTime) {
            console.log("You win. Stage: " + this.stageIdx);
            this.nextStage();
            // clear listener
            Laya.timer.clear(this, this.stageListener);
        }
        // player fail: out of ammo
        else if (this.currBulletNum >= this.MaxBulletNum) {
            console.log("out of ammo");
            this.restart();
            Laya.timer.clear(this, this.stageListener);
        }
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
        if (!this.gameStage || !this.player || !this._bullet) {
            return;
        }

        // play shoot animation
        this.shootTime = Const.PlayerShootLifeTime;
        this.playerAni.speed = 1;

        // get ray
        this.mousePoint.x = Laya.MouseManager.instance.mouseX;
        this.mousePoint.y = Laya.MouseManager.instance.mouseY;
        this.camera.viewportPointToRay(this.mousePoint, this.ray);

        // get bullet shooting direction
        let bulletDirection: Laya.Vector3 = new Laya.Vector3();
        if (this.scene3D.physicsSimulation.rayCast(this.ray, this.hitResult, 30)) {
            // direction vector: [bullet init point] to [mouse hit point]
            Laya.Vector3.subtract(this.hitResult.point, Const.BulletInitPos, bulletDirection);
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
            Laya.Vector3.subtract(this.camera.transform.position, Const.BulletInitPos, bV3);
            // direction vector: [bullet init point] to [mouse hit point]
            Laya.Vector3.add(aV3, bV3, bulletDirection);
        }
        Laya.Vector3.normalize(bulletDirection, bulletDirection);

        // create bullet
        this.createBullet(Const.BulletType.FROZEN, bulletDirection);
    }

    /** create bullet */
    private createBullet(type: number, direction: Laya.Vector3) {
        this.bulletType = type;

        let bullet: Laya.MeshSprite3D = this._bullet.clone();
        bullet.name = "bullet";
        this.scene3D.addChild(bullet);

        // trasform
        bullet.transform.localPosition = Const.BulletInitPos.clone();
        bullet.transform.localRotationEuler = Const.BulletInitRot.clone();
        Laya.Vector3.scale(bullet.transform.localScale, Const.BulletScale[this.bulletType], bullet.transform.localScale);

        // add rigidbody
        let bulletRigid: Laya.Rigidbody3D = bullet.getComponent(Laya.Rigidbody3D);

        // quick moving detecion
        bulletRigid.ccdMotionThreshold = 0.0001;
        bulletRigid.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[this.bulletType];

        // set physics
        bulletRigid.mass = Const.BulletMass[this.bulletType];

        // set velocity
        let velocity: Laya.Vector3 = direction.clone();
        Laya.Vector3.scale(velocity, Const.BulletVelocity[this.bulletType], velocity);
        bulletRigid.linearVelocity = velocity.clone();

        // add script
        let bulletScript: Bullet = bullet.addComponent(Bullet);
        // set type
        bulletScript.setType(this.bulletType);
        
        // 开放物体物理受力：玩家有效输入前，子弹发射轨迹形状检测是否有碰撞
        if (!this.isStageStart) {
            var shape = new Laya.SphereColliderShape(Const.BulletRadius * 5);
            var checkHitResult: Laya.HitResult[] = [];
            if (this.scene3D.physicsSimulation.shapeCastAll(shape, Const.BulletInitPos, velocity, checkHitResult)) {
                for (let i in checkHitResult) {
                    if (checkHitResult[i].collider.owner.name !== "stand") {
                        this.isStageStart = true;
                    }
                }
            }
        }
    }
}