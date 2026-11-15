# 本地启动与验证

项目根：`/Users/cjjxw/codex/摄影选片平台/proofroom`。所有命令在此目录执行。只运行本项目的独立服务，不操作旧WorkBuddy、旧数据库或旧18080/18082/18084端口。

```sh
export PATH="/Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin:$PATH"
npm ci
npm run local:setup
npm run db:migrate
npm run dev
```

Node固定22.22.2；PostgreSQL CLI需要可执行，本机已验证17.11。`local:setup`使用本项目`.local/postgres`、loopback18432和S3兼容替身18190；已有数据不重建。API18182、Web18180、Worker使用同一份普通PostgreSQL业务数据。`.env`0600和`.local`0700包含必要私密配置，不粘贴到聊天、日志或前端。Web只获得API地址，不继承DB/S3/APP_SECRET。上传源、预览和日志位于本项目私有目录；不需要云账号。

预览入口：<http://127.0.0.1:18180/studio>，注册入口：<http://127.0.0.1:18180/studio/register>。新项目的账号与旧站独立，从注册创建工作室，默认八题问卷即可编辑；公开咨询前先填联系微信。邀请以复制链接完成，本地没有邮件发送。平台角色由本机管理者通过受控数据库配置，不把任意自注册用户自动升为平台管理员。

开发命令终端Ctrl+C只结束本次启动的Web/API/Worker；私有PG和S3数据保留。不要对其他项目使用全局kill、重启容器或清空浏览器。

## 验证顺序

先停止本项目正在运行的Web/API/Worker，再依次执行，避免重复QA进程争用端口或Next类型目录。只读PG/S3服务继续运行。

```sh
npm run typecheck
npm run lint
npm run build
npm run check:architecture
npm run test:platform
npm run test:e2e
```

平台/浏览器测试固定`proofroom_test`和`proofroom-test`bucket，拒绝使用开发库；浏览器自动启动Web18186/API18184/QA Worker，结束只关闭自建服务。恢复演练只建18432上的`proofroom_restore_*`新库与独立媒体根，Web18188/API18189，演练会清理自己的副本。新API重启演练使用18185。不要同时另开QA Worker。材料在`/tmp/proofroom-qa`，可在不需要复核后清理；里面的状态、能力链接和备份文件不外传。

`check:architecture`默认最终模式要求真实`apps/web/.next/static`与完整`.env`参照，核对源码依赖边界及实际客户端包敏感值；缺产物/缺参照退出1。`--source-only`只检查源码且明确不证明包安全；其他副本须显式传`--reference-file`与`--build-dir`，不能把主配置扫描扩称其他运行配置已验。

此前完整平台129项、完整浏览器51项已通过，QA目录恢复另以架构4项增量验证。本轮受影响平台51项通过；浏览器共享51项通过，新增合成拖放用例修正重复选择器后单独1项通过，未冒称一次完整52项全绿。当前类型/三端构建/客户端秘密扫描通过。lint从102降到32条（0错误）：24条有界状态同步、8条私有压缩预览/本地blob图片提示，保留原因与回归见[acceptance](acceptance.md)。生产依赖审计0；开发S3rver仍4项，已在验签后、解析前拒绝不用的浏览器表单POST，属于入口缓解，不称依赖全部修复。

本机原生验收已补：用户亲自系统多选上传10张，Agent核对服务器与下载清单；Agent真实Finder拖入4张合成样图，可信drop、队列、就绪/P2和下载源SHA均通过；原生取消不创建批次。单个专属浏览器连接、0个filechooser监听，未用setFiles或合成drop替代。微信真机/云S3/生产/大批真实相机照片仍未验。

## M14 当前预览与模块留白

预览仍为18180主入口和18186原mock，账号密码不变。当前主父80418、mock父80419；以.local/dev.pid/.local/mock-preview.pid核对cwd/命令后操作，旧PID段落为历史记录。四Web/API均200，原工作室四表摘要及账号文件与M13一致，7项目/3咨询/16照片/5档期保留。

提示/上传/批次/精修对应/下载等功能容器添加20px基础留白，较大的明确间距沿用。新增四场景×四宽几何回归通过，29页×四宽只读复查无贴边，受影响上传/交付/下载检查有效；Web构建、11包扫描和独审通过。仅CSS与现有回归调整，无业务/依赖/迁移变更，详见acceptance M14。原有复用QA与串行构建纪律继续有效。

## M13 预约/我的功能验收

主 <http://127.0.0.1:18180/studio>，原mock <http://127.0.0.1:18186/studio>，原账号密码不变。主父69990、mock父69991，仍以PID文件核对cwd/命令后停止。四入口/API 200、Worker新鲜；原账号文件及业务四表摘要一致，7项目/3咨询/16照片/5档期保留，常规列表5。

摄影师在「我的→预约与档期」用日历设置日期与起止时间，可精确分钟/多日结束；客户按日期/时段表达意向，确认接单才占用，取消释放。短暂断连只对安全GET有界重读，online核对；TIMEOUT与取消独立编码，未知不可说未开放。我的页分组入口保留原功能，完善状态来自真实配置/发布作品，工作室微信可复制，长名可展开，日期弹层标题/保存固定。

51项受影响整合50绿1草稿导航RED后按修复范围29绿，最后caller与视觉15绿；平台10、最终types/Web build/11客户端包扫描和独审通过。来源与原截图根因未复现的边界见acceptance M13，未称一次全量全绿。原UI/业务无变化层不重复测试。

若已核对现有QA确为本项目隔离服务，可显式复用，避免测试时中断体验：

```sh
PROOFROOM_E2E_REUSE_SERVER=1 npm run test:e2e -- tests/e2e/booking-profile.spec.ts tests/e2e/orders.spec.ts
```

默认仍为自启自清理，不盲目复用其他服务；新测试不覆盖原private state。类型/构建继续与Next预览串行，完成后恢复。以下M9–M12为历史验收/PID记录，当前以本节与PID文件为准。

## M12 单页导航验收记录

工作台外壳/主导航/手机底栏/会话常驻，正常业务跳转保持同一document和外壳节点，不重读auth/me或文档/JS/CSS；只切业务区域。前进后退与界面返回同一草稿确认，取消保原地址/原文/历史顺序，确认按原方向继续；刷新直达项目分区与刷新后安全草稿恢复通过。账号变化清原人员草稿，工作室切换先确认，业务状态按actor/studio隔离；登录失效或权限变化由受保护请求/获焦/跨标签通知重校验。

单次73浏览器集成7.4m后，最后9导航增量25.8s通过；平台8、最终root/Web类型、Web构建、11客户端包扫描通过，lint0错误/2既有建议，独审无确定P1/P2。API/Worker未改，相关构建沿用M11；完整命令、RED与证据口径见acceptance M12。

主预览 <http://127.0.0.1:18180/studio>，原mock体验 <http://127.0.0.1:18186/studio>，原账号不变。最终主/mock父60685/60686，分别为现有scripts/local.mjs start与scripts/e2e-local.mjs；PID文件及上述停止纪律为准。四入口/API 200，Worker心跳新鲜。原账号文件及业务四表摘要一致，7项目/3咨询/16照片/5档期保留；常规列表5项目。下述M9–M11是历史验收记录，当前服务以本节和PID文件为准。

## M9 mock体验检查与预览

本轮按模块分批54个浏览器case都有通过证据（不是一次54整轮），新mock55个命名场景×四宽，客户品牌另六宽；新测试tests/e2e/product-experience.spec.ts。平台具体portfolio/presales/architecture15项及root/Web类型、三build/客户端秘密扫描通过。发现与修复、原生复用及未变证据来源详见acceptance末尾M9。

隔离mock工作台 <http://127.0.0.1:18186/studio>，数据在proofroom_test/proofroom-test；私有登录信息/tmp/proofroom-qa/product-experience-state.json，含能力值不打印外传。当前mock父进程记录.local/mock-preview.pid，日志.local/logs/product-mock-preview.log；新会话先核对PID/cwd/命令确为本项目scripts/e2e-local.mjs。运行自动化之前先SIGTERM此父进程释放18184/18186，不能同时再开QA Worker。单独恢复预览可用固定Node执行`node --import tsx scripts/e2e-local.mjs`，不会往主开发库造订单。结束保留数据与媒体；旧WorkBuddy服务不动。

## M10 截图修正与现有预览

六项截图反馈已完成，T053–056关闭：同类选择菜单站内化/当前值可见、运行状态图标及灯、工作台去重复完整列表、参考题和图片在原始需求末尾同块、客户微信直接复制/失败手动。系统文件选择窗口仍按已有原生验收范围处理。

单次57个浏览器用例7.3m通过；最终手机复查发现字段容器过窄引起重叠，修复后3项增量24.5s通过，含320/390/393/1280实际点选状态与排序。类型、三端构建通过；最后CSS后重做root/Web类型、Web构建与11份客户端包扫描。详见acceptance末尾M10，未重复全量平台或依赖审计。

预览仍为上面的18180主入口与18186隔离mock；用户原体验账号不变。`product-experience-state.json`保留原账号记录，回归以后只写独立`product-experience-test-state.json`，二者均为0600私密材料。当前主父31264、mock父31265；PID文件为准，停用前继续核对命令/cwd。最终四个入口/API HTTP200，dev/QA Worker心跳均新鲜；弹层取消未写预约，主业务写入0。没有自动提交、推送或部署。

## M11 历史验收版本

所有复制入口点击即请求复制，失败才提供原文手动复制；项目顶部复制阶段微信文案，单独项目链接按钮去除。预约采用日期/时段卡，已约灰显、当前预约标识、每30秒和窗口获焦更新，跨日时间明确；公开提交仍是意向，最终确认占用，取消释放。摄影师在「我的→预约与档期」设置时段。

两端为暖白/棕色、系统中文字体；项目完整头随滚动，紧凑客户标识与分区固定；星级颜色收起但备注/勾选直接用；顾客完成按钮固定底部。改期未知结果按原key+payload恢复，可稍后核对；明确业务409回到保目标的新版本核对，避免误取消、重复改期或卡死。

现有原体验账号仍可登录18186，原7项目/媒体保留，新增2个正常mock档期（共5）。测试生成的数据只在隔离库，原体验state不被回归覆盖。当前主父45011、mock父45012；以PID文件为准，停止前核对。主/mock Web/API均200，Worker新鲜。

65个独立浏览器case均有通过来源，单次59整轮后按实际修复跑24/16/14/9等增量及文件名单项；没有称一次65整轮。平台21项、最终types、三build及最后Web新build、11客户端包扫描通过，详见acceptance M11。当前仅本地开发，服务保持；常规测试前仍先停自己的预览，勿并发Next产物。

## 备份与回退

Owner在「帮助与数据」设置仅内存备份密码，生成并下载加密工作室包；服务器临时文件24小时后失效，需自己长期保管文件与密码。其他成员不导出全局原密码/MFA。

```sh
npm run backup -- full-export --output "/安全目录/新的全量备份.prbackup"
npm run backup -- restore --file "/安全目录/工作室备份.prbackup" --name rehearsal_20261115
node scripts/local.mjs restore "/绝对路径/本次恢复输出目录"
```

密码在终端不回显；自动化可`--passphrase-stdin`，不要放在命令参数。只恢复到新库/新前缀，新APP_SECRET重新封装必要资料，Owner原登录/MFA、客户原链接/PIN、备注/源字节/到期日保持；其他当前成员生成新临时密码并强制改密，历史署名禁用。默认私有输出`.local/restores/<id>`；使用独立浏览器配置核对副本。先查照片SHA、登录、回执幂等和原期限，再另行决定切换，恢复不会自动替换当前服务。

原库/原媒体和程序版本保留；普通失败仅清理新副本，强杀或清理故障可凭私有`restore-state.json`定位本次库名/媒体前缀。先确认进程已停止，再仅清理该副本。迁移文件按摘要校验，已应用001–015不可改。详见[migration](migration.md)。

验收边界：系统文件窗口与自动setFiles分开记录；微信真机、真实大批相机照片、跨机/云S3与生产部署均没有以本地合成素材冒充。阶段按业务动作自动推进，浏览为压缩预览，最终下载为全部当前可交付原片/精修上传源字节。
