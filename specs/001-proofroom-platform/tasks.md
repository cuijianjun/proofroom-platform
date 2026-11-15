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
- [ ] T102 用户确认原型后再实施正式React页面和受影响增量；目前不得自动执行
