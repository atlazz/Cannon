import GameScene from "../runtime/GameScene";
import * as Const from "../Const"

export default class BulletScript extends Laya.Script3D {
    private bullet: Laya.MeshSprite3D;
    private rigidbody: Laya.Rigidbody3D;
    private material: Laya.PBRSpecularMaterial;

    public type: number;

    private lifetime: number;
    private flag_active: boolean;

    private collisionBlackList: string[] = ["bullet", "player"];

    constructor() {
        super();
    }

    onAwake() {
        if (!this.bullet) {
            this.bullet = this.owner as Laya.MeshSprite3D;
        }
    }

    private init() {
        // add rigidbody
        this.rigidbody = this.bullet.addComponent(Laya.Rigidbody3D);
        this.rigidbody.colliderShape = new Laya.SphereColliderShape(Const.BulletRadius);
        // add material
        this.material = new Laya.PBRSpecularMaterial();
        this.bullet.meshRenderer.material = this.material;
    }

    reset(type: number) {
        this.bullet = this.owner as Laya.MeshSprite3D;

        /** initialize */
        if (this.rigidbody === undefined) {
            this.init();
        }

        /** reset property */
        this.type = type;
        this.lifetime = 120;
        this.flag_active = false;

        /** reset material: 初始隐身 */
        this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_FADE;
        this.material.albedoColorA = 0;

        /** reset trasform */
        this.bullet.transform.localPosition = GameScene.instance.turretInitPos.clone();
        Laya.Vector3.scale(new Laya.Vector3(1, 1, 1), Const.BulletScale[this.type], this.bullet.transform.localScale);

        /** reset physics */
        // quick moving detecion
        this.rigidbody.ccdMotionThreshold = 0.001;
        // 半径越小越精准
        this.rigidbody.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[this.type];
        // mass
        this.rigidbody.mass = Const.BulletMass[this.type];
        // velocity
        let velocity: Laya.Vector3 = GameScene.instance.bulletDirection.clone();
        Laya.Vector3.scale(velocity, Const.BulletVelocity[this.type], velocity);
        this.rigidbody.linearVelocity = velocity.clone();

        // bullet trigger handle
        if (this.bullet.name === "bulletTrigger") {
            this.rigidbody.isTrigger = true;
            // quick moving detecion
            this.rigidbody.ccdMotionThreshold = 0.001;
            // 半径越小越精准
            this.rigidbody.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[this.type] / 1000;
        }
    }

    onCollisionExit(collision: Laya.Collision) {
        if (this.bullet.name === "bulletTrigger") {
            this.recover();
        }
    }

    onUpdate() {
        // update lifetime
        this.lifetime--;
        if (this.lifetime < 0) {
            this.recover();
        }

        // 超出炮管距离才显示，根据z轴判断
        if (this.bullet.name === "bullet" && !this.flag_active && this.bullet.transform.position.z < -1) {
            this.refreshMaterial();
            this.flag_active = true;
        }
    }

    /** refresh material by type */
    private refreshMaterial() {
        if (this.type === Const.CannonType.DEFAULT) {
            this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
            this.material.albedoColor = new Laya.Vector4(1, 0, 0, 1);
        }
        else if (this.type === Const.CannonType.FROZEN) {
            this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_TRANSPARENT;
            this.material.albedoColor = new Laya.Vector4(0.2, 0.2, 1, 0.7);
        }
    }

    /** recover */
    private recover() {
        Laya.timer.frameOnce(1, this, () => {
            // recover to pool
            this.bullet.removeSelf();
            if (this.bullet.name === "bulletTrigger") {
                Laya.Pool.recover("bulletTrigger", this.bullet);
            }
            else {
                Laya.Pool.recover("bullet", this.bullet);
            }
        });
    }
}