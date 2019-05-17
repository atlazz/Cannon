
export default class BulletScript extends Laya.Script3D {
    private bullet: Laya.MeshSprite3D;

    private lifetime: number = 120;

    /** 子弹射击速度 */
    public velocityV3: Laya.Vector3 = new Laya.Vector3();
    /** 子弹速度缩放值 */
    private velocityScale: number;

    public power: number = 10;

    /** 碰撞检测黑名单 */
    private collisionBlackList: string[] = ["bullet", "player"];

    constructor() {
        super();
    }

    onAwake() {
        this.bullet = this.owner as Laya.MeshSprite3D;
    }

    /** 设置子弹射击方向并计算速度 */
    public setDirection(origin: Laya.Vector3, direction: Laya.Vector3): void {
        /****
         * 注：
         * 三维向量即是位置、方向，也可以是速度，但速度需要一个统一的参考衡量标准，比如“N*标准速度值/帧”或
         * “N*标准速度值/毫秒”，它类似于“N*米/帧”。
         * 而我们得到的方向向量，它的大小不一，无法作为标准速度值使用，这个时候可用Vector3.normalize()方法
         * 把任一向量归一化，产生单位为一的向量作为标准速度值，再把它进行缩放作为不同物体的速度来使用，比如
         * 0.2倍标准速度值，1.5倍标准速度值等，可使用Vector3.scale()方法缩放。
         ****/
        // normalize direction
        Laya.Vector3.normalize(direction, this.velocityV3);
        // set velocity
        this.velocityScale = 0.08;
        Laya.Vector3.scale(this.velocityV3, this.velocityScale, this.velocityV3);
    }

    onUpdate() {
        //子弹位置更新
        this.bullet.transform.translate(this.velocityV3, false);
        //生命周期递减
        this.lifetime--;
        //生命周期结束后，一帧后销毁子弹
        if (this.lifetime < 0) {
            Laya.timer.frameOnce(1, this, () => {
                this.bullet.removeSelf();
            });
        }
    }

    /**
     * 当其他碰撞器进入绑定物体碰撞器时触发（子弹击中物品时）
     * 注：如相对移动速度过快，可能直接越过
     */
    public onTriggerEnter(other: Laya.PhysicsComponent): void {
        let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
        if (this.collisionBlackList.indexOf(otherSp.name) < 0) {
            console.log("bullet trigger enter: " + otherSp.name);
            Laya.timer.frameOnce(1, this, function () { this.bullet.removeSelf(); });
        }
    }

    // public onCollisionEnter(collision: Laya.Collision) {
    // }

    /**
     * 当其他碰撞器进入绑定物体碰撞器后逐帧触发（子弹进入物品时）
     * 注：如相对移动速度过快，可能直接越过
     */
    public onTriggerStay(other: Laya.PhysicsComponent): void {
        let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
        // console.log("bullet trigger stay")
        // console.log(otherSp)
    }
    /**
     * 当其他碰撞器退出绑定物体碰撞器时逐帧触发（子弹穿出物品时）
     * 注：如相对移动速度过快，可能直接越过
     */
    public onTriggerExit(other: Laya.PhysicsComponent): void {
        let otherSp: Laya.MeshSprite3D = other.owner as Laya.MeshSprite3D;
        // console.log("bullet trigger exit")
        if (this.collisionBlackList.indexOf(otherSp.name) < 0) {
            //一帧后销毁子弹
            Laya.timer.frameOnce(1, this, function () { this.bullet.removeSelf(); });
        }
    }

    public broken() {
        this.bullet.removeSelf();
    }
}