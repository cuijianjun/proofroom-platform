# 技术核对与复用决定
2026-11-14，源码eff48d0，本地Node22.22.2/PG17.11/specify1.2.6.dev0。
- 决定：保留Next16.3.4、React19.2.8与上游UI主题、Dialog/Lightbox/UI primitives；新增独立API。依据已安装上游锁与源码，而非替换Vue/Java。
- 决定：pg单连接事务，原Neon事务不可机械Promise.all。官方 https://node-postgres.com/features/transactions 。
- 决定：Fastify5（Node22），共享schema不含node:crypto；官方 https://fastify.dev/docs/latest/Reference/LTS/ 。
- 复用：password.ts、tokens.ts只在domain，CSV序列化补公式保护；slug与DTO可浏览器共享。
- 排除Web依赖：原db/auth/session/storage、Neon、Vercel Blob、Server Actions、旧proxy查库。UI uploader需改成持久批次，不能复用其上传成功即就绪逻辑。
- 普通PG隔离集群18432，MinIO本地S3适配，pg-boss持久任务；不另加Redis/ORM。
- 只读研究agent已检查隐藏耦合：validation→password→crypto，site sections→render→db。边界检查覆盖全部Web依赖，不仅client组件。

M0实跑：上游npm ci 486依赖成功；Next16.3.4 build/TS/122静态页通过（编译20.4s、TS27s），无DATABASE_URL，未触及旧库；不是新平台功能验收。

本地S3决定更新：Docker Hub指定MinIO镜像拉取被拒，官方Quay同tag无manifest，未启动任何MinIO容器。采用固定s3rver3.7.1作loopback确定性兼容替身，应用仍走AWS SDK/S3存储接口；禁匿名与默认凭据，生成本地密钥。真实S3/MinIO兼容性保留外部验收，不声称已通过。
