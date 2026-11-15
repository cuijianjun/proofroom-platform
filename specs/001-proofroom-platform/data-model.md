# 数据模型
沿用ProofRoom的users/studios/memberships/invitations/sessions/clients/inquiries/orders/galleries/photos/photo_comments/photo_selections语义；orders是唯一项目主记录，不并建projects。
- users：username/email（工作人员）、scrypt、禁用/强制改密/MFA；sessions：hash/revoke/expire。
- studios：slug/品牌/timezone/状态/配额/reserved+used；memberships角色实时校验；invite用途隔离hash。
- studio_configs：section+version+JSONB，CAS；固定身份题/2～30/稳定ID；套件与FAQ版本独立。
- inquiries：答案/定义/作品/套餐快照，hash PIN，私密receipt，幂等digest；不占预约。
- clients：studio局部，email可null，wechat与后四位不可自动合并。orders：studio/client，随机token hash，PIN hash，workflow/lifecycle/version/selection_version/completion基线/delivery deadline/compatibility/visibility。
- booking_slots：studio+UTC起止，gist排他约束；order占用与事务锁；取消释放而非删订单。
- galleries：order原片/精修、发布/可见、版本；photos：studio/order/gallery/batch，唯一源键/SHA256/bytes/filename/role/processing/variants。
- upload_batches/items：期望集合持久，quota预留，receipts唯一，worker与scan可恢复。
- photo_selections/comments：唯一可编辑事实，评级颜色/多条备注；order完成摘要仅判断改变。
- delivery_mappings：原片与精修唯一对应，绑定清单版本，不通过数目推断。
- idempotency：scope/studio/key/digest/result，事务内绑定；audit/resource jobs租户不可缺失。
状态：P1整批原片就绪→P2，非空清单提交→P3，完整精修与对应且当前版本→P4，首次交付写now+30days；到期archived，续期max(now,deadline)+30days。合作取消独立。
复合唯一/FK防跨租户引用；所有用户输入绑定SQL；错误回滚/预约竞争/CAS/迟到worker必须实测。
