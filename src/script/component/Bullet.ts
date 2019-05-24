import GameScene from "../runtime/GameScene";
import * as Const from "../Const"

export default class BulletScript extends Laya.Script3D {
    private bullet: Laya.MeshSprite3D;
    private rigidbody: Laya.Rigidbody3D;
    private material: Laya.PBRSpecularMaterial;

    public type: number = Const.CannonType.DEFAULT;

    private lifetime: number = 120;

    private collisionBlackList: string[] = ["bullet", "player"];

    private flag_active: boolean = false;

    constructor() {
        super();
    }

    onAwake() {
        this.bullet = this.owner as Laya.MeshSprite3D;
        this.rigidbody = this.bullet.getComponent(Laya.Rigidbody3D);
        // new mat: 初始隐身
        this.material = new Laya.PBRSpecularMaterial();
        this.material.renderMode = Laya.PBRSpecularMaterial.RENDERMODE_FADE;
        this.material.albedoColorA = 0;
        this.bullet.meshRenderer.material = this.material;
    }

    onUpdate() {
        // check spirte alive
        if (this.bullet.destroyed) {
            this.destroy();
            return;
        }

        // update lifetime
        this.lifetime--;
        if (this.lifetime < 0) {
            Laya.timer.frameOnce(1, this, () => {
                // update counter
                GameScene.instance.currBulletNum++;
                // destroy
                this.destroy();
                this.bullet.destroy();
            });
        }

        // 超出炮管距离才显示，根据z轴判断
        if(!this.flag_active && this.bullet.transform.position.z < -1) {
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

    // onCollisionEnter(collision: Laya.Collision) {
    // }
}