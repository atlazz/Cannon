import * as Const from "../Const";
import GameScene from "../runtime/GameScene";

export default class Cube extends Laya.Script3D {
    private cube: Laya.MeshSprite3D;

    private _type: number = Const.CubeType.DEFAULT;
    private _width: number;

    private isHit: boolean = false;
    private hitPoint: Laya.Vector3;

    private velocityBroken: number = 10;

    private collisionWhiteList: string[] = ["bullet", "cube"];

    /** cube pieces */
    private cubePiecesList: Laya.MeshSprite3D[] = [];
    private cubePiecesPosList: Laya.Vector3[] = [];
    private cubePiecesRotList: Laya.Vector3[] = [];
    private cubePiecesFrameIdx: number = Const.CubeBrokenTime;

    constructor() {
        super();
    }

    onAwake() {
        this.cube = this.owner as Laya.MeshSprite3D;
        this.initCubePieces();
    }

    get type() {
        return this._type;
    }

    set type(v: number) {
        this._type = v;
    }

    get width() {
        return this._width;
    }

    set width(v: number) {
        this._width = v;
    }

    onCollisionEnter(collision: Laya.Collision): void {
        let bullet: Laya.MeshSprite3D = collision.other.owner as Laya.MeshSprite3D;
        let bullet_idx: number = this.collisionWhiteList.indexOf(bullet.name);
        if (bullet_idx >= 0) {
            if (this.type === Const.CubeType.GLASS) {
                // 高速度可击碎
                let velocity: Laya.Vector3 = (bullet.getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity.clone();
                let velocityValue: number = Math.sqrt(Math.pow(velocity.x, 2) + Math.pow(velocity.y, 2) + Math.pow(velocity.z, 2));
                if (velocityValue >= this.velocityBroken) {
                    this.isHit = true;
                    this.hitPoint = (collision.other.owner as Laya.Sprite3D).transform.localPosition.clone();
                }
            }
        }
    }

    onUpdate() {
        if (this.isHit) {
            if (this.type === Const.CubeType.GLASS) {
                this.broken();
            }
        }
    }

    private broken() {
        // play broken sound

        // change to pieces
        this.effectCubeBroken(this.cube.transform.position.clone());
        Laya.timer.frameOnce(1, this, () => {
            this.cube.removeSelf();
        });
    }

    /** init cube pieces */
    private initCubePieces() {
        Laya.Mesh.load(Const.CubePieceResUrl, Laya.Handler.create(this, (mesh) => {
            let cubePiece: Laya.MeshSprite3D = new Laya.MeshSprite3D(mesh);
            let mat: Laya.BlinnPhongMaterial = new Laya.BlinnPhongMaterial();
            mat.renderMode = Laya.BlinnPhongMaterial.RENDERMODE_TRANSPARENT;
            mat.albedoColor = new Laya.Vector4(0.7, 0.7, 1, 0.7);
            cubePiece.meshRenderer.material = mat;
            cubePiece.active = false;

            let pieceRigid: Laya.Rigidbody3D = cubePiece.addComponent(Laya.Rigidbody3D);
            let pieceColliderShape: Laya.MeshColliderShape = new Laya.MeshColliderShape();
            pieceColliderShape.mesh = cubePiece.meshFilter.sharedMesh;
            pieceRigid.colliderShape = pieceColliderShape;

            for (let i = 0; i < Const.CubePiecesNum; i++) {
                this.cubePiecesList.push(cubePiece.clone());
                GameScene.instance.scene3D.addChild(this.cubePiecesList[i]);
                this.cubePiecesPosList.push(new Laya.Vector3());
                this.cubePiecesRotList.push(new Laya.Vector3());
            }
        }));
    }

    /** cube broken to pieces */
    public effectCubeBroken(worldPos: Laya.Vector3) {
        for (let idx in this.cubePiecesList) {
            this.cubePiecesList[idx].active = true;
            this.cubePiecesList[idx].transform.position = worldPos.clone();
            // pos
            this.cubePiecesPosList[idx].x = (Math.random() - 0.5) * 2;
            this.cubePiecesPosList[idx].y = (Math.random() - 0.5) * 2;
            this.cubePiecesPosList[idx].z = (Math.random() - 0.5) * 2;
            Laya.Vector3.scale(this.cubePiecesPosList[idx], 1, this.cubePiecesPosList[idx]);
            // rot
            this.cubePiecesRotList[idx].x = (Math.random() - 0.5) * 2;
            this.cubePiecesRotList[idx].y = (Math.random() - 0.5) * 2;
            this.cubePiecesRotList[idx].z = (Math.random() - 0.5) * 2;
            Laya.Vector3.scale(this.cubePiecesRotList[idx], 90, this.cubePiecesRotList[idx]);
            // size scale
            let rand_scale = (Math.random() * 0.3 + 0.7) * this.width * 2;
            this.cubePiecesList[idx].transform.localScale = new Laya.Vector3(rand_scale, rand_scale, rand_scale);

            (this.cubePiecesList[idx].getComponent(Laya.Rigidbody3D) as Laya.Rigidbody3D).linearVelocity = this.cubePiecesPosList[idx].clone();
        }
        // start looping
        this.cubePiecesFrameIdx = 0;
        Laya.timer.frameLoop(1, this, this.cubePiecesLoop);
    }

    /** cube breaking loop */
    private cubePiecesLoop() {
        let flag = false;
        for (let idx in this.cubePiecesList) {
            if (this.cubePiecesFrameIdx >= Const.CubeBrokenTime) {
                flag = true;
                this.cubePiecesList[+idx].active = false;
            }
        }
        this.cubePiecesFrameIdx++;
        if (flag) {
            Laya.timer.clear(this, this.cubePiecesLoop);
        }
    }
}