var statusKey = {
    stop: "stop",
    ready: "ready",
    playing: "playing"
};
var tagKey = {
    none: "",
    have: "!",
    doubt: "?"
};
var sandboxTmpl, flagTmpl, boxTmpl, matrixInfo, mineMatrix, openStatus, gameStatus;

function winReady() {
    mineMatrix = [];
    gameStatus = statusKey.stop;
    sandboxTmpl = document.getElementById("sandbox").outerHTML;
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
    let sandbox = document.getElementById("sandbox");
    sandbox.style["height"] = sumH + "px";
    sandbox.style["width"] = sumW + "px";

    let boxArr = [];
    mineMatrix = [];
    openStatus = [];
    for (let y = 0; y < h; y++) {
        let line = [];
        for (let x = 0; x < w; x++) {
            let tmp = boxTmpl.replace(/#x/g, x).replace(/#y/g, y);
            boxArr.push(tmp);
            line.push(0);
        }
        mineMatrix.push(line);
        openStatus.push(line);
    }
    sandbox.innerHTML = boxArr.join("");
    gameStatus = statusKey.ready;
}

function mouseUp(event, element) {
    if (event.button === 0) {
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
    gameStatus = statusKey.playing;
    let __matrixInfo = matrixInfo, __mineMatrix = mineMatrix;
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
    for (let i = 0; i < __matrixInfo.mCount; i++) {
        let randomX = randomNum(0, __matrixInfo.width - 1), randomY = randomNum(0, __matrixInfo.height - 1);
        if (!insideRange(randomX, randomY, around) && __mineMatrix[randomY][randomX] < 9) {
            __mineMatrix[randomY][randomX] += 9;
            // 遍历周围格子
            let tRange = getRange(randomX, randomY);
            for (let y = tRange[2]; y <= tRange[3]; y++) {
                for (let x = tRange[0]; x <= tRange[1]; x++) {
                    __mineMatrix[y][x]++;
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
    let blockX = parseInt(element.getAttribute("data-x")),
        blockY = parseInt(element.getAttribute("data-y")),
        __openStatus = openStatus, __statusKey = statusKey;
    // 判断是否已经打开
    if (__openStatus[blockY][blockX] > 0) {
        return;
    } else {
        __openStatus[blockY][blockX] = 1;
    }
    switch (gameStatus) {
        case __statusKey.ready:
            loadMine(blockX, blockY);
        case __statusKey.playing:
            // region // 显示盒子
            let flag = mineMatrix[blockY][blockX];
            if (flag < 1) {
                element.className = element.className.replace("close", "empty");
                openAround(blockX, blockY);
            } else {
                if (flag > 8) {
                    element.className = element.className.replace("close", "die");
                    element.innerHTML = flagTmpl.replace("#flag", "X");
                } else {
                    element.className = element.className.replace("close", "bc" + flag);
                    element.innerHTML = flagTmpl.replace("#flag", flag);
                }
            }
            element.onmouseup = null;
            // endregion
        default:
            return;
    }
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
    let inH = flagTmpl, __tagKey = tagKey;
    let attTag = "data-tag", defFlag = "#flag";
    let tag = element.getAttribute(attTag);
    switch (tag) {
        case __tagKey.none:
            tag = __tagKey.have;
            inH = inH.replace(defFlag, __tagKey.have);
            break;
        case __tagKey.have:
            tag = __tagKey.doubt;
            inH = inH.replace(defFlag, __tagKey.doubt);
            break;
        case __tagKey.doubt:
            tag = __tagKey.none;
            inH = inH.replace("visible", "hidden");
            break;
        default:
            tag = __tagKey.none;
    }
    element.setAttribute(attTag, tag);
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
    let __matrixInfo = matrixInfo, xyRange = [];
    xyRange[0] = x > 0 ? x - 1 : x;
    xyRange[1] = x < __matrixInfo.width - 1 ? x + 1 : x;
    xyRange[2] = y > 0 ? y - 1 : y;
    xyRange[3] = y < __matrixInfo.height - 1 ? y + 1 : y;
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
    // console.log("(%d, %d) %s", targetX, targetY, (inside ? "inside" : "outside"));
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