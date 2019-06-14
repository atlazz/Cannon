import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Guard extends Laya.Script3D {
    private guard: Laya.MeshSprite3D;

    private sizeX: number;
    private sizeY: number;
    private sizeZ: number;

    private MaxMoveTimes: number;
    private moveTimes: number = 0;

    private flag_move: boolean;
    private moveStepX: number;
    private moveStepY: number;

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
        // add material
        let material: Laya.PBRSpecularMaterial = new Laya.PBRSpecularMaterial();
        Laya.Texture2D.load(Const.StageTexUrl[0], Laya.Handler.create(this, (tex) => {
            material.albedoTexture = tex;
        }));
        material.specularColor = new Laya.Vector4(0, 0, 0, 1);
        material.enableEmission = true;
        material.emissionColor = new Laya.Vector4(0.2, 0.2, 0.2, 1);
        this.guard.meshRenderer.material = material;

        /** 平移参数设置 */
        // 全屏水平移动
        if (this.guard.name.search("move_x") >= 0) {
            this.MaxMoveTimes = 120;
            this.moveStepY = 0;
            // 旋转了90度
            if (Math.floor((Math.abs(this.guard.transform.localRotationEulerZ) + 90.5) % 180) === 0) {
                this.moveStepX = this.guard.transform.localPositionY * 2 / this.MaxMoveTimes;
            } else {
                this.moveStepX = this.guard.transform.localPositionX * 2 / this.MaxMoveTimes;
            }
        }
        // 全屏纵向移动
        else if (this.guard.name.search("move_y") >= 0) {
            this.MaxMoveTimes = 120;
            this.moveStepX = 0;
            // 旋转了90度
            if (Math.floor((Math.abs(this.guard.transform.localRotationEulerZ) + 90.5) % 180) === 0) {
                this.moveStepY = this.guard.transform.localPositionX * 2 / this.MaxMoveTimes;
            } else {
                this.moveStepY = this.guard.transform.localPositionY * 2 / this.MaxMoveTimes;
            }
        }
        // 半屏移动
        else if (this.guard.name.search("move_") >= 0) {
            this.MaxMoveTimes = 60;
            // X和Y方向平移步进
            let stepX: number = this.sizeX * this.guard.transform.localScaleX / 2 / this.MaxMoveTimes;
            let stepY: number = this.sizeY * this.guard.transform.localScaleY / 2 / this.MaxMoveTimes;
            // Z轴旋转90，X和Y互换
            if (Math.floor((Math.abs(this.guard.transform.localRotationEulerZ) + 90.5) % 180) === 0) {
                let tmp = stepX;
                stepX = stepY;
                stepY = tmp;
            }

            if (this.guard.name.search("move_left") >= 0) {
                this.moveStepX = -stepX;
                this.moveStepY = 0;
            }
            else if (this.guard.name.search("move_right") >= 0) {
                this.MaxMoveTimes = 60;
                this.moveStepX = stepX;
                this.moveStepY = 0;
            }
            else if (this.guard.name.search("move_up") >= 0) {
                this.MaxMoveTimes = 60;
                this.moveStepX = 0;
                this.moveStepY = -stepY;
            }
            else if (this.guard.name.search("move_down") >= 0) {
                this.MaxMoveTimes = 60;
                this.moveStepX = 0;
                this.moveStepY = stepY;
            }
        }
    }

    onUpdate() {
        // check spirte alive
        if (this.guard.destroyed) {
            this.destroy();
            return;
        }

        /** 平移 */
        if (this.guard.name.search("move") >= 0) {
            // update
            this.moveTimes = (this.moveTimes + 1) % (this.MaxMoveTimes * 2);
            this.flag_move = Math.floor((this.moveTimes / this.MaxMoveTimes) % 2) > 0;
            if (this.flag_move) {
                this.guard.transform.localPositionX += this.moveStepX;
                this.guard.transform.localPositionY += this.moveStepY;
            }
            else {
                this.guard.transform.localPositionX -= this.moveStepX;
                this.guard.transform.localPositionY -= this.moveStepY;
            }
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