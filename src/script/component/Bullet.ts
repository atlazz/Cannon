import GameScene from "../runtime/GameScene";
import * as Const from "../Const"

export default class BulletScript extends Laya.Script3D {
    private bullet: Laya.MeshSprite3D;
    private rigidbody: Laya.Rigidbody3D;

    public type: number = Const.BulletType.DEFAULT;

    private lifetime: number = 120;

    private collisionBlackList: string[] = ["bullet", "player"];

    constructor() {
        super();
    }

    onAwake() {
        this.bullet = this.owner as Laya.MeshSprite3D;
        this.rigidbody = this.bullet.getComponent(Laya.Rigidbody3D);
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
                this.bullet.removeSelf();
                this.destroy();
            });
        }
    }

    /** set material by type */
    setType(type: number) {
        this.type = type;
        if (this.type === Const.BulletType.DEFAULT) {
            let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
            mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            mat.albedoColor = new Laya.Vector4(1, 0.7, 1, 0.7);
            this.bullet.meshRenderer.material = mat;
        }
        else if (this.type === Const.BulletType.FROZEN) {
            let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
            mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            mat.albedoColor = new Laya.Vector4(0.2, 0.2, 1, 0.7);
            this.bullet.meshRenderer.material = mat;
        }
    }

    // onCollisionEnter(collision: Laya.Collision) {
    // }
}