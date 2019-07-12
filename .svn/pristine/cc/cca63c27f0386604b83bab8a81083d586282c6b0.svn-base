let Global = {
    gameData: {
        //音乐开关
        musicEnabled: true,
        //音效开关
        soundEnabled: true,
        //振动开关
        vibrationEnabled: true,
        //数据更新时间
        updateTimestamp: 0,
        //视频观看次数
        videoCount: 0,
        lastVideoTimestamp: 0,
        //转发次数
        shareCount: 0,
        lastShareTimestamp: 0,
        //关卡索引
        stageIndex: 1,
        //当前炮台类型
        cannonType: 1,
        //大炮解锁状态
        cannonUnlockState: {},
        //当前拖尾类型
        trailType: 1,
        //拖尾解锁状态
        trailUnlockState: {},
        //拖尾游戏内解锁弹窗，是否已弹出
        trailShowToday: false,
        lastTrailShowTimestamp: 0,
        //钻石
        diamond: 0,
        //新手引导环节索引
        tutorialStep: 6,
        videoErr: {},
        //领取钻石状态（1初始默认，2曾经从小程序打开有领取资格，3已领取钻石）
        getDiamond: 1,
        //宝箱暴击页每天误点次数
        treasureBannerHit: 0,
        lastTreasureBannerHitTimestamp: 0,
    },
    config: {
        skin_block: false, //是否屏蔽皮肤
        share_first: false, //是否转发优先
        allow_share: true, //是否允许转发
        allow_video: true, //是否允许视频
        share_number: 5, //优先转发情况下，最多转发次数，如果超过视频次数，仍会继续转发
        video_number: 6, //视频观看次数
        share_time: 30, //转发冷却时间
        banner_time: 180, //banner切换时间
        share_delay: 4,
        online: true,//是否线上版本
        debug: false,
        allow_pay: false,
        allow_revive: true,//允许复活
        banner_delay: 1, //banner延迟弹出时间
        banner_delay_ratio: 1, //banner延迟弹出概率
        banner_delay_ratio1: 0.8, //banner1延迟弹出概率, 复活页
        deny_banner: false,
        share_fail: "'操作失败，请换个群'",
        distance_iphonex: 50,
        banner_click_time: 2,
        games: {},
        shares: {},
        videos: {},
        banners: {},
        try_cannon: 1,
        try_ball: 1,
        revive: 1,
        get_trail: 1,
        reward_triple: 1,
        bulletRewardType: 1, // balckhole
        cannonRewardType: 4, // shotgun x4
        hasTreasure: true,  // 宝箱是否开启
        banner: "",  // banner Josn对象, key为1,2,3..., value为对应adunitId
        banner_number: 0, // banner个数
        banner_delay_pass: 1, // 通关页banner误点概率
        banner_show_treasure: 1, // 宝箱banner显示概率
        show_number: 2, // banner刷新触发次数 - 首页
        show_number_t: 1, // banner刷新触发次数 - 宝箱页
        MaxTreasureBannerHit: 2,
        allow_interstitial: true, // 插屏广告开关
        uid_interstitial: "adunit-1b8d841eedb67978",  // 插屏广告uid
    },
    user: {},
    audio: {
        volume: 0.5,
    },
}
export default Global;