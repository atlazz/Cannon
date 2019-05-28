/** version */
export const VERSION = "1.0.0";

/************** 后台参数设置 *******************/
/** 分享位置 */
export const RewardPos = {
    OverShare: 'OverShare',
    Revive: 'revive',
}
/** Banner广告位置 */
export const BannerPos = {
    HomeView: 'HomeView',
    GameScene: 'HomeView',
    OverView: 'HomeView',
    ReviveDialog: 'HomeView',
}
/** 复活倒数秒数 */
export const ReviveCountdown: number = 5;
/**********************************************/

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
export const StageTexUrl: string[] = [
    // stand
    "res/stage/out/materials/mutou_06.jpg",
    // target wood
    "res/stage/out/materials/box 13.png",
    // target TNT
    "res/stage/out/materials/TNT.png",
]
export const StageResUrl: string = "res/stage/out/";
export const StageInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
export const StageInitRot: Laya.Vector3 = new Laya.Vector3(0, 180, 0);
export const StageInitScale: Laya.Vector3 = new Laya.Vector3(20, 20, 20);
export const StageNum: number = 74;
// winning check frame
export const MaxWinCheckTime: number = 30;
// 屏蔽物体物理受力前等待时间
export const SetKinematicWaitTime: number = 10;

/** background */
export const BgResUrl: string[] = [
    "res/scene/Scenes_02.lh",
    "res/scene/Scenes_04.lh",
    "res/scene/Scenes_07.lh",
]

/** target object */
export const enum TargetType {
    DEFAULT = 0,
    GLASS = 1,
    TNT = 2
}

/** glass */
export const GlassBrokenVelocity: number = 12.5;
export const GlassFallingBrokenVelocity: number = 1;

/** piece of target object */
export const PieceResUrl: string = "res/cube_piece.lm";
export const PiecesNum: number = 3;
export const PiecesBrokenTime: number = 120;

/** cannon */
export const enum CannonType {
    DEFAULT = 1,
    FROZEN = 2,
}
export const CannonResUrl = {
    1: "res/cannon/Cannon_01.lh",   // DEFAULT
    2: "res/cannon/Cannon_22.lh",   // FROZEN
};
export const CannonInitPos: Laya.Vector3 = new Laya.Vector3(0, 0.04, -0.17);
export const CannonInitRot: Laya.Vector3 = new Laya.Vector3(0, 180, 0);
export const CannonInitScale: Laya.Vector3 = new Laya.Vector3(25, 25, 25);
export const TurretInitLocalRot: Laya.Vector3 = new Laya.Vector3(0, 0, 0);

/** bullet */
export const enum BulletType {
    DEFAULT = 1,
    FROZEN = 2,
}
export const BulletResUrl: string = "res/bullet.lh";
// init radius
export const BulletRadius: number = 0.08;
// scale
export const BulletScale = {
    1: 1,       // DEFAULT
    2: 1.2,     // FROZEN
};
// mass
export const BulletMass = {
    1: 40,      // DEFAULT
    2: 10,      // FROZEN
};
// velocity
export const BulletVelocity = {
    1: 40,      // DEFAULT
    2: 40,      // FROZEN
};

