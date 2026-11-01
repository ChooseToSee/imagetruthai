# Tasks
- [x] Connect signed-out uploads to anonymous server allowance, preserving consent and signed-in behavior; browser verified request and friendly 24-hour-limit message without login redirect; seven tests passed.
- [x] Add server-only anonymous single-scan access and atomic rolling quotas; verified live success, repeat/IP rejection, batch rejection, private storage, 24-hour expiry, and 150 cap; signed-in tests passed and UI unchanged.
- [x] Add completed-analysis-shown tracking for real single and batch analyses.
- [ ] Add secure Visitor Stats to admin — blocked on a Lovable account analytics connection; connection card was cancelled by the user's question.
- [x] Explain why the published app needs separate permission to read Lovable analytics.
- [x] Validate event schema and four tracking tests; signed-in real single analysis displayed results and emitted one event.