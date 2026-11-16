# 验收记录
环境：新ProofRoom隔离本地开发；旧站验收不复用为新证据。
状态：已完成账号与售前部分本地业务验收，项目/选片/交付与最终全量验收尚未开始。58 FR、37 UI、9 CU、28 AT完整保留于需求正本；实施按tasks推进。
真实系统文件选择器、真实Safari/手机/微信、外部S3与生产容量必须分别记录，未测不得宣称通过。
本文件随实际测试更新需求/UI编号、角色、工作室样本、步骤、预期/实际、证据与结果。

## M0/M1/M2 本批实际证据 · 2026-11-14

| 范围 | 环境/角色与实际操作 | 结果和边界 | 证据 |
|---|---|---|---|
| M0/T001 | eff48d0原版、无DATABASE_URL，原锁npm ci与Next build | 486依赖、TS/122页构建通过；只证明上游基线 | research.md |
| T004/T007 | 新独立PG17，migrator/runtime；参数注入字符串/JSONB/数组/日期/bigint/numeric/null、迁移重放、单连接回滚 | foundation3通过；原站库未用 | tests/platform/foundation.test.ts |
| T005 | Web/contracts依赖扫描、429码/请求编号、截断JSON/错误envelope、外部signal仍超时 | architecture1、api-client3通过；无DB/存储密钥/旧Actions | tests/platform/{architecture,api-client}.test.ts |
| T006 | loopback S3替身（非外部S3），带签名的put/get/list/delete与SHA、匿名直访拒绝 | storage2通过；MinIO镜像不可用已记录，真实S3尚未验收 | tests/platform/storage.test.ts、research.md |
| T008/009/012、AT01/02/39 | 独立测试库多工作室、多账号；CAS/幂等注册回滚/Origin/成员加入、撤销、转移、移除/只读暂停/MFA恢复码与禁用校验 | tenancy11通过；7个真实PG交错安全场景先RED后GREEN，阻塞审计失败整体回滚 | /tmp/proofroom-qa/m2-api-final.log |
| UI01/02/03/34/36 | 独立Chrome contexts，Web18186/API18184/test库：注册、改密/登录返回、切换、受邀注册、移除、MFA恢复码、平台只读支持、Owner转移 | 6场景20.2s通过；320/390/393/1280布局及44px；并非真机或全平台UI通过 | /tmp/proofroom-qa/m2-e2e-final.log |
| AT02（账号/邀请部分） | 同账号双标签分别向两个工作室邀请 | 1场景6.9s通过；照片上传双标签在T032/043继续验收 | /tmp/proofroom-qa/m2-two-tabs.log |
| UI34空工作室路径 | 纯平台账号从正常空工作室页点击平台入口；强制改密从账号安全完成再回平台 | 导航缺口1RED→1GREEN；强制改密扩展1通过8.4s | /tmp/proofroom-qa/no-studio-navigation-red.log、no-studio-force-password.log |
| 独立构建/运行 | Web无私密env build，当前API/Worker esbuild与类型；编译产物以runtime角色启动、发持久health任务并处理、正常SIGTERM | 通过；仅health队列，不是照片处理/重启恢复完成 | /tmp/proofroom-qa/m2-web-current-build.log；本批工具输出 |

非实现者foundation_review已关闭4个后端并发阻塞和1个无studio导航阻塞，最后一次仅源码复核；实际测试由主Agent执行。T010/T011仍保留下游媒体/导出与业务草稿的原验收，不提前打勾。整体FR/UI/CU/AT均未全通过，尚无订单/照片业务验收。

## M3售前纵切片 · 2026-11-14

| 范围 | 实际检查 | 结果与证据 |
|---|---|---|
| T013-016/018、CU01-03、UI24-27 | 配置CAS/固定身份与作品特殊题型；十五图边界；提交幂等/回执隐私/不建项目；HttpOnly访客凭据+原提交键找回丢失回执；压缩去EXIF/历史引用授权/坏图计额/只读不发布/删除竞争/持久清理 | 当前API11通过，/tmp/proofroom-qa/m3-media-presales-final.log；并发重复PUT先RED2次写后GREEN1次，portfolio-red.log |
| 共享事务与鉴权附近回归 | 同连接回滚、MFA/凭据/角色/状态/配额真实PG锁竞争、审计失败回滚、售前与媒体 | 30通过（其中旧presales3；后来新增2与媒体历史引用已由上行增量覆盖），m3-backend-regression.log |
| UI01-03/06/24-27/34/36、CU01-03/UX05/AT34 | Chrome隔离context账号8场景；配置草稿/取消/双标签冲突；十五图灯箱/原文备注/回执刷新/忽略恢复；旧问卷兼容迁移；真实Worker压缩发布；320/390/393/1280无横溢；成功响应故意丢失→刷新恢复原回执且DB仅1咨询 | 集成14场景中13通过，m3-browser-regression.log；剩余列表回退等待URL后与PUT中断重试2场景通过，m3-list-retry.log（原失败为导航提交前立即goBack的测试时序，未放宽业务断言） |
| T005/独立构建 | Web/contracts边界；固定Node22 root+Web typecheck；API/Worker/Web build且Web无DB/S3/APP_SECRET环境 | 通过，m3-types-final.log、m3-build.log |

独立复核foundation_review报告的文件副作用、短月末日期、丢响应重复咨询、列表筛选、同账号重登录丢草稿问题已关闭；最后队列pending网络失败的原文件重试已修并由真实请求中断测试验证，最终源码确认待回执。作品上传采用file input自动设置文件，未宣称原生系统窗口验收；存储仍本地S3替身。UI07接单仍由T019/T022完成，T017保持未勾；T010媒体/导出政策和M4-M8尚未完成。

## M4接单、项目、预约与历史 · 2026-11-14

| 范围 | 实际检查 | 结果与证据 |
|---|---|---|
| T019-021/024、AT06/07/33 | 手工/咨询Tx创建项目+两图库、不同请求键并发确认一次；套餐/答案冻结与独立张数；排他约束、抢档、失效版本回滚不留半项目；改期/取消合作/恢复不占回；跨租户creation状态/逐资源批量权限；短月末/隐藏与恢复不续期 | orders11 + 相邻presales5通过，m4-api-expanded.log。完整微秒游标25+5在项目双向/历史/咨询均覆盖，m4-cursor-red.log→m4-cursor-green.log；归档不计入普通待办，角标与列表一致 |
| UI04-10/17/20-22/28/36、AT33/34 | 真实界面配置档期、手工建单核对/取消/最终确认；咨询旧套餐+抢档409保约定重选；客户上下文、目标复制/元数据只读预览；仅取消预约、取消/恢复合作；滚动追加30项/返回恢复位置；不以PIN搜索；历史恢复只改可见；4视口无横溢 | 当前集成8场景36.1s全绿，m4-browser-final.log。并发改期与咨询版本变化先加载最新父实体再确认；批量服务端成功但响应abort后沿用原payload，均在此8场景中实测 |
| 共享UI回归 | Dialog主动切步骤不误关父流程、layout关闭消除重复反馈窗口；列表窗口按账号+租户+筛选隔离、登出清理 | 账号8+售前7=15场景52.9s通过，m4-shared-ui-regression.log；先前滚动位置与弹窗反馈问题证据m4-e2e.log / m4-ui-recovery.log，修复m4-ui-recovery-2.log |
| 类型、架构、构建 | 固定Node22、Web无业务DB/存储私密依赖；API/Worker/Web独立构建（Web剥离私密env） | m4-types-final.log、m4-build.log通过；桌面列表截图m4-projects-1280.png已观察，手机公开页截图m3-public-390.png仅临时QA材料 |

独立复核foundation_review已关闭M4全部报告阻塞（微秒游标、待办口径、409父实体恢复与批量换键误报）；复核只读，测试由主Agent实际执行。T017接单UI已收口；T022仍保留客户照片只读预览到T030/T031，不以当前元数据预览扩大验收。原片/清单/精修/下载仍为M5/M6任务，不是全平台完成；M7/M8与最终整单也未执行。迁移002-007已在test应用，后续仅新增迁移。

原生系统窗口本轮未验：Chrome原生工具多次拒绝变化的目标窗口；Safari无窗口/超时，Chrome browser provider不可用。仅创建自有Chrome空窗口，未关闭/重用其他项目页；4样图在native-originals，但未选入/未上传，T029保持未完成。CUA已completion_summary。隔离QA另建专用测试账号/空项目，native-state.json不含客户能力URL。


## M22 · 独立原型，等待用户确认（2026-11-15）
原型docs/prototypes/public-booking-v1/包含index.html、style.css、app.js及6张本地示意图片；仅作为设计评审参考，不接API、不保存访问码、不创建真实咨询或占档。介绍短摘要/全文弹层；作品分类tab/跨组已选/最多15张；套餐意向同步；问答默认直接显示答案、长内容明确展开；预约草选确认/关闭保留原值；必填校验/选填偏好/演示回执。摄影师示意保侧栏，桌面无独立返回，浏览器历史及层级路径可返回，手机保胶囊及底栏；既有业务入口保留，非完整业务模块实现。

/tmp/proofroom-qa/public-booking-prototype/checks.json实测17项通过、正常/长内容两模式×6宽共12状态，pageErrors0、API请求0、非GET写0。覆盖tab键盘/跨组保留、照片切换/关闭焦点、套餐同步、预约关闭/占用/读错恢复、校验保留/访问码不出回执、15张上限、复制及失败回退、长介绍/分类/问答、桌面历史和手机导航。首次长内容检查的样例560字未达测试阈值600，后扩大样例并整组通过；不计为业务缺陷。独立foundation_review只读检查，弹层名称/末项移除焦点/完整退出示意和跨组已选建议均修正闭环，无新增确定阻塞；复核者未跑测试。未改正式React/API/DB/登录，未运行应用全量测试或重启旧服务。

评审 http://127.0.0.1:18188/，摄影师导航 http://127.0.0.1:18188/?view=studio；静态服务父53927，pid/log及截图集中上述/tmp目录，可在评审结束后按授权清理；原型源保留作实施参考。T101仅原型完成，T102明确等用户确认，不能据此宣称正式页面已改。2026-11-15用户明确授权提交前后端，当前同一仓库主提交27cb7b3包含Web/API/Worker/共享包、旧码迁移及独立原型；运行环境与私密QA状态未入Git，无推送/部署。


## M23 · 正式应用Apple产品体验（2026-11-15）
用户明确选择直接改18186的客户、摄影师和Owner端，覆盖先原型确认限制；平台后台不改。保暖色品牌/React+Next/分离API、登录、既有功能入口和已有数据。本轮没有实施完整原版功能合并、收费或配额政策，D07仍待确认。

- 工作台待办在前，项目整卡保单一目的入口并可直接处理当前步骤；项目分区滚动吸顶。电脑侧栏、浏览器历史；手机胶囊、五tab、真实计数和中间新增按钮保持。
- 客户首页短介绍/全文弹层、可识别且有方向键的作品tab、完整长分组名可展开、照片选中边框/勾；套餐可直接选，FAQ问题与答案直接可见，长内容可展开。题ID/顺序/必填、原文、草稿/冲突/提交幂等保留。
- 客户项目阶段进度可见、长品牌与项目名可展开，选片/备注确认后反馈；精修/交付保现政策，下载主卡位于规则说明前。最终390×852实测主下载按钮y675.47、说明y764.47，完整可点；原片/精修/单图入口保留，下载权限和源字节逻辑未改。
- 可中断移动指示、弹层进退/反向、reduced-motion即时及动画中切换、按压表面反馈。退出surface inert、阻click/submit，native modal保持至退出完成；取消危险操作后仍在画面的按钮不能发命令。Portal自带产品样式scope，长预约正文独立滚动、确认在底部；关闭后回可用trigger，未知/只读时回同组legend。IME候选默认动作保留，只阻业务提交/快捷键，组合期间暂停备注自动保存。

| 验证 | 本轮实际结果 | 证据（均/tmp/proofroom-qa/apple-experience/） |
|---|---|---|
| 5个具体e2e文件，固定Node22，复用18186/18184，单worker | 72个唯一用例最终闭环：final-regression.log首跑70过2失败；两失败为新测试textarea误匹配隐藏复制区/测入场动画时几何与浮点。修测试后verified.log 4过1失败（3个为下载/首屏附近回归，另1为IME）；portal-final.log剩余预约在入场idle后量测与未知焦点通过1项 | final-regression.log、verified.log、portal-final.log。保留初次失败记录，未跳过断言或改业务状态 |
| 账号、角色、实际预约附近补充 | 12通过/50.1s：成员邀请注册/权限拒绝/移除、Owner转移、工作室切换/账号/MFA/跨标签草稿，嵌套预约草选确认/键盘、只读/未知关闭焦点，真实日期/时段设置重叠恢复 | roles-final.log；只新隔离工作室写测 |
| 动效及缩屏 | 中间帧/快速反向/reduce/取消后零命令，发现缩屏取消旧动画后settle覆盖新位置：RED选中438、指示494；先移除running记录再cancel后，同一动画中缩屏对齐误差<1px。3项相关回归10.5s通过 | motion-final.log；这3项是上述72内用例加断言，唯一合计仍84，不重复计数 |
| 手机/电脑实际渲染 | 47状态：15工作台路由×390/1440，公开页两宽，客户P1/P2/P3/P4/归档×320/390/1440，0整页横溢/0页面脚本异常。客户后续15状态重测；最终P4截图及可访问品牌DOM另核对。响应测试还覆盖393/767/768/1024/1280/1920 | render-checks.json、isolation-final.json、client-P4-390.png及各角色截图；原有彩色色块/长Mock内容保留 |
| 平台隔离 | admin源文件/API/domain/upstream无diff；后台product作用域0；CSS字体/颜色/表面/内边距/圆角8类签名前后完全相同、0新签名。后台列出的控件从3555增到3885是新隔离测试工作室数据，不能拿动态列表长度/几何当样式变化 | platform-isolation.json、platform-before/after.json；不是平台新功能验收 |
| 静态与边界 | root/Web tsc --noEmit、架构guard通过；受影响lint0错误，17条原有告警逐文件数量未增（旧effect同步setState与压缩预览img）。未新增依赖，不运行并发typegen/build，不重启服务 | types-tests-final.log、types-web-final.log、lint-final.json、lint-comparison.json及工具guard输出 |
| 独立复核 | foundation_review只读源码与实际截图复核；portal作用域、反向采样、IME默认动作、sticky、焦点resolver、退出危险操作、长名可读/品牌可访问名称均已修正关闭，最后取消旧settle修法静态确认无阻塞。复核者未跑测试，测试由主Agent实际执行 | 当前会话复核结果与上述实际结果分别记载 |

72+12=84个唯一用例，不是全仓/原版全功能测试总数。本轮真实浏览器自动化与本地PG/Worker/下载集成，包含合成键盘/IME事件、文件输入或拖入注入；未扩称真机、真实系统输入法候选窗口、Finder原生拖入、VoiceOver、生产验收或60fps测量。已有体验7项目不作写测；私密state里的project对象是创建时快照，不是当前版本基线，未用其历史version相等来宣称数据保全。原型本轮未完成尝试已恢复原已验版本。未提交、推送、部署；正式前端源与文档改动保留待后续指令。

预览摄影师/Owner http://127.0.0.1:18186/studio ，客户公开页 http://127.0.0.1:18186/t/experience-8e4929209248 。保留本地服务。私密客户能力链接/PIN不写到此记录。临时证据可在用户结束体验后按需清理，项目源码/spec/既有历史保留。


## M24 · 导航、表单顺序、刷新加载与项目工具 · 2026-11-15

范围：正式18186外部产品界面，保留M23未提交变更。T107–112关闭；平台后台、API/domain/数据库结构/upstream均无源码变更，不代表原版全功能合并完成。既有体验项目不作写测，只新建隔离工作室/客户样本。

| 验收内容 | 本批实际结果 | 证据 |
| --- | --- | --- |
| 横向分类/状态/日期导航 | 隐藏横向滚动条，只保留右箭头；无溢出及最右侧隐藏。上滑吸顶，手机避开顶部栏、预约弹层在自身滚动区吸顶。320/390/768/1440、动态尺寸、键盘与消失时焦点通过 | m24-final.log T107/T088/T089；保留横滑与减少动态效果 |
| 客户模块顺序与浏览 | 作品与风格、套餐与问答位于全部问卷答案后、意向套餐前；删除两处跳转按钮和重复分类名。非提交按钮明确type=button；暂停咨询仍可浏览分类/照片/长问答。真实咨询提交保留参考作品、套餐和备注原文 | m24-final.log T108/T077/T103/105及CU01–03/UX05 |
| 刷新与恢复 | 下拉/松手/双点刷新/回弹；等待实际GET完成再反馈，失败保留内容并可重试。短拉不请求；减少动态效果直接归位；匿名公开页/PIN页无工作人员cookie也可刷新。保存或上传忙时不重触发，未重放写请求，外壳与草稿保留 | m24-final.log T110；新视频本地8帧查看于m24-video，未上传媒体 |
| 公开配置新鲜度 | 未编辑表单刷新后应用新内容与提交状态；已编辑表单保答案/PIN/问卷快照，内容或问卷变化要求明确核对后迁移。Owner实际修改开放状态/问答后顾客刷新、新问卷兼容迁移均通过 | m24-final.log T110/CU02/UX05 |
| 分页与即时筛选 | 既有游标接入上滑加载、图标/加载/到底反馈；读取失败不循环重试，手动重试一次，刷新回到首游标。删除项目筛选/刷新按钮，状态/排序即选即过滤，搜索保回车 | m24-final.log T110/111及UI05/24；m24-error.log原T042列表失败保旧行、重刷读到新增行 |
| 项目工具位置 | 客户预览/更多集中于顶部身份卡，移除分区下重复工具块；危险操作确认取消零写入；长名两行且可展开完整名 | m24-final.log T112；m24-project-390/1440.png |
| 实际渲染与附近回归 | 公开页/项目/项目列表×390/1440共6状态无整页横溢/页面脚本错；公开页两张lazy图滚入视口并等待加载后naturalWidth240。预约、真实售前编辑/冲突/草稿、前进后退/工作室切换均通过 | m24-render.json及m24-public/project/list截图；m24-final.log |
| 静态及独立复核 | 固定Node22执行root与Web tsc --noEmit、架构guard、diff --check通过；27个受影响文件lint 0错误，24条既有告警逐文件规则数量与HEAD相同，新errors测试单独lint 0；无新增依赖。foundation_review只读关闭匿名鉴权、浏览禁用、焦点、配置新鲜度及回弹清理阻塞 | m24-types.log、m24-test-types.log、m24-lint-final.json；独审未跑测试，主Agent执行上述用例 |

执行命令：`PROOFROOM_E2E_REUSE_SERVER=1 <固定Node> node_modules/@playwright/test/cli.js test tests/e2e/{interface-feedback,presales,booking-profile,orders,spa-navigation}.spec.ts --grep <M24及附近用例> --reporter=line`最终23通过/1.4m；随后`test tests/e2e/errors.spec.ts --grep 'T042/UI05:'`1通过/6.9s，共24个唯一本批用例。首轮7项中1项等待DOM时点失败已补等待；中间22项21过1售前Dialog定位失败，其间有源码热更新，原因不作已证实结论，稳定源码重跑后该项通过。保留初次日志，不跳过断言，不把M23历史84项作为本次新跑。

证据集中在`/tmp/proofroom-qa/apple-experience/m24-*`，临时日志/截图/视频帧在结束体验后可清理；源码/spec/历史保留。测试使用真实本地浏览器及隔离PG数据，触摸为合成事件、屏宽为浏览器视口；未扩称微信/手机真机、系统输入法候选窗口、Finder原生拖入或生产验收。保留现有服务、功能、数据和登录，未提交/推送/部署。摄影师入口与公开页均复核HTTP200： http://127.0.0.1:18186/studio ，http://127.0.0.1:18186/t/experience-8e4929209248 。


## M25 · 操作入口分层、手机交互和筛选 · 2026-11-15至16

T113–120关闭。只调整外部Web布局和交互；保留现有业务接口、功能、角色权限、状态规则、数据与登录。平台业务源、API/worker/domain/数据库结构/upstream无diff，原版全功能合并不属于本批。参考Vant官方Search/ActionSheet的交互模式，继续React及既有组件，不安装Vue/Vant或新增依赖。

| 范围 | 实际结果 | 证据 |
| --- | --- | --- |
| 全页入口层级核查 | 检查摄影师工作台/项目/咨询/图库/照片/作品/档期/配置/团队/账号/我的/帮助备份/历史/交付，以及客户咨询/私密项目/选片/下载。保上传、填写本单约定、编辑、提交、主下载、联系、当前异常重试直达；密码/MFA/设置保存取消及单一恢复入口保持其原流程。低频刷新/导出/复制配置/删除/权限调整/Owner纠正集中在就近更多 | 源码入口核查与以下实际受影响用例；不是逐一重验所有原版功能 |
| 咨询/图库/作品与团队 | 咨询顶部主入口定位约定表单，忽略进更多，取消保草稿，忽略/恢复保提交快照；图库标题卡常驻关联上传，复制配置收更多，独立新建/返回普通新建保身份与PIN隔离。作品编辑/失败重试可见，删除及分组删除收更多；团队角色/移除/所有权保持命名确认 | m25-final.log、m25-repair.log、m25-close.log；UI03、UI24–27、UI25、UI30–33、UX01/05 |
| 客户主任务 | 只看已选保直接操作，辅助查找/视图/导出/读新照片进更多；选片提交、下载主入口及联系继续可见。真实本地上传、CSV公式转义、只读预览、失败刷新禁止提交、拒绝剪贴板后的手动复制和鼠标点击关闭返焦通过 | T080、UI18/35、CU07/09、T057；原方法与请求键/数据规则保留 |
| 项目搜索/排序 | 隐藏可见搜索/排序文字标签，保输入可访问名称，内置放大镜提交；3排序横向点击即时过滤并显示选中态，和状态共同吸顶。搜索与排序保条件、浏览器历史及中文组合输入意图 | T119/120、T053、T110/111；合成IME Enter不触发请求，明确搜索提交后过滤；非真实输入法候选窗口验收 |
| 手机选择与更多 | 手机更多采用底部动作面板、遮罩/取消/安全区，电脑保持定位披露；手机Select底部列表保原选项、即时选择、取消不改值、键盘及禁用规则，跨断点保值。平台不启用手机改造分支 | T113/114、T114、T119/120、T120；最后m25-isolation.log 5通过/31.5s，包括原平台操作员只读支持UI34 |
| 只读/焦点/裁剪修复 | 独审发现的作品面板裁剪、复制fallback鼠标点击误关更多、portal脱离禁用fieldset、选择层变只读后无法关闭4项P2均修。更多继承/同步重验原fieldset禁用且取消可用；Select实际禁用后收起并释放滚动。真实Member不能绕过套餐只读；作品删除按钮elementFromPoint实际命中true，复制失败关闭回原复制按钮 | 两项T120及T057，实际浏览器几何/命中核对；foundation_review最后源码复核无阻塞，未代替主线程运行测试 |
| 箭头与间距 | 可见箭头图标16px、触达44px；最右160ms淡出/缩小并立即禁点、移除键盘/可访问曝光，反向恢复，减少动态效果立即归位。客户套餐问答分隔线上方标题留白28px，相关public sections四宽首子元素距边界≥20px；其他列表/答案/确认分区保已有间距 | T117/118及两项T107，320/390/768/1440；真实中间opacity处于0与1之间，非只看最终截图 |
| 手机/电脑呈现与静态 | 项目/图库更多/公开内容/图库选择×390/1440共8状态无整页横溢或页面脚本错。手机动作面板入场idle后top678/bottom900/height222，补图替换中间帧；电脑作品删除入口命中。root/Web tsc --noEmit、架构guard、diff --check通过；41受影响文件lint0错，30既有警告逐文件规则数与HEAD相同，最后Select增量lint0 | m25-render.json、m25-{projects,gallery,public,select}-390/1440.png、m25-portfolio-more-1440.png、m25-{web,test}-types.log、m25-lint-final.json |

固定Node22执行Playwright，`PROOFROOM_E2E_REUSE_SERVER=1`复用18186，单worker、无自动重试。受影响文件action-placement/interface-feedback/presales/galleries/selection/booking-profile/account/delivery，按上述编号grep。27项集成首跑21过6失败，修定位/空fixture/导航及确认退出时点后13项补跑11过2失败，最后2通过15.9s；最终平台隔离5通过31.5s（新增UI34，其余4已在27内）。共28个唯一闭环用例，非一次28全绿、非全仓/原版全功能回归。初轮4新用例失败、整合getByLabel与Dialog重名、短暂组件语法错误导致500及后续记录保留于m25-actions/m25-integrated-first/m25-final/m25-repair/m25-close日志，不跳过断言；语法已修且入口恢复HTTP200，没有重启既有服务。

测试只写新隔离工作室/项目/客户与本地mock，既有体验项目只读展示；私密state未打印或覆盖。以上为本地浏览器及真实隔离API/PG/worker集成，手机为视口/合成事件，未扩称手机/微信真机、VoiceOver、真实系统输入法、原生Finder拖入或生产验收。既有服务保运行，未commit/push/deploy。长期保留源码、tests/e2e/action-placement.spec.ts及spec；临时证据集中在/tmp/proofroom-qa/apple-experience/m25-*，结束体验后可清理。

摄影师/Owner预览 http://127.0.0.1:18186/studio ，客户公开页 http://127.0.0.1:18186/t/experience-8e4929209248 ，最终均HTTP200。Vant官方参考为 https://raw.githubusercontent.com/youzan/vant/main/packages/vant/src/action-sheet/README.zh-CN.md 和同目录search/README.zh-CN.md ；参考交互，不迁移框架或计费/预约/选片/交付功能。


## M26 · 手机胶囊与快捷操作 · 2026-11-16

T121–123关闭。只调整外部工作台壳、Mine、产品CSS与受影响测试；保留前批未提交改动，不动平台业务源/API/domain/worker/DB结构/upstream，不重启/提交/推送/部署。

| 验收 | 实际结果 | 证据 |
| --- | --- | --- |
| 胶囊外观/触达 | 手机可视88×32、按钮各44×44、图标18；320/390/767通过，无整页横溢。768/1440隐藏胶囊并保电脑侧栏切换。长标题、底部tab和既有返回逻辑保留 | T121、T095/T103、T092/093；m26-quick-390.png实际观察 |
| 快捷操作 | “…”为待处理项目、拍摄日程、复制售前链接。原工作室列表/创建功能不在快捷面板，Mine团队账号组唯一“工作室管理”打开原Dialog及原命令；电脑保侧栏原入口 | T121、T122、原T075两个模块完整性用例 |
| 快捷导航/复制 | 跳待处理不重载document/script/stylesheet，外壳保持；跳日程触发原未保存保护，取消保原文并返焦胶囊。立即复制内容正确，拒绝剪贴板后可手动复制，鼠标点关闭回原复制按钮 | T121、T122；既有CopyText方法，不加新分享接口 |
| 工作室功能保全 | 手机从Mine实际创建工作室，同一账号id不变、工作室数增1；再切回原工作室，恢复原客户草稿。既有项目version/title不变。桌面原切换的草稿守卫/延迟URL提交取消保留，手机隐式Mine URL的取消切换不会采纳迟到导航 | T122、T065、两项T093；只新隔离测试账号/工作室/项目写测 |
| 复制生命周期修复 | 独审发现复制状态常驻可跨断点残留或延迟失败重弹；T123先实测RED：应0个open dialog但仍1个。快捷CopyText按user/studio/quickActions开闭key隔离后，失败兜底→跨断点、pending复制→关闭后迟到reject、再打开均绿；父面板仍保退出动画 | m26-lifecycle-red.log与m26-final.log；foundation_review静态复核关闭P2，未代主线程跑测试 |
| 附近恢复/静态 | 刷新失败toast按内容宽度但仍限视口，非交互文字不挡页面，重试按钮保可点；数量失败恢复从可见重试刷新完成。root/Web tsc --noEmit、架构guard、diff --check通过；5受影响TS/TSX文件lint0错，2条原有effect告警逐文件规则与HEAD相同 | T092 large counts、T110；m26-{web,test}-types.log、m26-lint.json及工具guard输出 |

固定Node22、Playwright复用18186、单worker无自动重试；action-placement/interface-feedback/booking-profile/spa-navigation按T121/T122/T123、T092/T095、T075、T065/T093、T110筛选，最终12项一次同跑全部通过49.4s。初轮10项8过2失败：新用例surface选择器误中嵌套隐藏fallback、旧数量测试重试目标被浮层/顶栏遮挡；分别明确直接surface、使用当前可见浮层重试入口，并修正toast宽度/点击穿透。初次测试类型NodeList迭代写法改Array.from；不改业务以迎合测试，不略过断言。RED/初轮日志保留，不将M25历史28项作为本次新跑。

这是浏览器视口、合成事件及本地真实隔离API的验证，未扩称手机/微信小程序真机、真实系统输入法或生产验收。既有体验业务数据只读；私密state未输出/覆盖。证据集中/tmp/proofroom-qa/apple-experience/m26-*，体验结束可清理；源码/spec/已有测试长期保留。工作台 http://127.0.0.1:18186/studio 与客户公开页均最终HTTP200，服务保运行。


## M27 · 复制成功Toast · 2026-11-16

T124–125关闭。外部产品复制反馈统一为顶部居中的深棕灰底白字勾图标Toast，1.8秒淡入/淡出，不占卡片布局；平台旧复制反馈分支保持。只改共享CopyText、ToastProvider复制通道、Photos文件名反馈、产品CSS及增量/spec，保原复制内容与业务接口/数据/登录；平台业务源/API/worker/domain/DB结构/upstream无diff，无依赖/重启/提交/部署。

| 验收 | 本批实际结果 | 证据 |
| --- | --- | --- |
| 成功反馈与布局 | clipboard回执前无成功Toast，按钮忙态保留；成功后微信号提示“已复制微信号”、其他内容“已复制”、文件名“已复制文件名”。原copy-feedback成功文字在产品范围不再渲染，成功图标保留；卡片前后高度相同。320/390/1440不整页横溢，单例重复复制、自动消失及减少动态效果通过 | T124；m27-copy-390.png实际观察；微信内容与上传场景原值一致 |
| 弹层与意图归属 | 提示Portal进入复制源所在native dialog或body，弹层内实际paint命中并可见；只最近一次复制意图显示提示，较旧延迟完成不盖新提示。失败无成功Toast、保手动复制与重试，重试成功保焦点。宿主关闭清提示，关闭来源后的迟到成功不再弹出 | T125/T123/T121；m27-copy-modal-390.png实际观察 |
| 摄影师/客户/现有入口 | 项目卡客户微信复制不触发项目导航；PIN客户端复制摄影师微信内容正确且无原位提示；Mine售前链接、快捷入口、拒绝复制手动恢复、平台只读支持仍通过 | T077/T055/T075/UI34及T124末次新增客户路径；不把平台历史样式签名当本次新证据 |
| 文件名失败恢复 | 真实本地上传两张、选中、文件名复制拒绝后可手动复制并返焦，再成功后Toast提示且精确文件名不变。独审发现旧失败notice会残留，补断言实测RED（应0条仍1条）；成功仅清匹配的copyFailureNotice，其他照片业务提示与CSV代码路径保留 | m27-retry-red.log、m27-final.log T057；CSV分支静态保留，本批未扩称新增CSV全路径验收 |
| 静态与复核 | root/Web tsc --noEmit、架构guard、diff --check通过；5受影响TS/TSX文件lint0错，5既有告警逐文件规则数与HEAD相同。foundation_review源码复核P2关闭、无剩余阻塞，复核者未运行测试 | m27-{web,test}-types.log、m27-lint-final.json及工具输出 |

固定Node22、复用18186、Playwright单worker无自动重试；action-placement/interface-feedback/selection/booking-profile/account按T124/T125、T121/T123、T055/T057/T077/T075/UI34筛选，9项集成通过50.6s。随后独审补失败notice断言，T057实测RED并修复，最后T057/T124两项通过14.7s（T124补真正PIN客户端路径），唯一本批仍9项，非修后再次全9同跑。剪贴板用浏览器替身控制成功、拒绝和延迟，不冒称真实系统剪贴板/VoiceOver/微信手机真机验收。测试只写新隔离账号/工作室/项目/样图，既有体验业务只读，私密state未输出/覆盖。

证据集中/tmp/proofroom-qa/apple-experience/m27-*，体验结束后可清理，源码/spec/既有测试保留。工作台 http://127.0.0.1:18186/studio 与客户公开页最终HTTP200，本地服务保运行。


## M28 · 长名称行内展开 · 2026-11-16
T126–127完成。Mine工作室身份、摄影师/客户项目名称、公开工作室及套餐名称用共享NameDisclosure：去掉下方文字展开按钮，名称末尾18px下箭头/44px触区，展开转为上箭头，保两行折叠/完整原文和heading可访问名称。短名无多余按钮；客户顶部原品牌箭头统一大小与旋转。正文/问答/工作室切换/更多菜单等原功能保留，平台/API/worker/packages/upstream无源diff；不改业务、数据库、登录或既有体验数据。

本地实际验证：
- T126/127新2项：320/390/1440，Mine/摄影师项目/客户项目/公开工作室/套餐；箭头44px、aria-controls/expanded、Enter/Space返向与焦点保留、展开原文可读、减少动态效果、无整页横溢。客户表单答案/PIN保留，浏览展开无提交请求；真正PIN客户端项目和约定/version不变。
- 原受影响8项：T070、两项T075、T080、T095/T103、两项T108、T112；覆盖原Mine入口/完善提示、公开分享、客户照片优先、手机电脑壳、表单真实咨询/关闭状态正文与问答、项目工具/取消危险操作不写入。
- m28-test初轮2失败为测试自身动态label定位和非原子滚动坐标读取；测试修正后m28-final 10项9过1（reduce已有全局强制时长0.01ms，测试原要求严格0s），最后适配阈值并等箭头动画settle，m28-recheck两新项全过30.1s。本批10唯一用例闭环，非一次10同跑全过；未以测试失误扩称业务bug。
- root/Web tsc --noEmit、架构guard和git diff --check通过；7文件lint0错5既有告警，client/public逐规则与HEAD一致。foundation_review独立静态复核无确定P1/P2，未代主线程执行测试。
- m28-mine-390.png、m28-project-1440.png、m28-client-390.png已实际查看；不扩称微信/手机真机、系统输入法、VoiceOver或生产验收。

固定Node22复用18186/18184，未重启/build/typegen/commit/push/deploy；现有未提交改动全保。测试仅写新隔离fixture，私密state未打印/覆盖。证据集中/tmp/proofroom-qa/apple-experience/m28-*，验收后可清理。/studio/mine与/t/experience-8e4929209248已确认HTTP200。当前用户要求新会话交接，下一步只读交接与Git确认后等待新指令。


## M29 · 手机端产品体验收口 · 2026-11-16
T128–129完成。外部客户/摄影师/Owner三端共享产品层原语（下拉刷新、上滑加载、横向条、选择导航、名称折叠）与Toast/弹层/相册手势/选择器反馈统一；横向标签条右箭头由大圆改32px圆盘、按钮本体仍44×44且到末端自动隐藏；“我的工作室”改为完善进度+一键待办直达。平台后台、API/worker/packages、业务与数据未改。

本地实际验证：/studio/mine 与共享横向条实测箭头按钮44×44、可见圆盘32px；完善进度可点击直达；长名称行内箭头展开保两行折叠；320/390整页横向溢出0。受影响增量与静态检查通过。源码随3418b12、61dc74f提交，本节为spec补记，不新增声称。


## M30 · 反馈位置与折叠、骨架、步进 · 2026-11-16
T130–131完成。五项手机端交互收口，全部只在外部产品UI内，平台后台/API/worker/packages无源diff，业务规则、数据库、登录与既有体验数据未改。

| 项 | 实测行为 | 证据 |
| --- | --- | --- |
| 成功反馈贴底 | 保存成功后反馈以position:fixed停在底部84px（底部导航之上），role=status仍唯一、文案“已保存到工作室。”不变；0.7s不透明，4.9s透明度0，pointer-events:none时elementFromPoint命中下层字段，不挡后续输入 | m30-ack-live.png；ack@0.7s/ack@4.9s/ack-hit输出 |
| 折叠项动效 | summary统一44px头部、marker隐藏；展开时::details-content blockSize 0→392→466→476px（0.28s），箭头45°→225°；不支持interpolate-size时退化为瞬时展开，<details>语义与xpath断言不变 | details-trace/details-after输出；m30-details-open.png |
| 勾选框 | 手机端22×22、accent取品牌色，触区由.check-line 48px承担；桌面仍走20px原规则 | /studio/portfolio 实测count 2、size 22×22、line 48px |
| 首屏骨架 | 项目/咨询/图库/历史空列表首屏改3–4行形状骨架，带role=status与aria-busy；有数据时仍用原Loading，加载完成后骨架消失 | 骨架实测3行252px；m30-skeleton.png |
| 精修张数步进 | 默认精修张数与套餐精修张数两侧各加44×44加减键，1…300夹取，输入框id/data-field-path/label文案不变 | 步进键[[44,44],[44,44]]，值10，label“精修张数”仍可定位 |
| 空态与减少动态 | 手机空态图标收进56px圆底；prefers-reduced-motion关闭ack-dock、骨架扫光、箭头与步进过渡 | globals.css M30块；静态复核 |

固定Node22、复用18186（API 18184 / proofroom_test），单worker、retries 0。受影响增量presales/action-placement/interface-feedback/galleries/booking-profile共75项通过；product-experience T050/T051 报browserContext.newPage崩溃，暂存本批全部改动后复跑同样失败，判定为既有本地Chrome环境问题，未计入本批回归也不宣称通过。root/Web tsc --noEmit通过。测试只写隔离fixture，私密state未打印/覆盖。不扩称微信/手机真机、VoiceOver或生产验收。证据在/tmp/proofroom-qa/apple-experience/m30-*，验收后可清理。


## M31 · 真实 Chrome 内核复测与修复 · 2026-11-16
T132完成。承接M30遗留的 `browserContext.newPage: Target crashed`，用真实 Google Chrome 内核（channel:chrome，Chrome 157.0.8103.51，headless）复测：先定位崩溃根因并修复，再跑受影响增量，最后按 Chrome 下暴露的真实缺陷修一处产品样式。平台后台、API/worker/packages、业务规则、数据库、登录与既有体验数据未改。

| 项 | 根因/缺陷 | 处理 | 证据 |
| --- | --- | --- | --- |
| T050/T051 崩溃 | `test.use({launchOptions:{chromiumSandbox:true}})` 与 `channel:'chrome'` 叠加，Mac 下 Chrome 沙箱与 Playwright 冲突，上下文创建即崩 | 删掉该行，改用 Chrome 渠道默认沙箱配置 | 同文件两项在 Chrome 下全过；崩溃复现 100%、移除后 0 次 |
| 用例预算 | 跨模块长链路实测 45～75s，含 Chrome 关闭上下文 10～30s，45s 周期性误报超时 | `timeout` 45000→90000（配置内注明原因）；T053 单条 `test.setTimeout(150000)` | 57 项连续跑无一超时 |
| T094 计数断言 | 工作台每 30 秒后台轮询一次 dashboard，长用例正好插进一次读取，`reads` 计数多 1 | `addInitScript` 覆盖 `visibilityState='hidden'` 静音轮询，只统计主动刷新的读取 | 断言 reads=1 稳定通过 |
| T099 触区断言 | 44px 触区在 DIP 下算成 43.99997，高度断言取 `>=44` 会假失败（宽度侧早已按 43.5 口径） | 高度断言与宽度同口径，改 43.5 并注明亚像素原因 | 四项宽度均通过 |
| T050 下载流程 | 用例仍按合并前两步流程（准备全部照片ZIP→下载全部照片ZIP），当前主卡是"下载全部照片"单击直下 | 改为单击主卡按钮、`waitForEvent('download')` 给 120s | 5 个文件哈希与源文件逐一相等 |
| 布局越界断言 | `inspect()` 把横向滑动条内的标签和被 ellipsis 有意裁切的元素也报成越界 | 只报"看得见的越界"：祖先可横向滚动或自身 `overflow-x≠visible` 时不计 | 320/390/393/1280 四档不再有假阳性 |
| 折叠箭头溢出（产品源） | `summary::after` 用 border 拼箭头再 `rotate()`，旋转后的伪元素盒子外扩，320/390 下多出 3px 横向可滚动溢出 | 箭头改 `clip-path` 多边形绘制（10×10，开合两套顶点），`transition:opacity/clip-path .2s` 保留翻转观感；`.project-tools` 的 `⌄` 字形不受影响 | 实测箭头盒 10×10、`clip-path` 闭合 `polygon(50% 68%,4% 22%,14% 12%,50% 48%,86% 12%,96% 22%)`、展开为镜像顶点、opacity .45→.85、transition `opacity, clip-path 0.2s`；整页 `scrollWidth` 390/390、1280/1280，横向溢出 0 |

本地实际验证：Playwright 走真实 Chrome 渠道、单 worker、retries 0，固定 Node22 复用 18186/18184，未重启/build/typegen。
- 受影响增量 booking-profile + interface-feedback + presales 共 57 项，17.3 分钟全过（`57 passed`）。
- 此前唯一崩溃点 product-experience 两项在 Chrome 下全过：T050/T051 5.2 分钟通过，T051 上传用例同批通过。
- root 与 Web `tsc --noEmit` 通过；`check-architecture.mjs` 边界通过；`git diff --check` 干净。
- 测试只写新隔离 fixture，未向体验项目写入；私密 state 未打印/覆盖。不扩称微信/手机真机、系统输入法、VoiceOver 或生产验收。
- 箭头改法的观感单独确认：在真实 Chrome 里用产品层同一套 CSS 渲染折叠项，闭合态为向下的 V 形、展开态为向上的 V 形，无模糊色块；截图 m31-chevron-closed.png / m31-chevron-open.png。（探针脚本用完即删，未入库。）

## M32 · 工作室名展开按钮底色 · 2026-11-16
T134完成。承接M31的 Chrome 复测，修一处视觉缺陷：`我的工作室` 卡片里长名称的展开按钮，鼠标停在上面会出一块 44×44 的浅色圆角底（`#f8f4ef` 落在 `#f0e8df` 卡片上），点开收起时指针仍在该按钮上，看起来像多出一个背景方框。

| 项 | 缺陷 | 处理 |
| --- | --- | --- |
| 展开按钮 hover 底色 | `.name-disclosure-toggle:hover` 带 `background:var(--color-surface-2)`，与卡片 `#f0e8df` 形成可见方块 | 去掉 hover/active 底色，只保留 `color` 变化（hover 转 pine、按下转 pine-dark）；同时清掉已无作用的 `border-radius:8px` |

同类位置一致性：客户页 `.client-brand-toggle`、项目页同一 `.name-disclosure-toggle` 共用此规则，改一处全部收敛，无残留底色。
实测（Chrome 157 渠道，390×852）：静止/悬停/点开三态 `background-color` 均为 `rgba(0,0,0,0)`，悬停态 `color` 变为 `rgb(138,90,59)`，展开态箭头朝上；44px 触区与 18px 箭头未变。
回归：action-placement + booking-profile 共 31 项 2.3 分钟全过；`git diff --check` 干净。不扩称其它宽度或真机。

## M33 · 刷新入口随下拉刷新统一下线 · 2026-11-16
T135/T136完成。产品层从 M29 起就有下拉刷新：`PageRefresh` 在 `scrollY<=0` 时接手触摸/滚轮手势，把 `useResource`（默认 `globalRefresh=true`）与 `useCursorWindow` 注册进 `registry.reads` 的读一次性重跑。既然每一页的读都能被下拉触发，页面上再留一个"手动刷新"按钮就是同一动作的第二个入口，本轮把它们全部清掉。

| 页面 | 删掉的入口 | 原位置 |
| --- | --- | --- |
| 工作台 | 刷新工作台 | 标题右侧 |
| 咨询 | 更多咨询列表操作 → 刷新咨询 | 标题右侧菜单（菜单只剩刷新，整段移除） |
| 项目图库 | 更多图库列表操作 → 刷新图库列表 | 列表标题右侧菜单 |
| 项目图库 | 读取最新图库照片 | 图库照片管理区菜单（菜单只留"切换列表/网格"） |
| 预约日程 | 更多日程操作 → 刷新日程 | 卡片标题右侧菜单 |
| 搜索历史 | 更多历史操作 → 刷新历史 | 搜索按钮旁菜单 |
| 帮助与数据 | 刷新工作室状态与额度 | "当前工作室"标题右侧 |
| 交付与下载 | 刷新下载状态 | "源文件下载"标题右侧 |
| 交付与下载 | 刷新精修预览 | "精修预览"标题右侧 |

刻意保留的四处及理由：

| 保留项 | 为什么不删 |
| --- | --- |
| `/studio/platform` 的刷新运行状态、刷新账号状态 | 该路由 `ProductExperience active={false}`（application.tsx:29），整页没有下拉刷新，删了就没有刷新手段 |
| 客户公开页 `client.tsx` 的刷新项目进度 | 客户侧未登录、不挂产品层，是访客自己的兜底入口 |
| `ZipCard` 的"正在准备下载…" | 与"刷新{原片|精修}打包状态"共用同一按钮位：打包中是状态节流入口，就绪后立刻变下载按钮；状态本身另有 1400ms 自动轮询 |
| 时段表单的"重新读取时段" | 语义是查询此刻可用性（带 `open` 条件），不是刷新页面数据 |

改写与验证：
- action-placement 原 T113/114 的前提（"更多*操作"菜单里应有刷新项）被本轮删除，重写为 T135：遍历工作台/咨询/图库/日程/历史/帮助 6 条路由 × 320/1440 两档，断言 `getByRole('button',{name:/^刷新/})` 计数为 0、含"刷新"的"更多*操作"菜单为 0、主操作仍可见、整页 `scrollWidth<=width`，并统计整轮非 GET/HEAD 请求为 0（只读）。
- interface-feedback T081：原来靠点"刷新下载状态"把 `ready` 推进到 UI，按钮删掉后改为让 `ZipCard` 的 1400ms 轮询自己接上——这反而是真实路径。断言不变（只下载一次、403 后 `downloads` 仍为 1）。
- interface-feedback T094：末段"点刷新工作台触发 503"改为在 `.status-cards` 上下拉，标题里的 "and the refresh button" 一并删掉。
- booking-profile T069：原来 `更多日程操作 → 刷新日程` 才能看到后台新建的历史时段，改为在 `#main` 上下拉，并等 `page-refresh-feedback` 到 `done` 再断言。
- action-placement T117：`expect(during.opacity).toBeLessThan(1)` 曾偶发收到 `1`——160ms 渐隐的起点帧数不固定，固定等 45ms 会采到过渡还没启动的初值。改为逐帧等到第一个 `<1` 的中间值再取快照，语义（渐隐而非硬切）不变。

本地实际验证：Playwright 走真实 Chrome 渠道、单 worker、retries 0，固定 Node22 复用 18186/18184，未重启/build/typegen。
- 受影响增量 action-placement + backups + galleries + interface-feedback + presales + booking-profile 共 77 项，13.3 分钟全过（`77 passed`）。
- root 与 Web `tsc --noEmit` 通过；`check-architecture.mjs` 边界通过；改动 11 个文件 eslint `0 errors, 9 warnings`（均为既有 `react-hooks/set-state-in-effect` 等）；`git diff --check` 干净。
- 真实 Chrome 390×852 探针：6 个受影响页面 `刷新*` 按钮为空、`documentElement.scrollWidth==innerWidth==390` 无横向溢出；滚轮上滑触发下拉得到 `{state:'done',text:'已刷新'}`，1.4s 后反馈消失，说明下拉确实覆盖了被删按钮的职责。
- 截图目视确认工作台标题右侧、预约日程卡片标题右侧均无空位，排版不下塌。不扩称微信/手机真机、系统输入法或生产验收。

## M34 · 返回入口与顶部胶囊去重 · 2026-11-16
T137/T138完成。手机端 `workspace-top` 胶囊左侧常驻「← 返回上一页」（`router.back()`，`<768px` 显示、桌面隐藏）。页面内容区原有的「← 返回项目列表 / ← 返回图库 / ← 返回图库列表 / ← 返回咨询列表 / 返回摄影师项目」都是同一个"回上一层"动作的第二个入口，本轮全部删除。

删掉的入口：

| 页面 | 删掉的入口 | 原逻辑 |
| --- | --- | --- |
| 项目详情 | ← 返回图库 / ← 返回项目列表 | 读 `?from=` 参数决定去向 |
| 项目详情（客户预览） | 返回摄影师项目 | 固定指向列表 |
| 图库列表 | ← 返回项目列表 | 读 `?from=` |
| 图库详情 | ← 返回图库列表 | 读 `?from=` |
| 咨询详情 | ← 返回咨询列表 | 读 `?status=` 拼回 |

`from=` 参数链路一并拆除：生产方 6 处（项目列表卡片、图库列表"管理图库"、图库详情两处 `&from=`、来源图库切换、历史"查看历史详情"），消费方 2 处（projects/galleries 各自的 `params.get('from')` 与返回链接）。`grep -rn "返回图库\|返回项目列表\|返回咨询列表\|返回摄影师项目" tests apps/web/src` 已为空。

刻意保留的「返回」文案及理由：

| 保留项 | 为什么不删 |
| --- | --- |
| `/studio/platform`「返回工作台」、无工作室时 `/studio/account`「返回工作台」 | 这两条路由不挂 workspace 外壳（`application.tsx` 直接 `return <main className="page">`），页面没有顶部胶囊，删了就没有回去的路 |
| `application.tsx` 错误态「返回我的工作室」 | `Empty` 分支，同样不在 workspace 外壳内 |
| 时段表单「返回重选时段」、作品区「返回作品区选择或回改」、账号「返回密码登录」、首页「返回首页」、项目表单「返回重新核对」 | 语义是"回到本页的上一步/某个锚点/切换登录方式"，不是上一层导航，与胶囊不重复 |

列表回退能力不依赖 URL 记忆：`useCursorWindow`（`list-window.ts`）在模块级 `windows` Map 里按路径存快照，`pull` 的 `onClickCapture` 在点 `a[href]` 前捕获 `scrollY` 与窗口大小，返回时 `requestAnimationFrame` 恢复。所以删掉「返回项目列表」后 `orders.spec.ts` UI05/24 的 30 张卡 + `scrollY>1000` 断言仍然成立。

用例改写与两处踩坑：
- `orders.spec.ts` UI08/09/17/18/20/21/28：原为"进详情 → 点客户预览 → 点返回摄影师项目"，改 `page.goto('/studio/projects/<id>?studio=<sid>&section=overview')`。**必须带 `section=overview`**：项目详情分区缺省时按阶段推导，P1 且无未来预约会落到 `originals`（原片），第 25 行的「改期或仅取消预约」就找不到了。先试的 `goBack()` 会停在 `/preview?section=originals`，也失败。
- `orders.spec.ts` UI05/24：`← 返回项目列表` 改 `page.goBack()`，断言不变。
- `orders.spec.ts` UI22/AT33：`.notice.success` 在页面与 Dialog 内各渲染一份 `data-action-ack`（`ActionStatus`），`toContainText` 触发 strict mode violation。改为 `.filter({hasText:'业务状态与下载期限保持原值'}).first()).toBeVisible()`，语义等价。
- `interface-feedback.spec.ts` T077 两处：列表返回改 `goBack()` + 断言卡片数；图库链路去掉 `listFrom` 与 `&from=`，返回后改断言 URL 匹配 `/studio/galleries/<id>\?` 且「选片与反馈」`aria-current=page`。
- `galleries.spec.ts` UI30-33：`进入关联项目与上传` → `goBack()`。**返回后不能再断言 `photoQ` 仍在**——`GalleryPhotos` 的 `useState(q)` 只在挂载时取一次 URL 值，返回是重新挂载。改为断言 URL 保留 `photoCategory`、分类选中「逆光」、2 张照片，再重新 `fill('frame04')` + 点搜索断言 1 张（`managerURL` 变量删除，`grep -c managerURL` 为 0）。
- 新增 `action-placement.spec.ts` T137（编号避让 M33 已占的 T136）：390/1440 两档进项目详情，断言 `.workspace-content` 内无 `← 返回*` 文案、无 `/返回(项目|图库|咨询)/` 链接、无横向溢出；手机点 `返回上一页` 胶囊回到列表，桌面用 `goBack()`，两档都断言回到 `/studio/projects?studio=<sid>` 且 1 张卡。

本地实际验证：Playwright 走真实 Chrome 渠道、单 worker、retries 0，固定 Node22 复用 18186/18184，未重启/build/typegen。
- 受影响增量 action-placement + galleries + interface-feedback + orders + presales 共 68 项 19.0 分钟，唯一 failed 为 UI22/AT33（见上），修复后单跑 `1 passed (13.4s)`；`orders.spec.ts` 全量复跑 `9 passed`，仅 T084 的 `toBeFocused()` 收到 `inactive`——已在 HEAD `git stash` 后连跑 2 次确认同样失败，判为既有失败、环境无关，本轮不改。
- T137 单跑 `1 passed (20.2s)`。
- root 与 Web `tsc --noEmit` 通过；`check-architecture.mjs` 边界通过；改动 8 个文件 eslint `0 errors, 3 warnings`（均为既有 `react-hooks/set-state-in-effect`、`@next/next/no-img-element`）；`git diff --check` 干净。不扩称微信/手机真机、系统输入法或生产验收。

## M35 · 打包状态手动刷新下线 · 2026-11-16
T139/T140完成。M33 把「刷新下载状态」「刷新精修预览」删掉后，交付页 ZIP 卡里还留着「刷新原片打包状态 / 刷新精修打包状态」——这是产品页上最后一个仍带"刷新"字样的按钮。它同样被两件事覆盖：页面级下拉刷新（`useResource` 默认进 `registry.reads`）与 ZIP 卡自己的 1400ms 轮询（`state` 为 `pending`/`processing` 时自动重读）。

改法：把该分支从按钮换成状态文案，其余动作按钮保持不变。

| 场景 | 改之前 | 改之后 |
| --- | --- | --- |
| 主下载流程准备中（`primary && autoDownload`） | 按钮「正在准备下载…」，禁用 | `role="status"` 文案「正在准备下载…」 |
| 其余（含非主卡、`available` 为 false） | 按钮「刷新{原片\|精修}打包状态」 | 文案「就绪后这里会自动出现下载按钮，也可下拉刷新查看进度。」 |

**没有删掉的按钮，因为它们不是刷新**：`核对刚才的下载`/`核对上次…准备请求`（结果未确认时的核对入口）、`重新准备当前{原片|精修}`、`准备{原片|精修}ZIP`、`重试准备{原片|精修}`（`failed`/`expired` 后的动作）、`下载…`——这些是产生状态变化的动作，不是重复读取。

T081 断言随之调整：原来断言 `getByRole('button',{name:'正在准备下载…'})` 可见，现在改 `getByText('正在准备下载…',{exact:true})`（`notice` 那条更长的提示不会被 `exact` 命中），并补一条 `.zip-card` 内 `刷新*` 按钮计数为 0 的守卫。

排除法复核：页面上剩余的「重新读取/读取最新」都不是页刷新，而是冲突与回执恢复——uploads 的 `读取最新服务器回执`、delivery 的 `读取最新对应`、photos 的 `读取最新清单后重试`/`读取最新照片`、config-editor 的 `读取最新配置…`、slot-picker 与 schedule 的 `重新读取时段`（可用性查询）。`/studio/platform` 的 `刷新运行状态`/`刷新账号状态` 与客户公开页 `刷新项目进度` 按 M33 结论保留：前者所在路由 `ProductExperience active={false}` 没有下拉刷新，后者是未登录访客。

本地实际验证：Playwright 真实 Chrome 渠道、单 worker、retries 0，复用 18186/18184，未重启/build/typegen。
- action-placement 15 项 1.2 分钟全过。
- delivery + interface-feedback 37 项 2.9 分钟：唯一 failed 为 `T094`（下拉刷新同步列表总数），单跑 `1 passed (3.9s)`，属该用例已知的后台轮询抖动，非本轮回归。
- Web `tsc --noEmit` 通过；改动 2 文件 eslint `0 errors, 4 warnings`（既有 `react-hooks/set-state-in-effect`、`@next/next/no-img-element`）；`git diff --check` 干净。

另：用户本轮反馈的「咨询 → 更多咨询列表操作 → 刷新咨询」在 M33（`6d3ede6`）已经删除，源码与 dev 服务当前下发的 `apps_web_src_features_*.js` 中该文案计数均为 0，`action-placement` T135 复跑通过；截图来自改动前的旧页面，重新加载即可看到新界面。

## M36 · 输入框统一占位提示 · 2026-11-16
T141完成。用户反馈公开问卷的「怎么称呼你？」与「想拍什么类型的照片？」两个输入区只有题干预设、框内空着，客户不知道该怎么填。本轮把**全站**输入框统一补上「请输入 XXXX」式占位提示，客户侧优先、工作台一并对齐。

### 覆盖面与计数

先扫 `apps/web/src`：`<Input>` / `<Textarea>` 组件共 78 处、其中 72 处无 `placeholder`；再单独扫原生 `<input>` / `<textarea>`（排除 `checkbox/radio/file/hidden/range/color`）后，剩余未覆盖的只有组件定义本身与公开问卷的 `.honeypot` 蜜罐。最终新增 **72 处 placeholder**，另改写 5 处旧提示（`history.tsx` 1、`projects.tsx` 搜索框 1、`public.tsx` 意向日期 1、`schedule.tsx` 2）。

| 文件 | 新增 | 覆盖范围 |
| --- | --- | --- |
| `features/public.tsx` | 6+1 | 客户公开问卷：称呼、微信号、来源、其他说明、想法、项目访问码 |
| `features/account.tsx` | 16 | 注册/登录/邀请成员/改密/MFA 启用与禁用/强制改密 |
| `features/settings.tsx` | 12 | 工作室名与简介、对外微信、问卷题干/提示/选项、套餐名价述、FAQ 问答、额度步进 |
| `features/project-form.tsx` | 9 | 新建项目：客户称呼/微信/访问码/项目名/精修张数/电话后四位/价格说明/特别约定/日期说明 |
| `features/galleries.tsx` | 5 | 图库与照片搜索、图库名称、分类、原文件名关键词 |
| `features/platform.tsx` | 5 | 平台后台：驳回原因、席位与额度上限、工作人员搜索、操作原因 |
| `features/application.tsx` | 4 | 入伙申请：工作室名、公开页地址（两处表单各一套） |
| `features/projects.tsx` | 3+1 | 批量取消原因、重置访问码、合作调整原因、列表搜索框（改写） |
| `features/portfolio.tsx` | 3 | 作品组名称、作品名称、排序位置 |
| `features/photos.tsx` | 2 | 照片文件名关键词、给客户的备注 |
| `features/schedule.tsx` | 0+2 | 时段开始/结束时间（原「例如 09:30」改写为「请输入时间，例如 09:30」） |
| `features/history.tsx` | 0+1 | 历史检索（改写为「请输入…」句式） |
| `features/lifecycle.tsx` / `backups.tsx` / `downloads.tsx` / `client.tsx` | 各 1 | 纠正原因、备份口令、下载文件名关键词、客户访问码 |
| `components/ui/fields.tsx` | 3 | `ColorField` / `DateTimeField` / `MoneyField`（见下方死代码说明） |

### 文案规范

统一为「请输入 + 说明或示例」，示例用中文逗号引出，数字与单位间留空格：

- 必填、含义唯一的直白写：`请输入你的称呼，例如：小林`、`请输入你的微信号，方便摄影师联系你`、`请输入 4 位数字访问码`、`请输入至少 10 位密码`。
- 需要格式约束的写清约束：`请输入用户名，3～40 位字母或数字`、`请输入公开页地址，例如：xiaolin-studio`、`请输入至少 12 位的备份口令`、`请输入给工作室的原因说明，至少 5 个字`。
- 有明确取值习惯的给示例：`请输入价格说明，例如：¥2999 含 10 张精修`、`请输入时间，例如 09:30`、`请输入意向日期，例如：12 月中旬的周末`。
- 批量重复的字段仍带序号语义：问卷题干 `请输入题干，例如：想拍什么类型的照片？`、选项 `请输入选项，每行一项，例如：个人写真`。

`Input` / `Textarea` 用的是全局 `input` 工具类（`globals.css:122` 的 `@utility input` 已含 `placeholder:text-muted`），因此**没有新增任何 CSS**，占位文字自动是次级灰、和已填内容区分得开。

### 两处特殊处理

1. **公开问卷的单选题下拉**。`Select` 是「原生 `select` 隐藏 + `button[role=combobox]` 显示 `.select-value` 文案 + 自定义 listbox」的结构，没有 placeholder 概念，占位语义由空选项承担。原空选项是硬编码的 `请选择`，客户看不出这一项在问什么，于是改为按题干生成：

   ```ts
   /** 题干带问号/冒号时去掉尾标点，拼成「请输入XXX」的占位提示。 */
   const promptLabel=(label:string)=>label.replace(/[？?：:。.、，,\s]+$/,'').slice(0,20);
   ```

   空选项变成 `<option value="">请选择{promptLabel(q.label)}</option>`，即「请选择想拍什么类型的照片」；短文本题的 placeholder 也复用同一函数（`请输入${promptLabel(q.label)}`），`fixed:'name'` 单独给 `请输入你的称呼，例如：小林`（默认问卷里 q1 题干就叫「怎么称呼你？」，直接拼接会读成「请输入怎么称呼你」）。函数截断 20 字，避免工作室自定义长题干把下拉挤成两行。`data-value` 与 `required` 的 `setCustomValidity('请选择一项')` 都没动，所以断言 `data-value` 的既有用例不受影响（`grep "'请选择'" tests/e2e` 为空）。

2. **`.honeypot` 蜜罐字段不加提示**。公开问卷表单第一个字段是 `<label className="honeypot" aria-hidden="true">网站地址<input name="website" tabIndex={-1}>`，用于识别自动填充的机器人。它必须对真人不可见、对脚本像正常字段，加「请输入网站地址」反而会诱导真人填写、也会让脚本判断出这是陷阱。因此**审计用例显式跳过 `.honeypot`**。

`components/ui/fields.tsx` 的 `ColorField` / `DateTimeField` / `MoneyField` 全仓库零引用（`grep -rn "ColorField\|MoneyField\|DateTimeField\|ui/fields"` 为空），是早期遗留死代码。本轮不删（不在用户诉求内），但把里面的英文占位（`#1A2B3C`、`Pick a date and time`、`0.00`）一并改成中文，避免哪天被重新引用时又留下中英混排。

### 第三处：下拉框的「选中感」问题

真机截图复核时发现一个只看代码看不出来的副作用：下拉框的空选项文案从「请选择」换成「请选择你的预算范围」之后，**文字仍然是正常深色**（`rgb(34,32,29)`），跟已选中值一模一样，客户容易以为「已经选好了」。

`Select` 的显示文案来自 `.select-value`，没有 `placeholder` 概念，所以给触发按钮加一个占位态标记 + 一条弱化字色的规则：

```ts
/** 空值且展示的是「请选择…」提示时按占位态弱化颜色；空值的真实选项（未分类/无颜色等）保持正常字色。 */
const placeholder=current===''&&(selected<0||(choices[selected]?.label.startsWith('请选择')??false));
```

```css
.select-trigger[data-placeholder] .select-value{color:var(--color-muted)}
```

条件是「空值 **且** 文案是提示语」，不能只用 `current===''`：全站共 6 处 `value=""` 的选项，其中「未分类」×2、「无颜色」「待核对对应」「尚未决定，与摄影师沟通」都是**真实选项**（选了它就是选了），只有「请选择项目 / 请选择{promptLabel}」才是提示。实测四档结果：

| 下拉 | `data-placeholder` | 字色 |
| --- | --- | --- |
| 想拍什么类型的照片（未选） | true | `rgb(113,105,97)` 弱化 |
| 你的预算范围（未选） | true | `rgb(113,105,97)` 弱化 |
| 意向套餐 = 尚未决定，与摄影师沟通 | false | `rgb(34,32,29)` 正常 |
| 想拍什么类型（选中「个人写真」后） | false | `rgb(34,32,29)` 正常 |

### T141 写法

```ts
const audit=async(context:string)=>{ /* 遍历可见 input/textarea，跳过 .honeypot，placeholder 为空即记入 missing */ };
for(const width of [390,1440]){ /* 公开问卷：断言四处具体文案 + audit */ }
for(const [path,context] of [['/studio/new','新建项目'],['/studio/settings','工作室设置'],['/studio/galleries','图库列表'],['/studio/history','历史记录']]){ /* 桌面 audit */ }
```

审计选择器排掉 `checkbox/radio/hidden/file/color`，逐项 `isVisible()` 后取 `placeholder`，空则把 `id || aria-label || name || outerHTML 前 60 字`记进 `missing`，最后 `expect(missing).toEqual([])`；同时 `expect(total).toBeGreaterThan(0)` 防止选择器写错后「零字段零缺失」假通过。公开问卷部分除了泛化审计，还钉住四条具体文案（`请输入你的称呼，例如：小林` / `请输入你的微信号，方便摄影师联系你` / `请输入 4 位数字访问码` / 下拉含「请选择想拍什么类型的照片」），保证文案被改坏时能立刻定位。

### T142 写法

```ts
for(const width of [390,1440]){ /* 进公开问卷 */ }
// 未选中的问题下拉：有 data-placeholder，字色 ≠ 已选值
// 意向套餐（value="" 的真实选项）：无 data-placeholder，字色 = 正常深色
// 选中「个人写真」后：data-value 更新、data-placeholder 消失、字色与正常值一致
```

比较的是 `getComputedStyle(.select-value).color`，不写死色值 —— 主题换色时用例仍然成立。两档宽度都跑，因为手机端走 `mobile-select-sheet`、桌面走浮层 listbox，是两条不同的交互路径。

### 本地实际验证

Playwright 真实 Chrome 渠道、单 worker、retries 0，复用 18186/18184 隔离库，未重启/build/typegen。

- T141 单跑 `1 passed (5.6s)`，合计 7.8s；T142 单跑 `1 passed (5.6s)`。
- `action-placement` 全量 16 项 1.6 分钟全过（含 T141 6.5s、T142）。
- 受下拉字色影响的 presales + galleries + booking-profile 28 项 2.5 分钟全过。
- 首轮受影响六 spec（presales + galleries + interface-feedback + delivery + action-placement + account）共 **73 项 6.7 分钟、`72 passed`**。
- 唯一 failed 是 `account.spec.ts:18` UI03/AT39：`locator.click` 等成员列表行内 `member-…@example.test` 的「移除」按钮 15s 超时。单跑复现（19.3s）后 `git stash push -u` 回到 HEAD `9d45bd3` 复跑**同样失败**（`1 failed (19.3s)`），确认与本轮 placeholder 改动无关，判为既有失败，未改用例。
- root 与 Web `tsc --noEmit` 通过；`check-architecture.mjs` 输出 `Web/contracts boundary passes`；`git diff --check` 干净；18 个改动文件 eslint `0 errors, 25 warnings`（全部为既有的 `react-hooks/set-state-in-effect`、`@next/next/no-img-element`）。
- 不扩称微信/手机真机、真实输入法或生产验收；占位文字在真实软键盘弹起时的遮挡未纳入本轮证据。

## M37 · 真机逐屏走查修掉的三处「代码审查看不出」· 2026-11-16
T143/T144完成。M36 之后按用户「继续执行任务」在真实 Chrome 里逐屏看客户问卷、工作台首页、我的、项目详情、回执页、工作台各设置页（`/studio/profile`、`/content`、`/questionnaire`、`/account`、`/schedule`、`/galleries`、`/help`、`/history`、`/new`），390×844 / 两档宽度滚动截图。代码审查看不出、只有真机才暴露的三处问题如下。

### 问题与修法

| 现象 | 根因 | 修法 |
| --- | --- | --- |
| 空表单提交提示「请填写怎么称呼你？」「请填写想拍什么类型的照片？」 | 统一用 `请填写${q.label}` 拼接；选择题说「填写」不准确，且 label 末尾的问号被带进提示 | 新增 `requiredMessage(q)` 按题型/固定项分支生成「请填写你的称呼」「请选择「想拍什么类型的照片」」「请填写你的微信号，方便摄影师联系你」；访问码另写「请填写 4 位数字访问码」 |
| 「微信用于沟通，四位访问码用于之后的项目访问」出现在「从哪里知道我们（选填）」上方 | `Field` 的 `hint` 只渲染在输入框之后，而这个 hint 属于整个 q8 联系组，写在了组内末尾字段上 | 联系项的 `hint` 不再交给 `Field`，改为在微信号输入框之后单独渲染 `p.hint` |
| 「项目访问码（四位数字）」label 紧贴「从哪里知道我们」输入框 | `.public-question` 只有 `width:100%`，相邻两个 `Field` 之间没有间距 | `.public-question{display:flex;flex-direction:column;gap:18px}` |
| `/studio/account`「成功后撤销其他设备会话…」与「原密码」贴合（实测相邻块间距 0） | 卡片里 `<p>` 直接接 `<form>`，两者之间没有任何 margin | `.card-pad > p + form{margin-top:1rem}` |

顺带把 `error` 从「始终渲染空 `.field-error`」改成 `{error&&…}`，一次提交少 6 个空节点。

### T143 写法

```ts
for(const width of [390,1440]){ /* 进 /t/<slug>，直接点「提交拍摄咨询」 */ }
// 四条文案必须精确可见：请填写你的称呼 / 请选择「想拍什么类型的照片」/ 请填写你的微信号，方便摄影师联系你 / 请填写 4 位数字访问码
// .field-error:empty 计数 = 0（没出错的项目不渲染空节点）
// 用 compareDocumentPosition 断言：hint 在微信号输入框之后、且在「项目访问码」label 之前
```

顺序断言用 `Node.DOCUMENT_POSITION_FOLLOWING` 位运算，而不是比 `boundingBox().y` —— 后者在同一行两栏（桌面）下会误判，DOM 先后才是「说明归谁」的语义证据。

### T144 写法

```ts
await page.goto(`/studio/account?studio=${sid}`);
for(const width of [390,1280]){
  const a=await note.boundingBox(),b=await label.boundingBox();
  expect(b.y-(a.y+a.height)).toBeGreaterThanOrEqual(12);
}
```

阈值取 12px 而不是精确 16px：`mt-4` 在压缩断点下可能被覆写，但「明显贴上」与「有呼吸」之间的分界是能不能一眼看出层级，12px 已经能守住。

### T141 的路由修正（M36 遗留）

T141 的审计清单里写的是 `/studio/settings`，这个路由在本项目**不存在**（真实设置页是 `/studio/profile`、`/content`、`/questionnaire`、`/account`...），访问它渲染的是 `<Empty title="未找到工作台页面">`。因为 audit 是跨页累计计数，页面空态只是「这一页零字段」，不会触发 `total>0`（别的页有字段），于是「工作室设置」这一页从来没有被真正审计过。

修法两点：清单换成 `/studio/profile`（工作室资料，字段最多）与 `/studio/account`（密码与 MFA），并在每页 audit 之前加一条 `await expect(page.getByText('未找到工作台页面')).toHaveCount(0)`。改完单跑 42.8s 通过，也反证这两个页面的输入框全部有占位提示。

### 本地实际验证

Playwright 真实 Chrome 渠道、单 worker、retries 0，复用 18186/18184 隔离库，未重启/build/typegen。

- T143 单跑 `1 passed (6.3s)`（合计 15.0s）、T144 单跑 `1 passed (3.9s)`、修正后 T141 单跑 `1 passed (42.8s)`。
- `interface-feedback` + `presales` + `action-placement` 共 **58 项 9.2 分钟 `58 passed`**（含 T143；`interface-feedback.spec.ts` 单文件 5.4 分钟）。
- Web `tsc --noEmit` 通过；改动文件 `git diff --check` 干净。
- 间距问题全部先用 DOM 实测（相邻块 `getBoundingClientRect()` 差值）定位再改，避免凭截图猜；改完复测 `/studio/account` 相邻块最小间距从 0 变为 16px，其余页面（profile/content/questionnaire/new/galleries/history/mine）实测无 <10px 的贴合。
- 不扩称微信/手机真机、真实输入法或生产验收；软键盘弹起时占位文字的遮挡仍未纳入本轮证据。

## M38 · 补完全部路由的真机走查，修掉手机端保存条被底部导航压住 · 2026-11-16
T145完成。M37 只覆盖了 13 个页面，本轮把剩余路由（`/`、`/studio/login`、`/studio/register`、`/studio/portfolio`、`/studio/members`、`/c/<token>`、`/invite/<token>`）也逐屏看完，覆盖到 application.tsx 里的每一个 `path===` 分支。

### 唯一新问题：手机端 `.save-bar` 被底部导航与凸起的「新建」按钮压住

| 现象 | 根因 | 修法 |
| --- | --- | --- |
| `/studio/portfolio`、`/studio/profile`、`/studio/questionnaire` 滚动后，保存条只剩上沿一条缝，中间的「+ 新建」圆钮直接压在「取消修改 / 保存修改」上 | `.save-bar` 全局是 `sticky;bottom:18px`，移动端另有一条 `bottom:calc(82px + safe-area)`。82px 只够让开导航本体（74px），但导航中间的新建按钮是**凸起**的，圆形顶边在距底 92px 处，于是仍压住保存条 30px 高的一条 | 移动端这条改 `calc(104px + safe-area)`，比凸起圆钮再多让 12px。**不是新增规则**，是改既有那一条（先前新增的重复规则会被它覆盖，实测无效后已删除） |

关键教训：`grep save-bar` 只看到 `globals.css` 一处定义时，还要继续搜 `@media` 段里同名类的覆写；我第一次加了一条新规则，实测 `getComputedStyle().bottom` 仍是 82px，才发现第 183 行已有一条移动端覆写。

### T145 写法

```ts
for(const y of [0,400,900]){
  await page.evaluate(v=>window.scrollTo(0,v),y);
  const b=await bar.boundingBox(),n=await page.locator('.mobile-nav').boundingBox();
  expect(b.y+b.height).toBeLessThanOrEqual(n.y-24);   // 24px = 凸起圆钮高出导航的 22px + 2
}
```

阈值用「导航顶边 - 24」而不是「导航顶边」，因为凸起按钮的 `getBoundingClientRect()` 并不凸出（`top=779` 落在导航内部），凸起是绘制层面的，DOM 量不到；只能按已知几何倒推出 24px 的安全余量。已用旧值 82px 反向验证：该用例确实失败，改回 104px 后通过，说明它不是恒真断言。

### 复核确认无需改动的两处

- 客户公开页「刷新项目进度」按钮：P1 空态下 `Photos` 不渲染，`useRefreshRegistration` 没有任何注册，此时下拉刷新是空的，按钮是访客唯一入口。与 M33 结论一致，保留。
- 登录页密码框比其它输入框窄一截：右侧「显示」按钮占位所致，宽度差是设计意图，不做「对齐」处理。

### 本地实际验证

- T145 单跑 `1 passed (3.1s)`；旧值 82px 下 `1 failed`，恢复 104px 后通过。
- `interface-feedback` + `presales` + `booking-profile` + `selection` 回归见提交说明。
- 全部路由实测 `document.scrollWidth === innerWidth`（390 宽），无横向溢出；无 <11px 正文字号（`.eyebrow` 10px 为既有设计）。
- 未纳入本轮证据：桌面宽度逐页截图（仅用 1440/1280 做了间距与文案断言）、软键盘弹起时的遮挡、iOS Safari 安全区实机。

## M39 · 搜索收进框内 + 切筛选不再整页闪（2026-11-16）

### 搜索框：一个框、一个框内按钮、三条提交路径

`components/ui/search-input.tsx` 里 `SearchBox` 的结构就是一个 `.search-box` 容器包着「圆形放大镜 `type="submit"` 按钮」+「`type="search"` 输入框」。提交走外层 `form` 的 `onSubmit`，所以三条路径天然统一：点框内放大镜、桌面按 Enter、手机键盘右下角「搜索」（`enterKeyHint="search"` 决定这个键长什么样）。

几何与语义由 T146 在三段页面（`/studio/projects`、`/studio/galleries`、`/studio/history`）实测钉住：

```ts
expect(geo.inside,'放大镜应在输入框内部左侧').toBe(true);
expect(geo.buttonRight,'放大镜只占内边距区域，不压住输入文字').toBeLessThanOrEqual(geo.padLeft);
expect(geo.type).toBe('search'); expect(geo.enterKeyHint).toBe('search');
expect(geo.submits,'搜索表单只有框内这一个提交按钮').toEqual([true]);
expect(geo.texts.filter(t=>/^(搜索|查找)/.test(t)),'不再有需要点击的独立搜索按钮').toEqual([]);
expect(geo.label,'按钮的无障碍名不应含字段名，否则会和输入框标签混淆').toBe('提交搜索');
```

`buttonRight ≤ padLeft` 这条是关键：放大镜是绝对定位盖在输入框上的，只有它的右沿不越过输入框的左内边距（`padding-left:46px`），文字才不会被压住。实测 `.search-box` 358×44（390 视口）、按钮 `left:5px` / 36×36。

提交路径两侧都验：`fill('界面') + Enter` 与 `fill('不存在的项目名称') + 点放大镜`，都断言 `?q=` 同步、空态标题「暂无符合条件的项目」、`scrollWidth ≤ 390`。

### 闪动：先在旧行上等，不要先清空

根因是 `useResource` 在 `url` 变化那一刻就把 `data` 置 `null` 并 `loading=true`，于是切筛选时汇总块、筛选栏、列表整块消失再出现。改法是「有新数据用新数据，没有就继续用上一份行」：`useCursorWindow` 加了按页面共享的 `families` 缓存（`clearListWindows` 一并清空、超 20 条淘汰），切换时先用上一份行；各页 `Loading`/`ListSkeleton` 一律收敛为「只在还没有任何数据时才显示」。

T147 用逐帧采样（`requestAnimationFrame` 循环 1200ms）而不是「点完看一眼」，因为闪动只有 1–2 帧：

```ts
// 切「只看当前已选」
expect({goneSummary,goneForm,goneGrid}).toEqual({goneSummary:0,goneForm:0,goneGrid:0});
expect(minRows).toBeGreaterThan(0);   // 行数全程 > 0，不存在空列表中间态
// 切图库分类下拉（自定义 combobox + portal listbox，不能用 selectOption）
expect(chosen).toBe(true);            // 选项真的被点中
expect({goneForm,goneCards}).toEqual({goneForm:0,goneCards:0});
```

### 顺带修掉的既有红：`platform.spec.ts` UI34/UX05

另一标签页登录后，平台页靠 `BroadcastChannel('proofroom-staff-auth')` 收到 `login` 再重新校验账号。无头浏览器里后台标签页的消息会滞后，断言 12s 内等不到换号后的文案。先把平台页切回前台再给 800ms 沉淀，单跑 3 次稳定通过。

这不是本轮引入的：`git stash` 掉 M39 全部改动、回到 HEAD `8f6206f` 复跑同一条，同样 `1 failed`（页面仍停在「当前平台账号：平台工作人员 · …」，弹窗也还开着）。因此按既有红处理，只改用例的等待方式，不改产品行为。

### 本地实际验证

- `platform` + `galleries` + `action-placement` 共 23 项 7.9 分钟全过（`23 passed`）。
- `interface-feedback` 全量 38 项见提交说明；T146/T147 单跑均通过。
- Web `tsc --noEmit`、改动文件 eslint（0 errors，仅既有 `react-hooks/set-state-in-effect` 与 `no-img-element` 警告）、`git diff --check` 通过。
- 未纳入本轮证据：iOS Safari 真机软键盘图标（用 `enterKeyHint=search` 的语义断言替代）、搜索建议/联想（产品未要求）。

## M40 · 作品选题挪到问卷最后、紧贴作品区（2026-11-16）

### 问题：问「挑了哪几张」的问题，离作品区两屏远

默认问卷里 `q5` 是 `type==='portfolio'` 的「挑选你喜欢的作品（最多15张）」，排在预算、时间之后，「你最在意哪些方面」之前。它问的其实就是「下面那个作品区你挑了几张」，但客户读到它时作品区还没出现，只能先去找、回来再答。问卷设置页还给它留了上移/下移，工作室排序一动就可能把它推得更前。

### 改法：渲染时排到末位，不碰数据

`public.tsx` 加一行 `askQuestions`：非作品题按原顺序 + 作品题放最后，渲染入口从 `cfg.questionnaire.value.questions.map` 换成 `askQuestions.map`。

```tsx
const askQuestions=[...(cfg?.questionnaire.value.questions??[]).filter(q=>q.type!=='portfolio'),
                    ...(cfg?.questionnaire.value.questions??[]).filter(q=>q.type==='portfolio')];
```

只改显示顺序：问卷版本、答案键（`answers[q.id]`）、草稿快照、提交载荷全部沿用原 id，所以历史咨询、草稿恢复、`CU02` 的兼容迁移都不受影响。设置页把作品选题的上移/下移隐藏（`q.type!=='portfolio'&&<>…</>`），并让它的 hint 说明「客户页固定排在问卷最后、紧贴作品区，不参与这里的排序」，免得工作室以为还能调。

### 分割线：不新增规则，靠既有节奏自然接上

没有为「作品题和作品区之间」写任何新的 `margin`/`border`。作品题仍是 `.public-question`（`padding:0 0 20px` + `border-bottom:1px`），父级 `.inquiry-form > .form-stack` 的 `gap:18px` 同时管住两段距离——上一题到它、它到 `#portfolio`，都是 18px。`#portfolio` 自己的 `border-top:1px` 被 `[data-product-ui] .inquiry-form .public-section` 的 padding 覆写吃掉，实测 `borderTopWidth` 为 `0px`，所以视觉顺序是「一条线 → 18px → 作品区标题」，不会叠出双线，也不会留出一大块空白。

T149 把这些钉成数字（320/390 两档）：

```ts
expect(m.lastIsPortfolio).toBe(true); expect(m.lastAboveWorks).toBe(true);
expect(m.portfolioIndex).toBe(m.questionCount-1);
expect(m.gapBeforeLast).toBe(18); expect(m.gapToWorks).toBe(18);
expect([...new Set(m.otherGaps)]).toEqual([18]);   // 其它题之间也是同一节奏，不搞特例
expect(m.lastBorderBottom).toBe('1px'); expect(m.sectionBorderTop).toBe('0px');
expect(m.overflowX).toBe(0);
```

反向验证：把渲染入口改回 `cfg.questionnaire.value.questions.map`，同一条用例 `1 failed`（`portfolioIndex` 不在末位）；恢复后 `1 passed`。既有 `interface-feedback` T108 本来就断言「最后一个 `.public-question` 在 `#portfolio` 之前」，这条用例不改也照过，等于两处独立证据指向同一顺序。

实测（390×844）：题目实际顺序为称呼 → 类型 → 预算 → 时间 → 联系方式 → 作品选题，`portfolioIsLast:true`、`gapToWorks:18`、`gapPrevToLast:18`、`docOverflowX:0`；桌面 1280 下作品块宽 720、作品区宽 1120，`gapBeforeLast`/`gapToWorks` 同样 18px。

### 本地实际验证

- T149 单跑 `1 passed (1.5s)`；反向改回旧顺序 `1 failed`，恢复后 `1 passed`。
- `presales` 全量 8 项 47.2 秒全过；`presales + interface-feedback` 中 T149/T108×2/T143/T144 `5 passed (13.7s)`。
- Web `tsc --noEmit` exit 0、`git diff --check` 通过。
- 未纳入本轮证据：作品区超出一屏时的锚点滚动定位（只覆盖 `#portfolio` 锚点链接这一条路径）、iOS Safari 真机软键盘弹起后的可视区。
