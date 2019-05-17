import * as Const from "../Const";

export default class Platform extends Laya.Script3D {
    private platform: Laya.MeshSprite3D;

    private winCount: number = 0;

    private collisionWhiteList: string[] = ["cube"];

    constructor() {
        super();
    }

    onAwake() {
        this.platform = this.owner as Laya.MeshSprite3D;
    }

    onUpdate() {
        this.winCount++;
        if (this.winCount > Const.WinCheckTime) {
            // player win
            console.log("You win.")
        }
    }

    onCollisionStay(collision: Laya.Collision): void {
        if (this.collisionWhiteList.indexOf(collision.other.owner.name) >= 0) {
            this.winCount = 0;
        }
    }
}