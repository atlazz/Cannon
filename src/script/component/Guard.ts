import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Guard extends Laya.Script3D {
    private guard: Laya.MeshSprite3D;

    private initPos: Laya.Vector3;

    private sizeX: number;
    private sizeY: number;
    private sizeZ: number;

    private MaxMoveTimes: number = 60;
    private moveTimes: number = 0;

    constructor() {
        super();
    }

    onAwake() {
        // get sprite
        this.guard = this.owner as Laya.MeshSprite3D;
        // get size
        let boundingBox: Laya.BoundBox = this.guard.meshFilter.sharedMesh.boundingBox.clone();
        this.sizeX = boundingBox.max.x - boundingBox.min.x;
        this.sizeY = boundingBox.max.y - boundingBox.min.y;
        this.sizeZ = boundingBox.max.z - boundingBox.min.z;
        // add collider
        let collider: Laya.PhysicsCollider = this.guard.addComponent(Laya.PhysicsCollider);
        collider.colliderShape = new Laya.BoxColliderShape(this.sizeX, this.sizeY, this.sizeZ);
        // record init pos
        this.initPos = this.guard.transform.localPosition.clone();
    }

    onUpdate() {
        // check spirte alive
        if (this.guard.destroyed) {
            this.destroy();
            return;
        }

        /** 平移 */
        this.moveTimes = (this.moveTimes + 1) % (this.MaxMoveTimes * 2);
        // 位移方向标志
        var flag = Math.floor((this.moveTimes / this.MaxMoveTimes) % 2);
        // X和Y方向平移步进
        var moveStepX: number = this.sizeX * this.guard.transform.localScaleX / 2 / this.MaxMoveTimes;
        var moveStepY: number = this.sizeY * this.guard.transform.localScaleY / 2 / this.MaxMoveTimes;
        // Z轴旋转90，X和Y互换
        if (Math.floor((Math.abs(this.guard.transform.localRotationEulerZ) + 90.5) % 180) === 0) {
            let tmp = moveStepX;
            moveStepX = moveStepY;
            moveStepY = tmp;
        }
        
        // 全屏水平移动
        if (this.guard.name.search("move_x") >= 0) {
            this.MaxMoveTimes = 120;
            moveStepX = this.initPos.x * 2 / this.MaxMoveTimes;
            flag = Math.floor((this.moveTimes / this.MaxMoveTimes) % 2);
            if (flag) { this.guard.transform.localPositionX += moveStepX; }
            else { this.guard.transform.localPositionX -= moveStepX; }
        }
        // 全屏纵向移动
        else if (this.guard.name.search("move_y") >= 0) {
            this.MaxMoveTimes = 120;
            moveStepY = this.initPos.y * 2 / this.MaxMoveTimes;
            flag = Math.floor((this.moveTimes / this.MaxMoveTimes) % 2);
            if (flag) { this.guard.transform.localPositionY += moveStepY; }
            else { this.guard.transform.localPositionY -= moveStepY; }
        }
        // 半屏移动
        else if (this.guard.name.search("move_left") >= 0) {
            if (flag) { this.guard.transform.localPositionX -= moveStepX; }
            else { this.guard.transform.localPositionX += moveStepX; }
        }
        else if (this.guard.name.search("move_right") >= 0) {
            if (flag) { this.guard.transform.localPositionX += moveStepX; }
            else { this.guard.transform.localPositionX -= moveStepX; }
        }
        else if (this.guard.name.search("move_up") >= 0) {
            if (flag) { this.guard.transform.localPositionY -= moveStepY; }
            else { this.guard.transform.localPositionY += moveStepY; }
        }
        else if (this.guard.name.search("move_down") >= 0) {
            if (flag) { this.guard.transform.localPositionY += moveStepY; }
            else { this.guard.transform.localPositionY -= moveStepY; }
        }

        /** 旋转 */
        else if (this.guard.name.search("rotate_left") >= 0) {
            this.guard.transform.localRotationEulerY = (this.guard.transform.localRotationEulerY + 1) % 360;
        }
        else if (this.guard.name.search("rotate_right") >= 0) {
            this.guard.transform.localRotationEulerY = (this.guard.transform.localRotationEulerY - 1) % 360;
        }
        else if (this.guard.name.search("rotate_up") >= 0) {
            this.guard.transform.localRotationEulerX = (this.guard.transform.localRotationEulerX + 1) % 360;
        }
        else if (this.guard.name.search("rotate_down") >= 0) {
            this.guard.transform.localRotationEulerX = (this.guard.transform.localRotationEulerX - 1) % 360;
        }
    }
}