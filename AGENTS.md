# ProofRoom platform
需求 ../需求规格与实施方案.md 为正本；spec/tasks见 specs/001-proofroom-platform/；当前状态 _codex/sessions/proofroom.md。固定Node22.22.2；npm workspaces。
只本地开发、不自动commit/push/部署/迁移真数据。原WorkBuddy工程和服务不动。upstream为eff48d0原源码参考，不是活动运行应用；复用组件需消除DB/Blob/Next Action依赖。
apps/web只依赖contracts；SQL/鉴权/存储在API/domain；studio显式/live membership、事务/幂等/CAS/严格交付不可绕过。按任务逐纵切片验证，只跑受影响增量，最终集成检查及独立复核。
.local存开发状态且忽略；/tmp/proofroom-qa可清理证据；保护私密链接/PIN/凭据。
