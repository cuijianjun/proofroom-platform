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
