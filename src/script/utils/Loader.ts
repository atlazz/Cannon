const wx = window["wx"];

/**修改laya.wxmini.js */
// MiniFileMgr.readFile=function(filePath,encoding,callBack,readyUrl,isSaveFile,fileType,isAutoClear){
// 	(encoding===void 0)&& (encoding="ascill");
// 	(readyUrl===void 0)&& (readyUrl="");
// 	(isSaveFile===void 0)&& (isSaveFile=false);
// 	(fileType===void 0)&& (fileType="");
// 	(isAutoClear===void 0)&& (isAutoClear=true);
// 	filePath=URL.getAdptedFilePath(filePath);
// 	//**修改开始 */
// 	var nativeFilePath = filePath;
//  if(filePath.indexOf("http://") == -1 && filePath.indexOf("https://") == -1){
//     var fileInfo = MiniFileMgr.getFileInfo(filePath);
//     if(fileInfo){
//         nativeFilePath = MiniFileMgr.getFileNativePath(fileInfo.md5);
//     }
//  }
// 	MiniFileMgr.fs.readFile({filePath:nativeFilePath,encoding:encoding,success:function (data){
// 	//**修改结束 */
// 			if (filePath.indexOf("http://")!=-1 || filePath.indexOf("https://")!=-1){
// 				if(MiniAdpter.autoCacheFile || isSaveFile){
// 					MiniFileMgr.copyFile(filePath,readyUrl,callBack,encoding,isAutoClear);
// 				}
// 			}
// 			else
// 			callBack !=null && callBack.runWith([0,data]);
// 			},fail:function (data){
// 			if (data)
// 				callBack !=null && callBack.runWith([1,data]);
// 	}});
// }

class Loader {

    //debug会输出console.log内容
    public debug: boolean = true;
    //尝试失败次数
    private failCount: number = 0;

    constructor() { }

    private log(message?: any, ...optionalParams: any[]) {
        if (this.debug) {
            console.log.apply(this, arguments);
        }
    }

    /**获取文件夹的及其子文件的状态*/
    private stat(path: string, statMap: any) {
        let stats = wx.getFileSystemManager().statSync(path);
        if (stats.isDirectory()) {
            let files = wx.getFileSystemManager().readdirSync(path);
            for (let filename of files) {
                try {
                    this.stat(path + "/" + filename, statMap);
                } catch (e) {
                    //获取状态失败代表该文件不可用
                    this.log("stat fail: " + path + "/" + filename, e);
                }
            }
        } else {
            statMap[path] = stats;
        }
    }

    /**
     * 将zip文件存在本地并解压，存入MiniFileMgr缓存
     * @param url 远程路径
     * @param rootDir 解压包里面的根目录，只能有一个
     * @param complete 完成回调
     * @param excludeZipFileNames 每次下载新的zip前会清除其他zip，该参数为清除白名单
     */
    public loadZip(url: string, rootDir: string, complete?: Laya.Handler, excludeZipFileNames?: string[]) {
        //不在微信小游戏直接返回
        if (!Laya.Browser.onMiniGame) {
            complete && complete.runWith(false);
            return;
        }

        //没有url直接返回
        if (!url) {
            complete && complete.runWith(false);
            return;
        }

        this.failCount = 0;
        //解压并缓存
        this.unzipFile(url, rootDir, complete, excludeZipFileNames);
    }

    /**
     * 解压并缓存
     * @param url 远程路径
     * @param rootDir 解压包里面的根目录，只能有一个
     * @param complete 完成回调
     * @param excludeZipFileNames 每次下载新的zip前会清除其他zip，该参数为清除白名单
     */
    private unzipFile(url: string, rootDir: string, complete?: Laya.Handler, excludeZipFileNames?: string[]) {
        let temp = url.split("/");
        let fileName = temp[temp.length - 1];
        let zipBaseDir = wx.env.USER_DATA_PATH + "/zip/";

        //zip文件路径
        let zipFilePath = zipBaseDir + fileName;
        //zip解压路径
        let unzipFileDir = Laya['MiniFileMgr'].getFileNativePath("");

        //解压
        wx.getFileSystemManager().unzip({
            zipFilePath: zipFilePath,
            targetPath: unzipFileDir,
            success: () => {
                this.log("unzip success");
                let statMap = {};
                try {
                    //获取解压的所有文件状态
                    this.stat(unzipFileDir + rootDir, statMap);
                    this.log("stat success");
                } catch (e) {
                    this.log("stat fail", e);
                    //失败则清除该文件夹下所有文件
                    this.cleanDir(unzipFileDir + rootDir);
                    complete && complete.runWith(false);
                    return;
                }

                let fileUrlArrays: string[][] = [];
                for (let unzipFilePath in statMap) {
                    let readyUrl = unzipFilePath.replace(unzipFileDir, "");
                    let ext = Laya.Utils.getFileExtension(readyUrl);
                    if ([].indexOf(ext) !== -1) { //忽略的后缀名
                        continue;
                    } else {
                        fileUrlArrays.push([unzipFilePath, readyUrl]);
                    }
                }
                let readFileCount = fileUrlArrays.length;
                //没有文件则直接返回
                if (!readFileCount) {
                    complete && complete.runWith(false);
                    return;
                }

                if (!Laya['MiniFileMgr'].filesListObj['fileUsedSize']) {
                    Laya['MiniFileMgr'].filesListObj['fileUsedSize'] = 0;
                }
                //将所有解压的文件写入filesListObj
                for (let i = 0; i < fileUrlArrays.length; i++) {
                    let fileUrlArr = fileUrlArrays[i];
                    let unzipFilePath = fileUrlArr[0];
                    let readyUrl = fileUrlArr[1];
                    let fileSize: number = statMap[unzipFilePath].size || 0;
                    let encoding = this.getEncoding(readyUrl);

                    if (Laya['MiniFileMgr'].filesListObj[readyUrl]) {
                        let size = parseInt(Laya['MiniFileMgr'].filesListObj[readyUrl].size) || 0;
                        Laya['MiniFileMgr'].filesListObj['fileUsedSize'] = parseInt(Laya['MiniFileMgr'].filesListObj['fileUsedSize']) + fileSize - size;
                    } else {
                        Laya['MiniFileMgr'].filesListObj['fileUsedSize'] = parseInt(Laya['MiniFileMgr'].filesListObj['fileUsedSize']) + fileSize;
                    }
                    Laya['MiniFileMgr'].filesListObj[readyUrl] = { md5: readyUrl, readyUrl: readyUrl, size: fileSize, times: Laya.Browser.now(), encoding: encoding };
                }
                this.saveFileListObj();
                complete && complete.runWith(true);
            },
            fail: (res: any) => {
                this.log("unzip fail");
                this.failCount++;
                //解压3次失败后直接返回
                if (this.failCount >= 3) {
                    complete && complete.runWith(false);
                    return;
                }
                //不能访问则创建文件夹
                try {
                    wx.getFileSystemManager().accessSync(zipBaseDir);
                    //清除zip包的文件夹下的文件
                    this.cleanDir(zipBaseDir, excludeZipFileNames);
                    //清除zip解压文件路径rootDir文件夹下的文件
                    this.cleanDir(unzipFileDir + rootDir);
                } catch (e) {
                    this.log("mkdir", zipBaseDir);
                    wx.getFileSystemManager().mkdir({ dirPath: zipBaseDir });
                }
                //从远程下载zip文件
                wx.downloadFile({
                    url: url,
                    filePath: zipFilePath,
                    success: () => {
                        this.log("downloadFile success");
                        this.unzipFile(url, rootDir, complete, excludeZipFileNames);
                    },
                    fail: () => {
                        this.log("downloadFile fail");
                        complete && complete.runWith(false);
                    },
                });
            },
        });
    }

    /**清除一个文件夹下的所有文件 */
    private cleanDir(dirPath: string, excludeFileNames?: string[]) {
        if (dirPath.charAt(dirPath.length - 1) === "/") {
            dirPath = dirPath.slice(0, dirPath.length - 1);
        }
        let statMap = {};
        try {
            //遍历文件夹
            this.stat(dirPath, statMap);
            this.log("cleanDir stat success");
        } catch (e) {
            this.log("cleanDir stat fail");
        }
        //遍历文件状态
        for (let filePath in statMap) {
            if (excludeFileNames && excludeFileNames.length) {
                let readyUrl = filePath.replace(dirPath + "/", "");
                if (excludeFileNames.indexOf(readyUrl) !== -1) {
                    continue;
                }
            }
            //删除文件
            wx.getFileSystemManager().unlink({
                filePath: filePath,
                success: () => {
                    this.log("unlink success");
                },
                fail: () => {
                    this.log("unlink fail");
                },
            });
        }
        //如果文件夹路径是laya本地缓存路径，从文件列表filesListObj里删除
        if ((dirPath + "/").indexOf(Laya['MiniFileMgr'].getFileNativePath("")) === 0) {
            let fileListChangeFlag = false;
            //相对文件夹
            let dir = (dirPath + "/").replace(Laya['MiniFileMgr'].getFileNativePath(""), "");
            this.log("cleanDir: ", dir);
            for (let readyUrl in Laya['MiniFileMgr'].filesListObj) {
                if (readyUrl.indexOf(dir) === 0) {
                    fileListChangeFlag = true;
                    let fileInfo = Laya['MiniFileMgr'].filesListObj[readyUrl];
                    Laya['MiniFileMgr'].filesListObj['fileUsedSize'] = parseInt(Laya['MiniFileMgr'].filesListObj['fileUsedSize']) - (parseInt(fileInfo.size) || 0);
                    delete Laya['MiniFileMgr'].filesListObj[readyUrl];
                }
            }
            if (fileListChangeFlag && dir) {
                this.saveFileListObj();
            }
        }
    }

    /**文件信息列表写入文件系统*/
    private saveFileListObj() {
        wx.getFileSystemManager().writeFile({
            filePath: Laya['MiniFileMgr'].fileNativeDir + "/" + Laya['MiniFileMgr'].fileListName,
            encoding: 'utf8',
            data: JSON.stringify(Laya['MiniFileMgr'].filesListObj),
        });
        this.log("filesListObj", Laya['MiniFileMgr'].filesListObj);
    }

    /**从url解析出文件的字符编码*/
    private getEncoding(url): string {
        let type = Laya.Loader.getTypeFromUrl(url);
        let contentType;
        if (!type) {
            let ext = Laya.Utils.getFileExtension(url);
            switch (ext) {
                case "lh":
                case "ls":
                case "lmat":
                case "ltc":
                case "lav":
                    contentType = "json";
                    break;
                case "lm":
                case "lani":
                    contentType = "arraybuffer";
                    break;
            }
            if (contentType) {
                return Laya.MiniAdpter.getUrlEncode(url, contentType);
            }
        }
        switch (type) {
            case /*laya.net.Loader.ATLAS*/"atlas":
            case /*laya.net.Loader.PREFAB*/"prefab":
            case /*laya.net.Loader.PLF*/"plf":
                contentType =/*laya.net.Loader.JSON*/"json";
                break;
            case /*laya.net.Loader.FONT*/"font":
                contentType =/*laya.net.Loader.XML*/"xml";
                break;
            case /*laya.net.Loader.PLFB*/"plfb":
            case "image":
            case "sound":
                contentType =/*laya.net.Loader.BUFFER*/"arraybuffer";
                break;
            default:
                contentType = type;
        }
        return Laya.MiniAdpter.getUrlEncode(url, contentType);
    }
}

export default new Loader();