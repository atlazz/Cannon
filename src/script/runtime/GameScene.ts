import { ui } from "./../../ui/layaMaxUI";
import * as Const from "../Const";
import Bullet from "../component/Bullet";
import Platform from "../component/Platform";
import Cube from "../component/Cube";

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

    /** platform */
    private platform: Laya.MeshSprite3D;
    private platform_stand: Laya.MeshSprite3D;

    /** cube */
    private _cube: Laya.MeshSprite3D;
    private cubeList: Cube[] = [];
    private cubeNumX: number = 4;
    private cubeNumY: number = 4;
    private cubeNumZ: number = 3;
    private cubeWidth: number;

    /** bullet */
    private _bullet: Laya.MeshSprite3D;
    private bulletRadius: number = 0.02;
    private bulletVelocity: number = 1;
    private bulletInitPos: Laya.Vector3;
    private bulletDirection: Laya.Vector3 = new Laya.Vector3();

    /** cannon */
    private player: Laya.MeshSprite3D;
    private playerAni: Laya.Animator;
    private shootTime: number = -1;;

    /** raycast */
    private mousePoint: Laya.Vector2 = new Laya.Vector2();
    private ray: Laya.Ray = new Laya.Ray(new Laya.Vector3(0, 0, 0), new Laya.Vector3(0, 0, 0));
    private hitResult: Laya.HitResult = new Laya.HitResult();

    constructor() {
        super();

        GameScene.instance = this;

        this.initScene3D();

        this.initGameStage();

        this.initPlayer();

        this.initBullet();
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

    /** initialize game stage */
    private initGameStage() {
        /** init platform */
        this.initPlatfrom();

        /** init cube */
        this._cube = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(1, 1, 1));
        this._cube.name = "cube";
        let cubeRigid: Laya.Rigidbody3D = this._cube.addComponent(Laya.Rigidbody3D);
        cubeRigid.colliderShape = new Laya.BoxColliderShape(1, 1, 1);
        cubeRigid.mass = 1;
        // cubeRigid.restitution = 0.2;
        // cubeRigid.friction = 10;
        // cubeRigid.rollingFriction = 0;
        // // block physics sim
        // cubeRigid.angularFactor = new Laya.Vector3(0, 0, 0);
        // cubeRigid.linearFactor = new Laya.Vector3(0, 0, 0);

        /** game stage */
        let cubeNum: number = this.cubeNumX * this.cubeNumY * this.cubeNumZ;

        let tmp: number = this.cubeNumX > this.cubeNumY ? this.cubeNumX : this.cubeNumY;
        tmp = this.cubeNumZ > this.cubeNumY ? this.cubeNumZ : this.cubeNumY;
        let padding: number = 1;
        this.cubeWidth = (Const.PlatformWidth - padding * 2) / tmp;
        let initX: number = (this.cubeNumX % 2 == 1) ? (-Math.floor(this.cubeNumX / 2) * this.cubeWidth) : (this.cubeWidth / 2 - this.cubeNumX / 2 * this.cubeWidth);
        let initY: number = (Const.PlatformHeight + this.cubeWidth) / 2;
        let initZ: number = (this.cubeNumZ % 2 == 1) ? (-Math.floor(this.cubeNumZ / 2) * this.cubeWidth) : (this.cubeWidth / 2 - this.cubeNumZ / 2 * this.cubeWidth);
        for (let x: number = 0; x < this.cubeNumX; x++) {
            for (let y: number = 0; y < this.cubeNumY; y++) {
                for (let z: number = 0; z < this.cubeNumZ; z++) {
                    let cube: Laya.MeshSprite3D = this._cube.clone();
                    cube.transform.localScale = new Laya.Vector3(this.cubeWidth, this.cubeWidth, this.cubeWidth);
                    cube.transform.localPosition = new Laya.Vector3(initX + this.cubeWidth * x, initY + this.cubeWidth * y, initZ + this.cubeWidth * z);
                    this.platform.addChild(cube);

                    let cubeScript: Cube = cube.addComponent(Cube);
                    cubeScript.type = Const.CubeType.GLASS;
                    cubeScript.width = this.cubeWidth;
                    this.cubeList.push(cubeScript);
                }
            }
        }
    }

    /** initialize platfrom */
    private initPlatfrom() {
        /** platform */
        // create mesh
        this.platform = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createBox(Const.PlatformWidth, Const.PlatformHeight, Const.PlatformWidth));
        this.scene3D.addChild(this.platform);
        this.platform.addComponent(Platform);
        this.platform.transform.localPosition = Const.PlatformInitPos.clone();
        this.platform.transform.localRotationEuler = Const.PlatformInitRot.clone();

        // set physics
        let collider: Laya.PhysicsCollider = this.platform.addComponent(Laya.PhysicsCollider);
        collider.colliderShape = new Laya.BoxColliderShape(Const.PlatformWidth, Const.PlatformHeight, Const.PlatformWidth);

        /** stand */
        // create mesh
        this.platform_stand = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createCylinder(Const.PlatformStandRadius, Const.PlatformStandHeight));
        this.platform.addChild(this.platform_stand);
        this.platform_stand.transform.localPosition = new Laya.Vector3(0, -Const.PlatformStandHeight / 2, 0);

        // set physics
        let collider_stand: Laya.PhysicsCollider = this.platform_stand.addComponent(Laya.PhysicsCollider);
        collider_stand.colliderShape = new Laya.CylinderColliderShape(Const.PlatformStandRadius, Const.PlatformStandHeight);
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

            // mouse click event listen: shoot a bullet
            Laya.stage.on(Laya.Event.CLICK, this, this.onClick);

            // onUpdate
            this.gameStart();
        }));
    }

    /** initialize bullet */
    private initBullet() {
        this._bullet = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(Const.BulletRadius));

        /** set physic */
        let bulletRigid: Laya.Rigidbody3D = this._bullet.addComponent(Laya.Rigidbody3D);
        // set collieder shape
        bulletRigid.colliderShape = new Laya.SphereColliderShape(Const.BulletRadius);
        // quick moving detecion
        bulletRigid.ccdMotionThreshold = 0.0001;
        bulletRigid.ccdSweptSphereRadius = Const.BulletRadius;
        // mass
        bulletRigid.mass = 1;

        /** trasform */
        this._bullet.transform.localPosition = Const.BulletInitPos.clone();
        this._bullet.transform.localRotationEuler = Const.BulletInitRot.clone();

        this._bullet.name = "_bullet";
    }

    /** game start */
    private gameStart() {
        // shooting animation
        this.playerAni.getDefaultState().clip.islooping = true;
        this.playerAni.play();
        Laya.timer.frameLoop(1, this, () => {
            // game state check

            // play shooting animation
            this.shootTime--;
            if (this.shootTime < 0) {
                // stop playing
                this.playerAni.speed = 0;
            }
        });
    }

    /** mouse click event: shoot a bullet */
    private onClick() {
        // play shoot animation
        this.shootTime = Const.PlayerShootLifeTime;
        this.playerAni.speed = 1;

        // get ray
        this.mousePoint.x = Laya.MouseManager.instance.mouseX;
        this.mousePoint.y = Laya.MouseManager.instance.mouseY;
        this.camera.viewportPointToRay(this.mousePoint, this.ray);

        // get bullet shooting direction
        if (this.scene3D.physicsSimulation.rayCast(this.ray, this.hitResult, 30)) {
            // direction vector: [bullet init point] to [mouse hit point]
            Laya.Vector3.subtract(this.hitResult.point, Const.BulletInitPos, this.bulletDirection);
        }
        else {
            // direction vector: [camera point] to [mouse hit point]
            var aV3: Laya.Vector3 = new Laya.Vector3();
            // ray direction scale: to depth scaleZ
            let scaleV: number = this.camera.farPlane;
            scaleV = 12;
            Laya.Vector3.scale(this.ray.direction, scaleV, aV3);
            // direction vector: [bullet init point] to [camera point]
            var bV3: Laya.Vector3 = new Laya.Vector3();
            Laya.Vector3.subtract(this.camera.transform.position, Const.BulletInitPos, bV3);
            // direction vector: [bullet init point] to [mouse hit point]
            Laya.Vector3.add(aV3, bV3, this.bulletDirection);
        }
        Laya.Vector3.normalize(this.bulletDirection, this.bulletDirection);
        this.bulletVelocity = 50;
        Laya.Vector3.scale(this.bulletDirection, this.bulletVelocity, this.bulletDirection);

        // generate bullet
        let bullet: Laya.MeshSprite3D = this._bullet.clone();
        bullet.name = "bullet";
        this.scene3D.addChild(bullet);
        let bulletRigid: Laya.Rigidbody3D = bullet.getComponent(Laya.Rigidbody3D);
        bulletRigid.linearVelocity = this.bulletDirection.clone();
    }
}