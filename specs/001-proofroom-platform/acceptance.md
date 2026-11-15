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
