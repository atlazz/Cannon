/** version */
export const VERSION = "1.0.0";

/** pages */
export const URL_HomeView: string = "home/HomeView.scene";
export const URL_GameScene: string = "game/GameScene.scene";
export const URL_OverView: string = "over/OverView.scene";
export const URL_ReviveView: string = "dialog/ReviveView.scene";

/** camera */
export const CameraInitPos: Laya.Vector3 = new Laya.Vector3(0, 0.5, 0);
export const CameraInitRotEuler: Laya.Vector3 = new Laya.Vector3(0, 0, 0);

/** directional light */
export const LightInitPos: Laya.Vector3 = new Laya.Vector3(-3, 5, 0);
export const LightInitRotEuler: Laya.Vector3 = new Laya.Vector3(-45, -30, 0);

/** game stage */
export const StageResUrl: string = "res/stage/out/Boss";
export const StageInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
export const StageInitRot: Laya.Vector3 = new Laya.Vector3(0, 180, 0);
export const StageInitScale: Laya.Vector3 = new Laya.Vector3(40, 40, 40);
export const StageNum: number = 30;
// winning check frame
export const WinCheckTime: number = 120;

/** cube */
export const enum TargetType {
    DEFAULT = 1,
    GLASS = 2,
    TNT = 3
}

/** glass */
export const GlassBrokenVelocity: number = 3;

/** obstacle piece */
export const PieceResUrl: string = "res/cube_piece.lm";
export const PiecesNum: number = 3;
export const PiecesBrokenTime: number = 120;

/** bullet */
export const BulletResUrl: string = "res/bullet.lh";
export const BulletInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, -5);
export const BulletInitRot: Laya.Vector3 = new Laya.Vector3(180, 0, 0);
export const BulletRadius: number = 0.15;

/** player */
export const PlayerResUrl: string = "res/human.lh";
export const PlayerInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, -1);
export const PlayerInitRot: Laya.Vector3 = new Laya.Vector3(90, 168, 0);
export const PlayerInitScale: Laya.Vector3 = new Laya.Vector3(20, 20, 20);
export const PlayerShootLifeTime: number = 10;
