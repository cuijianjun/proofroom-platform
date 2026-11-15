# ProofRoom active · 2026-11-14
目标：新平台完整本地开发→全验后预览；Web/API/Worker分离、普通PG。PM补需求正本../需求规格与实施方案.md v1.1§19（16UX/39AT）；spec/tasks/acceptance在specs/001-proofroom-platform。
根 /Users/cjjxw/codex/摄影选片平台/proofroom。Git eff48d0→agent/proofroom-local-main，原码移upstream保留；未commit/push/部署。旧WorkBuddy工程/服务不动。
完成T001-009/011-028（T010媒体导出保下游）；T031-032已验待checkbox更新；T030等M6下载空间收口。M5后端17绿（含真实SIGKILL Worker、缺dispatch扫描恢复4→P2、源SHA），浏览器10+完成未知重试1绿、共享23绿；触摸分支RED→修ratio/dx/dy→两条GREEN（合成非真机）、clipboard读回；types/架构/三服务build绿。证据acceptance及/tmp/proofroom-qa/m5-*.log。独审已报告项全关闭。
T029原生窗口未完成：Chrome app目标被其他窗口变化，工具拒绝；Safari noWindows/timeout；Chrome purpose浏览器不可用。未用setFiles冒充。CUA已completion_summary。新建自有Chrome空窗口留存，未动旧tab。native样图/tmp/proofroom-qa/native-originals、native-state.json仅账号/sid/id（勿扩散），本轮无照片上传。QA supervisor68579已SIGTERM停止，仅PG/S3保留。
当前M6后端已写：delivery严格映射/自动P4/首期限一次，lifecycle续期/到期/Owner相邻hold与前置，downloads源流/Range/三个ZIP，zip懒流SHA/CRC/错误转发/4次租约收敛/私有TTL缓存。011、012迁移已test应用，不可改。yazl3.3.1与@types3.3.1已装，未用npm audit fix。前端M6仍全部待接。
M6验证：31绿m6-lifecycle-regression；补Owner P2→P3须原片known+ready后delivery16绿m6-stage-guard。M6 ZIP复核3阻塞已修：懒输入error转输出/子进程不崩，stale第4claim收敛failed且不第5次，>16MiB用8MiB起有界multipart/失败abort+永久tombstone列举清理。当前m6-zip-recovery.log 40过/1恢复失败（旧ZIP队列按1项轮询拖慢新任务）；zip Worker改batch5 burst/并发1，已build，正在只重跑recovery m6-recovery-final.log。types m6-zip-types.log已绿。rootS3签名本地替身仍不是外部S3验收；17MiB真multipart/强制小ZIP64/PythonCRC/逐源SHA已过，非5GB实测。
本地S3脚本补ListMultipartUploads/Abort，置于既有signature auth之后；只重启自有18190，数据保留、pid见.local/storage.pid。原S3rver v2分页依赖DES，Node22不可用；storage.listObjects改标准v1 Marker分页，实际1588 key列举通过，不冒称照片容量。storage-io包括ZIP引用保护，不能回退误删源。
后续：收口真实Worker第4claim SIGKILL→failed→显式retry→ready；ZIP guard独审再确认；M6 UI矩阵/旧批adopt/CAS保选择/续期与Owner纠正、客户下载优先+三ZIP/单图；e2e CRC/SHA/补片/到期。M7/M8全待，T029原生窗口阻塞保留，不交最终预览。
T045依赖审计 /tmp/proofroom-qa/dependency-audit.json 有Next/Sharp/Zod/Vitest等已知漏洞，已告用户最终前更新+回归；不要audit --force或降Next15。npm建议Next16.4.6，审官方/registry后做必要兼容patch；S3rver仅loopback签名替身。原生native-state.json勿扩散，CUA已completion。
固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。PG17:18432 dev/test；签名S3rver18190是本地替身。QA18186/18184/.next-qa；Web build用.next，勿竞争生成物。迁移002-010已应用不可改，只加011+。.env0600不打印；Web剥离DB/S3/APP_SECRET，APIWorker runtime DSN。
关键：storage PUT前持久tombstone、跨进程资源锁；引用含upload_items/photos，防误删源；idempotent/withTx可复用锁连接。未知请求后任意失败保原key/payload；PIN不入草稿、客户草稿用projectUUID。备注原文/双方星色同源，P3改动需重提；未完成集合绝不假零。
