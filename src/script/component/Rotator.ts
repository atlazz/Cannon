import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Rotator extends Laya.Script3D {
    private stageIdx: number;

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
        // record game stage index
        this.stageIdx = GameScene.instance.stageIdx;
        // get sprite
        this.rotator = this.owner as Laya.MeshSprite3D;
        // add collider
        let collider: Laya.PhysicsCollider = this.rotator.addComponent(Laya.PhysicsCollider);
        let colliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
        colliderShape.mesh = this.rotator.meshFilter.sharedMesh;
        collider.colliderShape = colliderShape;
        // get size
        let boundingBox: Laya.BoundBox = this.rotator.meshFilter.sharedMesh.boundingBox.clone();
        this.sizeX = boundingBox.max.x - boundingBox.min.x;
        this.sizeY = boundingBox.max.y - boundingBox.min.y;
        this.sizeZ = boundingBox.max.z - boundingBox.min.z;

        this.sizeX *= 3;
        this.sizeY *= 3;
    }

    setMoveType(moveType: string) {
        this.moveType = moveType;
    }

    onUpdate() {
        // check stage
        if (this.stageIdx !== GameScene.instance.stageIdx) {
            console.log("rotator destroyed.")
            this.destroy();
            return;
        }

        this.moveTimes = (this.moveTimes + 1) % (this.MaxMoveTimes * 2);
        var flag = Math.floor((this.moveTimes / this.MaxMoveTimes) % 2);
        if (this.moveType === "move_left") {
            if (flag) { this.rotator.transform.localPositionX -= this.sizeX / this.MaxMoveTimes; }
            else { this.rotator.transform.localPositionX += this.sizeX / this.MaxMoveTimes; }
        }
        else if (this.moveType === "move_right") {
            if (flag) { this.rotator.transform.localPositionX += this.sizeX / this.MaxMoveTimes; }
            else { this.rotator.transform.localPositionX -= this.sizeX / this.MaxMoveTimes; }
        }
        else if (this.moveType === "move_up") {
            if (flag) { this.rotator.transform.localPositionY += this.sizeY / this.MaxMoveTimes; }
            else { this.rotator.transform.localPositionY -= this.sizeY / this.MaxMoveTimes; }
        }
        else if (this.moveType === "move_down") {
            if (flag) { this.rotator.transform.localPositionY -= this.sizeY / this.MaxMoveTimes; }
            else { this.rotator.transform.localPositionY += this.sizeY / this.MaxMoveTimes; }
        }
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