import GameScene from "../runtime/GameScene";
import Global from "../Global";

/**
 * 使用例子：
 * let navigator = new Navigator(ws);
 * navigator.createHomeIcons(parentBox,visibleSprite,["home_icon_1", "home_icon_2", "home_icon_3", "home_icon_4", "home_icon_5", "home_icon_6", "home_icon_7", "home_icon_8", "home_icon_9", "home_icon_10"]);
 * 例子说明：
 * 1、导量资源文件夹路径：res/texture/navigator/;
 * 2、ws为小酷SDK;
 * 3、parentBox父节点的宽高比为16:9,其中宽为屏幕设计宽度，中心点要屏幕居中;
 * 4、调用后即在父节点创建，无需创建多次.
 */
export default class Navigator {
    /**整体缩放比例*/
    private SCALE: number;
    /**小酷SDK*/
    private ws: any;

    constructor(ws: any) {
        this.ws = ws;
        this.SCALE = Laya.stage.width / 720;
    }

    public loadIconInfoList: Function;

    public loadGuessLikeIconInfoList: Function;

    /** 广告位置 */
    private IconPos = [
        'first_step',
        'mid_step'
    ]

    /**对联图标信息列表*/
    private iconList: any[] = [];
    /**更多图标信息列表*/
    private moregameIconList: any[] = [];

    /**
     * 创建对联图标列（左右各5个）
     * 
     * @param parentBox 父节点
     * @param visibleSprite 该节点可以为父节点或者父节点所在的场景/页面。当该节点属性visible为true的时候，图标才会自动刷新。
     * @param posList 位置列表
     * 
     * @return 返回对联图标根节点
     */
    public createIcons(parentBox: Laya.Box, visibleSprite: Laya.Sprite): Laya.Box {
        if (!Laya.Browser.onMiniGame) {
            console.log("Laya.Browser.onMiniGame is false!");
            return;
        }

        /**当前显示首页图标*/
        let currentHomeIconInfoList: any[] = [];

        //首页图标列根盒子
        let homeIconBox = new Laya.Box();
        homeIconBox.width = 720 * this.SCALE;
        homeIconBox.height = 1280 * this.SCALE;
        homeIconBox.centerX = 0;
        homeIconBox.centerY = 0;
        homeIconBox.mouseThrough = true;
        parentBox.addChild(homeIconBox);

        //首页图标列表
        let homeIconList = new Laya.List();
        homeIconList.width = 720 * this.SCALE;
        homeIconList.height = 790 * this.SCALE;
        homeIconList.x = 0;
        homeIconList.y = 240 * this.SCALE;
        homeIconList.mouseThrough = true;
        homeIconList.spaceY = 45 * this.SCALE;
        homeIconList.spaceX = 468 * this.SCALE;
        homeIconList.repeatY = 5;
        homeIconList.repeatX = 2;
        homeIconBox.addChild(homeIconList);

        let SCALE = this.SCALE;
        //列表内容模板
        class Item extends Laya.Box {
            constructor() {
                super();
                this.width = 106 * SCALE;
                this.height = 106 * SCALE;
                this.pivotX = 53 * SCALE;
                this.pivotY = 53 * SCALE;
                this.x = 73 * SCALE;
                this.y = 73 * SCALE;
                this.visible = false;

                //图标
                let iconImage = new Laya.Sprite();
                iconImage.name = "iconImage";
                iconImage.width = 106 * SCALE;
                iconImage.height = 106 * SCALE;
                iconImage.x = 0;
                iconImage.y = 0;
                this.addChild(iconImage);

                //提示
                let tips = new Laya.Sprite();
                tips.name = "tips";
                tips.scaleX = -1;
                tips.width = 36 * SCALE;
                tips.height = 36 * SCALE;
                tips.x = 116 * SCALE;
                tips.y = -10 * SCALE;
                tips.loadImage("res/texture/navigator/tips2.png");
                this.addChild(tips);

                //图标名称
                let titleLabel = new Laya.Label();
                titleLabel.name = "titleLabel";
                titleLabel.width = 106 * SCALE;
                titleLabel.overflow = "visible";
                titleLabel.valign = "middle";
                titleLabel.align = "center";
                titleLabel.fontSize = Math.round(18 * SCALE);
                titleLabel.font = "Arial";
                titleLabel.color = "#1d3b63";
                titleLabel.anchorY = 0;
                titleLabel.anchorX = 0.5;
                titleLabel.y = 110 * SCALE;
                titleLabel.x = 53 * SCALE;
                this.addChild(titleLabel);
            }
        }
        homeIconList.itemRender = Item;

        //渲染处理
        homeIconList.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
            let iconInfo = homeIconList.array[index];
            if (iconInfo.data && iconInfo.pos) {
                cell.visible = true;
                //注册点击
                cell.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, [iconInfo.pos/** posList[index]*/, iconInfo.data]);
                //图片
                let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
                iconImage && iconImage.loadImage(iconInfo.data.icon);
                //名称
                let titleLabel = cell.getChildByName("titleLabel") as Laya.Label;
                titleLabel && titleLabel.changeText(iconInfo.data.title);
                titleLabel && (titleLabel.visible = false);
                //抖动
                this.shakeOnce(Math.random() * 1000, cell);
            } else {
                cell.visible = false;
            }
        }, [], false);

        //后台获取图标信息
        this.loadIconInfoList = (force: boolean = false) => {
            /** 后台重新拉取 */
            if (force || !this.iconList.length) {
                this.iconList = [];
                this.ws.fetchGameAd({
                    data: [{ pos: this.IconPos[0], count: Global.config.first_step_count }, { pos: this.IconPos[1], count: (10 - Global.config.first_step_count) * 10 }],
                    success: (res: any) => {
                        let data = res.data;
                        console.log('fetch icon', data)
                        this.iconList = [];
                        this.moregameIconList = [];
                        // save data list
                        for (let i = 0; data[this.IconPos[1]] && i < data[this.IconPos[1]].length; i++) {
                            let info = {};
                            info['data'] = data[this.IconPos[1]][i];
                            info['pos'] = this.IconPos[1];
                            this.moregameIconList.push(info);
                        }
                        for (let i = 0; data[this.IconPos[0]] && i < data[this.IconPos[0]].length; i++) {
                            let info = {};
                            info['data'] = data[this.IconPos[0]][i];
                            info['pos'] = this.IconPos[0];
                            this.moregameIconList.push(info);
                            // 对联icon数据列表，直跳
                            if (i < 10) {
                                this.iconList.push(info);
                            }
                        }
                        // 对联icon数据列表，二跳
                        let cnt = 0;
                        for (let i = this.iconList.length; i < 10; i++) {
                            this.moregameIconList[cnt] && this.iconList.push(this.moregameIconList[cnt++]);
                        }
                        //当前显示图标
                        homeIconList.array = this.iconList;
                        homeIconList.refresh();
                    }
                })
            }
            /** 不重新拉取 */
            else {
                homeIconList.array = this.iconList;
                homeIconList.refresh();
            }

            // this.ws.getPromoGameAd({
            //     count: posList.length,
            //     success: (res: any) => {
            //         let data = res.data;
            //         this.iconList = [];
            //         for (let i = 0; i < Math.min(data.length, posList.length); i++) {
            //             let info = data[i];
            //             this.iconList.push([info]);
            //         }
            //         //当前显示图标
            //         currentHomeIconInfoList = [];
            //         scheduleRefreshHomeIcons();
            //     },
            // });
        }

        this.loadIconInfoList(true);
        return homeIconBox;
    }


    /**
     * 创建游戏页图标（H型）
     * 
     * @param posList 位置列表
     * 
     * @return 返回首页图标根节点
     */
    public createGameIcons() {
        if (!Laya.Browser.onMiniGame) {
            return;
        }

        if (!GameScene.instance) {
            return;
        }

        /** 已有icon数据 */
        if (this.iconList.length) {
            console.log('show gameIcon')
            for (let i = 0; i < Math.min(this.iconList.length, 10); i++) {
                let iconImg = GameScene.instance.box_gameIcon.getChildAt(i) as Laya.Image;
                if (this.iconList[i] && this.iconList[i].data && this.iconList[i].pos && iconImg) {
                    iconImg.visible = true;
                    //注册点击
                    iconImg.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, [this.iconList[i].pos/** posList[index]*/, this.iconList[i].data]);
                    //图片
                    iconImg.loadImage(this.iconList[i].data.icon);
                    //名称
                    let titleLabel = iconImg.getChildByName("iconTitle") as Laya.Label;
                    titleLabel && titleLabel.changeText(this.iconList[i].data.title);
                    titleLabel && (titleLabel.visible = false);
                    //抖动
                    this.shakeOnce(Math.random() * 1000, iconImg);
                } else {
                    iconImg.visible = false;
                }
            }
        }
        /** 重新从后台拉取 */
        else {
            this.ws.fetchGameAd({
                data: [{ pos: this.IconPos[0], count: Global.config.first_step_count }, { pos: this.IconPos[1], count: (10 - Global.config.first_step_count) * 10 }],
                success: (res: any) => {
                    let data = res.data;
                    console.log('fetch icon in game', data)
                    this.iconList = [];
                    this.moregameIconList = [];
                    // save data list
                    for (let i = 0; data[this.IconPos[1]] && i < data[this.IconPos[1]].length; i++) {
                        let info = {};
                        info['data'] = data[this.IconPos[1]][i];
                        info['pos'] = this.IconPos[1];
                        this.moregameIconList.push(info);
                    }
                    for (let i = 0; data[this.IconPos[0]] && i < data[this.IconPos[0]].length; i++) {
                        let info = {};
                        info['data'] = data[this.IconPos[0]][i];
                        info['pos'] = this.IconPos[0];
                        this.moregameIconList.push(info);
                        // 对联icon数据列表，直跳
                        if (i < 10) {
                            this.iconList.push(info);
                        }
                    }
                    // 对联icon数据列表，二跳
                    let cnt = 0;
                    for (let i = this.iconList.length; i < 10; i++) {
                        this.moregameIconList[cnt] && this.iconList.push(this.moregameIconList[cnt++]);
                    }
                    // render and listen
                    for (let i = 0; i < 10; i++) {
                        let iconImg = GameScene.instance.box_gameIcon.getChildAt(i) as Laya.Image;
                        if (this.iconList[i] && this.iconList[i].data && this.iconList[i].pos && iconImg) {
                            iconImg.visible = true;
                            //注册点击
                            iconImg.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, [this.iconList[i].pos/** posList[index]*/, this.iconList[i].data]);
                            //图片
                            iconImg.loadImage(this.iconList[i].data.icon);
                            //名称
                            let titleLabel = iconImg.getChildByName("iconTitle") as Laya.Label;
                            titleLabel && titleLabel.changeText(this.iconList[i].data.title);
                            titleLabel && (titleLabel.visible = false);
                            //抖动
                            this.shakeOnce(Math.random() * 1000, iconImg);
                        } else {
                            iconImg.visible = false;
                        }
                    }
                }
            })
        }

        // this.ws.getPromoGameAd({
        //     count: 10,
        //     success: (res: any) => {
        //         let data = res.data;
        //         this.iconData = res.data;
        //         // console.log("game icon fetched: ", data)
        //         for (let i = 0; i < 10; i++) {
        //             let iconImg = GameScene.instance.box_gameIcon.getChildAt(i) as Laya.Image;
        //             if (i < data.length && data[i] && iconImg) {
        //                 iconImg.visible = true;
        //                 //注册点击
        //                 iconImg.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, ["default"/** posList[index]*/, data[i]]);
        //                 //图片
        //                 iconImg.loadImage(data[i].icon);
        //                 //名称
        //                 let titleLabel = iconImg.getChildByName("iconTitle") as Laya.Label;
        //                 titleLabel && titleLabel.changeText(data[i].title);
        //                 //抖动
        //                 this.shakeOnce(Math.random() * 1000, iconImg);
        //             } else {
        //                 iconImg.visible = false;
        //             }
        //         }
        //     },
        // });
    }

    /**
     * 随机触发icon点击事件
     * 
     * @param success 成功回调函数: 确认跳转
     * @param fail 失败回调函数
     */
    public randomIconTap(pos: string, success: Function, fail: Function) {
        // 已有icon数据
        if (this.iconList && this.iconList.length) {
            let idx = Math.floor(Math.random() * this.iconList.length);
            this.ws.tapGameAd({
                pos: this.iconList[idx].pos,
                ad: this.iconList[idx].data,
                redirect: true,
                success: success,
                fail: fail
            });
        }
        // 没有数据，重新后台抓取
        else {
            fail && fail();
        }
    }

    /** 初始化更多游戏图标列表
    * @param parentBox 父节点
    * @param openButtonParentBox 更多游戏按钮父节点，该层级要比抽屉父节点层级低，但更多游戏面板根节点要比抽屉父节点层级高
    * @param pos 位置
    * @return 更多游戏根盒子
    */
    public createMoreGame(parentBox: Laya.Box): Laya.Box {
        if (!Laya.Browser.onMiniGame) {
            console.log("Laya.Browser.onMiniGame is false!");
            return;
        }

        //更多游戏根盒子
        let moreGameBox = new Laya.Box();
        moreGameBox.width = 720 * this.SCALE;
        moreGameBox.height = 1280 * this.SCALE;
        moreGameBox.centerX = 0;
        moreGameBox.centerY = 0;
        moreGameBox.mouseThrough = true;
        moreGameBox.visible = false;
        parentBox.addChild(moreGameBox);

        //更多游戏面板盒子
        let panelBox = new Laya.Box();
        panelBox.width = 720 * this.SCALE;
        panelBox.height = 1280 * this.SCALE;
        panelBox.centerX = 0;
        panelBox.centerY = 0;
        panelBox.mouseThrough = true;
        moreGameBox.addChild(panelBox);

        //更多游戏面板图片
        let panel = new Laya.Box();
        panel.width = 690 * this.SCALE;
        panel.height = 900 * this.SCALE;
        panel.x = 15 * this.SCALE;
        panel.top = 220 * this.SCALE;
        panelBox.addChild(panel);

        //更多游戏图标列表
        let moreGameList = new Laya.List();
        moreGameList.width = 690 * this.SCALE;
        moreGameList.height = 1000 * this.SCALE;
        // moreGameList.centerX = 10 * this.SCALE;
        // moreGameList.centerY = 5 * this.SCALE;
        moreGameList.spaceX = 10 * this.SCALE;
        moreGameList.spaceY = 80 * this.SCALE;
        moreGameList.repeatX = 4;
        panel.addChild(moreGameList);

        let SCALE = this.SCALE;
        //列表内容模板
        class Item extends Laya.Box {
            constructor() {
                super();
                this.width = 165 * SCALE;
                this.height = 165 * SCALE;
                this.x = 0;
                this.y = 0;
                this.visible = false;

                //图标
                let iconImage = new Laya.Sprite();
                iconImage.name = "iconImage";
                iconImage.width = 165 * SCALE;
                iconImage.height = 165 * SCALE;
                iconImage.x = 0;
                iconImage.y = -2 * SCALE;
                this.addChild(iconImage);

                //提示
                let tips = new Laya.Sprite();
                tips.name = "tips";
                tips.width = 59 * SCALE;
                tips.height = 32 * SCALE;
                tips.x = 110 * SCALE;
                tips.y = -10 * SCALE;
                tips.loadImage("res/texture/navigator/tips.png");
                this.addChild(tips);
                //提示文字
                let tipsLabel = new Laya.Label();
                tipsLabel.name = "tipsLabel";
                tipsLabel.width = 42 * SCALE;
                tipsLabel.height = 18 * SCALE;
                tipsLabel.valign = "middle";
                tipsLabel.align = "center";
                tipsLabel.fontSize = Math.round(18 * SCALE);
                tipsLabel.font = "Arial";
                tipsLabel.color = "#ffffff";
                tipsLabel.x = 9 * SCALE;
                tipsLabel.y = 6 * SCALE;
                tips.addChild(tipsLabel);

                //图标名称
                let titleLabel = new Laya.Label();
                titleLabel.name = "titleLabel";
                titleLabel.width = 165 * SCALE;
                titleLabel.overflow = "visible";
                titleLabel.valign = "middle";
                titleLabel.align = "center";
                titleLabel.fontSize = Math.round(22 * SCALE);
                titleLabel.font = "Arial";
                titleLabel.color = "#1d3b63";
                titleLabel.anchorY = 0;
                titleLabel.anchorX = 0.5;
                titleLabel.x = 66 * SCALE;
                titleLabel.y = 170 * SCALE;
                this.addChild(titleLabel);
            }
        }
        moreGameList.itemRender = Item;

        moreGameList.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
            let iconInfo = moreGameList.array[index];
            if (iconInfo && iconInfo.data && iconInfo.pos) {
                cell.visible = true;
                //注册点击
                cell.on(Laya.Event.CLICK, this, this.onIconClick, [iconInfo.pos/**"default"*/, iconInfo.data]);
                //图片
                let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
                iconImage && iconImage.loadImage(iconInfo.data.icon);
                //名称
                let titleLabel = cell.getChildByName("titleLabel") as Laya.Label;
                titleLabel && titleLabel.changeText(iconInfo.data.title);
                //提示
                let tips = cell.getChildByName("tips");
                if (tips) {
                    let tipsLabel = tips.getChildByName("tipsLabel") as Laya.Label;
                    tipsLabel && tipsLabel.changeText(Math.random() > 0.5 ? "热门" : "NEW");
                }
            } else {
                cell.visible = false;
            }
        }, [], false);

        if (this.moregameIconList.length) {
            console.log('moregameIconList', this.moregameIconList)
            moreGameList.array = this.moregameIconList;
            moreGameList.refresh();
        }
        // show
        moreGameList.vScrollBarSkin = '';
        moreGameBox.visible = true;

        return moreGameBox;
    }

    /**
     * 创建猜你喜欢图标列（横排4个）
     * 
     * @param parentBox 父节点
     * @param visibleSprite 该节点可以为父节点或者父节点所在的场景/页面。当该节点属性visible为true的时候，图标才会自动刷新。
     * @param posList 位置列表
     * 
     * @return 返回猜你喜欢图标根节点
     */
    public createGuessLikeIcons(parentBox: Laya.Box, visibleSprite: Laya.Sprite, posList: string[]): Laya.Box {
        if (!Laya.Browser.onMiniGame) {
            console.log("Laya.Browser.onMiniGame is false!");
            return;
        }

        if (!posList || !posList.length) {
            console.log("posList is empty!");
            return;
        }

        /**猜你喜欢图标信息列表*/
        let guessLikeIconInfosList: any[] = [];
        /**当前显示猜你喜欢图标*/
        let currentGuessLikeIconInfoList: any[] = [];

        //猜你喜欢图标列根盒子
        let guessLikeIconBox = new Laya.Box();
        guessLikeIconBox.width = 720 * this.SCALE;
        guessLikeIconBox.height = 1280 * this.SCALE;
        guessLikeIconBox.centerX = 0;
        guessLikeIconBox.centerY = 0;
        guessLikeIconBox.mouseThrough = true;
        parentBox.addChild(guessLikeIconBox);

        let guessLikeFrame = new Laya.Sprite();
        guessLikeFrame.width = 560 * this.SCALE;
        guessLikeFrame.height = 188 * this.SCALE;
        guessLikeFrame.y = 670 * this.SCALE;
        guessLikeFrame.x = 80 * this.SCALE;
        guessLikeFrame.loadImage("res/texture/navigator/guessyoulike.png");
        guessLikeIconBox.addChild(guessLikeFrame);

        //猜你喜欢图标列表
        let guessLikeIconList = new Laya.List();
        guessLikeIconList.width = 500 * this.SCALE;
        guessLikeIconList.height = 208 * this.SCALE;
        guessLikeIconList.x = 60 * this.SCALE;
        guessLikeIconList.y = -20 * this.SCALE;
        guessLikeIconList.mouseThrough = true;
        guessLikeIconList.spaceY = 45 * this.SCALE;
        guessLikeIconList.spaceX = 18 * this.SCALE;
        guessLikeIconList.repeatY = 1;
        guessLikeIconList.repeatX = 4;
        guessLikeFrame.addChild(guessLikeIconList);

        let SCALE = this.SCALE;
        //列表内容模板
        class Item extends Laya.Box {
            constructor() {
                super();
                this.width = 106 * SCALE;
                this.height = 106 * SCALE;
                this.pivotX = 53 * SCALE;
                this.pivotY = 53 * SCALE;
                this.x = 63 * SCALE;
                this.y = 108 * SCALE;
                this.visible = false;

                //图标
                let iconImage = new Laya.Sprite();
                iconImage.name = "iconImage";
                iconImage.width = 106 * SCALE;
                iconImage.height = 106 * SCALE;
                iconImage.x = 0;
                iconImage.y = 0;
                this.addChild(iconImage);

                //图标名称
                let titleLabel = new Laya.Label();
                titleLabel.name = "titleLabel";
                titleLabel.width = 106 * SCALE;
                titleLabel.overflow = "visible";
                titleLabel.valign = "middle";
                titleLabel.align = "center";
                titleLabel.fontSize = Math.round(18 * SCALE);
                titleLabel.font = "Arial";
                titleLabel.color = "#1d3b63";
                titleLabel.anchorY = 0;
                titleLabel.anchorX = 0.5;
                titleLabel.y = 110 * SCALE;
                titleLabel.x = 53 * SCALE;
                this.addChild(titleLabel);
            }
        }
        guessLikeIconList.itemRender = Item;

        //渲染处理
        guessLikeIconList.renderHandler = Laya.Handler.create(this, (cell: Laya.Box, index: number) => {
            let iconInfo = guessLikeIconList.array[index];
            if (iconInfo) {
                cell.visible = true;
                //注册点击
                cell.on(Laya.Event.MOUSE_DOWN, this, this.onIconClick, ["default"/**posList[index]*/, iconInfo]);
                //图片
                let iconImage = cell.getChildByName("iconImage") as Laya.Sprite;
                iconImage && iconImage.loadImage(iconInfo.icon);
                //名称
                let titleLabel = cell.getChildByName("titleLabel") as Laya.Label;
                titleLabel && titleLabel.changeText(iconInfo.title);
                //抖动
                this.jumpeOnce(index * 150, cell);
            } else {
                cell.visible = false;
            }
        }, [], false);

        /**刷新猜你喜欢图标*/
        let refreshGuessLikeIcons = () => {
            if (guessLikeIconBox && guessLikeIconBox.activeInHierarchy && visibleSprite && visibleSprite.visible) {
                for (let i = 0; i < guessLikeIconInfosList.length; i++) {
                    let iconInfos = guessLikeIconInfosList[i];
                    let iconInfo = this.getRandom(iconInfos);
                    currentGuessLikeIconInfoList[i] = iconInfo;
                }
                guessLikeIconList.array = currentGuessLikeIconInfoList;
                guessLikeIconList.refresh();
            }
        }

        /**每隔三秒刷新一次*/
        let scheduleRefreshGuessLikeIcons = () => {
            guessLikeIconBox.clearTimer(this, refreshGuessLikeIcons);
            refreshGuessLikeIcons();
            guessLikeIconBox.timerLoop(3000, this, refreshGuessLikeIcons);
        }

        //后台获取图标信息
        // let fetchParams = [];
        // for (let pos of posList) {
        //     let list = this.ws.conf.games[pos];
        //     let count = list && list.length ? list.length : 1;
        //     fetchParams.push({ pos, count });
        // }
        // this.ws.fetchGameAd({
        //     data: fetchParams,
        //     success: (res: any) => {
        //         let data = res.data;
        //         guessLikeIconInfosList = [];
        //         for (let pos of posList) {
        //             guessLikeIconInfosList.push(data[pos]);
        //         }
        //         //当前显示图标
        //         currentOverIconInfoList = [];
        //         scheduleRefreshOverIcons();
        //     },
        // });
        this.loadGuessLikeIconInfoList = () => {
            this.ws.getPromoGameAd({
                count: posList.length,
                success: (res: any) => {
                    let data = res.data;
                    guessLikeIconInfosList = [];
                    for (let i = Math.max(data.length - posList.length, 0); i < data.length; i++) {
                        let info = data[i];
                        guessLikeIconInfosList.push([info]);
                    }
                    //当前显示图标
                    currentGuessLikeIconInfoList = [];
                    scheduleRefreshGuessLikeIcons();
                },
            });
        }
        this.loadGuessLikeIconInfoList();
        return guessLikeIconBox;
    }

    /**图标点击*/
    private onIconClick(pos: string, ad: any, redirect = true) {
        this.ws.tapGameAd({ pos, ad, redirect, });
    }

    /** 抖动一次图标 */
    private shakeOnce(delay: number, cell: Laya.Sprite) {
        cell.timerOnce(delay, this, () => {
            Laya.Tween.to(cell, { rotation: -10 }, 100, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                Laya.Tween.to(cell, { rotation: 10 }, 200, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                    Laya.Tween.to(cell, { rotation: -5 }, 150, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                        Laya.Tween.to(cell, { rotation: 5 }, 100, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                            Laya.Tween.to(cell, { rotation: 0 }, 50, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                                Laya.timer.clearAll(cell);
                            }));
                        }));
                    }));
                }));
            }));
        });
        this.blinkTips(delay, cell);
    }

    /** 跳动一次图标 */
    private jumpeOnce(delay: number, cell: Laya.Sprite) {
        let initY = cell.y;
        cell.timerOnce(delay, this, () => {
            Laya.Tween.to(cell, { rotation: -10 }, 100, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                Laya.Tween.to(cell, { rotation: 10 }, 200, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                    Laya.Tween.to(cell, { rotation: -5 }, 150, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                        Laya.Tween.to(cell, { rotation: 5 }, 100, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                            Laya.Tween.to(cell, { rotation: 0 }, 50, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                                Laya.timer.clearAll(cell);
                            }));
                        }));
                    }));
                }));
            }));
            Laya.Tween.to(cell, { y: initY - 50 }, 200, Laya.Ease.sineOut, Laya.Handler.create(this, () => {
                Laya.Tween.to(cell, { y: initY }, 200, Laya.Ease.sineIn);
            }));
        });
        this.blinkTips(delay, cell);
    }

    /** 闪烁提示 */
    private blinkTips(delay: number, sprite: Laya.Sprite) {
        //提示
        let tips = sprite.getChildByName("tips") as Laya.Sprite;
        if (tips) {
            tips.timerOnce(delay, this, () => {
                Laya.Tween.to(tips, { alpha: 0 }, 500, Laya.Ease.sineIn, Laya.Handler.create(this, () => {
                    Laya.Tween.to(tips, { alpha: 1 }, 500, Laya.Ease.sineOut, Laya.Handler.create(this, () => {
                        Laya.Tween.to(tips, { alpha: 0 }, 500, Laya.Ease.sineIn, Laya.Handler.create(this, () => {
                            Laya.Tween.to(tips, { alpha: 1 }, 500, Laya.Ease.sineOut, Laya.Handler.create(this, () => {
                                Laya.Tween.to(tips, { alpha: 0 }, 500, Laya.Ease.sineIn, Laya.Handler.create(this, () => {
                                    Laya.Tween.to(tips, { alpha: 1 }, 500, Laya.Ease.sineOut, Laya.Handler.create(this, () => {
                                        Laya.timer.clearAll(tips);
                                    }));
                                }));
                            }));
                        }));
                    }));
                }));
            });
        }
    }

    /** 根据权重随机获取列表的索引 */
    private randomIndex(list: any[], ratioProp: string = 'weight', defaultRatio: number = 0): number {
        let rangeList: [number, number][] = [];
        let totalRatio: number = 0;
        if (list && list.length) {
            for (let i: number = 0; i < list.length; i++) {
                let item: any[] = list[i];
                let itemRatio: number = Number(item[ratioProp]) || defaultRatio || 0;
                rangeList[i] = [totalRatio, totalRatio + itemRatio];
                totalRatio += itemRatio;
            }
        }
        if (totalRatio > 0) {
            let rand: number = Math.random() * totalRatio;
            for (let i: number = 0; i < rangeList.length; i++) {
                let range: [number, number] = rangeList[i];
                if (range[0] <= rand && rand < range[1]) {
                    return i;
                }
            }
        }
        return 0;
    }

    /** 根据权重随机获取列表中的一个 */
    private getRandom<T>(list: T[], ratioProp: string = 'weight', defaultRatio: number = 0): T {
        if (list && list.length) {
            if (list.length === 1) {
                return list[0];
            }
            return list[this.randomIndex(list, ratioProp, defaultRatio)];
        }
        return null;
    }
}