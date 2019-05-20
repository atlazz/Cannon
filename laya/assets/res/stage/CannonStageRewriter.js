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

for (var i = fromIdx; i <= toIdx; i++) {
    let fileName = i + ".lh";
	if (prefix) {
		fileName = prefix + fileName;
	}

    // read
    fs.readFile(fileName, (err, stage) => {
        if (err) throw err;
        console.log("Read file: " + fileName);

        stage = JSON.parse(stage.toString())
        for (let i = 0; i < stage.data.child.length; i++) {
            let item = stage.data.child[i];
            // stand cube
            if (item.props.name.indexOf("Cube") >= 0) {
                item.props.meshPath = "models/Cube.lm"
                item.props.materials = [];
            }
            // stand cylinder
            else if (item.props.name.indexOf("Cylinder") >= 0) {
                item.props.meshPath = "models/Cylinder.lm"
                item.props.materials = [];
            }
            // target cube
            else if (item.props.name.indexOf("Obstacles-Cube") >= 0) {
                item.props.meshPath = "models/Obstacles-Cube.lm"
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
        }

        var str = JSON.stringify(stage)
        // write
        fs.writeFile("out\\" + fileName, str, (err) => {
            if (err) throw err;
            console.log("Write file: " + "out\\" + fileName);
        });
    });
}