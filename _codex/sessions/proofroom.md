# ProofRoom active · 2026-11-14
目标：新平台完整本地开发→全验后预览；Web/API/Worker分离、普通PG。PM补需求正本../需求规格与实施方案.md v1.1§19（16UX/39AT）；spec/tasks/acceptance在specs/001-proofroom-platform。
根 /Users/cjjxw/codex/摄影选片平台/proofroom。Git eff48d0→agent/proofroom-local-main，原码移upstream保留；未commit/push/部署。旧WorkBuddy工程/服务不动。
完成T001-009/011-028（T010媒体导出保下游）；T031-032已验待checkbox更新；T030等M6下载空间收口。M5后端17绿（含真实SIGKILL Worker、缺dispatch扫描恢复4→P2、源SHA），浏览器10+完成未知重试1绿、共享23绿；触摸分支RED→修ratio/dx/dy→两条GREEN（合成非真机）、clipboard读回；types/架构/三服务build绿。证据acceptance及/tmp/proofroom-qa/m5-*.log。独审已报告项全关闭。
T029原生窗口未完成：Chrome app目标被其他窗口变化，工具拒绝；Safari noWindows/timeout；Chrome purpose浏览器不可用。未用setFiles冒充。CUA已completion_summary。新建自有Chrome空窗口留存，未动旧tab。native样图/tmp/proofroom-qa/native-originals、native-state.json仅账号/sid/id（勿扩散），本轮无照片上传。QA supervisor工具session88759待停，只停本任务进程，PG/S3保留。
下一步M6 T033-038：严格精修映射/清单版本/齐套P4/30天/补片旧集合有效/可撤销源与3ZIP/续期/CAS与Owner纠正/交付优先UI/CRC-SHA。M7-8尚未做，不交最终预览。先源码/受影响增量，再独审。
固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。PG17:18432 dev/test；签名S3rver18190是本地替身。QA18186/18184/.next-qa；Web build用.next，勿竞争生成物。迁移002-010已应用不可改，只加011+。.env0600不打印；Web剥离DB/S3/APP_SECRET，APIWorker runtime DSN。
关键：storage PUT前持久tombstone、跨进程资源锁；引用含upload_items/photos，防误删源；idempotent/withTx可复用锁连接。未知请求后任意失败保原key/payload；PIN不入草稿、客户草稿用projectUUID。备注原文/双方星色同源，P3改动需重提；未完成集合绝不假零。
