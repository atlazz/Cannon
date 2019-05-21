import GameScene from "../runtime/GameScene";

export default class BulletScript extends Laya.Script3D {
    private bullet: Laya.MeshSprite3D;
    private rigidbody: Laya.Rigidbody3D;

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

    // onCollisionEnter(collision: Laya.Collision) {
    // }
}