
export default class BulletScript extends Laya.Script3D {
    private bullet: Laya.MeshSprite3D;

    private lifetime: number = 120;

    private collisionBlackList: string[] = ["bullet", "player"];

    constructor() {
        super();
    }

    onAwake() {
        this.bullet = this.owner as Laya.MeshSprite3D;
    }

    onUpdate() {
        // update lifetime
        this.lifetime--;
        if (this.lifetime < 0) {
            Laya.timer.frameOnce(1, this, () => {
                this.bullet.removeSelf();
                this.destroy();
            });
        }
    }

    // onCollisionEnter(collision: Laya.Collision) {
    // }
}