/** version */
export const VERSION = "1.0.0";

/** pages */
export const URL_HomeView: string = "home/HomeView.scene";
export const URL_GameScene: string = "game/GameScene.scene";
export const URL_OverView: string = "over/OverView.scene";
export const URL_ReviveView: string = "dialog/ReviveView.scene";

/** camera */
export const CameraInitPos: Laya.Vector3 = new Laya.Vector3(0, 0.3, 0.2);
export const CameraInitRotEuler: Laya.Vector3 = new Laya.Vector3(0, 0, 0);

/** directional light */
export const LightInitPos: Laya.Vector3 = new Laya.Vector3(0, 5, 0);
export const LightInitRotEuler: Laya.Vector3 = new Laya.Vector3(-30, 0, 0);
export const LightInitColor: Laya.Vector3 = new Laya.Vector3(1, 1, 1);

/** game stage */
export const StageResUrl: string = "res/stage/out/";
export const StageInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
export const StageInitRot: Laya.Vector3 = new Laya.Vector3(0, 180, 0);
export const StageInitScale: Laya.Vector3 = new Laya.Vector3(20, 20, 20);
export const StageNum: number = 30;
// winning check frame
export const MaxWinCheckTime: number = 90;
// 屏蔽物体物理受力前等待时间
export const SetKinematicWaitTime: number = 10;

/** background */
export const BgResUrl: string[] = [
    "res/scene/Scenes_02.lh",
    "res/scene/Scenes_04.lh",
    "res/scene/Scenes_07.lh",
]

/** cube */
export const enum TargetType {
    DEFAULT = 0,
    GLASS = 1,
    TNT = 2
}

/** glass */
export const GlassBrokenVelocity: number = 2.5;

/** obstacle piece */
export const PieceResUrl: string = "res/cube_piece.lm";
export const PiecesNum: number = 3;
export const PiecesBrokenTime: number = 120;

/** bullet */
export const BulletResUrl: string = "res/bullet.lh";
export const BulletInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, -1);
export const BulletInitRot: Laya.Vector3 = new Laya.Vector3(180, 0, 0);
// type
export const enum BulletType {
    DEFAULT = 0,
    FROZEN = 1,
}
// init radius
export const BulletRadius: number = 0.08;
// scale
export const BulletScale = [
    1,      // DEFAULT
    1.2,    // FROZEN
];
// mass
export const BulletMass = [
    10,     // DEFAULT
    10,     // FROZEN
];
// velocity
export const BulletVelocity = [
    40,     // DEFAULT
    40,     // FROZEN
];

/** player */
export const PlayerResUrl: string = "res/human.lh";
export const PlayerInitPos: Laya.Vector3 = new Laya.Vector3(0, -0.1, -0.5);
export const PlayerInitRot: Laya.Vector3 = new Laya.Vector3(90, 168, 0);
export const PlayerInitScale: Laya.Vector3 = new Laya.Vector3(15, 15, 15);
export const PlayerShootLifeTime: number = 10;
