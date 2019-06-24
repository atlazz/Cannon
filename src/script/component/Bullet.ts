import GameScene from "../runtime/GameScene";
import * as Const from "../Const"
import Target from "./Target";
import Guard from "./Guard";

export default class BulletScript extends Laya.Script3D {
    public bullet: Laya.MeshSprite3D;
    public rigidbody: Laya.Rigidbody3D;
    public material: Laya.PBRSpecularMaterial;
    public effect: Laya.Sprite3D;

    public isReward: boolean = false;
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
            this.lifetime = 300;
        }
        this.flag_active = false;

        /** initialize */
        if (this.rigidbody === undefined) {
            this.init();
        }

        /** set material: 初始隐身 */
        this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_FADE;
        this.material.albedoColorA = 0;
        if (!this.isReward) {
            Laya.Texture2D.load(Const.BulletTextureUrl[this.type], Laya.Handler.create(this, (tex) => {
                this.material.albedoTexture = tex;
            }));
        }
        this.effect && (this.effect.active = false);

        /** set transform */
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
        this.rigidbody.linearVelocity = velocity;
        // gravity
        this.rigidbody.overrideGravity = Const.BulletOverrideGravity[+this.isReward][this.type];
        if (this.rigidbody.overrideGravity) {
            this.rigidbody.gravity = new Laya.Vector3(0, 0, 0);
        }
        
        this.rigidbody.canCollideWith = 1;
        this.rigidbody.collisionGroup = 4;

        // bullet trigger handle
        if (this.bullet.name === "bulletTrigger") {
            this.rigidbody.isTrigger = true;
            // 避免子弹以及隐形子弹碰撞检测
            this.rigidbody.collisionGroup = 5;
            // quick moving detecion
            this.rigidbody.ccdMotionThreshold = 0.0001;
            // 半径越小越精准
            this.rigidbody.ccdSweptSphereRadius = Const.BulletRadius * Const.BulletScale[+this.isReward][this.type] / 1000;
        }
    }

    onTriggerEnter(other: Laya.PhysicsComponent): void {
        // console.log("onTriggerEnter", this.bullet.name)
        this.triggerHandler(other);
    }

    onTriggerExit(other: Laya.PhysicsComponent): void {
        // console.log("onTriggerExit", this.bullet.name)
        if (this.bullet.name === "bulletTrigger") {
            this.recover();
        }
    }

    private triggerHandler(other: Laya.PhysicsComponent) {
        /** 宝箱处理 */
        if (other.owner.name === "bottom") {
            if (!GameScene.instance) return;
            // 超时直接胜利
            if (GameScene.instance.treasureFrameCnt >= 400) {
                GameScene.instance.treasureHitCnt = GameScene.instance.treasereMaxHitCnt;
            }
            // 击中宝箱处理
            if (GameScene.instance.treasureHitState === 0) {
                GameScene.instance.treasureHitState = 1;
            }
            GameScene.instance.isTreasureMoveStart = true;
            GameScene.instance.isTreasureHit = true;
            GameScene.instance.treasureHitCnt++;
            this.recover();
        }
        /** reward bullet */
        if (this.isReward) {
            /** black hole */
            if (this.type === Const.BulletRewardType.BLACKHOLE) {
                GameScene.instance.isStageStart = true;
                let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
                if (otherSp.name === "stand" || otherSp.name.indexOf("Guard") >= 0 || otherSp.name.indexOf("Obstacle") >= 0) {
                    otherSp.timer.frameOnce(1, this, () => {
                        otherSp.getComponent(Laya.PhysicsCollider) && otherSp.getComponent(Laya.PhysicsCollider).destroy();
                        otherSp.getComponent(Laya.Rigidbody3D) && otherSp.getComponent(Laya.Rigidbody3D).destroy();
                        otherSp.getComponent(Target) && otherSp.getComponent(Target).destroy();
                        otherSp.getComponent(Guard) && otherSp.getComponent(Guard).destroy();
                    });
                    // 消失动画
                    let cnt: number = 0;
                    let MaxCnt: number = 120;
                    let scaleStepX = otherSp.transform.localScaleX / MaxCnt;
                    let scaleStepY = otherSp.transform.localScaleY / MaxCnt;
                    let scaleStepZ = otherSp.transform.localScaleZ / MaxCnt;
                    let posStepX = (this.bullet.transform.position.x - otherSp.transform.position.x) / MaxCnt / GameScene.instance.gameStage.transform.scale.x;
                    let posStepY = (this.bullet.transform.position.y - otherSp.transform.position.y) / MaxCnt / GameScene.instance.gameStage.transform.scale.y;
                    let posStepZ = (this.bullet.transform.position.z - otherSp.transform.position.z) / MaxCnt / GameScene.instance.gameStage.transform.scale.z;
                    let rotStepX = Math.random() * 5;
                    let rotStepY = Math.random() * 5;
                    let rotStepZ = Math.random() * 5;
                    otherSp.timer.frameLoop(1, otherSp, () => {
                        if (cnt++ > MaxCnt / 2) {
                            otherSp.timer.clearAll(otherSp);
                            otherSp.destroy();
                            return;
                        }
                        // scale
                        otherSp.transform.localScaleX -= scaleStepX;
                        otherSp.transform.localScaleY -= scaleStepY;
                        otherSp.transform.localScaleZ -= scaleStepZ;
                        // position
                        otherSp.transform.localPositionX -= posStepX;
                        otherSp.transform.localPositionY += posStepY;
                        otherSp.transform.localPositionZ -= posStepZ;
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
            this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_OPAQUE;
            this.material.albedoColorA = 1;
        }
    }

    /** recover */
    recover() {
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
                this.bullet.destroy();
                this.destroy();
            });
        }
    }
}