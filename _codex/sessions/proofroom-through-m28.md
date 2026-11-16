# 历史参考：M23–M28完整交接快照
只作定点历史查询；最新状态以同目录proofroom.md为准，不全量重读。

# 历史交接快照 · M28已完成
根 /Users/cjjxw/codex/摄影选片平台/proofroom；agent/proofroom-local-main@a3873eb，保M23–M27所有未提交。用户要求去掉“展开完整名称”文字按钮，名称末尾加下箭头，同类统一。T126–127已建：共享NameDisclosure用于Mine、摄影师/客户项目、公开工作室/套餐；客户页已有品牌箭头统一方向/大小。保正文展开/业务/数据/登录，平台/API/DB/upstream不动。
T126–127已闭环：10唯一受影响增量，集成9过1测试时长断言→修测试后2新项过30.1s；root/Web类型、架构/diff guard过，7文件lint0错5旧警告。独立静态复核无P1/P2；详见acceptance.md M28。证据/tmp/proofroom-qa/apple-experience/m28-*可清理，私密state不打印。未重启/提交/部署。当前用户要求新会话交接，不自动续做旧任务。

# 当前状态 · M27完成，等下一条指令
根/分支/服务见下，保所有旧未提交。T124–125关闭。外部CopyText与Photos文件名复制成功统一顶部居中深棕灰白字勾Toast、1.8秒进退/reduce，产品原位copy-feedback文字移除、成功图标保；平台旧反馈保持。ToastProvider beginCopy(source)单例/最新意图、等待真实clipboard确认、校验source/owner open/inert，native dialog或body承载，宿主close清理。CopyText加mounted/换源guard，失败手动复制/重试及焦点保留，迟到结果不重开UI。
验证：m27-test.log9项全过50.6s；独审发现Photos复制失败notice重试成功未清，T057补断言RED→仅清匹配copyFailureNotice（保其它业务提示/CSV代码路径），m27-final.log T057/T124两项过14.7s，后者补真正PIN客户复制摄影师微信，唯一仍9。root/Web tsc、架构/diff guard过，5文件lint0错5旧告警与HEAD逐规则相同，foundation_review仅静态复核全关闭。320/390/1440布局不跳、modal实际paint命中/最新意图/失败重试/卸载晚成功均过。m27-copy-390及copy-modal-390图已看。
只改共享复制/Toast/Photos反馈/CSS/增量/spec，平台业务/API/worker/domain/DB结构/upstream无diff；无依赖/重启/提交/部署。临时/tmp/proofroom-qa/apple-experience/m27-*验收后可清理，长期源码/spec/既有测试保留。既有体验数据只读，私密state勿打印；浏览器clipboard替身，不扩称真机/系统剪贴板/VO/生产。18186/studio与公开页200；下一步按新指令，不重跑全量/调研/重启/提交。

# 当前状态 · M26完成，等下一条指令
根/分支/运行见下，保M23–25全部未提交。T121–123关闭：手机胶囊视觉88×32、按钮44×44、图标18；“…”是快捷面板（待处理项目/拍摄日程/直接复制售前链接），原切换/创建工作室从“我的→工作室管理”进原Dialog/命令，电脑侧栏保留。只改Application/Mine/产品CSS与现有增量，平台/API/worker/domain/DB结构/upstream无diff；无依赖/服务重启/提交/推送/部署。
快捷导航先native close返焦再走原navigate守卫，取消保草稿。独审发现CopyText复制兜底生命周期P2，T123实测RED（跨断点仍1个open dialog）；现key按user/studio/quickActions隔离，迟到reject不重开，复核关闭。顺修刷新toast width:max-content及容器pointer-none/按钮auto，恢复用其可见重试入口。
验证：m26-final.log12项一次同跑全过49.4s（新3项+原Mine/角标/布局/切换/恢复），root/Web tsc、架构/diff guard过，5文件lint0错2旧告警与HEAD逐规则相同。手机Mine真实创建/切回工作室保持账号id和原项目，草稿恢复通过；无整页静态资源重载。初轮10项8过2测试定位/重试目标失败，NodeList类型写法改Array.from；RED和初轮日志保留。foundation_review仅静态独审全关闭；手机390快捷截图已看，几何覆盖320/390/767/768/1440。细节acceptance.md M26。
证据/tmp/proofroom-qa/apple-experience/m26-*验收后可清理，源码/spec/既有测试保留；私密state勿打印，既有体验业务只读。18186/studio和公开页200，保服务固定Node22。下一步仅按新指令，不自动重做调研/全量/重启/提交；非微信/手机真机/生产验收。

# 当前状态 · M25完成，等下一条指令
根/分支/服务/M23背景见下。T113–120关闭；保M23/M24全部未提交。本批摄影师/客户端常用上传/建单/编辑/提交/下载/联系直达，低频刷新/复制配置/导出/删除/权限调整/Owner纠正进就近更多；咨询锚点、图库标题上传入口保留。手机参考Vant，MoreActions在ui/dialog.tsx（电脑details、手机portal+既有Dialog底部动作面板），Select产品手机底部选择层/取消/锁滚动，电脑与平台保原分支。项目搜索隐藏标签+放大镜submit、三排序横向即过滤，与状态联合sticky。箭头图标16px/160ms末端淡出且立即禁点，public-offerings top28。
4独审P2已修关闭：作品卡裁剪（图单裁剪）、复制fallback点modal误关更多（忽略dialog外侧）、portal继承fieldset禁用（observer+原位guard+动作fieldset）、Select打开后只读收起返焦/解锁。viewport用useSyncExternalStore，typeahead用event.timeStamp；新分支都产品范围启用。平台/API/worker/domain/DB结构/upstream无diff；无新依赖/重启/提交/推送/部署。
28唯一增量闭环：m25-final27项21过6测试适配失败→m25-repair13项11过2旧定位→m25-close2过15.9s；m25-isolation5过31.5s（新增UI34，其余4已在27内），非一次28同跑。新7项action-placement覆盖入口/草稿/真实Member/继承禁用/IME/箭头中间态/间距，旧受影响测试按新入口适配。root/Web tsc、架构/diff guard过，41文件lint0错30旧警告与HEAD逐规则相同，最后Select增量lint0；foundation_review仅静态独审全关闭。8实际渲染390/1440无溢出/脚本错；手机面板idle bottom900/height222、作品删除命中true。详见acceptance.md M25。
临时/tmp/proofroom-qa/apple-experience/m25-*可清理，源码/spec/新tests/e2e/action-placement.spec.ts保留。短暂语法500已修恢复200，旧失败日志保留，不当全仓/原版全功能/真机/输入法/生产绿。只新隔离数据写测，既有体验只读，私密state勿打印。入口18186/studio与t/experience-8e4929209248均200；保服务，固定Node22。下一步仅按用户新指令，不自动重跑全量/调研/重启/提交。

# 当前状态 · M24已完成，等用户下一条指令
根/分支/服务及M23背景见下。T107–112全部关闭：横条隐藏，仅右箭头到末端消失并保键盘焦点，横向分类/状态/日期上滑吸顶；客户作品/套餐FAQ在全部questions后、意向套餐前（同form，浏览区不在disabled fieldset），删除两跳转/重复分类名；双点下拉刷新等待真实GET、短拉回弹/reduced直接归位、失败重试/保草稿、命令/上传忙锁；适合分页上滑加载及到底/错误反馈；项目去筛选/刷新按钮，状态排序即时过滤、搜索Enter；客户预览/更多进顶部header，危险确认保留，长名两行可展开。
公开cfg刷新：clean直接更新；dirty保答案/PIN/问卷/作品快照，更新开放状态并要求明确兼容迁移。未动平台/API/domain/upstream/DB结构，现有体验数据不用作写测。
实际验证：固定源码23项受影响集成全过1.4m；另原T042列表失败恢复1项过6.9s，共24唯一新跑。最初7项6过1DOM等待失败已修测试，中间22项21过1Dialog失败（期间HMR，未证实根因），最终重跑通过。root/Web tsc、架构/diff guard过；27文件lint0错24旧警告与HEAD逐规则相同，新增errors测试lint0；独立foundation_review静态审查全部关闭，未代主线程跑测试。6实际渲染状态390/1440无横溢/脚本错；横向/预约测试覆盖320/390/768/1440。详见acceptance.md M24与tasks T107–112。
证据/tmp/proofroom-qa/apple-experience/m24-*（含m24-video8帧、本次日志/6截图；验收后可清理）。服务18186/18184未重启，预览studio及t/experience-8e4929209248均HTTP200。固定Node22，未commit/push/deploy；保M23所有未提交。真实手机/微信/原生窗口/生产未测。下一步仅按用户新指令，不自动续做旧任务；不重做调研/原型/全量/服务，不打印私密state。

# ProofRoom active · M23正式Apple体验验收中
根 /Users/cjjxw/codex/摄影选片平台/proofroom；agent/proofroom-local-main@a3873eb（业务27cb7b3）。用户最新明确直接改18186客户/摄影师/Owner，平台后台不动；已取代先原型待确认。只本地，保登录/数据/现功能/框架/业务规则，不自动提交推送部署。原WorkBuddy与upstream不动。

范围：apps/web产品作用域布局/反馈/motion，现有e2e增量/spec。新components/ui/product-experience.tsx复用全局Apple无依赖动画；Dialog只在产品context启用进退/反向/reduce，退出surface inert且native modal保持至结束；SlotPicker portal自带scope并保挂载，关闭后resolver回触发器或legend；IME不取消候选默认，仅挡业务快捷键/提交，备注组合期间暂停自动保存。公开页短介绍/真tab/可展开长名/问答可见/选套餐；工作台待办优先、项目整卡单入口、客户选中指示/阶段/下载主入口，手机胶囊/底tab，电脑侧栏去独立返回。原型本轮未完成改动已还原至此前已验版本。

当前验证已完成：84个唯一受影响用例闭环（72集成首跑70过2测试定位/时点失败，补跑verified4+portal1关闭；账号/Member/Owner/嵌套预约12过50.1s；同批3动效/缩屏回归10.5s过，不重复计数）。47渲染状态无整页溢出/脚本错，P4手机主下载y675在说明前。平台0产品scope、8类CSS签名无变化；动态隔离工作室新增令后台控件数量变化不能冒充样式差异。root/Web tsc/architecture过，lint0错17既有警告不增。独立foundation_review已关闭本批阻塞，仅静态/截图审查，测试由主Agent。T102–106与acceptance M23已更新。临时证据/tmp/proofroom-qa/apple-experience/summary.json和各final日志/截图（可清理）；私密product-experience-state.json勿打印覆盖，其project对象是创建快照，不是当前version基线。服务保运行，未提交。下一步交付18186链接；后续仅按新指令。

T103–106见specs/001-proofroom-platform/tasks.md，契约plan.md M23。已有完整合并方案full-feature-merge-plan.md（36旧模块/18改造/109页/50路由/28测试/7Lua），原版eff48d0在upstream；UI批不等于原版全部功能已接回。六项确认：默认摄影师确认占档+可选即约；项目/收费图库/商店各自下载；平台原版主/外部新UI主且全保；超选线下默认+可选自动费；图库LR原行为/P4待确认新版本旧交付有效；原Free/Pro收费14天试用/Free1席5GB/Pro每席18美元。D07 Pro公平使用与人工配额优先级仍待答，本批不改。

服务保运行：主44186→18180/18182，QA44187→18186/18184，原版18332，原型18188父53927。固定Node /Users/cjjxw/.workbuddy/binaries/node/versions/22.22.2-6/bin。复用QA；只新隔离工作室写测，不覆盖体验数据/T050state；不并发next typegen/build/dev，正式Web tsc直接noEmit。

恢复：先git status+本卡+T103–106，确认最新验收后按用户新指令；平台apps/web/src/features/platform.tsx、API/domain/upstream须无改动，查看最终作用域和新组件再测。不要重做全功能调研/原型/重启服务。
