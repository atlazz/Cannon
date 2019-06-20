/**This class is automatically generated by LayaAirIDE, please do not make any modifications. */
import View=Laya.View;
import Dialog=Laya.Dialog;
import Scene=Laya.Scene;
var REG: Function = Laya.ClassUtils.regClass;
export module ui.cannonSelect {
    export class CannonSelectUI extends View {
		public box_scene3D:Laya.Box;
		public box_UI:Laya.Box;
		public label_name:Laya.Label;
		public label_feature:Laya.Label;
		public list_Icon:Laya.List;
		public arrowLeft:Laya.Image;
		public arrowRight:Laya.Image;
		public label_unlockMsg:Laya.Label;
		public btn_select:Laya.Image;
		public btn_unlock:Laya.Image;
		public icon_unlockDiamond:Laya.Image;
		public label_unlockDiamond:Laya.Label;
		public btn_try:Laya.Image;
		public label_try:Laya.Label;
		public btn_back:Laya.Image;
		public icon_diamond:Laya.Image;
		public text_diamond:laya.display.Text;
		public tutorial_slide:Laya.Box;
		public tutorial_try:Laya.Box;
		public tutorial_back:Laya.Box;
        constructor(){ super()}
        createChildren():void {
            super.createChildren();
            this.loadScene("cannonSelect/CannonSelect");
        }
    }
    REG("ui.cannonSelect.CannonSelectUI",CannonSelectUI);
}
export module ui.game {
    export class GameSceneUI extends View {
		public box_scene3D:Laya.Sprite;
		public box_gameIcon:Laya.Box;
		public icon1:Laya.Image;
		public icon2:Laya.Image;
		public icon3:Laya.Image;
		public icon4:Laya.Image;
		public icon5:Laya.Image;
		public icon6:Laya.Image;
		public icon7:Laya.Image;
		public icon8:Laya.Image;
		public icon9:Laya.Image;
		public icon10:Laya.Image;
		public box_UI:Laya.Box;
		public box_level:Laya.Box;
		public label_level:Laya.Label;
		public level1:Laya.Image;
		public level2:Laya.Image;
		public level3:Laya.Image;
		public level4:Laya.Image;
		public level5:Laya.Image;
		public label_ballNum:Laya.Label;
		public btn_cannonOpen:Laya.Image;
		public btn_rewardCannon:Laya.Image;
		public btn_rewardBullet:Laya.Image;
		public label_rewardBullet:Laya.Label;
		public missionWin:Laya.Image;
		public btn_back:Laya.Image;
		public box_countdown:Laya.Box;
		public failCircle:Laya.Image;
		public label_failTimer:Laya.Label;
		public icon_diamond:Laya.Image;
		public text_diamond:laya.display.Text;
		public box_revive:Laya.Box;
		public mask_revive:Laya.Image;
		public box_reviveIcon:Laya.Box;
		public btn_revive:Laya.Image;
		public btn_retry:Laya.Image;
		public box_test:Laya.Box;
		public btn_test_restart:Laya.Image;
		public btn_test_next:Laya.Image;
		public input_test_lvl:Laya.TextInput;
		public label_test_lvl:Laya.Label;
		public box_treasureAD:Laya.Box;
		public btn_treasureGetExtra:Laya.Image;
		public label_extraDiamond:Laya.Label;
		public box_passStage:Laya.Box;
		public box_winIcon:Laya.Box;
		public btn_passStagex3:Laya.Image;
		public btn_passStage:Laya.Image;
		public label_winDiamond:Laya.Label;
		public label_stage:Laya.Label;
		public backCheck:Laya.Image;
		public btn_backReturn:Laya.Image;
		public btn_backExit:Laya.Image;
		public tutorial_shoot:Laya.Box;
		public tutorial_bulletTry:Laya.Box;
		public tutorial_cannonTry:Laya.Box;
		public tutorial_cannonSelect:Laya.Box;
		public tutorial_treasure:Laya.Box;
		public label_treasureTitle:Laya.Label;
        constructor(){ super()}
        createChildren():void {
            super.createChildren();
            this.loadScene("game/GameScene");
        }
    }
    REG("ui.game.GameSceneUI",GameSceneUI);
}
export module ui.home {
    export class HomeViewUI extends View {
		public mask_homeView:Laya.Image;
		public box_UI:Laya.Box;
		public box_homeIcon:Laya.Box;
		public box_drawer:Laya.Box;
		public btn_test:Laya.Image;
		public box_moreGame:Laya.Box;
		public lock_background:Laya.Image;
		public btn_background:Laya.Image;
		public lock_bullet:Laya.Image;
		public btn_bullet:Laya.Image;
		public lock_cannon:Laya.Image;
		public btn_cannon:Laya.Image;
		public btn_sound:Laya.Image;
		public btn_start:Laya.Image;
		public btn_vibration:Laya.Image;
		public label_highScore:Laya.Label;
		public label_level:Laya.Label;
		public icon_gameTitle:Laya.Image;
		public label_version:Laya.Label;
		public icon_diamond:Laya.Image;
		public text_diamond:laya.display.Text;
		public box_bannar:Laya.Image;
        constructor(){ super()}
        createChildren():void {
            super.createChildren();
            this.loadScene("home/HomeView");
        }
    }
    REG("ui.home.HomeViewUI",HomeViewUI);
}
export module ui.over {
    export class OverViewUI extends View {
        constructor(){ super()}
        createChildren():void {
            super.createChildren();
            this.loadScene("over/OverView");
        }
    }
    REG("ui.over.OverViewUI",OverViewUI);
}