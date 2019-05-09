# demo-mines
demo: find mines

# 190424
### 输/赢
- [x] 输
	- 打开所有地雷所在方块
	- 状态：lose
	- 出现透明板块，阻止鼠标接触盒子
	- 弹出Gome Over

- [x] 赢
	- 找到所有地雷
		- 标记出所有地雷
		- 未打开的盒子只剩下地雷
	- 状态：win
	- 出现透明板块，阻止鼠标接触盒子
	- 弹出Thank Play

### 增加进度信息
- [x] 进度：n/s（已标记/地雷总量）
- [x] 时间：--:--:-- 时分秒

### 功能性按钮
- [x] 暂停
	- 启用：playing
	- 暂停“进度信息”中的计时器
	- 更新状态：pause
	- 隐藏，并显示“继续”按钮
	- 出现透明板块，阻止鼠标点击盒子
- [x] 继续
	- 启用：pause
	- 继续“进度信息”中的计时器
	- 更新状态：playing
	- 隐藏，并显示“暂停”按钮
	- 隐藏透明板块，允许鼠标点击盒子
- [x] 重新开始
	- 启用：playing、pause、win、lose
	- 重新布置盒子矩阵、地雷矩阵
	- 更新状态：ready
- [x] 结束游戏
	- 启用：playing、pause、win、lose
	- 隐藏沙盒
	- 更新状态：stop

# 190507 TODO
### 操作优化
- [x] 添加quickOpen
	- 双击打开的方块
	- 判断：flag > 0 && openStatus == 1 && tag数量 == flag
	- judge为true：openAround

# 190509 TODO
### 优化quickOpen
- quickOpen后，连锁判断周围符合条件的盒子
	- 新增judgeQueue、judgeChain(打开的盒子, 回调)
		- judgeChain判断：flag > 0 && openStatus == 1 && tag数量 == flag
	- quickOpen调用judgeChain
	- quickOpen成功后插入queue
	- 遍历queue，调用judgeChain
