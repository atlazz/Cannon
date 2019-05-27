var fs = require('fs');

var arguments = process.argv.splice(2);
var fromIdx = arguments[0];
var toIdx = arguments[1];
var prefix = arguments[2];

if (!fromIdx || !toIdx) {
    console.log("Failed: 输入参数缺省");
    console.log("Input: from index, to index");
    return;
}

var lvlChangeData = "outLvl ==> inLvl\n";

read(fromIdx, 1);

function read(inIdx, outIdx) {
    // get in file name
    let fileName = inIdx + ".lh";
	if (prefix) {
		fileName = prefix + fileName;
    }
    inIdx++;

    // read
    fs.readFile(fileName, (err, stage) => {
        if (!err) {

            console.log("Read file: " + fileName);

            stage = JSON.parse(stage.toString())

            // clear animator
            stage.data.components = [];

            for (let i = 0; i < stage.data.child.length; i++) {
                let item = stage.data.child[i];
                item.components = [];
                // target cube
                if (item.props.name.indexOf("Obstacles-Cube") >= 0 || item.props.name.indexOf("Obstacles-TNT") >= 0) {
                    item.props.meshPath = "models/Obstacles-Cube.lm";
                    item.props.materials = [];
                }
                // target cylinder
                else if (item.props.name.indexOf("Obstacles-Cylinder") >= 0) {
                    item.props.meshPath = "models/Obstacles-Cylinder.lm"
                    item.props.materials = [];
                }
                // target triangle
                else if (item.props.name.indexOf("Obstacles-Triangle") >= 0) {
                    item.props.meshPath = "models/Obstacles-Triangle.lm"
                    item.props.materials = [];
                }
                // target gate to cube
                else if (item.props.name.indexOf("Obstacle-GateCube") >= 0 || item.props.name.indexOf("Obstacle-GateScale10") >= 0) {
                    item.props.meshPath = "models/Obstacle-GateScale10.lm"
                    item.props.materials = [];
                }
                // target gate
                else if (item.props.name.indexOf("Obstacle-Gate") >= 0) {
                    item.props.meshPath = "models/Obstacle-Gate.lm"
                    item.props.materials = [];
                }
                // guard
                else if (item.props.name.indexOf("Guard") >= 0) {
                    item.props.meshPath = "models/Rotator.lm"
                    item.props.materials = [];
                }
                // stand cube
                else if (item.props.name.indexOf("Cube") >= 0) {
                    item.props.meshPath = "models/Cube.lm"
                    item.props.materials = [];
                }
                // stand cylinder
                else if (item.props.name.indexOf("Cylinder") >= 0) {
                    item.props.meshPath = "models/Cylinder.lm"
                    item.props.materials = [];
                }
            }

            var str = JSON.stringify(stage)

            // get out file name
            let outFileName = outIdx + ".lh";
            if (prefix) {
                outFileName = prefix + outFileName;
            }
            outIdx++;

            // write
            fs.writeFile("out\\" + outFileName, str, (err) => {
                if (err) throw err;
                console.log("Write file: " + "out\\" + outFileName);
            });
            lvlChangeData += (outIdx - 1).toString() + " <== " + (inIdx - 1).toString() + "\n";
        }

        // read next file
        if (inIdx <= toIdx) {
            read(inIdx, outIdx);
        }

        if (inIdx > toIdx) {
            fs.writeFile("out\\lvlMsg.txt", lvlChangeData, (err) => {
                console.log("Write file: " + "out\\lvlMsg.txt");
            });
        }

        return;
    });
}

// var cnt = 0;
// for (var i = fromIdx; i <= toIdx; i++) {
//     let fileName = i + ".lh";
// 	if (prefix) {
// 		fileName = prefix + fileName;
// 	}

//     // read
//     fs.readFile(fileName, (err, stage) => {
//         if (!err) {

//             console.log("Read file: " + fileName);

//             stage = JSON.parse(stage.toString())

//             // clear animator
//             stage.data.components = [];

//             for (let i = 0; i < stage.data.child.length; i++) {
//                 let item = stage.data.child[i];
//                 item.components = [];
//                 // target cube
//                 if (item.props.name.indexOf("Obstacles-Cube") >= 0 || item.props.name.indexOf("Obstacles-TNT") >= 0) {
//                     item.props.meshPath = "models/Obstacles-Cube.lm";
//                     item.props.materials = [];
//                 }
//                 // target cylinder
//                 else if (item.props.name.indexOf("Obstacles-Cylinder") >= 0) {
//                     item.props.meshPath = "models/Obstacles-Cylinder.lm"
//                     item.props.materials = [];
//                 }
//                 // target triangle
//                 else if (item.props.name.indexOf("Obstacles-Triangle") >= 0) {
//                     item.props.meshPath = "models/Obstacles-Triangle.lm"
//                     item.props.materials = [];
//                 }
//                 // target gate to cube
//                 else if (item.props.name.indexOf("Obstacle-GateCube") >= 0 || item.props.name.indexOf("Obstacle-GateScale10") >= 0) {
//                     item.props.meshPath = "models/Obstacle-GateScale10.lm"
//                     item.props.materials = [];
//                 }
//                 // target gate
//                 else if (item.props.name.indexOf("Obstacle-Gate") >= 0) {
//                     item.props.meshPath = "models/Obstacle-Gate.lm"
//                     item.props.materials = [];
//                 }
//                 // guard
//                 else if (item.props.name.indexOf("Guard") >= 0) {
//                     item.props.meshPath = "models/Rotator.lm"
//                     item.props.materials = [];
//                 }
//                 // stand cube
//                 else if (item.props.name.indexOf("Cube") >= 0) {
//                     item.props.meshPath = "models/Cube.lm"
//                     item.props.materials = [];
//                 }
//                 // stand cylinder
//                 else if (item.props.name.indexOf("Cylinder") >= 0) {
//                     item.props.meshPath = "models/Cylinder.lm"
//                     item.props.materials = [];
//                 }
//             }

//             var str = JSON.stringify(stage)

//             cnt++;
//             let outFileName = cnt + ".lh";
//             if (prefix) {
//                 outFileName = prefix + outFileName;
//             }
//             // write
//             fs.writeFile("out\\" + fileName, str, (err) => {
//                 if (err) throw err;
//                 console.log("Write file: " + "out\\" + fileName);
//             });
//         }
//     });
// }