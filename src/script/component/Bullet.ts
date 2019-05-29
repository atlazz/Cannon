import GameScene from "../runtime/GameScene";
import * as Const from "../Const"

export default class BulletScript extends Laya.Script3D {
    public bullet: Laya.MeshSprite3D;
    public rigidbody: Laya.Rigidbody3D;
    public material: Laya.PBRSpecularMaterial;
    public effect: Laya.Sprite3D;

    public isReward: boolean;
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

    reset(type: number, isReward: boolean = false) {
        this.bullet = this.owner as Laya.MeshSprite3D;

        /** set property */
        this.isReward = isReward;
        this.type = type;
        this.effect = this.bullet.getChildByName("effect") as Laya.Sprite3D;
        this.lifetime = 120;
        if (this.isReward && this.type === Const.BulletRewardType.BLACKHOLE) {
            this.lifetime = 400;
        }
        this.flag_active = false;

        /** initialize */
        if (this.rigidbody === undefined) {
            this.init();
        }

        /** set material: 初始隐身 */
        this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_FADE;
        this.material.albedoColorA = 0;
        this.effect && (this.effect.active = false);

        /** set trasform */
        this.bullet.transform.localPosition = GameScene.instance.turretInitPos.clone();
        this.bullet.transform.localRotationEuler = Const.StageInitRot.clone();
        Laya.Vector3.scale(new Laya.Vector3(1, 1, 1), Const.BulletScale[+this.isReward][this.type], this.bullet.transform.localScale);
        this.effect && (Laya.Vector3.scale(this.effect.transform.localScale, 1 / Const.BulletScale[+this.isReward][this.type], this.effect.transform.localScale));

        /** set physics */
        // trigger
        this.rigidbody.isTrigger = Const.BulletTrigger[+this.isReward][this.type];
        // quick moving detecion
        this.rigidbody.ccdMotionThreshold = 0.001;
        // 半径越小越精准
        this.rigidbody.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[+this.isReward][this.type];
        // mass
        this.rigidbody.mass = Const.BulletMass[+this.isReward][this.type];
        // velocity
        let velocity: Laya.Vector3 = GameScene.instance.bulletDirection.clone();
        Laya.Vector3.scale(velocity, Const.BulletVelocity[+this.isReward][this.type], velocity);
        this.rigidbody.linearVelocity = velocity.clone();
        // gravity
        this.rigidbody.overrideGravity = Const.BulletOverrideGravity[+this.isReward][this.type];
        if (this.rigidbody.overrideGravity) {
            this.rigidbody.gravity = new Laya.Vector3(0, 0, 0);
        }

        // bullet trigger handle
        if (this.bullet.name === "bulletTrigger") {
            this.rigidbody.isTrigger = true;
            // quick moving detecion
            this.rigidbody.ccdMotionThreshold = 0.001;
            // 半径越小越精准
            this.rigidbody.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[+this.isReward][this.type] / 1000;
        }
    }

    onCollisionExit(collision: Laya.Collision) {
        if (this.bullet.name === "bulletTrigger") {
            this.recover();
        }
    }

    onTriggerEnter(other: Laya.PhysicsComponent): void {
        this.triggerHandler(other);
    }

    private triggerHandler(other: Laya.PhysicsComponent) {
        /** reward bullet */
        if (this.isReward) {
            /** black hole */
            if (this.type === Const.BulletRewardType.BLACKHOLE) {
                let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
                if (otherSp.name === "stand" || otherSp.name.indexOf("Guard") >= 0 || otherSp.name.indexOf("Obstacle") >= 0) {
                    otherSp.timer.frameOnce(1, this, () => {
                        otherSp.getComponent(Laya.PhysicsCollider) && otherSp.getComponent(Laya.PhysicsCollider).destroy();
                        otherSp.getComponent(Laya.Rigidbody3D) && otherSp.getComponent(Laya.Rigidbody3D).destroy();
                    });
                    // 消失动画
                    let cnt: number = 0;
                    let MaxCnt: number = 90;
                    let scaleStepX = otherSp.transform.localScaleX / MaxCnt;
                    let scaleStepY = otherSp.transform.localScaleY / MaxCnt;
                    let scaleStepZ = otherSp.transform.localScaleZ / MaxCnt;
                    let rotStepX = Math.random() * 3;
                    let rotStepY = Math.random() * 3;
                    let rotStepZ = Math.random() * 3;
                    otherSp.timer.frameLoop(1, otherSp, () => {
                        if (cnt++ > MaxCnt) {
                            otherSp.timer.clearAll(otherSp);
                            otherSp.destroy();
                            return;
                        }
                        // scale
                        otherSp.transform.localScaleX -= scaleStepX;
                        otherSp.transform.localScaleY -= scaleStepY;
                        otherSp.transform.localScaleZ -= scaleStepZ;
                        // position
                        otherSp.transform.localPositionX -= (this.bullet.transform.position.x - otherSp.transform.position.x) / MaxCnt / otherSp.transform.scale.x;
                        otherSp.transform.localPositionY += (this.bullet.transform.position.y - otherSp.transform.position.y) / MaxCnt / otherSp.transform.scale.y;
                        otherSp.transform.localPositionZ -= (this.bullet.transform.position.z - otherSp.transform.position.z) / MaxCnt / otherSp.transform.scale.z;
                        // rotation
                        otherSp.transform.localRotationEulerX += rotStepX;
                        otherSp.transform.localRotationEulerY += rotStepY;
                        otherSp.transform.localRotationEulerZ += rotStepZ;
                    });
                }
            }
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
            this.flag_active = true;
            this.refreshMaterial();
            this.effect && (this.effect.active = true);
        }

        // 特效节点角度摆正
        if (this.effect && !this.rigidbody.isTrigger) {
            this.effect.transform.localRotationEulerX = -this.bullet.transform.localRotationEulerX;
            this.effect.transform.localRotationEulerY = -this.bullet.transform.localRotationEulerY;
            this.effect.transform.localRotationEulerZ = -this.bullet.transform.localRotationEulerZ;
        }
    }

    /** refresh material by type */
    private refreshMaterial() {
        if (!this.isReward) {
            if (this.type === Const.CannonType.DEFAULT) {
                this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
                this.material.albedoColor = new Laya.Vector4(1, 0, 0, 1);
            }
            else if (this.type === Const.CannonType.FROZEN) {
                this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_TRANSPARENT;
                this.material.albedoColor = new Laya.Vector4(0.2, 0.2, 1, 0.7);
            }
        }
    }

    /** recover */
    private recover() {
        if (!this.isReward) {
            Laya.timer.frameOnce(1, this, () => {
                // clean physics force
                this.rigidbody.clearForces();
                // remove reward effect
                this.bullet.removeChildByName("effect");
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
        else {
            Laya.timer.frameOnce(1, this, () => {
                this.destroy();
            });
        }
    }
}