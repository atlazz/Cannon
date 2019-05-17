/** version */
export const VERSION = "1.0.0";

/** pages */
export const URL_HomeView: string = "home/HomeView.scene";
export const URL_GameScene: string = "game/GameScene.scene";
export const URL_OverView: string = "over/OverView.scene";
export const URL_ReviveView: string = "dialog/ReviveView.scene";

/** camera */
export const CameraInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
export const CameraInitRotEuler: Laya.Vector3 = new Laya.Vector3(0, 0, 0);

/** directional light */
export const LightInitPos: Laya.Vector3 = new Laya.Vector3(0, 5, 0);
export const LightInitRotEuler: Laya.Vector3 = new Laya.Vector3(-45, 0, 0);

/** platform */
export const PlatformInitPos: Laya.Vector3 = new Laya.Vector3(0, -3, -15);
export const PlatformInitRot: Laya.Vector3 = new Laya.Vector3(0, 37, 0);
export const PlatformWidth: number = 5;
export const PlatformHeight: number = 0.3;
export const PlatformStandRadius: number = 0.3;
export const PlatformStandHeight: number = 10;
// winning check frame
export const WinCheckTime: number = 180;

/** cube */
export const enum CubeType {
    DEFAULT = 1,
    GLASS = 2,
    TNT = 3
}

/** cube piece */
export const CubePieceResUrl: string = "res/cube_piece.lm";
export const CubePiecesNum: number = 3;
export const CubeBrokenTime: number = 120;

/** bullet */
export const BulletResUrl: string = "res/bullet.lh";
export const BulletInitPos: Laya.Vector3 = new Laya.Vector3(-0.1, -1, -4);
export const BulletInitRot: Laya.Vector3 = new Laya.Vector3(180, 0, 0);
export const BulletRadius: number = 0.15;

/** player */
export const PlayerResUrl: string = "res/human.lh";
export const PlayerInitPos: Laya.Vector3 = new Laya.Vector3(0, -0.6, -1);
export const PlayerInitRot: Laya.Vector3 = new Laya.Vector3(90, 168, 0);
export const PlayerInitScale: Laya.Vector3 = new Laya.Vector3(20, 20, 20);
export const PlayerShootLifeTime: number = 10;
