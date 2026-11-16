# Tasks: 多工作室摄影选片平台
Input: spec.md / plan.md / data-model.md / contracts/；需求正本 ../需求规格与实施方案.md。
所有任务必做，阶段完成不等于整个平台完成；用户已授权自动连续推进、本地不部署。只在实际执行验收后打勾。

## M0 · Setup
独立验收：见plan与具体任务验收。

- [x] T001 冻结ProofRoom eff48d0/原锁/Node22，隔离原版构建与来源记录于 specs/001-proofroom-platform/research.md
- [x] T002 用已安装spec-kit生成spec/plan/data-model/contracts/quickstart/tasks，保留全FR/UI/CU/AT映射于 specs/001-proofroom-platform/

## M1 · Foundational
独立验收：见plan与具体任务验收。

- [x] T003 建立npm workspaces apps/web、apps/api、apps/worker、packages/*及各自构建命令 package.json
- [x] T004 实现普通PG池/tagged SQL/单连接事务、独立迁移与复合租户约束 packages/db/
- [x] T005 实现统一输入/响应/错误和API client、Web依赖边界 guards packages/contracts/ 与 tests/platform/architecture.test.ts
- [x] T006 隔离本机PG/S3/日志与Web/API启动配置 scripts/local.mjs、.env.example
- [x] T007 真实PG验证类型/回滚/参数/迁移幂等与最小JSON读写 apps/api/src/app.ts、tests/platform/foundation.test.ts

## M2 · 工作室与账号
独立验收：两工作室账户与权限正负向及中文Web。

- [x] T008 [US1] 实现注册/登录/退出/密码/强制改密/会话撤销/限流/Origin packages/domain/auth.ts、apps/api/src/app.ts（身份限制已验证；平台禁用/强制改密控制台由T040完成）
- [x] T009 [US1] 工作室创建/切换、邀请/接受/角色/移除/所有权 packages/domain/tenancy.ts、apps/api/src/app.ts
- [ ] T010 [US1] 平台工作室状态/配额/只读支持/审计与live membership校验 apps/api/src/platform.ts
- [x] T011 [US1] 中文登录/注册/框架/切换/成员/账号/平台UI apps/web/src/features/account.tsx，覆盖UI01-03/34
- [x] T012 [US1] 两租户/多角色/双标签/移除/只读/暂停及Web正负向 tests/platform/tenancy.test.ts、tests/e2e/account.spec.ts

## M3 · 展示、问卷与咨询
独立验收：新旧版本公开表单→咨询→私密回执，配置全UI。

- [x] T013 [US2] 品牌/默认八题/问卷schema/套餐FAQ配置CAS与版本 packages/contracts/config.ts、packages/domain/config.ts
- [x] T014 [US2] 主动公开作品S3压缩去EXIF/分组/排序/删除/安全旧引用 apps/api/src/portfolio.ts
- [x] T015 [US2] 公开配置/档期、严格白名单咨询/幂等/限流/私密回执 packages/domain/inquiries.ts、apps/api/src/public.ts
- [x] T016 [US2] 公开主页/十五图/动态问卷/绑定版本草稿/回执 apps/web/src/features/public.tsx，覆盖CU01-03
- [x] T017 [US2] 摄影师品牌/作品/问卷/套餐FAQ全交互及咨询列表详情 apps/web/src/features/settings.tsx、inquiries.tsx，覆盖UI06-07/23-27；配置/列表/历史答卷与UI07双重确认接单、冲突保本单输入均已验
- [x] T018 [US2] 版本409/十五边界/快照/回执隐私与UI恢复 tests/platform/presales.test.ts、tests/e2e/presales.spec.ts

## M4 · 接单、项目与预约
独立验收：并发接单/预约与快照、工作台/详情完整。

- [x] T019 [US3] 咨询确认/手工建单事务、幂等/快照/随机项目入口 packages/domain/orders.ts、apps/api/src/orders.ts
- [x] T020 [US3] 时段重叠/占用/改期原子性/取消预约与合作恢复 packages/domain/bookings.ts、apps/api/src/bookings.ts
- [x] T021 [US3] 聚合行动中心/游标列表/历史两日历月/恢复可见/批量逐资源权限 apps/api/src/dashboard.ts
- [ ] T022 [US3] 工作台/搜索筛选滚动与返回/新建/详情概览/复制文案/只读预览 apps/web/src/features/projects.tsx，覆盖UI04-10/17-18/22；M4工作台/列表/概览/复制/历史已验，客户照片只读预览待T030/T031接入后收口
- [x] T023 [US3] 预约编辑/改期/取消恢复/历史手机桌面交互 apps/web/src/features/schedule.tsx，覆盖UI20-21/28
- [x] T024 [US3] 并发确认/抢档/回滚/约定冻结/历史边界与前端 tests/platform/orders.test.ts、tests/e2e/orders.spec.ts

## M5 · 原片和选片
独立验收：4原片整批→客户选3备注→P3，失败/恢复/隔离。

- [ ] T025 [US4] S3私有源与衍生/公开隔离、配额预留/确认/释放 packages/storage/index.ts、packages/domain/uploads.ts
- [ ] T026 [US4] 持久期望批次/每文件回执/安全字节入口/去重/失败重试移除 apps/api/src/uploads.ts
- [ ] T027 [US4] pg-boss持久任务/sharp压缩/对账/重启扫描/P1自动P2 apps/worker/src/main.ts、packages/domain/media.ts
- [ ] T028 [US4] PIN用途隔离/30天会话/五次限流、当前选片星级颜色多备注/最小基线与提交 apps/api/src/client.ts、packages/domain/selections.ts
- [ ] T029 [US4] 原生多选/拖入/队列/进度/恢复/离开保护摄影师上传 apps/web/src/features/uploads.tsx，覆盖UI11/14-16；队列/恢复/离开已验，原生系统窗口暂受CUA目标变化/无窗口限制，不能以自动setFiles关闭
- [ ] T030 [US4] 客户PIN/项目空间/选片/超选/完成改选与只读预览 apps/web/src/features/client.tsx，覆盖CU04-07/09
- [x] T031 [US4] 灯箱触摸缩放/方向键焦点/清单CSV/文件名复制 apps/web/src/features/photos.tsx，覆盖UI12/32/35-37
- [x] T032 [US4] 坏图/丢响应/重启/清单未知/用途与媒体隔离 tests/platform/media.test.ts、tests/e2e/selection.spec.ts

## M6 · 精修与交付
独立验收：精修严格齐套→交付，源字节/期限/幂等。

- [ ] T033 [US5] 稳定编号/前后缀匹配/歧义重复/人工CAS/旧回调严格阻断 packages/domain/delivery.ts
- [ ] T034 [US5] 批次齐套自动P4/首次期限/补片不续期/定期归档 packages/domain/lifecycle.ts、apps/worker/src/main.ts
- [ ] T035 [US5] 受控源字节/Range/单图/ZIP持久任务与清单版本缓存 packages/domain/downloads.ts、apps/api/src/downloads.ts
- [ ] T036 [US5] 续期幂等/版本/链接不变、Owner相邻异常纠正与旧兼容显式政策 apps/api/src/lifecycle.ts
- [ ] T037 [US5] 精修缺失/人工对应/冲突保选择/交付下载优先/续期确认 apps/web/src/features/delivery.tsx，覆盖UI13/19/33、CU08
- [ ] T038 [US5] SHA256/CRC/三ZIP/Range/补片/十次下载/到期/迟到worker tests/platform/delivery.test.ts、tests/e2e/delivery.spec.ts

## M7 · 完整交互与运维
独立验收：全部交互、异常与隔离恢复，不以模拟代真机。

- [ ] T039 [US6] 图库创建/复制/分类/搜索/排序/可见/删除/分享保项目不变量 apps/api/src/galleries.ts、apps/web/src/features/galleries.tsx，覆盖UI30-33
- [ ] T040 [US6] MFA/账号安全（补齐平台工作人员禁用/强制改密控制台与实际入口）/帮助/平台健康与中文权限状态 apps/web/src/features/account.tsx、help.tsx，覆盖UI23/34
- [ ] T041 [US6] 数据库+媒体+身份必要配置备份（租户导出不得包含全局APP_SECRET/其他租户身份；必要秘密重新封装，受控全量备份与租户导出分开）与独立副本恢复/迁移回退方案 scripts/backup.mjs、specs/001-proofroom-platform/migration.md
- [ ] T042 [US6] 前端离线/截断JSON/超时/401-5xx/草稿恢复/统一弹层焦点与下拉刷新 apps/web/src/components/、tests/e2e/errors.spec.ts
- [ ] T043 [US6] 全部UI01-37/CU01-09逐页320/390/393/1280操作验收及完整单 tests/e2e/full-flow.spec.ts、specs/001-proofroom-platform/acceptance.md
- [ ] T044 [US6] 隔离恢复/API与Worker重启/存储异常/配额竞争与有界容量 tests/platform/recovery.test.ts

## M8 · Polish and local release
独立验收：见plan与具体任务验收。

- [ ] T045 Web/API/Worker独立构建/类型/lint/依赖与secret guard scripts/check-architecture.mjs、各app/package.json
- [ ] T046 集成本地AT01-28记录，真实设备/生产未测边界与启动回退说明 specs/001-proofroom-platform/acceptance.md、quickstart.md
- [ ] T047 非实现者独立复核整批变更与验收证据，修阻塞项并跑受影响检查 _codex/sessions/proofroom.md
- [ ] T048 保持本地服务运行，验证预览入口/注册与关键链路后交付链接 README.md

## Dependencies & Execution Order
M0→M1→US1底座→US2→US3→US4→US5→US6→M8。T010的媒体/导出统一策略须等T032/T038/T041实际入口就绪再关闭；T011的不敏感业务草稿/未保存保护须经T017/T018实际调用后关闭。两项保留原验收，当前元数据与账号UI已有实现和测试，不以底座通过冒充全路径完成。T013依赖T008/T009已就绪，可以继续。共享事务、权限、状态机单一实现者顺序修改。没有并行写任务；只读研究/独立复核可并行。每批测试覆盖实际行为、失败与附近回归，已有结果输入未变不反复全量；最终集成验证不可省略。
## Implementation Strategy
先基础与账号纵切片验证，再依次完成全部故事；中途checkpoint不结束授权。每个任务同时维护FR/UI/CU/AT证据到acceptance.md；不得用旧站历史测试冒充新平台验证。


## M22 · 客户公开页原型评审（正式实现待确认）
本节只记录此次原型，不改历史任务勾选状态。
- [x] T101 根据用户截图完成独立可点击的客户公开页电脑/手机原型和摄影师导航示意，介绍收敛、明确分类tab、问答默认可见；17项原型检查及12个响应状态通过，0 API请求/业务写入，提供本地评审链接
- [x] T102 用户后续明确授权直接实施18186正式应用；客户公开页正式改造及受影响增量已由T103–106承接。原型演示不等于全功能合并完成


## M23 · Apple产品体验打磨（正式18186，平台后台不动）
用户已明确直接改当前18186的客户、摄影师、Owner端。保留现有功能/数据/登录/框架和六项规则；D07不涉及本批。原型未完成的本轮改动已还原至此前已验版本。只修改apps/web外部产品界面与相应增量测试/记录，不动API/domain/数据库/upstream/平台业务及平台呈现。
- [x] T103 明确客户/摄影师/Owner任务层级、保入口，分别适配手机/电脑；客户短介绍、可辨分类tab、答案可读，电脑移除独立返回
- [x] T104 正式应用的主操作、选中/加载/错误/成功/只读反馈打磨；照片选中可见、保存确认后成功、失败留原文，下载主入口保留
- [x] T105 复用Apple motion参考为产品范围增加可中断指示条/弹层进退/按压反馈，reduced-motion与IME保护；平台继续原行为
- [x] T106 实际18186渲染、主路径/恢复/手机电脑增量与平台样式隔离验证，受影响静态检查及独立Impeccable复核，更新验收后交付链接

M23验收：84个唯一受影响用例已闭环；72项集成70过+两条测试定位/动画几何时点修正后补跑，再额外12项实际Member/Owner/嵌套预约通过。动效缩屏偏移实测RED438/494，修取消旧settle后3项附近回归通过。不是一次84项同跑。47个页面状态几何检查、最终下载首屏、平台CSS隔离与独立复核见acceptance.md M23；真机/真实输入法候选操作不在本地自动化验收范围。


## M24 · 客户表单顺序与横向导航（2026-11-15）
最新要求：横向滚动条全部隐藏，保横滑/翻动箭头；横向分类/日期导航向上滚动后吸顶。删除首页“聊聊你的拍摄想法”和作品区“继续填写”、分类下重复名称；作品与风格+套餐问答移入问卷答案之后、意向套餐之前。保已有答案/已选/套餐同步/权限和提交规则，平台不动。
范围 /Users/cjjxw/codex/摄影选片平台/proofroom@agent/proofroom-local-main(a3873eb)，保留现有未提交改动。仅外部Web组件/公开页/受影响增量及本记录；固定Node22、复用18186，无API/DB改动/提交/服务重启。临时证据/tmp/proofroom-qa/apple-experience/m24-*，验收后可清理。主Agent实施，非实现者只读复核。
- [x] T107 统一横向分类/项目状态/咨询状态/预约日期的右侧箭头与吸顶（无左箭头，到最右消失），隐藏横向滚动条；无溢出不显示箭头，横滑/键盘/减少动态效果保留
- [x] T108 客户页按图精简按钮/重复名称并调整模块顺序；迁入form后所有非提交按钮显式type=button，保草稿/原文/已选和套餐
- [x] T109 手机电脑、箭头边界/动态尺寸/吸顶与预约弹层、真实咨询/错误恢复增量，静态/独审；更新验收和预览

- [x] T110 参考新视频下拉/松手/双点刷新/回弹状态，全体产品数据页面刷新保草稿、命令中阻重触发；列表上滑加载配图标与动画，失败可重试且无重复请求
- [x] T111 去掉项目“筛选项目/刷新列表”，状态/排序即时请求过滤，搜索保留回车；覆盖手机/电脑、键盘、草稿和错误恢复增量
视频已用watch本地8帧0/1/2/3/4/5/7/9秒查看；约4秒下拉、5秒松手提示、7秒归位，双点动效。抽帧首选旧vsync不兼容FFmpeg9后改原脚本timestamps路径成功，未安装/上传媒体。临时m24-video/保留可清理。

- [x] T112 项目卡片上方集中“客户预览/更多”，危险操作留二次确认，移除分区下重复工具块；长标题两行可展开，手机电脑可用

M24验收：稳定源码后23项受影响集成全过（1.4m），另补原T042列表刷新失败恢复1项通过（6.9s），共24个唯一用例；四宽横向导航/预约、六个实际渲染状态、root/Web类型检查及架构guard通过。受影响lint无新错误/告警，独立复核已关闭。细节与边界见acceptance.md M24。


## M25 · 全页面操作入口分层（2026-11-15）
范围proofroom@agent/proofroom-local-main(a3873eb)，保留M23/M24未提交；外部Web/增量/spec，固定Node22、复用18186。常用操作就近直达，低频收进明确命名的更多；上下文编辑、未确认命令及错误重试不隐藏。无API/DB/平台后台/原版功能合并/服务重启/提交。
- [x] T113 核查摄影师/客户各页入口与手机电脑层级；保留现有功能、数据、登录和角色边界
- [x] T114 摄影师咨询、图库、照片、公开作品、档期、团队、历史/备份与异常工具合理分层；复用可键盘关闭与焦点恢复的更多，危险操作保确认
- [x] T115 客户选片保常用筛选/提交/下载/联系直达，辅助查找导出收更多；等待/异常主操作与草稿恢复保持可见
- [x] T116 本批受影响集成/手机电脑渲染/键盘焦点/剪贴板失败/权限/草稿与失败恢复增量、静态及非实现者复核，更新验收和链接

- [x] T117 横向右箭头缩小图标，末端淡出/缩小并立即释放点击与键盘区域，反向滑动可恢复，减少动态效果直接结束
- [x] T118 检查分隔线与标题/正文间距，修客户套餐问答等同类边界，手机电脑实测

- [x] T119 项目搜索隐藏可见标签、内置放大镜提交入口，三种排序改横向即点即筛选，状态/排序联合吸顶；保筛选/搜索/历史/IME规则
- [x] T120 参考Vant官方手机交互统一搜索/标签/更多动作面板和选择弹层，现有React与功能/权限/数据/桌面保持；手机安全区、取消、焦点与失败恢复增量

M25验收：28个唯一本批增量已闭环（27项21过6测试适配失败→13补跑11过2旧定位→最后2过；平台隔离5过新增UI34，非一次28同跑）。root/Web tsc、架构/diff guard过；41文件lint0错误/30原有告警，与HEAD逐文件规则数相同，最后Select增量lint0。8渲染状态无整页横溢/脚本错；独立复核4项P2已修并关闭。详见acceptance.md M25。


## M26 · 手机胶囊与快捷操作（2026-11-16）
根proofroom@agent/proofroom-local-main(a3873eb)，保前批所有未提交。只外部Web壳/Mine/增量/spec；固定Node22复用18186；平台/API/DB/登录/功能规则不动、不重启/提交。
- [x] T121 手机胶囊视觉32px/点击44px、图标18px，保返回与电脑侧栏；“…”改高频快捷操作
- [x] T122 快捷操作含待处理项目/拍摄日程/复制售前链接；原切换与创建工作室归“我的→工作室管理”，保角色/创建/切换/草稿保护/失败恢复
- [x] T123 窄屏/电脑/无整页刷新/键盘焦点/复制与未保存保护/工作室管理受影响增量、静态及独审，更新验收

M26验收：12项受影响增量一次同跑全过49.4s；胶囊320/390/767/768/1440、快捷复制/失败/迟到失败、草稿守卫、实际工作室新建/切换/取消与原Mine入口均过。root/Web类型、架构/diff guard通过，5文件lint0错2旧告警与HEAD相同，独审P2已修关闭。详见acceptance.md M26。


## M27 · 复制成功轻提示（2026-11-16）
根proofroom@agent/proofroom-local-main(a3873eb)，保前批未提交。只外部共享复制/Toast/照片导出反馈/CSS及受影响测试/spec；固定Node22、复用18186。平台原复制反馈/业务/API/DB/服务不动，不提交部署。
- [x] T124 外部复制成功统一顶部居中深棕灰底白字Toast，约1.8秒消失，移除原位成功文字；微信/链接/文件名文案对应，不改变复制内容/失败回退
- [x] T125 延迟完成/重复复制/面板和身份生命周期、手机电脑/弹层内可见/布局不跳/减少动态效果、平台隔离增量及静态独审，更新验收

M27验收：9项复制/入口/平台增量全过50.6s，独审补文件名失败重试残留断言RED→修后T057/T124两项通过14.7s（含新增真实PIN客户端复制），唯一仍9项。root/Web类型、架构/diff guard过，5文件lint0错5旧告警与HEAD逐规则相同，独审P2关闭。详见acceptance.md M27。


## M28 · 长名称行内展开（2026-11-16）
根proofroom@agent/proofroom-local-main(a3873eb)，保M23–M27未提交；只外部Web共享名称/调用页/CSS及受影响增量/spec。固定Node22复用18186，不改平台/API/DB/业务/数据/登录、不重启/提交。
- [x] T126 “我的”、摄影师/客户项目、公开工作室和套餐长名称统一末尾下拉箭头；移除单独文字按钮，保两行折叠/完整查看、短名不显示箭头
- [x] T127 手机电脑边界/44px触区/键盘与焦点/箭头方向及减少动态效果/表单草稿不提交/数据不变增量、静态与非实现者复核，更新验收

M28验收：10个唯一本批受影响用例闭环（m28-final 9过1减少动态时长断言不兼容，按既有全局0.01ms规则修测试后m28-recheck新2项全过30.1s；非一次10项全绿）。产品源码在本轮集成期间未改；root/Web类型、架构/diff guard过，7文件lint0错5旧告警与HEAD逐规则相同。foundation_review仅静态复核无确定P1/P2。详见acceptance.md M28。


## M29 · 手机端产品体验收口（2026-11-16）
根proofroom@agent/proofroom-local-main(a3873eb)，保M23–M28未提交；只外部客户/摄影师/Owner Web壳与共享组件/CSS及增量/spec，平台后台/API/worker/packages不动。固定Node22复用18186/18184，不重启/build/typegen。
- [x] T128 横向标签条右箭头收敛为32px圆盘、按钮保留44px触区且末端自动隐藏；我的工作室改为完善进度+一键待办直达，长名称行内箭头展开
- [x] T129 共享产品层原语（下拉刷新/上滑加载/横向条/选择导航/名称折叠）与Toast、弹层、相册手势、选择器反馈统一到同一套44px触区与类型层级

M29验收：横向条右箭头实测按钮44×44、可见圆盘32px；/studio/mine 完善进度、工作室内名称展开与整页横向溢出320/390为0；受影响增量与静态检查通过。详见acceptance.md M29。源码已随3418b12/61dc74f提交，本轮仅补记spec。


## M30 · 反馈位置与折叠、骨架、步进（2026-11-16）
根proofroom@agent/proofroom-local-main(9b27abc)，工作区在本批前干净；只外部共享core/CSS与项目/咨询/图库/历史/设置五页及增量/spec。平台后台、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。
- [x] T130 提交成功反馈从页首文字改为底部浮层（DOM位置与role=status、.notice.success语义不变，pointer-events:none，4秒后淡出）；项目/咨询/图库/历史首屏改形状骨架；精修张数加44px加减步进键
- [x] T131 折叠项统一44px头部+箭头随开合旋转+支持时高度过渡（不破坏details语义）；手机勾选框22px、触区仍由44px label承担；空态图标收进圆形底片；减少动态效果关闭全部新增动效

M30验收：折叠项实测blockSize 0→392→466→476px过渡0.28s、箭头45°→225°；成功反馈0.7s不透明、4.9s透明度0且命中测试落到下层字段；勾选框22×22、check-line 48px；骨架3行252px带role=status/aria-busy；步进键两枚44×44；320/390整页横向溢出0。presales/action-placement/interface-feedback/galleries/booking-profile共75项增量通过；product-experience两项T050/T051在暂存本批改动后同样失败（browserContext.newPage崩溃），判定为既有环境问题非本批回归。root/Web tsc通过。详见acceptance.md M30。


## M31 · 真实 Chrome 内核复测与修复（2026-11-16）
根proofroom@agent/proofroom-local-main(c9b9b2c)，只动 e2e 配置/增量用例与一条产品 CSS；平台后台、API/worker/packages、业务与数据不动，不重启服务、不部署。
- [x] T132 用真实 Chrome 内核复测：定位 `chromiumSandbox` 与 `channel:'chrome'` 冲突导致的 `browserContext.newPage` 崩溃并移除；单条预算 45s→90s、T053 单条 150s；T094 静音后台轮询、T099 高度断言按亚像素口径、T050 下载按当前单次下载主卡、`inspect()` 只报看得见的越界
- [x] T133 折叠箭头改 `clip-path` 绘制，消除旋转伪元素撑出的 3px 横向可滚动溢出，保留开合翻转与减少动态收敛

M31验收：Chrome 157 渠道下 booking-profile + interface-feedback + presales 共 57 项 17.3 分钟全过；崩溃点 product-experience 两项全过（T050/T051 5.2 分钟）；root/Web tsc、架构边界、diff --check 均通过。详见acceptance.md M31。

## M32 · 工作室名展开按钮底色（2026-11-16）
根proofroom@agent/proofroom-local-main，只动一条产品 CSS 与验收记录；平台后台、API/worker/packages、业务与数据不动，不重启服务、不部署。
- [x] T134 去掉 `.name-disclosure-toggle` 的 hover/active 底色（原来 `surface-2` 在工作室卡片上呈一块可见方块），只保留颜色反馈，并清掉多余的 `border-radius`

## M33 · 刷新入口随下拉刷新统一下线（2026-11-16）
根proofroom@agent/proofroom-local-main(fda995a)，只动外部产品页 8 个 feature 与 3 个 e2e 用例；平台后台、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。
- [x] T135 产品层已全局具备下拉刷新（`PageRefresh` 汇总 `useResource`/`useCursorWindow` 注册的读），因此删除 8 个产品页里 10 个重复的"手动刷新"入口：刷新工作台、刷新咨询（连同只剩它的"更多咨询列表操作"菜单）、刷新图库列表、读取最新图库照片、刷新日程、刷新历史、刷新备份记录、刷新工作室状态与额度、刷新下载状态、刷新精修预览；同时清掉 4 个已无用的 import 与 1 处无用解构。保留的例外各有技术理由：`/studio/platform` 因 `ProductExperience active={false}` 没有下拉刷新、客户公开页 `client.tsx` 是未登录侧的兜底、`ZipCard` 的"正在准备下载…"与打包状态节流入口共位、时段表单的"重新读取时段"是可用性查询而非刷新
- [x] T136 用例随入口下线改写：action-placement 原 T113/114 重写为 T135（断言页面上不存在任何以"刷新"开头的按钮、不存在只含刷新项的"更多*操作"菜单，同时核对主操作可见与零写入）；interface-feedback T081 改由 `ZipCard` 1400ms 自动轮询推进下载、T094 末段改下拉刷新触发 503 失败态并更新标题措辞；booking-profile T069 改下拉刷新读取新增时段；另把 action-placement T117 的渐隐采样从固定 45ms 改为逐帧等到首个中间值，消除过渡未启动时采到 opacity 1 的抖动

M33验收：受影响增量 action-placement + backups + galleries + interface-feedback + presales + booking-profile 共 77 项 13.3 分钟全过（`77 passed`）；root/Web `tsc --noEmit`、`check-architecture.mjs`、改动文件 eslint（0 errors / 9 条既有 warning）、`git diff --check` 均通过。真实 Chrome 390×852 实测 6 个受影响页面 `刷新*` 按钮为空、`scrollWidth==innerWidth`、下拉返回 `已刷新`。详见acceptance.md M33。


## M34 · 返回入口与顶部胶囊去重（2026-11-16）
根proofroom@agent/proofroom-local-main(97921b1)，工作区在本批前干净；只动外部产品 4 个 feature 与 4 个 e2e 用例；平台后台、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。
- [x] T137 顶部 `workspace-top` 胶囊里的「← 返回上一页」在手机端已覆盖上一层导航，页面内容区再放「← 返回项目列表 / ← 返回图库 / ← 返回图库列表 / ← 返回咨询列表 / 返回摄影师项目」就是同一动作的第二个入口，全部删除；同时拆掉只为这些返回链接服务的 `from=` 查询参数链路（6 处生产、2 处消费）；保留无 workspace 外壳的 `/studio/platform`「返回工作台」与错误态「返回我的工作室」、以及语义不同的一批「返回」文案
- [x] T138 用例随入口下线改写：orders 三处（`← 返回摄影师项目` 改 `goto` 带 `section=overview`、`← 返回项目列表` 改 `goBack()`、对话框成功提示改 `.filter({hasText}).first()`）、interface-feedback T077 两处、galleries UI30-33 一段重写（返回后 `photoQ` 不再保留，重新执行搜索）；新增 T137 断言详情页 `.workspace-content` 内不存在 `← 返回*` 文案与 `/返回(项目|图库|咨询)/` 链接，手机走胶囊、桌面走浏览器历史均能回到列表

M34验收：受影响增量 action-placement + galleries + interface-feedback + orders + presales 共 68 项 19.0 分钟通过（唯一 failed 为 UI22/AT33 的 strict mode 双 `data-action-ack`，单跑修复后 13.4s 通过；`orders.spec.ts` 全量复跑 9 passed，仅 T084 聚焦断言失败，已 `git stash` 在 HEAD 连跑 2 次同样失败，判定既有）；T137 单跑 20.2s 通过。root/Web `tsc --noEmit`、`check-architecture.mjs`、`git diff --check` 均通过，改动 8 文件 eslint 0 errors / 3 条既有 warning。详见 acceptance.md M34。


## M35 · 打包状态手动刷新下线（2026-11-16）
根proofroom@agent/proofroom-local-main(7636d78)，工作区在本批前干净；只动交付页 ZIP 卡与一条 e2e 断言；平台后台、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。
- [x] T139 交付页 ZIP 卡里「刷新原片打包状态 / 刷新精修打包状态」是页面上最后一个仍带"刷新"字样的按钮，同样已被下拉刷新与 ZIP 卡自带的 1400ms 轮询覆盖，改为纯状态文案：主下载流程准备中显示 `正在准备下载…`（`role="status"`），其余情况显示「就绪后这里会自动出现下载按钮，也可下拉刷新查看进度。」；`核对/重新准备/准备ZIP/重试准备/下载` 这些动作按钮不动
- [x] T140 interface-feedback T081 的过渡态断言从"按钮可见"改为"文案可见"，并补一条 `.zip-card` 内 `刷新*` 按钮计数为 0 的守卫

M35验收：action-placement 15 项 1.2 分钟全过；delivery + interface-feedback 37 项 2.9 分钟通过（唯一 failed 为 T094 那条已知的后台轮询抖动，单跑 3.9s 通过）；Web `tsc --noEmit`、`git diff --check` 通过，改动 2 文件 eslint 0 errors / 4 条既有 warning。详见 acceptance.md M35。

## M36 · 输入框统一占位提示（2026-11-16）
根proofroom@agent/proofroom-local-main(9d45bd3)，工作区在本批前干净；只动外部产品 17 个 web 源码文件与 1 个 e2e 用例；平台后台接口、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。
- [x] T141 全站输入框补 `placeholder` 并加一条守卫用例：`apps/web/src` 全部 `<Input>`/`<Textarea>` 与原生可见 `<input>`/`<textarea>` 共 72 处新增占位提示（另把 5 处旧提示改写成同一句式），文案统一为「请输入 + 说明/示例」；公开问卷的单选题下拉空选项由「请选择」改为按题干生成的「请选择想拍什么类型的照片」；`.honeypot` 蜜罐字段例外、不加提示。同时在 `action-placement` 新增同名 T141：390/1440 两档进公开问卷，先断言称呼/微信/访问码/下拉四处的具体文案，再遍历所有可见文本框断言 `placeholder` 非空，同一套审计再跑新建项目/工作室设置/图库列表/历史记录四页（跳过 `.honeypot`）
- [x] T142 未选择的下拉框按占位态弱化字色：空值选项文案由「请选择」变为「请选择你的预算范围」后，字色仍与已选值相同，客户会误以为已选。`Select` 触发按钮加 `data-placeholder`（仅当空值且文案是「请选择…」提示时），配合一条 `.select-trigger[data-placeholder] .select-value{color:var(--color-muted)}`；`value=""` 的真实选项（未分类、无颜色、待核对对应、尚未决定）仍按正常字色。新增同名 T142 在两档宽度比较计算字色并验证选中后撤销占位态

M36验收：T141/T142 单跑 `1 passed (6.5s)` / `1 passed (5.6s)`；`action-placement` 16 项 1.6 分钟全过；presales + galleries + booking-profile 28 项 2.5 分钟全过；此前受影响六 spec 73 项 6.7 分钟 `72 passed`，唯一 failed 为 `account.spec.ts` UI03/AT39（`git stash` 到 HEAD `9d45bd3` 复跑同样失败，判为既有）。root/Web `tsc --noEmit`、`check-architecture.mjs`、`git diff --check` 通过，19 文件 eslint 0 errors / 25 条既有 warning。详见 acceptance.md M36。

## M37 · 真机逐屏走查修掉的三处「代码审查看不出」（2026-11-16）
根proofroom@agent/proofroom-local-main(3fe7935)，工作区在本批前干净；只动 web 2 个源码文件、2 个 e2e 用例；平台后台接口、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。
- [x] T143 必填校验的提示文案改成客户能直接照做的说法，并把联系方式说明归位：空表单提交时原为「请填写怎么称呼你？」「请填写想拍什么类型的照片？」，选择题说「填写」不准确、句尾还挂问号。新增 `requiredMessage(q)`：称呼固定项→「请填写你的称呼」、单选/多选→「请选择「想拍什么类型的照片」」、联系项→「请填写你的微信号，方便摄影师联系你」、其余→「请填写「X」」，访问码另改为「请填写 4 位数字访问码」。同时把「微信用于沟通，四位访问码用于之后的项目访问」从「从哪里知道我们（选填）」上方移到微信号输入框正下方（原位置看着像在解释来源），并让空的 `.field-error` 不再渲染 6 个空节点。`.public-question` 补 `display:flex;flex-direction:column;gap:18px`，修掉「项目访问码（四位数字）」label 紧贴上一条输入框的问题。新增同名 T143 在 390/1440 两档钉住四条错误文案、`.field-error:empty` 计数为 0、以及 hint 与微信号/访问码的文档先后顺序
- [x] T144 卡片说明段与紧随的表单之间没有间距：`/studio/account` 里「成功后撤销其他设备会话，当前设备重新建立登录。」与下方「原密码」字段贴合（DOM 实测相邻块间距 0）。补一条 `.card-pad > p + form{margin-top:1rem}`，让「先说明后表单」的卡片统一留出呼吸空间。新增同名 T144 在两档宽度量说明段底部到首个字段顶部的距离 ≥12px。顺带修正 T141 里写错的 `/studio/settings`（该路由不存在，实际渲染「未找到工作台页面」空态，等于「工作室设置」从未被审计）：改为真实路由 `/studio/profile` 与 `/studio/account`，并在每页 audit 前断言页面上不存在「未找到工作台页面」，防止路由写错时零字段静默通过

M37验收：T143 单跑 `1 passed (6.3s)`，T144 单跑 `1 passed (3.9s)`，修正后 T141 单跑 `1 passed (42.8s)`；`interface-feedback` + `presales` + `action-placement` 共 58 项 9.2 分钟 `58 passed`（含 T143）。详见 acceptance.md M37。

### M38 · 补完剩余路由走查 + 手机端保存条让开底部导航（2026-11-16）

T145 完成。M37 之后把 `/`、`/studio/login`、`/studio/register`、`/studio/portfolio`、`/studio/members`、`/c/<token>`、`/invite/<token>` 也逐屏看完，覆盖 application.tsx 全部路由分支。新发现并修复一处：移动端 `.save-bar` 的 `bottom:calc(82px + safe-area)` 只让开导航本体，导航中间凸起的「新建」圆钮仍压在保存条上，改为 `104px`；该值改的是 `globals.css` 第 183 行既有覆写，不是新增规则。新增 T145（三个滚动位置断言保存条下沿 ≤ 导航顶边 - 24px），并用旧值 82px 反向验证会失败。详见 acceptance.md M38。

### M39 · 搜索收进框内 + 切筛选不再整页闪（2026-11-16）

根proofroom@agent/proofroom-local-main(8f6206f)，工作区在本批前干净；只动外部产品 11 个 web 源码文件与 5 个 e2e 用例；平台后台接口、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。

- [x] T146 搜索入口从「框旁边的独立按钮」改成「框内左侧放大镜」，回车与手机键盘搜索键都能提交：`components/ui/search-input.tsx` 重写为 `SearchBox`（`<div class="search-box">` 内一个 `type="submit"` 圆形放大镜按钮 + `type="search"`、`enterKeyHint="search"` 的输入框），依赖外层 form 的 `onSubmit` 提交，因此项目列表、选片清单/原片浏览、图库列表、图库照片、新建图库弹窗「查找已有项目」、历史、平台工作人员共 7 处调用点全部改包 `form`；输入法组词中的回车用 `compositionstart/end` 拦住，不当成提交。随之删掉「搜索照片 / 查找图库 / 搜索图库照片 / 查找项目 / 搜索历史 / 查找工作人员」6 个独立按钮，按钮 `aria-label` 用独立的「提交搜索」，避免和输入框的可访问名撞车。用例侧：`interface-feedback` T080 去掉旧按钮断言、新增同名 T146，在三段页面（项目列表、图库列表、历史）钉住几何与语义——放大镜在输入框内、按钮右沿不越过输入框左内边距、`type=search`/`enterKeyHint=search`、表单里只有一个 `submit`、不再有以「搜索/查找」开头的独立按钮、按钮无障碍名为「提交搜索」；提交路径同时验证回车与点放大镜（`q` 同步、空态标题、`scrollWidth ≤ 390`）。`action-placement` T135 的 `history` 主操作置空、T119/120 与 `galleries`、`platform` 的点击改回车
- [x] T147 切筛选/勾选时整页闪动：`useResource` 在 `url` 变化时把 `data` 置空并 `loading=true`，导致汇总块、筛选栏、列表整块消失再出现。列表页改为「有新数据用新数据、没有就先用上一份行」：`useCursorWindow` 增加按页面共享的 `families` 缓存（`clearListWindows` 一并清空、超 20 条淘汰），切筛选先用上一份行；`photos` / `galleries` / `history` / `inquiries` / `delivery` / `downloads` / `platform` 的 `Loading`/`ListSkeleton` 全部收敛成「只在还没有任何数据时才显示」，选片清单的 `canEdit`/汇总改用 snapshot 兜底。新增同名 T147：用逐帧采样断言切「只看当前已选」与切图库分类下拉时，汇总块/筛选栏/列表都没有从 DOM 消失（`goneSummary/goneForm/goneGrid` 均为 0、行数始终 > 0）
- [x] T148 顺带修掉 `platform.spec.ts` 的既有红：另一标签页登录后平台页靠 BroadcastChannel 重新校验账号，无头浏览器里后台页的消息会滞后，改为先 `bringToFront()` 再给 800ms 沉淀；该用例在 HEAD `8f6206f` 上 `git stash` 复跑同样失败（`1 failed`），确认与本轮搜索/闪动改动无关，且单跑 3 次稳定通过

M39验收：`platform` + `galleries` + `action-placement` 共 23 项 7.9 分钟 `23 passed`；`interface-feedback` 全量见 acceptance.md M39。root/Web `tsc --noEmit`、改动文件 eslint（0 errors）、`git diff --check` 通过。详见 acceptance.md M39。

### M40 · 作品选题挪到问卷最后、紧贴作品区（2026-11-16）

根proofroom@agent/proofroom-local-main(83c6ceb)，工作区在本批前干净；只动 web 2 个源码文件与 1 个 e2e 用例；平台后台接口、API/worker/packages、业务规则、数据与登录不动，不重启服务、不部署。

- [x] T149 客户页的「挑选你喜欢的作品（最多15张）」原来夹在预算、时间这类问题中间，它问的其实是「下面作品区你挑了几张」，客户读到它时作品区还在两屏之外。改为渲染时把作品题固定排到最后：`public.tsx` 加 `askQuestions`（非作品题按原顺序 + 作品题放末位），渲染入口从 `cfg.questionnaire.value.questions.map` 换成 `askQuestions.map`；只改显示顺序，问卷版本、答案键、草稿快照、提交载荷全部沿用原 id，历史咨询与 `CU02` 的兼容迁移不受影响。间距不新增任何规则——作品题沿用 `.public-question` 的 `padding:0 0 20px` 与 `border-bottom:1px`，父级 `.form-stack` 的 `gap:18px` 同时管住「它与上一题」和「它与作品区」，`#portfolio` 的 `border-top` 实测 `0px`，所以只有一条线 + 18px。问卷设置页配合：作品选题不再显示上移/下移（已不参与排序），hint 补「客户页固定排在问卷最后、紧贴作品区，不参与这里的排序」

M40验收：T149 单跑 `1 passed (1.5s)`；反向验证——把渲染入口改回 `cfg.questionnaire.value.questions.map`，同一条用例 `1 failed`（`portfolioIndex` 不在末位），恢复后 `1 passed`；`presales` 全量 8 项 47.2 秒全过；`presales + interface-feedback` 中 T149/T108×2/T143/T144 `5 passed (13.7s)`（既有 T108 本就断言「最后一个 `.public-question` 在 `#portfolio` 之前」，不改也照过，构成第二处独立证据）。Web `tsc --noEmit` exit 0、`git diff --check` 通过。详见 acceptance.md M40。
