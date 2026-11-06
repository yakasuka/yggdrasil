# 规则增量维护说明

`resources/rules/Custom_*.yaml` 是**生成文件**，由 `scripts/sync-rule-providers.mjs` 从
`Aethersailor/Custom_OpenClash_Rules@main/rule/` 同步后与本目录的增量合并而成，**不要手改**。
文件名与上游保持完全一致。

## 添加自己的规则

编辑与生成文件同名的 overlay，取消注释并按需添加，一行一条：

```yaml
payload:
  - '+.my-domain.com'
```

- `behavior: domain` 的文件（`Custom_Direct_Domain.yaml`、`Custom_Proxy_Domain.yaml`）只能放域名。
- `behavior: classical` 的文件可放 `IP-CIDR,...`、`DST-PORT,...`、`DOMAIN-SUFFIX,...` 等完整规则行。

保存后提交即可：同步脚本会比对 overlay 内容哈希，即使上游没更新也会重新合并并生成新文件。

## 删减自己的规则

**直接把那一行从 overlay 里删掉就行**，生成文件会跟着减少：合并是从
`上游最新内容 + 当前 overlay` **全量重建**，不是增量追加，所以不存在「删了但残留」的情况。
overlay 内容哈希变化会触发重建，`.exclude.txt` 增删同样触发。

注意区分两种「删」：

| 想删的东西 | 做法 |
|---|---|
| 你自己加进 overlay 的条目 | 从 overlay 里删掉该行 |
| 上游本来就有的条目 | 写进 `.exclude.txt`（见下） |

如果某条目上游和 overlay 里都有，只删 overlay 里那份，生成文件里**仍会保留**（上游还在提供）。

## 删除上游某条规则

新建 `overlays/<文件名>.exclude.txt`（例如 `Custom_Direct_Domain.yaml.exclude.txt`），
每行写一个要排除的条目，不要引号、不要注释：

```
+.some-upstream.com
```

该条目在合并时会被跳过，上游后续更新也不会把它带回来；从 `.exclude.txt`
里删掉该行再提交，条目就会重新出现。

## 更新触发方式

`.github/workflows/sync-rules.yml` 有两类触发：

- **push 到 `overlays/**`、同步脚本或本 workflow**：立即重建（增删都算），不用本地跑脚本；
- **定时每 15 分钟**：检查上游这 5 个文件的 blob SHA，只有**指定文件内容真的变了**
  （或 overlay 变了）才重新合并并提交，其余情况直接跳过。

也可在 Actions 页面手动运行，勾选 `force` 可强制全量重建（也能纠正被手改过的生成文件）。

外部仓库的 push 无法直接触发本仓库的 workflow（没有对方仓库的 webhook 权限），
所以上游侧依赖「高频轮询 + 按文件精确变更检测」作为等价触发器；本仓库侧的
overlay 变更则是即时触发。用默认 `GITHUB_TOKEN` 产生的 push 不会再触发 workflow，
不会形成循环。

## 本地验证

```bash
node scripts/sync-rule-providers.mjs
git diff --stat -- resources/rules
node scripts/sync-rule-providers.mjs --force   # 强制重建
```
