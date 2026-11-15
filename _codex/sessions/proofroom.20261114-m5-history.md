# ProofRoom active · 2026-11-14
目标：按正本完整开发新平台，独立Web/API/普通PG，本地全部验收后预览；连续48任务。用户追加高级PM旅程/状态/恢复修需求，已写正本v1.1§19（16UX/39AT，非访谈）。
根 /Users/cjjxw/codex/摄影选片平台/proofroom；正本../需求规格与实施方案.md；spec/tasks/acceptance在specs/001-proofroom-platform/。Git eff48d0→agent/proofroom-local-main，upstream来源，原码移upstream保留；未commit/push/部署。旧WorkBuddy工程/18080/82/84不动。
完成：T001-009/011-021/023/024；T010私有媒体/导出策略、T022客户照片只读预览保下游。M3售前与M4接单/预约/项目概览/历史已验；M4 API11+presales5、浏览器8/36.1s、共享账号售前15/52.9s、types/build/边界绿，独审全部报告项已关。详acceptance与/tmp/proofroom-qa/m4-*.log。
当前M5 T025-032：后端上传/worker/重试移除替换已写；media7真PG/S3绿，未知manifest不推进、expectedCount当前有效集合/historyCount分列/manifestKnown不明时null、双预留到删除确认释放。client-access/selections/photos+API/client已写，selections7绿（PIN用途/5错/重置撤Session、星色同源、raw多备注/作者保护、未选备注不使完成失效、超选重提、只读/暂停旧媒体URL）。当前组合media+selections在跑m5-backend-current.log，types最新m5-current-types.log。
尚无M5前端，Projects原片/清单/交付与客户照片预览仍开发占位，/c尚未接UI；不能全交付。M6交付/ZIP/续期、M7运维、M8全验待做。下一步M5UI：抽现有portfolio XHR/sha为应用transport复用；uploads持久批次回执/只重选缺失File/真字节进度/离开保护；photos星色/多备注/灯箱/CSV，client PIN/需求卡/完成改选。草稿不存PIN/能力token/upload grants；client备注草稿用已验证projectUUID隔离，staff用user+studio+project。网络未知重试冻结原key+payload，409显式读最新保本地文字，非自动覆盖。
重要：迁移002-010已在test应用，禁止改原文，只加011以后。storage-io每资源跨进程锁，PUT前storage_cleanup永久tombstone，引用检查包括portfolio/upload_items/photos，不可回退误删源。common.idempotent可传同连接，避免锁连接占满池。worker media localConcurrency2；恢复扫描只挑全原片齐套P1，不让20个部分批次占窗。
Root application已补统一dirty链接捕获、Workspace.navigate，Projects tab用此防上传中切区；下载/新tab跳过，显式换studio写回当前tab；新改未做UI回归。Dialog layout关闭+intendedOpen区分主动切步骤和用户关闭；list-window导航前存位置/instant恢复、账号+studio+筛选隔离，登出generation清缓存。
Node固定 /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。PG17:18432 dev/test、签名S3rver替身18190仍运行；Web/API/Worker已停，local.mjs/e2e-local.mjs启动，QA18186/18184/.next-qa隔离。Web构建与QA目录别竞争。
.env0600勿打印。APIWorker只runtime DSN，Web剥离DB/S3/APP_SECRET；db:migrate显式root env。只测试副本，不碰旧单；备注原文；不把setFiles当原生系统选图成功。到T029真原生验收时先定位旧studio-react handoff的filechooser根因小段，勿盲目附加浏览器，不关其他项目。
独审foundation_review已审M5收据/计费/恢复扫描与T026；最后expectedCount修复待只读确认；PIN/选片新模块还需独审。真实系统文件选择窗/微信真机/外部S3/容量尚未验。历史卡proofroom.20261114-m0-m2-history.md与proofroom.20261114-m3-m5-early-history.md按需定位，不全读。续接继续M5，不重走旧站/上游调研，全部完成再交预览。
