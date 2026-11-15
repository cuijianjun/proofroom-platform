# ProofRoom active · 2026-11-15
目标：新摄影平台完整本地开发/预览；普通PG+独立Web/API/Worker。正本 ../需求规格与实施方案.md v1.1§19，16UX/39AT；spec-kit specs/001-proofroom-platform，acceptance.md顶部为当前结论、下方保留历史。
项目 /Users/cjjxw/codex/摄影选片平台/proofroom；agent/proofroom-local-main@eff48d0，原上游参考保留upstream/；大量工作区变更为本次新架构，未提交/推送/部署。旧WorkBuddy和18080/18082/18084不动。
状态：T001–028/030–042/044–048完成。T029原生多选/拖入外部工具未验，T043自动矩阵通过但受029限制未勾，不能说全部验收完成。需求已按旅程/状态/权限/恢复修正：取消合作与工作室暂停分离，suspended连Owner租户备份也禁止，管理员本机full CLI独立。
证据均在/tmp/proofroom-qa（可清理，含私有能力链接不要打印）：m8-platform-integrated-first.log 17文件129绿88.21s；随后m8-cancel-policy-final.log39绿；m8-browser-integrated-final.log51绿4.8m。最后QA目录setup P2先m8-qa-root-red后green4项（新增第130项只增量）；types-qa-root-final绿，lint-delivery-final0error102warn，build-delivery-final三端绿，architecture-final真实client扫描绿。生产依赖审计0，dev S3rver替身4告警保留未称修复。foundation_review只读关闭全部报告代码阻塞，不曾冒充其执行测试。
本地预览已运行：http://127.0.0.1:18180/studio；首次/studio/register创建自己的工作室，账号不沿用旧站。API18182/Worker父进程51790，.local/dev.pid及.local/logs/dev-preview.log，停止前核对PID确为本项目scripts/local.mjs start，再SIGTERM仅自有子进程。PG17:18432/S3:18190运行，dev迁移001–015已应用不可修改。m8-preview-smoke.log四宽登录/注册/未登录恢复、无横溢/0pageerror/0主库业务写；健康HTTP200/Workerfresh。完整写链路来自QA，不能向主单上传测试照片。
Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin；命令见quickstart/README。平台/浏览器测试只proofroom_test及proofroom-test桶；QA18186/18184/.next-qa，restore18188/18189/.next-restore，recovery18185。测试串行/勿另起QA Worker，Next类型与build勿竞争；最终guard要实际build+完整参照，--source-only不证明构建包。
T029最近：专属GoogleChromeTesting profile/AX自有QA URL且0chooserlistener，Raise失败ScreenCaptureKit -3812；先前click状态变/AX超时、IAB宿主被安全限制。files0、无原生上传成功；CUA已completion_summary。勿盲附连接/关其他项目/反复代测/用setFiles冒充；如再次CUA须新handles与rewriteDocumentation。
当前新指令：补029/043和告警，T049新增未勾。原生进行：cua-driver daemon731/TCC两项true；专属正常Chrome157 pid54425/父窗46077，native picker46220（可能仍开，须新snapshot）；Finder539仅本次native-originals窗46264可操作，其他Finder窗不可关。QA由exec session78238运行18186/18184/Worker，主预览51790继续。用户已明确允许短暂前置专属Chrome/Finder，不重复问。用户亲自原生多选10张上传已确认，API核对1批10ready/P2，保留这单及用户图片，不声称Agent操作。另建空拖入项目，私有ID/凭据仅/tmp/proofroom-qa/native-remainder-state.json(0600)，native-originals四合成JPEG可用。拖入待完成；系统取消因背景键/pixel未生效，不能宣称通过。/tmp/proofroom-qa已chmod0700。当前暂停前端写入直到native结束。告警remaining-lint-before.json102、audit-before.json4dev，独审已给15deps+上游list-window ref修法，尚无代码修改；不关规则消警告。非微信真机/云S3/生产/大批真实相机照片验收（129张为298byte合成图）。原文备注/源文件不变；源下载/Range/ZIP逐请求撤权，阶段业务自动流转。备份密码/DB/S3/env/私客链接不打印。历史：proofroom.20261115-final-review-history.md及acceptance，勿整份重读。


## 告警增量检查前活动卡（历史）

# ProofRoom active · 2026-11-15 续验进行中
目标：用户新授权补029/043原生多选/拖入、检查处理告警，更新task/acceptance。项目 /Users/cjjxw/codex/摄影选片平台/proofroom，agent/proofroom-local-main@eff48d0；大量未提交迁移改动/删除属于既有新架构，禁止reset/stage/commit/push/部署；旧WorkBuddy与18080等不动。正本../需求规格与实施方案.md §19，spec-kit specs/001-proofroom-platform。
已知旧证据：平台129绿+最后新增QA目录架构4绿；浏览器最终51绿。不能当作本批新代码已验。T001–028/030–042/044–048此前已勾，029/043未勾；本轮T049告警收口未勾。
本轮Native：用户明确允许短暂前置专属Chrome/Finder，不再问。用户已亲自原生多选10张并点击上传且亲口确认，Agent API实见1批10ready/P2，保留用户图，不宣称Agent完成。只用testDB/bucket。私有状态 /tmp/proofroom-qa/native-remainder-state.json 含sid/projectId/dragProjectId/用户名/新密码/cookie，0600，不能打印。另一dragProjectId为空，4合成样图在native-originals。Agent native控制存在后台输入落错/焦点无法维持，正常Chrome15754425、CTF15565456均仅自建且已先尝试退出再SIGKILL；绝无setFiles/合成drop冒充native。原生拖入/取消仍未验。两cua-driver session已end；Finder539只本次native-originals窗46264可操作，其余窗口不得关。QA材料根已0700；输入失误截图有旧测试凭据，已通过API轮换隔离账号密码/撤旧会话，数据未删，勿再展示这些截图。
当前代码：15deps全清；Application稳定回调/标量studioId/声明前置，reload解构内联Effects，BookingDialog首次打开ref守卫保409选择，uploads捕获URL Set与稳定onUpdated，list-window用state缓存快照/layout commit更新ref，callers解构sentinel防refs传播，GalleryPhotos key包含默认sort，Dialog/Photos/Uploads ref写移layout，Public提交render状态与即时draft fence分离，Date.now采样移事件/惰性state。eslint配置未改，最新remaining-lint-after-second.json 0error32warn(24state-effect+8img)，102减70。未跑类型/构建/浏览器，不提前称绿。
新增selection.spec合成drop→4源SHA/P2/重复复用/只读拒入用例，明确不证明Finder。新增storage7th安全反例：真实SDK签名浏览器表单POST曾204，remaining-form-red.log；现scripts/s3-local.mjs在V4后/verifiedBody前拒POST&&ctx.is(form)415，不影响S3 MPU/binary PUT。4dev审计仍在，XML无兼容修复，不override/force。foundation_review只读建议和风险已收，最终新代码复核仍待。
服务：own主预览51790已SIGTERM以便检查；ownQA54400已SIGTERM。PG18432留存；ownS3旧88905已SIGTERM，npm local:setup已重新启动18190，存量对象保留。remaining-storage-green.log目前exec session39384待收。接下来types→build(剥Web私密env)→guard；增量platform选storage/delivery/backup-restore/api-client/architecture，随后共享Application/Dialog影响所有route，跑一轮browser52含新drop，勿并行QA Worker。最后恢复主预览/验证并更新task和acceptance/native来源与32warn依据。
固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin；env不打印。迁移001–015应用后不可改。QA18186/18184/.next-qa；restore18188/18189/.next-restore；Next类型/build不可竞争。_codex历史/acceptance按需切片，不整份重读。


## M9产品体验走查前收口卡

# ProofRoom active · 2026-11-15 本地续验收口
项目 /Users/cjjxw/codex/摄影选片平台/proofroom，agent/proofroom-local-main@eff48d0。大量既有迁移删除/未跟踪新源码须保留；不reset/stage/commit/push/部署。旧WorkBuddy及18080等不动。正本 ../需求规格与实施方案.md §19；spec-kit specs/001-proofroom-platform；最新证据见acceptance末尾T029/T043/T049，历史在同目录native-attempts-history。
用户本轮要求补原生/告警并更新记录，现T001–049全勾。本机原生多选：用户亲自选10张且明确确认，Agent核对1批10ready/P2，10源下载SHA与上传manifest一致，未比用户磁盘原件。Finder：Agent真实OS选4合成图/HID拖放，单专属Chrome连接/0filechooser监听/拦截关闭，可信drop4；1批4ready/P2与4本地源下载SHA一致。原生鼠标取消后面板消失/队列0/无新批。用户已允许短暂前置专属窗口，不再询问；现自建context/Finder窗口与控制session已关，其他项目未关。勿再setFiles冒充native或让用户重复代测。
本轮修改稳定回调/游标/ref提交期同步/草稿栅栏/时间采样；lint102→32（24有界state-effect+8私有预览img），0错误，未禁规则。S3替身验签后、表单解析前拒不用的form POST415，真实SDK反例先204后415；生产audit0，dev仍4，只称缓解，不force改依赖。
检查本轮platform51绿（storage7+其他44），browser共享51绿+新增合成drop选择器修后单项1绿，不称一次完整52绿；类型/三端构建/秘密扫描绿。既有完整platform129+后增QA目录架构4保留，不称本轮全131执行。foundation_review已关闭业务代码P1/P2，最终文档与选择器复核亦关闭，无夸大/新增阻塞。
服务：主预览77780，Web18180/API18182/Worker与dev库，PG18432/S3 18190留存；QA父75168已结束、18184/18186应空。私有.local/dev.pid与logs/dev-preview.log。remaining-preview-final.json：HTTP200/Worker新心跳/四宽登录注册与未登录恢复绿，0开发业务写入。固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。迁移001–015不可改；.next/.next-qa/.next-restore不得竞争。
材料 /tmp/proofroom-qa（0700）可复核后清理；native-remainder-state.json含凭据/cookie/项目ID，绝不打印。用户10张保留。早期输入失焦截图可能含旧QA凭据，已轮换并撤旧会话，勿展示。native-remainder-result.json记录操作来源；桌面截图不外传。未微信真机/云S3/生产/大批真实相机照片验收。
下一步：交付18180链接并等待新指令，无自动继续开发/提交任务。恢复提示：先读本卡与当前Git，只查相关验收切片，复用未变证据；不重跑流程/新附加浏览器。


## M9最终检查前活动卡（历史）

# ProofRoom active · 2026-11-15 M9全产品体验走查
目标：用户授权测试工程师+PM全旅程/UI/mock，遇问题直接修+增量测试后通知。项目 /Users/cjjxw/codex/摄影选片平台/proofroom，agent/proofroom-local-main@eff48d0。保留既有迁移删除/新源码，禁reset/commit/push/部署，旧WorkBuddy不动。spec-kit现有T050→051→052进行中，acceptance末尾M9矩阵。固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。
本轮只新增tests/e2e/product-experience.spec.ts，应用仅portfolio.tsx默认标题trim限120且不切断代理对/源filename完整，globals.css末尾长h1/h2/h3/strong/summary/label换行、wordmark子span、组按钮自适应。长filename实测RED后2图绿；长品牌/套餐/FAQ首轮29溢出RED后matrix-second1绿46.8s。视觉品牌PROOFROOM换行回归已收窄并固定字样单行断言。
本轮第三项P2：客户品牌是span.wordmark，通用mobile public-header>span规则隐藏，768/1024长名也不换。已独立实际RED：product-experience-client-brand-red.json 320visible=false、768482/820、1024661/820、1280正常（不能称1280坏）。已补 .client-space .public-header .wordmark{display:flex;overflow-wrap:anywhere}，正只跑新mock主旅程。新test已补客户六宽含768/1024品牌可见/首文本=长品牌、仅固定a.wordmark单行。不要与当前浏览器跑竞争改应用。
证据：/tmp/proofroom-qa，private product-experience-state.json含测试登录和客户cap，绝不打印。mock7项目/3咨询/3作品/16照片/3成员/1备份，3档期/1待邀请，双方标记备注/图库分类/两套角色界面/只读暂停恢复已入新test。只用proofroom_test/bucket。时间归档用QA定向SQL模拟。
本轮分批：受影响13首12绿/新mock测试DTO字段错，非产品bug；品牌修后4首3绿/新mock hidden switcher重复label，已#profile-name修。product-experience-remaining-flows.log 42绿5.1m。客户品牌专用display:flex/anywhere已修；product-experience-client-final.log 1绿1.1m，含六宽品牌/照片加载/真实ZIP CRC+5源SHA/备份下载。最终mock计数7项目/3咨询/3作品/16照片/3成员/1备份/1ZIP/10标记/7备注/3档期/14图库。主77780已停，root/Web类型均绿、平台3文件15项绿6.19s，build正在跑，仍需build/guard后恢复主和QA预览。root tsc与本批lint已绿（portfolio原2建议保留）。新mocktest sandbox true；原生用户10+AgentFinder4此前真验复用，不重复。
主77780已核对command+cwd并SIGTERM，准备最终构建，必须恢复18180/18182/Worker devDB；PG18432/S318190保留；QA由当前Playwright唯一webServer占18184/18186。Next .next/.next-qa/.next-restore/类型构建不要竞争。迁移001–015不可改，Web无秘密。下一步：收42→修客户品牌→单mock增量→停own主77780后Web类型/三build/秘密扫描与portfolio/presales/architecture平台增量→独审收口→恢复主及可选隔离mock预览→更新task/acceptance/README/quickstart/本卡通知。foundation_review已只读审两源及新test，除客户品牌P2无其他阻塞；最后增量结果待同步。32lint建议/4dev审计前批记录保留，不冒称已全部消警告。


## M10截图修正前M9收口卡

# ProofRoom active · 2026-11-15 M9已完成
项目 /Users/cjjxw/codex/摄影选片平台/proofroom；agent/proofroom-local-main@eff48d0，保留既有迁移/删除/未跟踪源码。不reset/commit/push/部署，旧WorkBuddy不动。正本 ../需求规格与实施方案.md §19；spec-kit tasks/acceptance。T001–052已勾，无自动续开发任务，等用户下一指令。
用户要PM+测试视角全旅程/mock/UI，现已逐段验。应用仅改portfolio.tsx默认展示title trim限120/不切断代理对，源filename完整；globals.css末尾处理长标题/summary/名字/作品组按钮，固定PROOFROOM单行；客户专用wordmark恢复手机显示并断词。3类问题实际RED→修→GREEN。新增tests/e2e/product-experience.spec.ts，55场景四宽，顾客五阶段品牌另加768/1024；照片实载、接单原文/套餐/预约快照、双方标记备注、分类、Admin/Member/只读暂停恢复、旧源403、5源SHA/ZIP CRC+SHA、备份实下载均验。备份格式头不冒称本轮恢复。
本轮分批54独立browser case有绿（非单次54）：browser-final首轮12；final-incremental3；remaining-flows42绿5.1m；client-final主旅程最后1绿58s，重叠项不重复计。平台portfolio/presales/architecture3文件15绿；root/Web类型、三build、实际11client秘密扫描绿；测试lint0，portfolio原2建议。全体32lint/生产audit0-dev4沿用前批未改依赖证据。foundation_review代码/文档均关闭，无剩余P1/P2。
服务已恢复：主父97749→18180/18182/dev Worker；mock父97750→18186/18184/test Worker。PG18432/S318190留存。PID .local/dev.pid、mock-preview.pid，日志logs/dev-preview.log、product-mock-preview.log。入口/API HTTP200、双库心跳/mockOwner实际登录/数据保留已验。主业务订单未写mock。运行自动化前先核对并SIGTERM唯一mock父释放QA端口，不能双开QA Worker；类型/build先停本项目Next，.next/.next-qa/.next-restore不竞争。迁移001–015不可改。
最终mock7项目/3咨询/3作品/16照片/14图库/3成员/3档期/10标记/7备注/1ZIP/1备份。全部材料 /tmp/proofroom-qa(0700)，private product-experience-state.json(0600)含mock账号/客户cap不能打印外传；preview-final.json记录最终探针，截图日志可复核后清。用户前批原生10张保留，原生多选/AgentFinder4+取消证据复用勿代测。未微信真机/云S3/生产/大批真实相机照片/完整WCAG认证。固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。新指令先读本卡/Git/相关证据，不重走全流程。


## M10 收尾前状态归档

# ProofRoom active · 2026-11-15 M10截图反馈进行中
用户6点：同类native select换站内并修空白；health图标LED；Home去重复项目列表；InquiryAnswers portfolio题末尾与图片同块；客户微信点击即复制。T053–056进行中，T001–052完成。直接实现已授权，无新审批。目标 /Users/cjjxw/codex/摄影选片平台/proofroom，agent/proofroom-local-main@eff48d0，既有9M/521D/17??迁移保留，不reset/commit/push/部署，旧WorkBuddy不动。
源码已实现：新components/ui/select.tsx→ui/index reexport，button combobox/listbox+隐藏native仅FormData/required/change桥，keyboard/typeahead/Esc不关父Dialog，fixed菜单随滚动重定位；disabled/fieldset在choose复查。Home留阶段/待办数量/今日预约+刷新，去完整ProjectList；core CopyText immediate只供微信，失败手动弹层，原链接默认两步；projects/inquiries/InquiryAnswers读值微信可复制，客户行div避免p内dialog；public参考题/其他说明+图末尾同块；platform health用Icon/LED+文字，错误时不显示旧绿；icons/CSS追加复用风格。
新tests/e2e/select-choice.ts真实点选项，7旧spec共29 selectOption替换helper，5个dropdown toHaveValue改data-value。新interface-feedback.spec3截图case：基线3RED，首修2绿1失败（表单平滑scroll误关菜单），修随滚动定位后3绿22.6s；后补真实邀请admin FormData支路。root/Web types绿；Select lint最终0，targeted总只原6建议，新memo警告已用optionCount+稳定setters依赖解决；uncontrolled selected属性保存默认/reset。foundation_review只读源码无P1/P2（没跑测试），最终证据待收。
当前exec63751跑全站共享UI影响57个browser（仅此一次，57=原54+新3），日志/tmp/proofroom-qa/interface-browser-integrated.log，已前11绿。覆盖全部29菜单调用、复制/快照/health/Home及原角色/恢复邻近；失败后只重跑具体。主97749与mock97750均已SIGTERM（核对own command/cwd后），测试唯一QA webServer运行18186/18184。PG18432/S318190保留。固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。Next类型/build不能与QA或主.next竞争，迁移001–015不可改。
重要体验账号：用户已收到experience_8e4929209248/Local-MockExperience!5291。其DB数据不能删。原private product-experience-state.json已复制保存在/tmp/proofroom-qa/interface-preview-preserve.json(0600)，因为M9回归会覆盖state。57结束后把新生成state保存为interface-test-state.json，再从preserve恢复product-experience-state.json，维持用户登录信息链接；将product-experience.spec后续输出改独立test-state文件(仅artifact变更无需重跑)。不能打印cap/cookie。临时材料统一/tmp/proofroom-qa，可复核后清；原生用户10张保留，不重做原生上传。
下一步：收57→修具体失败增量→当前整批root/Web类型(如新变)、三build+11clientguard+architecture平台4必要守卫；final读截图验证mock旧账号，弹层内展开/Escape只关下拉、不写预约；恢复主/mock两个预览并记新PID；更新tasks/acceptance/README/quickstart与本卡，独审收口。此前32lint/4dev审计记录保留，不称生产/真机/云/大批照片验收。

收尾实收：interface-browser-integrated.log单次57全绿7.3m，含所有旧54+新3；root/Web最终typecheck绿、architecture平台4绿1.03s、targeted lint6原建议（新Select0），三build已完待读client guard。体验state已从interface-preview-preserve恢复，回归新state保存在product-experience-test-state.json，M9脚本后续只写test-state避免覆盖用户登录信息；此项仅artifact路径改动，不重跑业务。主/mock仍停，必须恢复。


## M10完成卡（M11前归档）
# ProofRoom active · 2026-11-15 M10完成
目标：用户六项截图修正已完成，T001–056已关闭，等待新指令；无自动续做。
项目 /Users/cjjxw/codex/摄影选片平台/proofroom，agent/proofroom-local-main@eff48d0。既有9M/521D/17??迁移改动保留，不reset/commit/push/部署，旧WorkBuddy不动。
交互：29 Select站内菜单/值可见；Home去完整列表留汇总/待办/今日预约；health图标LED文字及失败不假绿；参考题/图末尾同块保原文；客户微信直接复制/失败手动。API/SQL/权限/源媒体未改。
验证/tmp/proofroom-qa：interface-browser-integrated.log单次57绿7.3m；最后390预览查出field缩窄遮挡，修父field宽/换行，interface-mobile-green.log3绿24.5s含四宽真实点选。最后root/Web types、Select/新tests lint0、Web build、client11guard绿；API/Worker build及architecture4绿；定向lint6旧建议。57在最后CSS前，3项增量在后，不再全跑。foundation_review代码/最终文字无P1/P2，没跑测试。
当前主父31264→18180/18182，mock父31265→18186/18184，各自Worker；PG18432/S318190保留。interface-preview-complete.json：四HTTP200、旧账号登录200、Worker新鲜、pageerror0、四宽点选/六截图复核、Esc只关菜单再关Dialog且预约version/booking不变；主业务写入0。Clipboard仅页面API spy/失败分支，非系统剪贴板实测。
运行用固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。原scripts/local.mjs start、scripts/e2e-local.mjs；停前核对.local/dev.pid、mock-preview.pid的cwd/命令。测试前停本项目预览，不并发Next类型/build；迁移001–015不改。
原体验账号/数据与用户原生10张保留。private product-experience-state.json为原账号，回归另写product-experience-test-state.json，0600含cap不打印。临时证据集中/tmp/proofroom-qa，复核后按授权清理。32lint与audit生产0/dev4沿用旧分类，不称全消除；不扩真机/云/生产/大批真实照片。
细节/命令/取舍见specs/001-proofroom-platform/acceptance.md末尾M10、tasks、quickstart和README；旧过程在本目录history。
恢复提示：先读本卡和Git，只按用户下一指令做增量，不重走全流程或原生上传。


## M11收口前状态归档
# ProofRoom active · M11最后核验
目标用户4点：全部copy单击、阶段文案顶部/去重复链接、正常预约灰显/摄影师设档、参考mvp暖白棕sans两端UI/mock测试。T057–062实现完成待最终核验/预览/文档；/Users/cjjxw/codex/摄影选片平台/proofroom@agent/proofroom-local-main/eff48d0，保留9M521D17??迁移，旧WorkBuddy只读，无commit/push/部署。
已做copy/header/主题/Slots日期卡、星色折叠/备注直达、客户完成bar、上传优先交付。公开slots只有available不含PII；30s/焦点刷新，PublicSlots不替换问卷答案/PIN，跨日提示。新组件slot-picker，新test simplified-experience，plan末尾详规。
/tmp/proofroom-qa证据：simplified-browser-integrated59单次绿7.1m；平台orders/presales/architecture21绿6.32s；后续simplified-final-incremental24绿2.9m（含公开自动刷新/跨日/确认目标失效）；filename失败先RED→17绿1焦点RED→CopyFallback triggerref+rAF焦点修后simplified-filename-green单项绿15s。mock55场景四宽，7项目3咨询16图14图库等已实际走两轮，原体验state没覆盖。
独审驱动的预约恢复修复：确认目标刷新失效不能target??null误取消，已RED实证并修；success丢ack须冻结key+payload+日期文案，按user/studio/project sessionStorage恢复，未知/后续403保留；可稍后核对不困住用户。simplified-booking-final16绿1.5m，含lostack→refresh/reload→403→原body同key重放不多写。源码core Confirm只加cancelText默认旧值；BookingDialog有onResumebanner/dirty。types绿，lint0错14建议=13旧+1有界modal初始化（没有降规则）。
最后独审P2：首请求未到服务器→外部改期→恢复明确VERSION_CONFLICT不能永锁旧请求。simplified-booking-conflict-red已证；刚修仅白名单409(VERSION_CONFLICT/BOOKING_CHANGED/SLOT_CHANGED/PROJECT_CANCELLED/PROJECT_ARCHIVED)恢复时解除attempt、保留目标、刷新并返回输入，用户显式重核后新key；未知/401/403不解除。下一步仅最终types→orders8+simplified6共14增量，独审此delta→lint→三build/client guard→恢复预览并截图→docs/task关闭。禁止再加功能/重跑59。
主旧31264/QA旧31265已停，PG18432/S318190保留；测试runner按需自建QA。固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin，Next类型/build不并发运行服务。迁移001–015不改。原private product-experience-state.json(0600)不可覆盖/打印cap，回归只写test-state，用户原生10张保留。32旧lint/生产audit0/dev4旧边界不扩称当前全消除。

最终14增量全绿1.3m，三build/11clientguard绿；曾恢复主42927/QA42928。原账号实登录成功并新增2个正常mock时段09–12/14–17（QA原3→5，不改订单）。预览脚本先错把regular5当全部7，失败日志已脱敏cap；DB正确7。后actual preview真实发现长p4标题sticky遮预约按钮，simplified-sticky-red以120字符标题320点击再RED，已改完整header滚动+compact客户身份/分区nav固定(display:contents)，不丢身份。刚停主/QA42927/42928，下一步types→simplified7+product2共9增量→Web新build/guard→恢复两服务→修正safe preview、看图→docs/task卡收口。此前14业务绿复用，不再加功能或重跑59。


## M11完成卡（M12前归档）
# ProofRoom active · 2026-11-15 M11完成
用户4点全部完成，T001–062关闭；无自动续做，等下一条指令。
项目 /Users/cjjxw/codex/摄影选片平台/proofroom，agent/proofroom-local-main@eff48d0，既有9M/521D/17??迁移保留，无commit/push/部署；旧WorkBuddy/mvp-shell只读参考。
M11：所有copy单击/失败手动；项目顶部阶段文案去重复链接；日期时段卡灰显/当前标识/30s及焦点刷新/跨日；摄影师设档，确认才占用/取消释放。暖白棕sans/白侧栏；完整header滚动+紧凑客户/分区固定；星色details、备注勾选直达、客户完成bar、交付先上传对应。原API/PG安全约束和媒体/备注保留，public只加available无PII。
预约恢复：首发冻结key/payload/文案，按user/studio/project sessionStorage(无PIN/cap)；未知/401/403重放原命令，稍后核对不丢；白名单业务409解除旧冻结、保目标显式新版本新key。确认失效目标绝不转null取消。core CopyFallback triggerref+rAF还焦点，关闭/重试有回归。
证据/tmp/proofroom-qa：simplified-browser-integrated59整轮绿7.1m；后续具体24绿2.9m/16绿1.5m/booking-complete14绿1.3m/visual-complete9绿1.7m+filename单项绿15s，当前65独立case均有绿来源，不称一次65整轮。平台orders/presales/architecture21绿6.32s；最终types-visual-final/三build-complete+Web新build/11clientguard绿。定向lint0错14建议=13旧+1有界modal初始化；最后视觉lint0。foundation_review源码全P2关闭，未跑检查。
当前主父45011→18180/18182，mock父45012→18186/18184，各自Worker；PG18432/S318190保留。simplified-preview-verified：四HTTP200/旧账号登录200、Worker1.53/1.05s、DB7项目/regular5/slots5、四宽实际预约点击与零写入、pageerror0、五截图已视觉复核。仅QA原mock添加两段09–12/14–17，主业务写入0。
固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin，原local.mjs start/e2e-local.mjs；停前核PID/cwd/命令，测试/build别争Next。迁移001–015不可改。
原private product-experience-state.json账号不变/不可打印cap，回归仅写test-state，用户原生10张保留。临时证据同/tmp，原state保留；一次预览脚本常规5误作全7失败日志已脱敏，后续只输出计数结果。旧32lint/生产audit0/dev4不冒充新跑/消除，不扩真机/云/生产/大批照片。详情acceptance末尾M11、tasks/plan/quickstart/README；历史在同目录history。
恢复提示：先读本卡/Git，仅做用户新指令，不重走全流程或原生验收。
