# ProofRoom active · 2026-11-14
目标：新平台完整本地开发→全验后预览。Web/API/Worker分离+普通PG；PM正本../需求规格与实施方案.md v1.1§19（16UX/39AT），spec/tasks/acceptance在specs/001-proofroom-platform。
根 /Users/cjjxw/codex/摄影选片平台/proofroom；Git eff48d0→agent/proofroom-local-main，原码upstream保留，未commit/push/部署。旧WorkBuddy工程/服务不动。
完成T001-009/011-028/031-032。T010等媒体+导出全入口；T030等下载空间。M1-M5证据acceptance；M5后端17/浏览器10+未知完成1/共享23绿，合成触摸2绿，不是真机。独审既报项已关。
M6后端已实现：严格映射/旧批显式adopt/自动P4首期限一次/补片旧集保留；相邻Owner hold/续期；源网关Range/HEAD、私有ZIP租约4次/流SHA/有界multipart。迁移001-012已test应用不可改。delivery28+media9+storage3=40绿m6-zip-recovery.log；真实第4claimSIGKILL→陈旧failed无第5次→显式retry→ready，m6-recovery-final.log1绿。17MiB实际3段+SHA/强制小ZIP64/CRC绿，非5GB/云容量。最终三ZIP独审源码已关。
本地S3rver缺List/Abort且V4只认key不验签，已补标准canonical+HMAC校验在全部route前及受控扩展；m6-storage-signature.log5绿（错secret与伪造签名403/错误key不abort、multipart失败abort）。签名最终源码独审待回。S3仅loopback替身，不是外部S3。
M6已完成T030/033-038：delivery/downloads/lifecycle界面、P4下载优先与只读精修预览接线。整单m6-browser-pathfix.log22.1s绿（4原片选3备注、3精修2auto1manual、源逐张/三ZIP CRC+SHA、补片8、到期/续期丢ack403同key/4宽度）；未知恢复m6-browser-recovery.log3绿+映射时序修后m6-conflict-final.log1绿。明确业务409解除pending保输入；401403仍原key。ZIP_OUTDATED终结旧准备可新建当前集合。独审全部报告项源码关闭。
当前树backend storage6+delivery28+真Worker第4claim恢复1=35绿m6-backend-integrated.log，type/架构/3服务build绿m6-types-final.log/m6-build-final.log。选片邻近3场景正在m6-selection-regression.log。下一步M7 T039图库管理（复用项目/PIN/期限，配置复制到新空P1），然后T040-044、M8；自动继续，不交提前预览。
T029原生文件窗仍未验：Chrome app窗口变化工具拒绝，Safari无窗口/超时，provider不可用。只建自有Chrome空窗口未选文件，不碰其他项目；CUA已completion_summary。native-originals与native-state.json在/tmp/proofroom-qa，后者仅合成账号/sid/id不含cap。禁止setFiles冒充原生。
固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。PG17:18432dev/test；S3:18190运行且数据保留。无Web/API/Worker常驻预期。QA18186/18184/.next-qa；build.next不竞争。tests隔离proofroom_test；.env不打印Web剥离DB/S3/APP_SECRET。QA全在/tmp/proofroom-qa可清。
T045审计JSON在临时QA：Next/Sharp/Zod/Vitest等漏洞待兼容更新；不audit--force/盲降级。原生T029尚阻塞，M7/M8未完，不交最终预览。
关键：未知请求后任意401/403保原key/payload；草稿不含PIN/cap/grant/会话；备注原文作者权限、双方星色同源，P3修改需重提；集合未知不假零。storage tombstone/资源锁，引用含ZIP，不误删源。独审可只读委派foundation_review，不并行写。
