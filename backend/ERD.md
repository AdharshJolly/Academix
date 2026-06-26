# Entity Relationship Diagram
## Academix Backend — Database Layer

See [docs/DATABASE.md](../docs/DATABASE.md) for the full schema reference.

This file is a quick-reference copy for backend developers.

```mermaid
erDiagram
    users ||--o{ tasks : "has"
    users ||--o{ intelligence_reports : "generates"
    users ||--o{ automation_logs : "triggers"
    tasks ||--o{ intelligence_reports : "analyzed_by"
    intelligence_reports ||--o{ automation_logs : "triggers"
```

