`# Graph Report - graphify-in  (2026-04-12)

## Corpus Check
- Corpus is ~591 words - fits in a single context window. You may not need a graph.

## Summary
- 37 nodes · 45 edges · 6 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Root Cause 1: Anthropic API Key Not Reaching SDK` - 5 edges
2. `Root Cause 2: Multiple Zombie Server Processes (Windows)` - 5 edges
3. `Root Cause 3: Corrupted Database Records (optimized_content)` - 5 edges
4. `frontend/src/pages/ResumePage.tsx` - 5 edges
5. `GENERATE OPTIMIZED RESUME Button` - 4 edges
6. `app/routes/resumes.py` - 4 edges
7. `app/services/ai_service.py` - 4 edges
8. `FastAPI Backend` - 4 edges
9. `2-Stage AI Pipeline (analyze + optimize)` - 4 edges
10. `Root Cause 4: Original Content Also Corrupted (Resumes 4-7)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `FastAPI Backend` --shares_data_with--> `React/TypeScript Frontend`  [INFERRED]
  graphify-in/conversation_summary.md → graphify-in/conversation_summary.md  _Bridges community 2 → community 3_
- `GENERATE OPTIMIZED RESUME Button` --references--> `Root Cause 1: Anthropic API Key Not Reaching SDK`  [EXTRACTED]
  graphify-in/conversation_summary.md → graphify-in/conversation_summary.md  _Bridges community 0 → community 5_
- `GENERATE OPTIMIZED RESUME Button` --references--> `Root Cause 2: Multiple Zombie Server Processes (Windows)`  [EXTRACTED]
  graphify-in/conversation_summary.md → graphify-in/conversation_summary.md  _Bridges community 0 → community 4_
- `Root Cause 1: Anthropic API Key Not Reaching SDK` --references--> `Fix: Explicit api_key Passing to Anthropic SDK`  [EXTRACTED]
  graphify-in/conversation_summary.md → graphify-in/conversation_summary.md  _Bridges community 5 → community 1_
- `Fix: Explicit api_key Passing to Anthropic SDK` --references--> `app/services/ai_service.py`  [EXTRACTED]
  graphify-in/conversation_summary.md → graphify-in/conversation_summary.md  _Bridges community 1 → community 2_

## Hyperedges (group relationships)
- **Root Causes of GENERATE OPTIMIZED RESUME Button Failure** — conv_generate_optimized_resume_button, conv_root_cause_1_api_key, conv_root_cause_2_zombie_processes, conv_root_cause_3_corrupted_db_records, conv_root_cause_4_original_content_corrupted [EXTRACTED 1.00]
- **2-Stage AI Pipeline Components** — conv_two_stage_ai_pipeline, conv_analyze_resume_job_fit, conv_generate_optimized_resume_method, conv_ai_service_py [EXTRACTED 1.00]
- **Fixes Applied to Resolve Button Issue** — conv_fix_api_key_passing, conv_fix_zombie_processes, conv_fix_corrupted_db, conv_resumes_py, conv_ai_service_py, conv_sqlite_db [EXTRACTED 1.00]
- **Frontend ResumePage Components** — conv_resume_page_tsx, conv_loading_progress, conv_ats_score_bar, conv_try_parse_optimization_result, conv_optimize_mutation [EXTRACTED 1.00]

## Communities

### Community 0 - "DB Corruption & Button Bug"
Cohesion: 0.28
Nodes (9): Fix: SQL UPDATE to Clear Corrupted optimized_content, GENERATE OPTIMIZED RESUME Button, PDF Binary Bytes Corruption in DB (old code bug), pypdf Library (PDF Text Extraction), Rationale: SQLite Stale Bytes in TEXT Columns Break JSON Parsing, Root Cause 3: Corrupted Database Records (optimized_content), Root Cause 4: Original Content Also Corrupted (Resumes 4-7), SQLite Database (ai_job_assistant.db) (+1 more)

### Community 1 - "File Generation & Downloads"
Cohesion: 0.33
Nodes (7): _build_docx() Helper Function, _build_pdf() Helper Function, /download/docx Endpoint, /download/pdf Endpoint, Fix: Explicit api_key Passing to Anthropic SDK, _normalize_data() Helper Function, app/routes/resumes.py

### Community 2 - "AI Optimization Pipeline"
Cohesion: 0.33
Nodes (7): app/services/ai_service.py, analyze_resume_job_fit() - Stage 1 AI Pipeline, ATS Score Improvement Result (48 to 78), FastAPI Backend, generate_optimized_resume() - Stage 2 AI Pipeline, app/services/resume_service.py, 2-Stage AI Pipeline (analyze + optimize)

### Community 3 - "Frontend React UI"
Cohesion: 0.4
Nodes (5): ATSScoreBar Component, LoadingProgress Component (4-step animated), optimizeMutation React Hook, React/TypeScript Frontend, frontend/src/pages/ResumePage.tsx

### Community 4 - "Windows Process Management"
Cohesion: 0.5
Nodes (5): Fix: PowerShell Stop-Process to Kill Zombie Processes, Rationale: Windows Requires PowerShell for Reliable Process Kill, Rationale: Zombie Processes on Same Port Intercept Requests, Root Cause 2: Multiple Zombie Server Processes (Windows), Uvicorn (ASGI Server)

### Community 5 - "API Key & Configuration"
Cohesion: 0.67
Nodes (4): Anthropic Python SDK, pydantic-settings v2, Rationale: pydantic-settings Does Not Populate os.environ, Root Cause 1: Anthropic API Key Not Reaching SDK

## Knowledge Gaps
- **11 isolated node(s):** `app/services/resume_service.py`, `Anthropic Python SDK`, `LoadingProgress Component (4-step animated)`, `ATSScoreBar Component`, `_build_pdf() Helper Function` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GENERATE OPTIMIZED RESUME Button` connect `DB Corruption & Button Bug` to `Windows Process Management`, `API Key & Configuration`?**
  _High betweenness centrality (0.448) - this node is a cross-community bridge._
- **Why does `Root Cause 1: Anthropic API Key Not Reaching SDK` connect `API Key & Configuration` to `DB Corruption & Button Bug`, `File Generation & Downloads`?**
  _High betweenness centrality (0.402) - this node is a cross-community bridge._
- **Why does `Fix: Explicit api_key Passing to Anthropic SDK` connect `File Generation & Downloads` to `AI Optimization Pipeline`, `API Key & Configuration`?**
  _High betweenness centrality (0.337) - this node is a cross-community bridge._
- **What connects `app/services/resume_service.py`, `Anthropic Python SDK`, `LoadingProgress Component (4-step animated)` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._