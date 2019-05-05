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
    win: "大佬",
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
    gameStatus;

/**
 * 初始化
 */
function winReady() {
    mineMatrix = [];
    gameStatus = statusKey.stop;
    flagTmpl = "<b class='flag' style='visibility: visible'>#flag</b>";
    boxTmpl = "<div id='mb-#x-#y' class='tmpl close' " +
        "data-x='#x' data-y='#y' data-mine='0' data-tag='' " +
        "oncontextmenu='return false' onmouseup='mouseUp(event, this)'>" +
        flagTmpl.replace("visible", "hidden") + "</div>"
}

/**
 * 加载雷区方块
 *
 * @param w {Number} 宽
 * @param h {Number} 高
 */
function loadBlocks(w, h) {
    matrixInfo = {
        width: w,
        height: h,
        mCount: w * h / 6.4
    };

    let sumW = (30 + 4) * w;
    let sumH = (30 + 4) * h;

    // 设置沙盒大小
    let cover = document.getElementById("cover");
    let epitaph = document.getElementById("epitaph");
    let sandbox = document.getElementById("sandbox");
    cover.style["visibility"] = "hidden";
    sandbox.style["width"] = cover.style["width"] = sumW + "px";
    sandbox.style["height"] = cover.style["height"] = sumH + "px";
    sandbox.style["height"] = cover.style["height"] = epitaph.style["line-height"] = sumH + "px";

    // 初始化矩阵，布置地雷盒子
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

    // ready 阶段先执行布雷函数
    if (gameStatus === statusKey.ready) loadMine(blockX, blockY);
    // region // 显示盒子
    let flag = mineMatrix[blockY][blockX];
    if (flag < 1) {
        element.className = element.className.replace("close", "empty");
        openAround(blockX, blockY);
    } else {
        if (flag > 8) {
            // 输了，game over
            gameStatus = statusKey.lose;
            // 提示语
            let msgLen = msgKey.lose.length;
            let index = lostCount >= msgLen ? msgLen - 1 : lostCount++;
            // 动态提示语
            let epitaph = document.getElementById("epitaph");
            epitaph.className = "loseMsg";
            epitaph.innerText = msgKey.lose[index];
            // 让透明盖子出现，阻止点击盒子
            let cover = document.getElementById("cover");
            cover.style["visibility"] = "visible";
            // 雷区格子内容
            element.innerHTML = flagTmpl.replace("#flag", "X");
            element.className = element.className.replace("close", "die");
            // TODO 打开所有未标记的地雷
        } else {
            element.className = element.className.replace("close", "bc" + flag);
            element.innerHTML = flagTmpl.replace("#flag", flag);
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
            inH = inH.replace(defFlag, tag = tagKey.have);
            break;
        case tagKey.have:
            inH = inH.replace(defFlag, tag = tagKey.doubt);
            break;
        default:
        case tagKey.doubt:
            tag = tagKey.none;
            inH = inH.replace("visible", "hidden");
            break;
    }
    element.setAttribute(attKey, tag);
    element.innerHTML = inH;
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
