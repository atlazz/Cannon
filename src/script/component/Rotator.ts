import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Rotator extends Laya.Script3D {
    private rotator: Laya.MeshSprite3D;

    private sizeX: number;
    private sizeY: number;
    private sizeZ: number;

    private moveType: string;
    private MaxMoveTimes: number = 30;
    private moveTimes: number = 0;

    constructor() {
        super();
    }

    onAwake() {
        // get sprite
        this.rotator = this.owner as Laya.MeshSprite3D;
        // get size
        let boundingBox: Laya.BoundBox = this.rotator.meshFilter.sharedMesh.boundingBox.clone();
        this.sizeX = boundingBox.max.x - boundingBox.min.x;
        this.sizeY = boundingBox.max.y - boundingBox.min.y;
        this.sizeZ = boundingBox.max.z - boundingBox.min.z;
        // add collider
        let collider: Laya.PhysicsCollider = this.rotator.addComponent(Laya.PhysicsCollider);
        collider.colliderShape = new Laya.BoxColliderShape(this.sizeX, this.sizeY, this.sizeZ);
    }

    setMoveType(moveType: string) {
        this.moveType = moveType;
    }

    onUpdate() {
        // check spirte alive
        if (this.rotator.destroyed) {
            this.destroy();
            return;
        }

        /** 平移 */
        this.moveTimes = (this.moveTimes + 1) % (this.MaxMoveTimes * 2);
        // 位移方向标志
        var flag = Math.floor((this.moveTimes / this.MaxMoveTimes) % 2);
        // X和Y方向平移步进
        var moveStepX: number = this.sizeX * this.rotator.transform.localScaleX / 2 / this.MaxMoveTimes;
        var moveStepY: number = this.sizeY * this.rotator.transform.localScaleY / 2 / this.MaxMoveTimes;
        // Z轴旋转90，X和Y互换
        if (Math.floor((Math.abs(this.rotator.transform.localRotationEulerZ) + 90.5) % 180) === 0) {
            let tmp = moveStepX;
            moveStepX = moveStepY;
            moveStepY = tmp;
        }
        if (this.moveType === "move_left") {
            if (flag) { this.rotator.transform.localPositionX -= moveStepX; }
            else { this.rotator.transform.localPositionX += moveStepX; }
        }
        else if (this.moveType === "move_right") {
            if (flag) { this.rotator.transform.localPositionX += moveStepX; }
            else { this.rotator.transform.localPositionX -= moveStepX; }
        }
        else if (this.moveType === "move_up") {
            if (flag) { this.rotator.transform.localPositionY += moveStepY; }
            else { this.rotator.transform.localPositionY -= moveStepY; }
        }
        else if (this.moveType === "move_down") {
            if (flag) { this.rotator.transform.localPositionY -= moveStepY; }
            else { this.rotator.transform.localPositionY += moveStepY; }
        }
        /** 旋转 */
        // else if (this.moveType === "rotate_left") {
        //     this.rotator.transform.localRotationEulerY = (this.rotator.transform.localRotationEulerY + 1) % 360;
        // }
        // else if (this.moveType === "rotate_right") {
        //     this.rotator.transform.localRotationEulerY = (this.rotator.transform.localRotationEulerY - 1) % 360;
        // }
        // else if (this.moveType === "rotate_up") {
        //     this.rotator.transform.localRotationEulerX = (this.rotator.transform.localRotationEulerX + 1) % 360;
        // }
        // else if (this.moveType === "rotate_down") {
        //     this.rotator.transform.localRotationEulerX = (this.rotator.transform.localRotationEulerX - 1) % 360;
        // }
    }
}