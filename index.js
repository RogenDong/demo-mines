/**
 * 失败次数
 * @type {number}
 */
var lostCount = 0;
/**
 * 字典：游玩状态
 * @type {{stop: string, ready: string, playing: string}}
 */
var statusKey = {
    /**
     * 赢
     */
    win: "win",
    /**
     * 输
     */
    lose: "lose",
    /**
     * 停止
     */
    stop: "stop",
    /**
     * 准备
     */
    ready: "ready",
    /**
     * 暂停
     */
    pause: "pause",
    /**
     * 游玩中
     */
    playing: "playing"
};
/**
 * 字典：右键标签
 * @type {{have: string, doubt: string, none: string}}
 */
var tagKey = {
    none: "",
    have: "!",
    doubt: "?"
};
/**
 * 提示语
 * @type {{lose: string[], win: string}}
 */
var msgKey = {
    win: "WIN",
    lose: [
        "DIE",
        "菜",
        "?"
    ]
};
/**
 * 模板：提醒/标记
 */
var flagTmpl,
    /**
     * 模板：地雷盒子基础
     */
    boxTmpl,
    /**
     * 显示找到的地雷
     */
    foundSpan,
    /**
     * 显示游戏进行时间
     */
    gameTimeSpan,
    /**
     * 模式选择按钮
     */
    modBtns,
    /**
     * 游戏选项按钮组
     */
    optBtns,
    /**
     * 游戏选项按钮集合
     */
    optBtnArr,
    /**
     * 游戏进度信息
     */
    gameProgress,
    /**
     * 矩阵信息
     */
    matrixInfo,
    /**
     * 矩阵：地雷位置
     */
    mineMatrix,
    /**
     * 矩阵：地雷盒子打开状态
     */
    openStatus,
    /**
     * 游玩状态
     */
    gameStatus,
    /**
     * 计时器：游戏进度
     */
    progressInterval;

/**
 * 初始化
 */
function winReady() {
    mineMatrix = [];
    gameStatus = statusKey.stop;
    // region // 初始化显示单元
    flagTmpl = "<b class='flag' style='visibility: visible'>#flag</b>";
    boxTmpl = "<div id='mb-#x-#y' class='tmpl close' " +
        "data-x='#x' data-y='#y' data-mine='0' data-tag='' " +
        "oncontextmenu='return false' onmouseup='mouseUp(event, this)'>" +
        flagTmpl.replace("visible", "hidden") + "</div>";
    foundSpan = document.getElementById("found");
    gameTimeSpan = document.getElementById("gameTime");
    // endregion

    // region // 初始化按钮组
    modBtns = document.getElementById("modBtns");
    optBtnArr = {};
    optBtnArr['sb'] = document.getElementById("stopBtn");
    optBtnArr['pb'] = document.getElementById("pauseBtn");
    optBtnArr['cb'] = document.getElementById("continueBtn");
    optBtnArr['mb'] = document.getElementById("changeModBtn");
    optBtns = document.getElementById("optBtns");
    optBtns.style['display'] = "none";
    // 隐藏进度信息
    document.getElementById("progressInfo").style['display'] = "none";
    // endregion
}

/**
 * 加载雷区方块
 *
 * @param w {Number} 宽
 * @param h {Number} 高
 */
function loadBlocks(w, h) {
    // 重置进度
    resetGameProgress();

    // 改变模式时重置嘲讽等级
    if (matrixInfo != null) {
        if (w !== matrixInfo.width || h !== matrixInfo.height) {
            lostCount = 0;
        }
    }

    // region // 初始化宽高
    matrixInfo = {
        width: w,
        height: h,
        mCount: w * h / 6.4
    };
    let sumW = (30 + 4) * w;
    let sumH = (30 + 4) * h;
    foundSpan.innerText = 0;
    document.getElementById("mineNum").innerText = matrixInfo.mCount;
    // endregion

    // region // 设置沙盒大小
    let cover = document.getElementById("cover");
    let epitaph = document.getElementById("epitaph");
    let sandbox = document.getElementById("sandbox");
    epitaph.innerText = "";
    cover.style["visibility"] = "hidden";
    sandbox.style['display'] = null;
    sandbox.style["width"] = cover.style["width"] = sumW + "px";
    sandbox.style["height"] = cover.style["height"] = sumH + "px";
    sandbox.style["height"] = cover.style["height"] = epitaph.style["line-height"] = sumH + "px";
    // endregion

    // region // 初始化矩阵，布置地雷盒子
    let boxArr = [];
    mineMatrix = [];
    openStatus = [];
    boxArr.push(cover.outerHTML);
    for (let y = 0; y < h; y++) {
        let line1 = [];
        let line2 = [];
        for (let x = 0; x < w; x++) {
            let tmp = boxTmpl.replace(/#x/g, x).replace(/#y/g, y);
            boxArr.push(tmp);
            line1.push(0);
            line2.push(0);
        }
        mineMatrix.push(line1);
        openStatus.push(line2);
    }
    sandbox.innerHTML = boxArr.join("");
    // endregion

    // region // 初始化游戏进度
    gameProgress = {};
    gameProgress['time'] = 0;
    gameProgress['foundMine'] = 0;
    gameProgress['closed'] = w * h;
    // endregion

    // region // 控制按钮的显示、隐藏、禁用
    modBtns.style['display'] = "none";
    optBtns.style['display'] = "inline-block";
    // 禁用暂停按钮
    optBtnArr.pb.disabled = true;
    // 隐藏继续按钮
    optBtnArr.cb.style['display'] = "none";
    // 禁用结束按钮
    optBtnArr.sb.disabled = true;
    // 隐藏“重新开始”按钮
    document.getElementById("retryBtn").style['visibility'] = 'hidden';
    // endregion

    // 显示进度信息
    document.getElementById("progressInfo").style['display'] = null;

    gameStatus = statusKey.ready;
}

/**
 * 鼠标按键弹起事件
 *
 * @param event 点击事件
 * @param element 被点击按钮的dom
 */
function mouseUp(event, element) {
    if (event.button === 0) {
        // 当：“正在游玩” && 打了标记 时不打开盒子
        if (gameStatus === statusKey.playing && element.getAttribute("data-tag") === tagKey.have) return;
        openBlock(element);
    } else if (event.button === 2) {
        if (gameStatus === statusKey.playing) {
            setTag(element);
        }
    }
}

/**
 * 加载矩阵
 *
 * @param firstX {Number} 起始点开的格子 - x轴
 * @param firstY {Number} 起始点开的格子 - y轴
 */
function loadMine(firstX, firstY) {
    // 运行状态变更为游玩中
    gameStatus = statusKey.playing;
    // 启用暂停按钮、变更难度按钮
    optBtnArr.pb.disabled = false;
    optBtnArr.sb.disabled = false;

    // region // 获取起始点周围坐标
    let around = [];
    let centerRange = getRange(firstX, firstY);
    for (let y = centerRange[2]; y <= centerRange[3]; y++) {
        for (let x = centerRange[0]; x <= centerRange[1]; x++) {
            around.push([x, y]);
        }
    }
    // endregion
    // region // 布雷
    for (let i = 0; i < matrixInfo.mCount; i++) {
        // 随机抽一个格子（random-x，random-y）
        let randomX = randomNum(0, matrixInfo.width - 1), randomY = randomNum(0, matrixInfo.height - 1);
        // 当：不在初始盒子范围内 && 抽中的格子没有雷 时才布置地雷
        if (!insideRange(randomX, randomY, around) && mineMatrix[randomY][randomX] < 9) {
            // 最高危险系数为 8，超过 8 便是地雷
            mineMatrix[randomY][randomX] = 9;
            // 遍历地雷周围的 8 个格子，危险系数自增 1
            let tRange = getRange(randomX, randomY);
            for (let y = tRange[2]; y <= tRange[3]; y++) {
                for (let x = tRange[0]; x <= tRange[1]; x++) {
                    mineMatrix[y][x]++;
                }
            }
        } else {
            i--;
        }
    }
    // endregion
}

/**
 * 打开盒子，改变样式
 *
 * @param element {Element} 触发的盒子
 */
function openBlock(element) {
    // 取坐标
    let blockX = parseInt(element.getAttribute("data-x")),
        blockY = parseInt(element.getAttribute("data-y"));

    // 已经打开的盒子，不再继续操作
    if (openStatus[blockY][blockX] > 0) return;
    // 没打开过就设置为打开
    openStatus[blockY][blockX] = 1;
    // 未打开的盒子数量减1
    gameProgress.closed--;

    // ready 阶段先执行布雷函数
    if (gameStatus === statusKey.ready) {
        loadMine(blockX, blockY);
        // 开始计时
        progressInterval = setInterval(function () {
            gameTimeSpan.innerText = timeFormat(gameProgress.time++);
        }, 1000);
    }

    // region // 显示盒子
    let flag = mineMatrix[blockY][blockX];
    if (flag < 1) {
        element.className = element.className.replace("close", "empty");
        openAround(blockX, blockY);
    } else {
        if (flag > 8) {
            gameOver();
            // 雷区格子内容
            element.innerHTML = flagTmpl.replace("#flag", "X");
            element.className = element.className.replace("close", "die");
            // TODO 打开所有未标记的地雷
        } else {
            element.className = element.className.replace("close", "bc" + flag);
            element.innerHTML = flagTmpl.replace("#flag", flag);
            // 若剩余未打开盒子数量等于地雷数量，表示赢得游戏
            if (gameProgress.closed <= matrixInfo.mCount) {
                win();
            }
        }
    }
    element.onmouseup = null;
    // endregion
}

/**
 * 打开周围9个区域的格子
 *
 * @param centerX {Number} 中心-x轴
 * @param centerY {Number} 中心-y轴
 */
function openAround(centerX, centerY) {
    // 遍历周围的盒子，全部打开
    let xyRange = getRange(centerX, centerY);
    for (let y = xyRange[2]; y <= xyRange[3]; y++) {
        for (let x = xyRange[0]; x <= xyRange[1]; x++) {
            openBlock(document.getElementById("mb-" + x + "-" + y));
        }
    }
}

/**
 * 设置标记
 * 去除左键点击事件
 * 推进进度
 *
 * @param element {Element} 目标元素
 */
function setTag(element) {
    let inH = flagTmpl;
    let attKey = "data-tag", defFlag = "#flag";
    let tag = element.getAttribute(attKey);
    switch (tag) {
        case tagKey.none:
            gameProgress.foundMine++;
            inH = inH.replace(defFlag, tag = tagKey.have);
            break;
        case tagKey.have:
            if (gameProgress.foundMine > 0) gameProgress.foundMine--;
            inH = inH.replace(defFlag, tag = tagKey.doubt);
            break;
        default:
        case tagKey.doubt:
            tag = tagKey.none;
            inH = inH.replace("visible", "hidden");
            break;
    }
    foundSpan.innerText = gameProgress.foundMine;
    element.setAttribute(attKey, tag);
    element.innerHTML = inH;
}

/**
 * 完成游戏
 */
function win() {
    // 赢了
    gameStatus = statusKey.win;
    // 防点击
    preventClick();
    // 动态提示语
    let epitaph = document.getElementById("epitaph");
    epitaph.className = "winMsg";
    epitaph.innerText = msgKey.win;
}

/**
 * 失败
 */
function gameOver() {
    // 输了，game over
    gameStatus = statusKey.lose;
    // 防点击
    preventClick();
    // 提示语
    let msgLen = msgKey.lose.length;
    let index = lostCount >= msgLen ? msgLen - 1 : lostCount++;
    // 动态提示语
    let epitaph = document.getElementById("epitaph");
    epitaph.className = "loseMsg";
    epitaph.innerText = msgKey.lose[index];
}

/**
 * 弹出蒙板，防止点击盒子
 */
function preventClick() {
    // 让透明盖子出现，阻止点击盒子
    let cover = document.getElementById("cover");
    cover.style["visibility"] = "visible";
    // 禁用按钮、停止计时、显示“重新开始”
    optBtnArr.pb.disabled = true;
    clearInterval(progressInterval);
    document.getElementById("retryBtn").style['visibility'] = 'visible';
}

/**
 * 重新开始
 */
function retryGame() {
    changeMod();
    let w = matrixInfo.width,
        h = matrixInfo.height;
    loadBlocks(w, h);
}

/**
 * 暂停游戏
 */
function pauseGame() {
    gameStatus = statusKey.pause;
    // 停止计时
    clearInterval(progressInterval);
    // 隐藏暂停，显示继续
    optBtnArr.cb.style['display'] = null;
    optBtnArr.pb.style['display'] = 'none';
    // 让透明盖子出现，阻止点击盒子
    document.getElementById("cover").style["visibility"] = "visible";
}

/**
 * 继续游戏
 */
function continueGame() {
    gameStatus = statusKey.playing;
    // 隐藏暂停，显示继续
    optBtnArr.pb.style['display'] = null;
    optBtnArr.cb.style['display'] = 'none';
    // 继续计时
    progressInterval = setInterval(function () {
        gameTimeSpan.innerText = timeFormat(gameProgress.time++);
    }, 1000);
    // 隐藏盖子
    document.getElementById("cover").style["visibility"] = "hidden";
}

/**
 * 改变游戏难度
 */
function changeMod() {
    // 暂停游戏
    pauseGame();
    // 重置进度
    resetGameProgress();
    optBtnArr.pb.style['display'] = null;
    // 隐藏选项按钮组、进度信息
    document.getElementById("progressInfo").style['display'] =
        optBtns.style['display'] = 'none';
    // 显示难度选择器
    modBtns.style['display'] = "inline-block";
}

/**
 * 结束游戏
 */
function stopGame() {
    // 隐藏沙盒
    document.getElementById("sandbox").style['display'] = 'none';
    // 通过“改变难度”的执行过程隐藏按钮组
    changeMod();
    // 状态改为停止
    gameStatus = statusKey.stop;
}

/**
 * 重置游戏进度
 */
function resetGameProgress() {
    clearInterval(progressInterval);
    gameProgress = {};
    gameProgress.time = 0;
    gameProgress.foundMine = 0;
    gameTimeSpan.innerText = "--:--:--";
}

/**
 * 获取九格内 x、y 的值域
 *
 * @param x {Number} 中心-x轴
 * @param y {Number} 中心-y轴
 * @return {Array} 值域数组：[xMin, xMax, yMin, yMax]
 */
function getRange(x, y) {
    let xyRange = [];
    xyRange[0] = x > 0 ? x - 1 : x;
    xyRange[1] = x < matrixInfo.width - 1 ? x + 1 : x;
    xyRange[2] = y > 0 ? y - 1 : y;
    xyRange[3] = y < matrixInfo.height - 1 ? y + 1 : y;
    return xyRange;
}

/**
 * 判断是否在指定范围内
 *
 * @param targetX {Number} 中心 - x轴
 * @param targetY {Number} 中心 - y轴
 * @param rangeArr {Array} 范围指标
 * @return {Boolean} 是否在范围内
 */
function insideRange(targetX, targetY, rangeArr) {
    let inside;
    for (let x = 0; x < rangeArr.length; x++) {
        inside = (rangeArr[x][0] === targetX && rangeArr[x][1] === targetY);
        if (inside) break;
    }
    return inside;
}

/**
 * 获取指定范围的整数随机数
 *
 * @param min {Number} 最小值
 * @param max {Number} 最大值
 * @return {number} min~max 以内，并包括 min 和 max 的随机数
 */
function randomNum(min, max) {
    return parseInt((Math.random() * (max - min + 1) + min), 10);
}

/**
 * 时间格式化
 *
 * @param {Number} time 毫秒
 * @return {String} 格式化时间串
 */
function timeFormat(time) {
    function addZero(num) {
        return (num < 10 ? "0" : "") + num;
    }
    let fm = "00:00:00";
    if (time > 0) {
        let s = time >= 60 ? addZero(parseInt(time % 60)) : addZero(time);
        let m = time >= 60 ? addZero(parseInt(time / 60)) : "00";
        let h = time >= 360 ? addZero(parseInt(time / 360)) : "00";
        fm = h + ":" + m + ":" + s;
    }
    return fm;
}
