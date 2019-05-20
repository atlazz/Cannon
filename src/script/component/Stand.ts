import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Stand extends Laya.Script3D {
    private stand: Laya.MeshSprite3D;

    private winCount: number = 0;

    private collisionBlackList: string[] = ["stand", "bullet", "piece"];

    constructor() {
        super();
    }

    onAwake() {
        this.stand = this.owner as Laya.MeshSprite3D;
    }

    onUpdate() {
        // check spirte alive
        if (this.stand.destroyed) {
            this.destroy();
            return;
        }

        /** win check */
        this.winCount++;
        if (this.winCount > Const.WinCheckTime) {
            console.log("You win. Stage: " + GameScene.instance.stageIdx);
            GameScene.instance.nextStage();
            this.destroy();
        }
    }

    onCollisionStay(collision: Laya.Collision): void {
        if (this.collisionBlackList.indexOf(collision.other.owner.name) < 0) {
            this.winCount = 0;
        }
    }
}