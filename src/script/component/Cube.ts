import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Cube extends Laya.Script3D {
    private cube: Laya.MeshSprite3D;

    private type: number = Const.CubeType.DEFAULT;

    private sizeX: number;
    private sizeY: number;
    private sizeZ: number;

    private collisionBlackList: string[] = ["platform"];

    /** cube pieces */
    private piecesList: Laya.MeshSprite3D[] = [];

    constructor() {
        super();
    }

    onAwake() {
        this.cube = this.owner as Laya.MeshSprite3D;
        this.setRigidbody();
        this.initPieces();
    }

    onCollisionEnter(collision: Laya.Collision): void {
        let other: Laya.MeshSprite3D = collision.other.owner as Laya.MeshSprite3D;
        // if (this.collisionBlackList.indexOf(other.name) < 0) {
        if (this.type === Const.CubeType.GLASS) {
            // 相对速度高可击碎
            let velocity: Laya.Vector3 = (this.cube.getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity.clone();
            let velocityOther: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
            // not playform
            if (this.collisionBlackList.indexOf(other.name) < 0) {
                velocityOther = (other.getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity.clone();
            }
            Laya.Vector3.subtract(velocity, velocityOther, velocity);
            let velocityValue: number = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2) + Math.pow(velocity.z, 2));
            if (velocityValue >= Const.GlassBrokenVelocity) {
                // this.isHit = true;
                this.broken();
            }
        }
        // }
    }

    onUpdate() {
        // physics engine bug detecting and fixing
        this.physics_engine_bug_fixing();

        // // hit handling
        // if (this.isHit) {
        //     if (this.type === Const.CubeType.GLASS) {
        //         this.broken();
        //     }
        // }
    }

    /** physics engine bug detecting and fixing
     *  引擎bug：姿态稳定情况下，某个物体作用力方向（如重力时的底下）的碰撞物体快速消失，
     *  而此过程中相互作用影响过小导致自身姿态没有变化时，引擎会自动将该物体的刚体非激活，从而导致腾空现象，
     *  增大物体间相互作用力（如摩擦系数）可减少该情况发生，但不能杜绝，
     *  故在此检测该情况并对刚体销毁重建
     * */
    private physics_engine_bug_fixing() {
        let rigidbody: Laya.Rigidbody3D = this.cube.getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D;
        if (rigidbody.isActive == false) {
            rigidbody.destroy();
            this.setRigidbody();
            console.log("Physics_engine_bug_fixing: Reset rigidbody.");
        }
    }

    /** set material by type */
    setType(type: number) {
        this.type = type;
        if (this.type === Const.CubeType.GLASS) {
            let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
            mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            mat.albedoColor = new Laya.Vector4(0.7, 0.7, 1, 0.7);
            this.cube.meshRenderer.material = mat;
        }
    }

    /** set rigidbody */
    private setRigidbody() {
        let rigidbody: Laya.Rigidbody3D = this.cube.addComponent(Laya.Rigidbody3D);
        if (this.cube.name.search("Cube") >= 0) {
            let boundindBox: Laya.BoundBox = this.cube.meshFilter.sharedMesh.boundingBox.clone();
            this.sizeX = boundindBox.max.x - boundindBox.min.x;
            this.sizeY = boundindBox.max.y - boundindBox.min.y;
            this.sizeZ = boundindBox.max.z - boundindBox.min.z;
            rigidbody.colliderShape = new Laya.BoxColliderShape(this.sizeX, this.sizeY, this.sizeZ);
        }
        else {
            let colliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
            colliderShape.mesh = this.cube.meshFilter.sharedMesh;
            rigidbody.colliderShape = colliderShape;
        }
        this.setPhysicsParam();
    }

    /** set physics param */
    private setPhysicsParam() {
        let rigidbody: Laya.Rigidbody3D = this.cube.getComponent(Laya.Rigidbody3D);
        rigidbody.isKinematic = false;
        if (this.type === Const.CubeType.DEFAULT) {
            rigidbody.mass = 10;
            rigidbody.friction = 10;
        }
        else if (this.type === Const.CubeType.GLASS) {
            rigidbody.mass = 0.1;
            rigidbody.friction = 2;
        }
    }

    /** set obstacle broken */
    private broken() {
        // play broken sound

        // show pieces
        this.effectPiecesBroken(this.cube.transform.position.clone());
        // hide obstacle
        Laya.timer.frameOnce(1, this, () => {
            this.cube.active = false;
        });
    }

    /** init obstacle pieces */
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

    /** platy effect: obstacle broken to pieces */
    public effectPiecesBroken(worldPos: Laya.Vector3) {
        for (let idx in this.piecesList) {
            // active pieces
            this.piecesList[idx].active = true;
            // set size scale
            let scaleX: number = (Math.random() * 0.5 + 0.5) * 2.5 * this.sizeX * Const.StageInitScale.x;
            let scaleY: number = (Math.random() * 0.5 + 0.5) * 2.5 * this.sizeY * Const.StageInitScale.y;
            let scaleZ: number = (Math.random() * 0.5 + 0.5) * 2.5 * this.sizeZ * Const.StageInitScale.z;
            this.piecesList[idx].transform.localScale = new Laya.Vector3(scaleX, scaleY, scaleZ);
            // set rot
            this.piecesList[idx].transform.localRotationEulerX = (Math.random() - 0.5) * 2 * 90;
            this.piecesList[idx].transform.localRotationEulerY = (Math.random() - 0.5) * 2 * 90;
            this.piecesList[idx].transform.localRotationEulerZ = (Math.random() - 0.5) * 2 * 90;
            // set pos
            let velocity: Laya.Vector3 = new Laya.Vector3();
            velocity.x = (Math.random() - 0.5) * Const.BulletRadius;
            velocity.y = (Math.random() - 0.5) * Const.BulletRadius;
            velocity.z = (Math.random() - 0.5) * Const.BulletRadius;
            this.piecesList[idx].transform.position = worldPos.clone();
            Laya.Vector3.add(this.piecesList[idx].transform.localPosition, velocity, this.piecesList[idx].transform.localPosition);
            // set velocity of pieces
            Laya.Vector3.scale(velocity, 50, velocity);
            (this.piecesList[idx].getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity = velocity.clone();
            // set hiding effect
            Laya.Tween.to(this.piecesList[idx].transform.localScale, {x: scaleX / 2, y: scaleY / 2, z: scaleZ / 2}, Const.PiecesBrokenTime / 60 * 1000, Laya.Ease.linearNone);
            Laya.Tween.to(this.piecesList[idx].meshRenderer.material, {albedoColorA: 0}, Const.PiecesBrokenTime / 60 * 1000, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                this.piecesList[+idx].destroy();
            }));
        }
    }
}