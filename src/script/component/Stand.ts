import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Stand extends Laya.Script3D {
    private stand: Laya.MeshSprite3D;

    private isWinCheck: boolean = false;
    private winCount: number = 0;

    private collisionBlackList: string[] = ["stand", "bullet", "piece"];

    constructor() {
        super();
    }

    onAwake() {
        this.stand = this.owner as Laya.MeshSprite3D;
        this.isWinCheck = false;
    }

    onUpdate() {
        // check spirte alive
        if (this.stand.destroyed) {
            this.destroy();
            return;
        }

        /** win check */
        this.winCount++;
        if (!this.isWinCheck && this.winCount > Const.WinCheckTime) {
            GameScene.instance.standClearCnt++;
            this.isWinCheck = true;
        }
    }

    onCollisionStay(collision: Laya.Collision): void {
        if (this.collisionBlackList.indexOf(collision.other.owner.name) < 0) {
            this.winCount = 0;

            // 避免空台子判断后台子上有掉落物体
            if (this.isWinCheck) {
                GameScene.instance.standClearCnt--;
                this.isWinCheck = false;
            }
        }
    }
}