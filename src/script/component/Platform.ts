import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Platform extends Laya.Script3D {
    private platform: Laya.MeshSprite3D;

    private winCount: number = 0;

    private collisionBlackList: string[] = ["platform", "bullet", "piece"];

    constructor() {
        super();
    }

    onAwake() {
        this.platform = this.owner as Laya.MeshSprite3D;
    }

    onUpdate() {
        /** win check */
        this.winCount++;
        if (this.winCount > Const.WinCheckTime) {
            GameScene.instance.state = 1;
            console.log("You win.")
        }
    }

    onCollisionStay(collision: Laya.Collision): void {
        if (this.collisionBlackList.indexOf(collision.other.owner.name) < 0) {
            this.winCount = 0;
        }
    }
}