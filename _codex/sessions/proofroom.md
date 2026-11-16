# ProofRoom 当前交接 · 2026-11-16 · M28完成

## 项目与边界
- 业务根：/Users/cjjxw/codex/摄影选片平台/proofroom；Git agent/proofroom-local-main@a3873eb。M23–M28许多未提交文件及untracked长期文件均保留，先git status，不reset/覆盖/自动commit/push/deploy。
- /Users/cjjxw/codex/开发agent只是控制器；WorkBuddy旧工程与upstream仅参考，不回旧SQLite架构。当前React/Next16、Fastify、worker、PostgreSQL17，不换技术栈。
- 当前用户要求交接后新会话先只读确认，等下一条任务。无自动续做/重调研/全量测试/重启服务。

## 最新完成与证据
- M28 T126–127：长名称下方“展开完整名称”文字按钮移除，名称末尾18px箭头/44px触区；展开朝上、两行折叠、短名无箭头。覆盖Mine、摄影师/客户项目、公开工作室/套餐，客户品牌箭头统一；正文/问答/切换功能保留。
- 10唯一受影响增量闭环：m28-final 9过1减少动态时长断言→按既有0.01ms全局规则适配测试后m28-recheck 2新项过30.1s；非一次10全过。root/Web tsc、架构/diff过，7文件lint0错5旧警告与HEAD同规则。foundation_review仅静态独审无P1/P2。三张布局截图已看，320/390/1440/键盘/焦点/表单草稿不提交与项目数据不变通过。未称微信/手机真机/VO/生产验收。
- M27复制成功顶部Toast；M26手机胶囊/快捷操作、工作室管理在Mine；M25常用直达/低频更多与手机选择层；M24横条隐藏/右箭头末端淡出、吸顶、刷新加载、项目筛选即选即请求。既有功能/数据/登录保留，平台后台不动。
- 详情：specs/001-proofroom-platform/{tasks,plan,acceptance}.md，历史交接proofroom-through-m28.md仅定点查询。临时证据/tmp/proofroom-qa/apple-experience/m28-*可清理；源码/spec/tests长期保留。

## 本地运行与纪律
- QA http://127.0.0.1:18186/studio/mine；公开页 http://127.0.0.1:18186/t/experience-8e4929209248，交接前HTTP200；API18184。主Web18180/API18182，原版18332，原型18188均勿随意动。
- 固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin/node。复用现有QA，不next typegen/build与dev并发；受影响Playwright单worker/retries0，Web tsc直接--noEmit -p apps/web/tsconfig.json。
- 测试只写隔离fixture；体验数据只读。/tmp/proofroom-qa/product-experience-state.json含私密客户链接/账号，仅必要时本地读取，不打印/覆盖；project对象是创建快照，不是实时version。
- 产品UI沿Apple规范+现品牌，手机参考Vant交互、桌面侧栏；只外部客户/摄影师/Owner，平台业务/API/DB/upstream不碰。需新功能按现spec建task、增量测试/独审/验收，保旧工作区。

## 待办与已确认合并规则
当前UI批无剩余任务，等待新指令。原版全功能接回尚未完成，不能把UI验收称全部原版已合并。full-feature-merge-plan.md保原功能；冲突找用户：预约默认摄影师确认占档+可选即约；拍摄/收费图库/商店分别下载规则；超选默认线下+可选自动收费；普通图库LR原逻辑/P4新版本待确认旧交付有效；订阅按原Free/Pro收费。D07公平使用/人工配额优先级未答，不擅定。

## 新会话激活提示词
接手ProofRoom，先只读此文件及适用AGENTS.md并检查Git，8行内复述当前状态后等待新指令；不要主动改代码/跑测试/调研/重启/提交。不要用旧WorkBuddy交接取代当前业务根。
