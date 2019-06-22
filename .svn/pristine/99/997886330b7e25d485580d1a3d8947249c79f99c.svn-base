/** version */
export const VERSION = "1.1.6";

/************** 后台设置参数 *******************/
/** 分享位置 */
export const RewardPos = {
    Cannon: 'try_cannon',
    Bullet: 'try_ball',
    Revive: 'revive',
    Treasure: 'reward_triple',
}
/** Banner广告位置 */
export const BannerPos = {
    HomeView: 'HomeView',
    StagePass: 'missionpass',
    Revive: 'revive',
}

/************** 游戏控制参数 **************/
/** 游戏运行状态 */
export enum GameState {
    /** 游戏开始 */
    START = 1,
    /** 暂停 */
    PAUSE = 2,
    /** 游戏结束 */
    OVER = 3,
}

/** pages */
export const URL_HomeView: string = "home/HomeView.scene";
export const URL_GameScene: string = "game/GameScene.scene";
export const URL_CannnonSelect: string = "cannonSelect/CannonSelect.scene";
export const URL_OverView: string = "over/OverView.scene";

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
    "res/stage/out/materials/stack_texture.jpg",
    // target TNT
    "res/stage/out/materials/TNT.png",
]
export const StageResUrl: string = "res/stage/out/";
export const StageInitPos: Laya.Vector3 = new Laya.Vector3(0, 0, 0);
export const StageInitRot: Laya.Vector3 = new Laya.Vector3(0, 180, 0);
export const StageInitScale: Laya.Vector3 = new Laya.Vector3(20, 20, 20);
export const StageNum: number = 20;
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
export const GlassBrokenVelocity: number = 10;
export const GlassFallingBrokenVelocity: number = 1;

/** piece of target object */
export const PieceResUrl: string = "res/cube_piece.lm";
export const PiecesNum: number = 3;
export const PiecesBrokenTime: number = 120;

/** cannon */
export const CannonInitPos: Laya.Vector3 = new Laya.Vector3(0, 0.04, -0.20);
export const CannonInitRot: Laya.Vector3 = new Laya.Vector3(0, 180, 0);
export const CannonInitScale: Laya.Vector3 = new Laya.Vector3(25, 25, 25);
export const TurretInitLocalRot: Laya.Vector3 = new Laya.Vector3(0, 0, 0);

// cannon ball box
export const CannonBallBoxUrl = "res/ball_box/ball_box.lh";
export const CannonBallInitPos: Laya.Vector3 = new Laya.Vector3(-0.01, 0.05, -0.13);
export const CannonBallInitScale: Laya.Vector3 = new Laya.Vector3(25, 25, 25);

/** cdn */
export const cdnUrl: string = "https://coolant.miniant.cn/cannon/res_v111.zip";

/** sound */
export const soundUrl: string = "res/audio/shoot.mp3";

/** treasure */
export const treasureUrl: string = "res/treasure/treasure.lh";
export const treasureAngleX: number[] = [-1.6, -1.4, -0.8, 0.1, 0.6, 1.2, 1, -0.8, -0.45];
export const treasureAngleZ: number[] = [0, 0.2, 0.5, 0.6, 0.3, 0.2, 0.1, 0, 0.8];

/******** bullet ********/
// bullet mesh model res url
export const BulletMeshUrl = "res/bullet/bullet.lm";
export const BulletLightningUrl = "res/bullet/lightning/lightning.lh";
/** reward bullet */
export const enum BulletRewardType {
    BLACKHOLE = 1,
};
export const BulletRewardResUrl = {
    1: "res/bullet/blackhole/blackhole.lh", // BLACKHOLE
};
export const cannonEffectUrl = {
    1: "res/cannon_effect/gunlightning.lh",  // BLACKHOLE
}
// init radius
export const BulletRadius: number = 0.08;

// cannon select scene
export const CannonSelectIconBgUrl = "res/ui/cannonSelect/CannonIconBG.png";
export const CannonSelectIconList = [
    {index: -1},    // 头部
    {index: 1, icon: "res/ui/cannonSelect/cannon_default.png"},
    {index: 3, icon: "res/ui/cannonSelect/Cannon_10.png"},
    {index: 7, icon: "res/ui/cannonSelect/cannon_dragon.png"},
    {index: 2, icon: "res/ui/cannonSelect/Cannon_03.png"},
    {index: 6, icon: "res/ui/cannonSelect/cannon_light.png"},
    {index: 5, icon: "res/ui/cannonSelect/cannon_lion.png"},
    {index: 4, icon: "res/ui/cannonSelect/Cannon_22.png"},
    {index: -1},    // 尾部
]
export const CannonSelectTextList = {
    1: {name: "普通炮", feature: "普通的大炮，普通的威力，就很普通", unlockLvl: 0, unlockDiamond: 0},
    3: {name: "冰雪奇缘", feature: "更强的威力，将方块变成冰块", unlockLvl: 5, unlockDiamond: 1350},
    7: {name: "龙门大炮", feature: "威力超强，拥有它，你就是龙的传人", unlockLvl: 11, unlockDiamond: 3500},
    2: {name: "双重射击", feature: "两炮齐发，威力强大", unlockLvl: 17, unlockDiamond: 7500},
    6: {name: "闪电风暴", feature: "威力无比，一发入魂", unlockLvl: 23, unlockDiamond: 10500},
    5: {name: "黄金狮子头", feature: "河东狮吼，十分暴躁", unlockLvl: 999, unlockDiamond: 13500},
    4: {name: "无敌散弹炮", feature: "终极武器，用一次爽一次", unlockLvl: 999, unlockDiamond: 999999},
}

export const enum CannonType {
    DEFAULT = 1,
    SHOTGUN_X2 = 2,
    FROZEN = 3,
    SHOTGUN_X4 = 4,
    BOMB = 5,
    LIGHTNING = 6,
    DRAGON = 7,
}
export const CannonResUrl = {
    1: "res/cannon/Cannon_Default.lh",      // DEFAULT
    2: "res/cannon/Cannon_ShotgunX2.lh",    // SHOTGUN_X2
    3: "res/cannon/Cannon_Frozen.lh",       // FROZEN
    4: "res/cannon/Cannon_Reward.lh",       // SHOTGUN_X4
    5: "res/cannon/Cannon_Lion.lh",         // LION(BOMB)
    6: "res/cannon/Cannon_Lightning.lh",    // LIGHTNING
    7: "res/cannon/Cannon_Dragon.lh",       // DRAGON
};
export const BulletTextureUrl = {
    1: "res/bullet/ball_texture/ball_default.jpg",    // DEFAULT
    2: "res/bullet/ball_texture/shotgun.jpg",   // SHOTGUN_X2
    3: "res/bullet/ball_texture/ice.jpg",       // FROZEN
    4: "res/bullet/ball_texture/shotgun.jpg",   // SHOTGUN_X4
    5: "res/bullet/ball_texture/boom.jpg",      // BOMB
    6: "res/bullet/ball_texture/lightning.jpg", // LIGHTNING
    7: "res/bullet/ball_texture/ball_default.jpg", // LIGHTNING
}
// scale
export const BulletScale = {
    /** cannon bullet */
    0: {
        1: 1,       // DEFAULT
        2: 1,       // SHOTGUN_X2
        3: 1,       // FROZEN
        4: 1,       // REWARD SHOTGUN_X4
        5: 1,       // BOMB
        6: 1,       // LIGHTNING
        7: 1,       // DRAGON
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
        1: 20,      // DEFAULT
        2: 20,      // SHOTGUN_X2
        3: 25,      // FROZEN
        4: 20,      // REWARD SHOTGUN_X4
        5: 20,      // BOMB
        6: 60,      // LIGHTNING
        7: 35,      // DRAGON
    },
    /** reward bullet */
    1: {
        1: 100,     // BLACKHOLE
    }
};
// velocity
export const BulletVelocity = {
    /** cannon bullet */
    0: {
        1: 30,      // DEFAULT
        2: 30,      // SHOTGUN_X2
        3: 30,      // FROZEN
        4: 30,      // REWARD SHOTGUN_X4
        5: 30,      // BOMB
        6: 30,      // LIGHTNING
        7: 30,      // LIGHTNING
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
        2: false,      // SHOTGUN_X2
        3: false,      // FROZEN
        4: false,      // REWARD SHOTGUN_X4
        5: false,      // BOMB
        6: false,      // LIGHTNING
        7: false,      // DRAGON
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
        2: false,      // SHOTGUN_X2
        3: false,      // FROZEN
        4: false,      // REWARD SHOTGUN_X4
        5: false,      // BOMB
        6: false,      // LIGHTNING
        7: false,      // DRAGON
    },
    /** reward bullet */
    1: {
        1: true,       // BLACKHOLE
    }
}
