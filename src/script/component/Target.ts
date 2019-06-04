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

    /** 有效碰撞体: target object or bullet */
    private collisionWhiteList: string[] = ["bullet", "Obstacle"];

    /** target object pieces */
    private piecesList: Laya.MeshSprite3D[] = [];

    /** 空中无碰撞计数，用于玻璃掉落碎掉 */
    private jumpCnt: number = 0;

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

        // check collision in white list: [target, bullet]
        let inWhiteList: boolean = false;
        for (let item of this.collisionWhiteList) {
            if (other.name.indexOf(item) >= 0) {
                inWhiteList = true;
                break;
            }
        }

        /** 本体类型碰撞处理 */
        // Glass
        if (this.type === Const.TargetType.GLASS) {
            // 相对速度高可击碎
            // falling broken
            if (this.jumpCnt > 60) {
                let velocityValueSelf: number = Laya.Vector3.distance(this.rigidbody.linearVelocity, new Laya.Vector3(0, 0, 0));
                if (velocityValueSelf >= Const.GlassFallingBrokenVelocity) {
                    this.broken();
                }
            }
            // target and bullet
            if (inWhiteList) {
                let velocityOther: Laya.Vector3 = (other.getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity.clone();
                let velocityValueSelf: number = Laya.Vector3.distance(this.rigidbody.linearVelocity, new Laya.Vector3(0, 0, 0));
                let velocityValueOther: number = Laya.Vector3.distance(velocityOther, new Laya.Vector3(0, 0, 0));
                if (velocityValueSelf >= Const.GlassBrokenVelocity || velocityValueOther >= Const.GlassBrokenVelocity) {
                    this.broken();
                }
            }
            // certainly broken
            else if (other.name === "ground" || other.name === "bomb") {
                this.broken();
            }
        }
        // TNT
        else if (this.type === Const.TargetType.TNT && this.target.parent) {
            // hit by bullet => bomb
            if (other.name.indexOf("bullet") >= 0 || other.name.indexOf("bomb") >= 0) {
                this.TNTBomb();
            }
            else {
                let rigid: Laya.Rigidbody3D = other.getComponent(Laya.Rigidbody3D);
                let velocityOther = new Laya.Vector3(0, 0, 0);
                rigid && (velocityOther = rigid.linearVelocity.clone());
                if (Laya.Vector3.distance(velocityOther, this.rigidbody.linearVelocity) >= 10 ) {
                    this.TNTBomb();
                }
            }
        }
        
        /** 外物碰撞处理 */
        // stand or guard
        if (other.name === "stand" || other.name.indexOf("Guard") >= 0) {
            // reset win check
            GameScene.instance.winCheckCnt = 0;
        }
        // ground
        else if (other.name === "ground") {
            Laya.timer.frameOnce(60, this, () => {
                // destroy
                this.destroy();
                this.target && this.target.destroy();
            });
        }
        // bullet
        else if (other.name === "bullet" || other.name === "bulletTrigger") {
            this.bulletHit(other.getComponent(Bullet));
        }
        // TNT bomb wave
        else if (other.name === "bomb") {
            let velocity: Laya.Vector3 = new Laya.Vector3();
            Laya.Vector3.subtract(this.target.transform.position, other.transform.position, velocity);
            Laya.Vector3.normalize(velocity, velocity);
            Laya.Vector3.scale(velocity, 20 / other.transform.localScaleX, velocity);
            Laya.Vector3.add(this.rigidbody.linearVelocity, velocity, velocity);
            this.rigidbody.linearVelocity = velocity;
        }

        // reset counter
        this.jumpCnt = 0;
    }

    /** TNT bomb */
    TNTBomb() {
        let bombRadius: number = this.sizeX / 2 * this.target.transform.localScaleX * 1;
        let bomb: Laya.MeshSprite3D = new Laya.MeshSprite3D(Laya.PrimitiveMesh.createSphere(bombRadius));
        GameScene.instance.scene3D.addChild(bomb);
        bomb.name = ("bomb");
        // set rigidbody
        let collider: Laya.PhysicsCollider = bomb.addComponent(Laya.PhysicsCollider);
        collider.colliderShape = new Laya.SphereColliderShape(bombRadius);
        collider.isTrigger = true;
        // 设置碰撞组，避免像玻璃碎片之类过多数量碰撞爆内存
        collider.collisionGroup = 3;
        collider.canCollideWith = 1;
        // set transform
        bomb.transform.position = this.target.transform.position.clone();
        bomb.transform.scale = this.target.transform.scale.clone();
        // set material
        let mat: Laya.UnlitMaterial = new Laya.UnlitMaterial();
        bomb.meshRenderer.material = mat;
        mat.renderMode = Laya.UnlitMaterial.RENDERMODE_TRANSPARENT;
        mat.albedoColor = new Laya.Vector4(1, 0.5, 0, 0.2);
        // 1帧后从场景中移除本体
        // Laya.timer.frameOnce(1, this, () => {
            this.target.removeSelf();
        // });
        // n帧后销毁隐形炸弹
        let cnt: number = 0;
        let scaleStepX: number = bomb.transform.localScaleX * 0.4;
        let scaleStepY: number = bomb.transform.localScaleY * 0.4;
        let scaleStepZ: number = bomb.transform.localScaleZ * 0.4;
        bomb.timer.frameLoop(1, bomb, () => {
            if (cnt++ > 15) {
                bomb.timer.clearAll(bomb);
                bomb.destroy();
                this.target && this.target.destroy();
                this.destroy();
                return;
            }
            bomb.transform.localScaleX += scaleStepX; //*= 1.12;
            bomb.transform.localScaleY += scaleStepY; //*= 1.12;
            bomb.transform.localScaleZ += scaleStepZ; //*= 1.12;
        });
    }

    /** bullet hit handler */
    private bulletHit(bullet: Bullet) {
        /** cannon bullet */
        if (!bullet.isReward) {
            // Frozen
            if (bullet.type === Const.CannonType.FROZEN && this.type !== Const.TargetType.GLASS) {
                this.setType(Const.TargetType.GLASS);
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

        // update counter
        this.jumpCnt++;

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
        if (!this.rigidbody.destroyed && this.rigidbody.isActive == false) {
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
        if (this.type === Const.TargetType.DEFAULT) {
            Laya.Texture2D.load(Const.StageTexUrl[1], Laya.Handler.create(this, (tex) => {
                this.material.albedoTexture = tex;
            }));
            this.material.specularColor = new Laya.Vector4(0, 0, 0, 1);
            this.material.enableEmission = true;
            this.material.emissionColor = new Laya.Vector4(0.1, 0.1, 0.1, 1);
        }
        else if (this.type === Const.TargetType.GLASS) {
            this.material.albedoTexture = null;
            this.material.albedoColor = new Laya.Vector4(0.7, 0.7, 1, 0.7);
            this.material.specularColor = new Laya.Vector4(0, 0, 0, 1);
            this.material.enableEmission = true;
            this.material.emissionColor = new Laya.Vector4(0.2, 0.2, 0.2, 1);
        }
        else if (this.type === Const.TargetType.TNT) {
            // // add TNT trigger for large range bomb check
            // let trigger: Laya.Sprite3D = this.target.addChild(new Laya.Sprite3D("Obstacles-TNT-Trigger")) as Laya.Sprite3D;
            // trigger.addComponent(TriggerTNT);
            Laya.Texture2D.load(Const.StageTexUrl[2], Laya.Handler.create(this, (tex) => {
                this.material.albedoTexture = tex;
            }));
            this.material.specularColor = new Laya.Vector4(0, 0, 0, 1);
            this.material.enableEmission = true;
            this.material.emissionColor = new Laya.Vector4(0.1, 0.1, 0.1, 1);
        }
        this.refreshRenderMode();
    }

    /** set rigidbody */
    private setRigidbody() {
        // get size of bounding box
        let boundingBox: Laya.BoundBox = this.target.meshFilter.sharedMesh.boundingBox.clone();
        // 往下取小一点，避免位置坐标偏差交叠导致物理引擎内存爆炸
        this.sizeX = (boundingBox.max.x - boundingBox.min.x)// * 0.99;
        this.sizeY = (boundingBox.max.y - boundingBox.min.y)// * 0.99;
        this.sizeZ = (boundingBox.max.z - boundingBox.min.z)// * 0.99;
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
            this.rigidbody.mass = 10;
            this.rigidbody.friction = 10;
        }
        else if (this.type === Const.TargetType.TNT) {
            this.rigidbody.mass = 50;
            this.rigidbody.friction = 100;
        }
    }

    /** set target broken */
    private broken() {
        // play broken sound

        // show pieces
        this.effectPiecesBroken();
        // // enlarge velocity
        // let velocity =  this.rigidbody.linearVelocity;
        // velocity.y *= 1.2;
        // this.rigidbody.linearVelocity = velocity;
        // hide target
        Laya.timer.frameOnce(2, this, () => {
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
            let mat: Laya.PBRSpecularMaterial = new Laya.PBRSpecularMaterial();
            mat.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_TRANSPARENT;
            mat.albedoTexture = null;
            mat.albedoColor = new Laya.Vector4(0.7, 0.7, 1, 0.7);
            mat.specularColor = new Laya.Vector4(0, 0, 0, 1);
            mat.enableEmission = true;
            mat.emissionColor = new Laya.Vector4(0.2, 0.2, 0.2, 1);
            piece.meshRenderer.material = mat;

            // set rigidbody
            let pieceRigid: Laya.Rigidbody3D = piece.addComponent(Laya.Rigidbody3D);
            let pieceColliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
            pieceColliderShape.mesh = piece.meshFilter.sharedMesh;
            pieceRigid.colliderShape = pieceColliderShape;
            pieceRigid.collisionGroup = 2;
            pieceRigid.canCollideWith = 1;

            // add pieces to scene
            let pieceNum = Const.PiecesNum - Math.round(Math.random());
            for (let i = 0; i < pieceNum; i++) {
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
            Laya.Vector3.add(velocity, this.rigidbody.linearVelocity, velocity);
            (this.piecesList[idx].getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity = velocity.clone();
            // set hiding effect
            Laya.Tween.to(this.piecesList[idx].transform.localScale, { x: scaleX / 2, y: scaleY / 2, z: scaleZ / 2 }, Const.PiecesBrokenTime / 60 * 1000, Laya.Ease.linearNone);
            Laya.Tween.to(this.piecesList[idx].meshRenderer.material, { albedoColorA: 0 }, Const.PiecesBrokenTime / 60 * 1000, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                this.piecesList[+idx].destroy();
            }));
        }
    }
}