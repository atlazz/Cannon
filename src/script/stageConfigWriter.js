var xlsx = require('node-xlsx');
var fs = require('fs');

var arguments = process.argv.splice(2);
var fileName = arguments[0];

if (!fileName) {
    console.log("Failed: 输入参数缺省");
    console.log("Input: fileName");
    return;
}

var sheets = xlsx.parse('./' + fileName);

//=============== 1: Stage ===============
// stage Android
var data_stage = "/** 关卡配置表 */\nexport const Stage = {\n";
var sheet_stageAndroid = sheets[0];
data_stage += "\t// system\n\tAndroid: {\n";
for(var rowId in sheet_stageAndroid['data']){
    if (rowId < 2) {
        continue;
    }
    if ((rowId - 2) % 5 == 0) {
        data_stage += "\t\t// stage\n\t\t" + ((rowId - 2) / 5 + 1) + ": {\n\t\t\t// mission\n";
    }
    data_stage += "\t\t\t" + ((rowId - 2) % 5 + 1) + ": {\n";
    data_stage += "\t\t\t\t" + "min: " + sheet_stageAndroid['data'][rowId][2] + ",\n";
    data_stage += "\t\t\t\t" + "max: " + sheet_stageAndroid['data'][rowId][3] + ",\n";
    data_stage += "\t\t\t\t" + "ball_add: " + sheet_stageAndroid['data'][rowId][4] + ",\n";
    data_stage += "\t\t\t\t" + "reward: " + sheet_stageAndroid['data'][rowId][5] + ",\n";
    data_stage += "\t\t\t},\n";
    if ((rowId - 2) % 5 == 4) {
        data_stage += "\t\t},\n";
    }
}
data_stage += "},\n";
// stage IOS
var sheet_stageIOS = sheets[1];
data_stage += "\t// system\n\tIOS: {\n";
for(var rowId in sheet_stageIOS['data']){
    if (rowId < 2) {
        continue;
    }
    if ((rowId - 2) % 5 == 0) {
        data_stage += "\t\t// stage\n\t\t" + ((rowId - 2) / 5 + 1) + ": {\n\t\t\t// mission\n";
    }
    data_stage += "\t\t\t" + ((rowId - 2) % 5 + 1) + ": {\n";
    data_stage += "\t\t\t\t" + "min: " + sheet_stageIOS['data'][rowId][2] + ",\n";
    data_stage += "\t\t\t\t" + "max: " + sheet_stageIOS['data'][rowId][3] + ",\n";
    data_stage += "\t\t\t\t" + "ball_add: " + sheet_stageIOS['data'][rowId][4] + ",\n";
    data_stage += "\t\t\t\t" + "reward: " + sheet_stageIOS['data'][rowId][5] + ",\n";
    data_stage += "\t\t\t},\n";
    if ((rowId - 2) % 5 == 4) {
        data_stage += "\t\t},\n";
    }
}
data_stage += "},\n";
data_stage += "}\n\n";

//=============== 2: Map ===============
var sheet_map = sheets[2];
var data_map = "/** 关卡映射表 */\nexport const Map = {\n";
// map Android
data_map += "\t// system\n\tAndroid: {\n\t\t// stage index\n";
for(var rowId in sheet_map['data']){
    if (rowId < 2) {
        continue;
    }
    data_map += "\t\t" + (rowId - 1) + ": " + sheet_map['data'][rowId][2] + ",\n";
}
data_map += "},\n";
// map IOS
data_map += "\t// system\n\tIOS: {\n\t\t// stage index\n";
for(var rowId in sheet_map['data']){
    if (rowId < 2) {
        continue;
    }
    data_map += "\t\t" + (rowId - 1) + ": " + sheet_map['data'][rowId][1] + ",\n";
}
data_map += "},\n";
data_map += "}\n\n";

//=============== 3: Stage Raw ===============
var sheet_stageRaw = sheets[3];
var data_raw = "/** 原始关卡参数配置 */\nexport const StageRaw = {\n\t// raw stage index\n";
for(var rowId in sheet_stageRaw['data']){
    if (rowId < 2) {
        continue;
    }
    data_raw += "\t" + (rowId - 1) + ": {\n";
    data_raw += "\t\tball_num: " + sheet_stageRaw['data'][rowId][1] + ",\n";
    data_raw += "\t\trotate: " + (sheet_stageRaw['data'][rowId][2] == 0 ? "false" : "true") + ",\n";
    data_raw += "\t\tmove_x: " + (sheet_stageRaw['data'][rowId][3] == 0 ? "false" : "true") + ",\n";
    data_raw += "\t\tmove_y: " + (sheet_stageRaw['data'][rowId][5] == 0 ? "false" : "true") + ",\n";
    data_raw += "\t\tmove_z: " + (sheet_stageRaw['data'][rowId][4] == 0 ? "false" : "true") + ",\n";
    data_raw += "\t},\n";
}
data_raw += "}\n\n";

//=============== 4: Stage Reward ===============
var sheet_stageReward = sheets[4];
var data_reward = "/** 大关卡钻石奖励配置 */\nexport const StageReward = {\n\t// stage index\n";
for(var rowId in sheet_stageReward['data']){
    if (rowId < 2) {
        continue;
    }
    data_reward += "\t" + (rowId - 1) + ": " + sheet_stageReward['data'][rowId][1] + ",\n";
}
data_reward += "}\n\n";

//=============== 5: Stage Texture ===============
var sheet_stageTexture = sheets[5];
var data_texture = "/** 大关卡方块贴图配置 */\nexport const StageTexture = {\n\t// stage index\n";
for(var rowId in sheet_stageTexture['data']){
    if (rowId < 2) {
        continue;
    }
    data_texture += "\t" + (rowId - 1) + ": " + sheet_stageTexture['data'][rowId][1] + ",\n";
}
data_texture += "}\n\n";


// write data
var data = data_map + data_stage + data_raw + data_reward + data_texture;
var fileName = "StageConfig.ts";
fs.writeFile(fileName, data, (err) => {
    if (err) throw err;
    console.log("Done: data all writed.");
});

// console.log(data);