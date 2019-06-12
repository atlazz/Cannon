import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Treasure extends Laya.Script3D {
    private treasure: Laya.Sprite3D;
    private top: Laya.MeshSprite3D;

    private hitCnt: number = 0;
    private MaxHitCnt: number = 10;

    private frameCnt: number = 0;
    private MaxFrameCnt: number = 90;

    constructor() {
        super();
    }

    onAwake() {
        // get sprite
        this.treasure = this.owner as Laya.Sprite3D;
        this.top = this.treasure.getChildByName("top") as Laya.MeshSprite3D;
    }

    onUpdate() {
        // check spirte alive
        if (this.treasure.destroyed) {
            this.destroy();
            return;
        }

        // win check
        if (this.frameCnt <= this.MaxFrameCnt || this.hitCnt <= this.MaxHitCnt) {
            GameScene.instance.winCheckCnt = 0;
        }
        // top open
        else {
            Laya.timer.frameLoop(1, this.treasure, () => {
                this.top.transform.localRotationEulerX += 1;
                if (this.top.transform.localRotationEulerX > 120) {
                    Laya.timer.clearAll(this.treasure);
                }
            });
        }

        // update
        this.frameCnt++;
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
        if (other.name === "bullet") {
            this.hitCnt++;
        }
    }
}