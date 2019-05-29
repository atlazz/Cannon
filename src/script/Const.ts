/** version */
export const VERSION = "1.0.0";

/************** 后台设置参数 *******************/
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

/************** 游戏控制参数 **************/
/** 游戏运行状态 */
export enum GameState {
    /** 游戏开始 */
    START = 1,
    /** 游戏结束 */
    OVER = 2,
}

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
    DEFAULT = 1,
    GLASS = 2,
    TNT = 3,
}

/** glass */
export const GlassBrokenVelocity: number = 14;
export const GlassFallingBrokenVelocity: number = 1;

/** piece of target object */
export const PieceResUrl: string = "res/cube_piece.lm";
export const PiecesNum: number = 3;
export const PiecesBrokenTime: number = 120;

/** cannon */
export const enum CannonType {
    DEFAULT = 1,
    SHOTGUN = 3,
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

/******** bullet ********/
/** reward bullet */
export const enum BulletRewardType {
    BLACKHOLE = 1,
};
export const BulletRewardResUrl = {
    1: "res/bullet/blackhole.lh",   // BLACKHOLE
};

/** bullet physics */
// init radius
export const BulletRadius: number = 0.08;
// scale
export const BulletScale = {
    /** cannon bullet */
    0: {
        1: 1,       // DEFAULT
        2: 1.2,     // FROZEN
    },
    /** reward bullet */
    1: {
        1: 7,       // BLACKHOLE
    }
};
// mass
export const BulletMass = {
    /** cannon bullet */
    0: {
        1: 40,      // DEFAULT
        2: 10,      // FROZEN
    },
    /** reward bullet */
    1: {
        1: 100,       // BLACKHOLE
    }
};
// velocity
export const BulletVelocity = {
    /** cannon bullet */
    0: {
        1: 40,      // DEFAULT
        2: 40,      // FROZEN
    },
    /** reward bullet */
    1: {
        1: 5,       // BLACKHOLE
    }
};
// trigger or not
export const BulletTrigger = {
    /** cannon bullet */
    0: {
        1: false,      // DEFAULT
        2: false,      // FROZEN
    },
    /** reward bullet */
    1: {
        1: true,       // BLACKHOLE
    }
}
// override gravity
export const BulletOverrideGravity = {
    /** cannon bullet */
    0: {
        1: false,      // DEFAULT
        2: false,      // FROZEN
    },
    /** reward bullet */
    1: {
        1: true,       // BLACKHOLE
    }
}
