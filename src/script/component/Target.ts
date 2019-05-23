import * as Const from "../Const";
import GameScene from "../runtime/GameScene";
import Bullet from "../component/Bullet"

export default class Target extends Laya.Script3D {
    private target: Laya.MeshSprite3D;
    private rigidbody: Laya.Rigidbody3D;
    private material: Laya.PBRSpecularMaterial;

    private type: number = Const.TargetType.DEFAULT;

    private sizeX: number;
    private sizeY: number;
    private sizeZ: number;

    private collisionBlackList: string[] = ["stand", "Guard"];

    /** target object pieces */
    private piecesList: Laya.MeshSprite3D[] = [];

    /** for win check */
    private distance: number;

    constructor() {
        super();
    }

    onAwake() {
        this.target = this.owner as Laya.MeshSprite3D;

        this.setRigidbody();
        // 延后几帧屏蔽物理受力，以等待物体掉落放置
        Laya.timer.frameOnce(Const.SetKinematicWaitTime, this, () => {
            if (!GameScene.instance.isStageStart) {
                this.rigidbody.isKinematic = true;
            }
        });

        this.initPieces();
    }

    /** collision enter */
    onCollisionEnter(collision: Laya.Collision): void {
        this.collisionHandler(collision);
    }
    /** collision stay */
    onCollisionStay(collision: Laya.Collision): void {
        this.collisionHandler(collision);
    }
    /** collision exit */
    onCollisionExit(collision: Laya.Collision): void {
        this.collisionHandler(collision);
    }

    /** collision handler */
    private collisionHandler(collision: Laya.Collision) {
        let other: Laya.MeshSprite3D = collision.other.owner as Laya.MeshSprite3D;

        // check collision in black list: stand, guard
        let inBlackList: boolean = false;
        for (let item of this.collisionBlackList) {
            if (other.name.indexOf(item) >= 0) {
                inBlackList = true;
                break;
            }
        }

        // reset win check
        if (inBlackList) {
            GameScene.instance.winCheckCnt = 0;
        }

        // 子弹效果处理
        if (other.name === "bullet") {
            let bullet: Bullet = other.getComponent(Bullet);
            if (bullet.type === Const.BulletType.FROZEN) {
                this.setType(Const.TargetType.GLASS);
            }
        }

        // 本体受击打处理
        if (this.type === Const.TargetType.GLASS) {
            // 相对速度高可击碎
            let velocity: Laya.Vector3 = this.rigidbody.linearVelocity.clone();
            let velocityOther: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
            // not stand and guard
            if (!inBlackList) {
                velocityOther = (other.getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity.clone();
            }
            let velocityValue: number = Laya.Vector3.distance(velocity, velocityOther);
            if (velocityValue >= Const.GlassBrokenVelocity) {
                // this.isHit = true;
                this.broken();
            }
        }
    }

    onUpdate() {
        // check spirte alive
        if (this.target.destroyed) {
            this.destroy();
            return;
        }

        // stage start
        if (this.rigidbody.isKinematic && GameScene.instance.isStageStart) {
            this.rigidbody.isKinematic = false;
        }

        // 刷新渲染模式，不然临近设置成透明渲染的物体会被遮盖
        this.refreshRenderMode();

        /** win check
         *  引擎bug：物体架在两个平台夹缝上时，不触发onCollisionStay,
         *  故完善关卡胜利判断，根据物体与关卡模型中心距离判定是否掉出平台
         *  ps：物理引擎bug较多，可以来引擎呈现物理宏观效果，但尽量少依赖碰撞做需要稳定的底层处理
         */
        this.distance = Laya.Vector3.distance(this.target.transform.position, GameScene.instance.gameStage.transform.position);
        if (this.distance < 15) {
            // reset win check counter
            GameScene.instance.winCheckCnt = 0;
        }

        /** physics engine bug detecting and fixing
         *  引擎bug：姿态稳定情况下，某个物体作用力方向（如重力时的底下）的碰撞物体快速消失，
         *  而此过程中相互作用影响过小导致自身姿态没有变化时，引擎会自动将该物体的刚体非激活，从而导致腾空现象，
         *  增大物体间相互作用力（如摩擦系数）可减少该情况发生，但不能杜绝，
         *  故在此检测该情况并对刚体销毁重建
         * */
        if (this.rigidbody && this.rigidbody.isActive == false) {
            console.log("Physics_engine_bug_fixing: Reset rigidbody.");
            this.refreshRigidbody();
        }
    }

    /** refresh render mode of material */
    private refreshRenderMode() {
        if (this.type === Const.TargetType.GLASS) {
            this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_TRANSPARENT;
        }
        else {
            this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
        }
    }

    /** destroy and recreate rigidbody */
    private refreshRigidbody() {
        if (this.rigidbody) {
            console.log("refresh rigidbody")
            this.rigidbody.destroy();
            this.setRigidbody();
        }
    }

    /** set material by type */
    setType(type: number) {
        this.type = type;
        // get material
        this.material = this.target.meshRenderer.material as Laya.PBRSpecularMaterial;
        if (!this.material) {
            this.material = new Laya.PBRSpecularMaterial();
            this.target.meshRenderer.material = this.material;
        }
        // set material by type
        if (this.type === Const.TargetType.GLASS) {
            this.material.albedoTexture = null;
            this.material.albedoColor = new Laya.Vector4(0.7, 0.7, 1, 0.7);
            this.material.specularColor = new Laya.Vector4(0, 0, 0, 1);
            this.material.enableEmission = true;
        }
        this.refreshRenderMode();
    }

    /** set rigidbody */
    private setRigidbody() {
        // get size of bounding box
        let boundingBox: Laya.BoundBox = this.target.meshFilter.sharedMesh.boundingBox.clone();
        this.sizeX = boundingBox.max.x - boundingBox.min.x;
        this.sizeY = boundingBox.max.y - boundingBox.min.y;
        this.sizeZ = boundingBox.max.z - boundingBox.min.z;
        // add rigidbody
        this.rigidbody = this.target.addComponent(Laya.Rigidbody3D);
        if (this.target.name.search("Cube") >= 0) {
            this.rigidbody.colliderShape = new Laya.BoxColliderShape(this.sizeX, this.sizeY, this.sizeZ);
        }
        else if (this.target.name.search("Cylinder") >= 0) {
            this.rigidbody.colliderShape = new Laya.CylinderColliderShape(this.sizeX / 2, this.sizeY);
        }
        else {
            let colliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
            colliderShape.mesh = this.target.meshFilter.sharedMesh;
            this.rigidbody.colliderShape = colliderShape;
        }
        this.setPhysicsParam();
    }

    /** set physics param */
    private setPhysicsParam() {
        this.rigidbody.isKinematic = false;
        if (this.type === Const.TargetType.DEFAULT) {
            this.rigidbody.mass = 10;
            this.rigidbody.friction = 10;
        }
        else if (this.type === Const.TargetType.GLASS) {
            this.rigidbody.mass = 0.1;
            this.rigidbody.friction = 2;
        }
    }

    /** set target broken */
    private broken() {
        // play broken sound

        // show pieces
        this.effectPiecesBroken();
        // hide target
        Laya.timer.frameOnce(1, this, () => {
            this.target.active = false;
        });
    }

    /** init target pieces */
    private initPieces() {
        Laya.Mesh.load(Const.PieceResUrl, Laya.Handler.create(this, (mesh) => {
            let piece: Laya.MeshSprite3D = new Laya.MeshSprite3D(mesh);

            piece.active = false;
            piece.name = "piece";

            // set material
            let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
            mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            mat.albedoColor = new Laya.Vector4(0.7, 0.7, 1, 0.7);
            piece.meshRenderer.material = mat;

            // set rigidbody
            let pieceRigid: Laya.Rigidbody3D = piece.addComponent(Laya.Rigidbody3D);
            let pieceColliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
            pieceColliderShape.mesh = piece.meshFilter.sharedMesh;
            pieceRigid.colliderShape = pieceColliderShape;

            // add pieces to scene
            for (let i = 0; i < Const.PiecesNum; i++) {
                this.piecesList.push(piece.clone());
                GameScene.instance.scene3D.addChild(this.piecesList[i]);
            }
        }));
    }

    /** platy effect: target broken to pieces */
    public effectPiecesBroken() {
        for (let idx in this.piecesList) {
            // active pieces
            this.piecesList[idx].active = true;
            // set size scale
            let scaleX: number = (Math.random() * 0.5 + 0.5) * 1.5 * this.sizeX * this.target.transform.localScaleX * Const.StageInitScale.x;
            let scaleY: number = (Math.random() * 0.5 + 0.5) * 1.5 * this.sizeY * this.target.transform.localScaleY * Const.StageInitScale.y;
            let scaleZ: number = (Math.random() * 0.5 + 0.5) * 1.5 * this.sizeZ * this.target.transform.localScaleZ * Const.StageInitScale.z;
            this.piecesList[idx].transform.localScale = new Laya.Vector3(scaleX, scaleY, scaleZ);
            // set rot
            this.piecesList[idx].transform.localRotationEulerX = (Math.random() - 0.5) * 2 * 90;
            this.piecesList[idx].transform.localRotationEulerY = (Math.random() - 0.5) * 2 * 90;
            this.piecesList[idx].transform.localRotationEulerZ = (Math.random() - 0.5) * 2 * 90;
            // set pos
            let velocity: Laya.Vector3 = new Laya.Vector3();
            velocity.x = (Math.random() - 0.5) * Const.StageInitScale.x / 80;
            velocity.y = (Math.random() - 0.5) * Const.StageInitScale.y / 80;
            velocity.z = (Math.random() - 0.5) * Const.StageInitScale.z / 80;
            this.piecesList[idx].transform.position = this.target.transform.position.clone();
            Laya.Vector3.add(this.piecesList[idx].transform.localPosition, velocity, this.piecesList[idx].transform.localPosition);
            // set velocity of pieces
            Laya.Vector3.scale(velocity, 50, velocity);
            (this.piecesList[idx].getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity = velocity.clone();
            // set hiding effect
            Laya.Tween.to(this.piecesList[idx].transform.localScale, { x: scaleX / 2, y: scaleY / 2, z: scaleZ / 2 }, Const.PiecesBrokenTime / 60 * 1000, Laya.Ease.linearNone);
            Laya.Tween.to(this.piecesList[idx].meshRenderer.material, { albedoColorA: 0 }, Const.PiecesBrokenTime / 60 * 1000, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                this.piecesList[+idx].destroy();
            }));
        }
    }
}