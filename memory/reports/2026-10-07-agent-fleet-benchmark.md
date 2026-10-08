# 智能体舰队组建案例调研（对标输入）｜2026-10-07｜tech-intel
基线：OpenClaw 单机网关＋frontend-architect 主会话＋6 常驻＋flash 动态子代理。🟢=实证 🟡=推断

## 案例清单

**1. Anthropic 多智能体研究系统**
- 结构：Opus 4 lead＋Sonnet 4 子代理；lead 并行 spawn 3-5 个，子代理再并行 3+ 工具 🟢
- 编排：orchestrator-worker；计划先存 Memory 防截断 🟢
- 采纳：①任务书四件套＝目标/输出格式/工具指引/边界（缺则子代理重复搜索）②失败模式清单（滥 spawn、无限搜、刷进度）入 qa-verifier ③+90.2% 效果但 token≈15×聊天，作预算护栏依据 🟢
- 证据：https://www.anthropic.com/engineering/multi-agent-research-system

**2. Claude Code：subagents／agent teams**
- 结构：lead＋teammates（各自独立上下文）；另有单向上报 subagents、/batch（5-30 个 worktree 子代理）🟢
- 编排：主从＋共享任务清单（三态、依赖自动解锁、文件锁防抢单）＋mailbox 双向直连 🟢
- 采纳：①TaskCompleted 钩子 exit 2=完成门禁 ②计划态审批（lead 批准才实施）③Delegate Mode（lead 只协调）④任务清单 JSON 落盘 🟢
- 证据：https://code.claude.com/docs/en/agent-teams ；https://code.claude.com/docs/en/agents

**3. LangGraph（supervisor/swarm 双库）**
- 结构：supervisor 层级制（可多层嵌套）；swarm 平权接力 🟢
- 编排：图编排＋工具化 handoff；子代理消息注入可选 full_history/last_message；checkpointer 长记忆 🟢
- 采纳：①sessions_send 升级 handoff 语义（控制权＋上下文包）②多级 supervisor ③回传末条/全量可选 🟢
- 证据：https://pypi.org/project/langgraph-supervisor/ ；https://github.com/langchain-ai/langgraph-swarm-py

**4. CrewAI（Crews＋Flows）**
- 结构：crew=角色代理＋任务列表；hierarchical 由 manager 分派/验收 🟢
- 编排：sequential/hierarchical 双过程；确定性 Flow 包 crew；任务 context 引用上游产出 🟢
- 采纳：①manager「分派→验收→流转」显式化 ②任务级 context 引用 ③内建 usage metrics 🟢
- 证据：https://docs.crewai.com/concepts/processes

**5. AutoGen / AG2**
- 结构：平等代理群＋GroupChatManager，可嵌套子团队 🟢
- 编排：群聊；发言选择 auto/manual/round_robin；发言转移白名单；max_round 熔断 🟢
- 采纳：①转移白名单约束谁可@谁 ②轮数熔断 ③开场自我介绍轮（低成本对齐）🟢
- 证据：https://docs.ag2.ai/latest/docs/user-guide/advanced-concepts/groupchat/groupchat

**6. OpenAI Agents SDK**
- 结构：专家代理＋handoffs／agents-as-tools 双委托 🟢
- 编排：handoff 移交；输入/输出/工具三级 guardrail；tracing 全链路；human-in-the-loop 🟢
- 采纳：①工具级 guardrail（调用前后动态校验，补静态白名单）②子 span 挂父 trace ③可恢复审批流 🟢
- 证据：https://openai.github.io/openai-agents-python/guardrails/ ；https://developers.openai.com/api/docs/guides/agents/sdk

**7. MetaGPT**
- 结构：5 角色软件公司（产品/架构/项目经理/工程师/QA）🟢
- 编排：SOP 流水线＋发布订阅；中间产物 schema 化（PRD→设计→任务→代码→review）🟢
- 采纳：①交付物 schema 化 ②按订阅收产物；消融：4 角色人工修订成本 10→2.5 🟢
- 证据：https://arxiv.org/html/2308.00352v7 ；https://www.ibm.com/think/topics/metagpt

**8. Magentic-One（Microsoft）**
- 结构：Orchestrator＋WebSurfer/FileSurfer/Coder/Terminal 🟢
- 编排：双循环双账本：task ledger（事实/待查/待推导/猜测＋计划）＋progress ledger；停滞计数>2 重规划 🟢
- 采纳：①停滞检测防死循环 ②facts/guesses 分离入账本（合我方🟢/🟡纪律）🟢
- 证据：https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/

**9. OpenClaw 官方 subagents（我方底座）**
- 结构：主代理＋后台子代理（独立 session）＋thread-bound 常驻线程 🟢
- 编排：sessions_spawn 非阻塞＋announce 回报；嵌套深度可配；子代理默认剥离 session/message 工具；另有专家车道/多代理沙箱页 🟢
- 采纳：主机制已用；增量=thread-bound 常驻、专家车道、并发参数（需查网关版本）🟢
- 证据：https://docs.openclaw.ai/tools/subagents

**10. Cursor Cloud Agents**
- 结构：本地代理＋云端 VM 代理群 🟢
- 编排：后台并行＋多入口派发（Slack/GitHub/Linear/API）＋dashboard；Temporal 持久执行；子代理可活过父代理；自愈环境 🟢
- 采纳：①云端并行补 WSL2 单机短板 ②agent 与会话状态解耦 ③memory 跨次运行学习 🟢
- 证据：https://cursor.com/docs/cloud-agent ；https://cursor.com/en-US/blog/cloud-agent-lessons

**11. Devin / Cognition（managed Devins）**
- 结构：1 coordinator＋N 完整 Devin（独立 VM）🟢
- 编排：主从＋中途插话＋ACU 用量监控＋子会话休眠/终止＋自定时提醒；回读子轨迹改进下次拆解 🟢
- 采纳：①轨迹复盘反哺拆解（并入 knowledge-distiller）②子会话级成本监控 ③暂停/终止控制面 🟢
- 证据：https://cognition.com/blog/devin-can-now-manage-devins ；https://cognition.com/blog/sept-24-product-update

**反例参照**：Cognition《Don't Build Multi-Agents》＋LangChain 综述：「读」型任务宜多代理扇出，「写」型（编码）多代理易冲突难合并 🟢。我方编制与此一致，升级不宜以编码并行为首。
- 证据：https://blog.langchain.com/how-and-when-to-build-multi-agent-systems

## 功能候选池

### A. 我方尚无
| 功能点 | 来源 | 预期收益 | 成本 |
|---|---|---|---|
| 共享任务清单＋依赖自动解锁＋防抢单 | Claude Code | 并行改码状态统一可见 | 低 |
| 完成门禁钩子（标完成前强制校验否则驳回） | Claude Code | qa-verifier 语义入状态机，杜绝自评完成 | 低 |
| 停滞检测＋自动重规划 | Magentic-One | 长任务防死循环省 token | 低 |
| 子代理轨迹复盘反哺拆解 | Devin | 正向学习闭环，拆解越用越好 | 中 |
| 交付物 schema 化＋订阅式传递 | MetaGPT | 交接标准化可机读，消费率可量化 | 中 |
| 计划态审批（先批计划再实施） | Claude Code | 审批前移降返工，扩展 G1-G2 | 低 |
| 云端并行执行环境 | Cursor/Devin | 补单机长任务短板 | 高 |

### B. 已有可增强
| 功能点 | 来源 | 预期收益 | 成本 |
|---|---|---|---|
| 任务书→目标/输出格式/工具指引/边界显式字段 | Anthropic | 消除子代理重复劳动 | 低 |
| sessions_send→handoff 语义（控制权＋上下文包） | LangGraph/OpenAI | 协作从通知升级为移交 | 中 |
| 遥测→全链路 tracing（子 span 挂父 trace） | OpenAI SDK | 故障定位一条链路 | 中 |
| spawn 加 token/预算上限护栏 | Anthropic 15×数据 | 多代理成本可控 | 低 |
| 静态白名单＋工具级动态 guardrail | OpenAI SDK | 白名单管权限，guardrail 管调用 | 中 |
| 子会话控制面（插话/暂停/终止/用量） | Devin/Cursor | 长跑子代理可纠偏止损 | 中 |

## 参考资料
1. https://www.anthropic.com/engineering/multi-agent-research-system
2. https://code.claude.com/docs/en/agent-teams
3. https://pypi.org/project/langgraph-supervisor/
4. https://docs.crewai.com/concepts/processes
5. https://docs.ag2.ai/latest/docs/user-guide/advanced-concepts/groupchat/groupchat
6. https://openai.github.io/openai-agents-python/guardrails/
7. https://arxiv.org/html/2308.00352v7
8. https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/
9. https://docs.openclaw.ai/tools/subagents
10. https://cursor.com/docs/cloud-agent
11. https://cognition.com/blog/devin-can-now-manage-devins
12. https://blog.langchain.com/how-and-when-to-build-multi-agent-systems

> ⚠️ 目标路径被 write 沙箱拦截，请主会话将本文件移至 frontend-architect/memory/reports/。
