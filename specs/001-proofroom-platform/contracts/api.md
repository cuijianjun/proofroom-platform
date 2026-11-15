# API contract v1
统一 /api/v1；业务JSON {data,error,requestId}，error含code/message/fields/retryable。UTC ISO；服务端schema严格白名单、参数化SQL。所有写入校验可信Origin。HttpOnly同源工作人员session与每项目PIN cookie隔离；不可用PIN定位。
/auth register/login/me/logout/password/mfa；/me/studios list/create；/studios/:sid/members、invitations、owner；/platform status/quotas/audit/support-read。
/studios/:sid/config/:section GET/PUT CAS；/public/:slug config/slots/inquiries；/public/:slug/receipts/:cap；/public/:slug/inquiries/status 用HttpOnly用途cookie+原提交键恢复丢失回执，不在普通草稿保存能力token。
/studios/:sid/inquiries list/detail/ignore/restore/confirm；projects list/manual/detail/reschedule/cancel/restore/renew/history/preview；slots创建/编辑/启停，已占用仅在项目中改期；projects/creation/:key在工作人员租户内核对丢失创建回执；projects/batch取消逐资源结果，原payload幂等重试。
/projects/:id/upload-batches POST、batch GET、items/:item PUT（二进制）/retry/remove；photos preview/source/metadata；delivery-mappings PUT绑定selectionVersion。
/client/:cap PIN/GET/selection/complete/photos/comments/download/zip，token绑定sid+order，客户写仅P2/P3 active，下载仅当前策略和期限。
CSV、源文件、Range与ZIP使用对应协议；JSON无内部对象键/PIN/hash/私密token。每接口OpenAPI由Fastify运行schema产生，TypeScript共享输入；前端API client保留状态码和错误。
401会话失效/403角色/404跨租户与无效链接/409版本或幂等/413大小/429限流。幂等键+内容hash，异内容拒绝。


M11公开预约展示：`GET /public/:slug/config`的slots包含已开放的未来时段，字段仅id/start_at/end_at/version/available；已占用仍显示且available=false，不含项目/客户标识，关闭时段不公开。咨询提交仍只记意向；提交时与最终摄影师确认均校验时段版本/占用，确认成功才占用，取消/改期后释放。UI灰显只表达读取时状态，不能替代事务校验。
