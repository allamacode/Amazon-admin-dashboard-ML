---
description: Auto-run the project servers when asked for the localhost link.
---

# Project Startup Rule

When the user asks for the "localhost link" or asks to "open the project":
1. Automatically provide the localhost links for both the Next.js dashboard (`http://localhost:3000`) and the FastAPI backend (`http://localhost:8000`).
2. Before returning the links, check if the servers are running. If they are not running, use the `run_command` tool to start them as background daemons (`IsDaemon: true`).
3. To start the backend, run `cmd /c .\venv\Scripts\uvicorn.exe main:app --reload` from `c:\Amazon E commerce\amazon-ml-backend`.
4. To start the frontend, run `cmd /c npm run dev` from `c:\Amazon E commerce\amazon-ml-dashboard`.
5. Tell the user you've automatically started the servers so everything works smoothly out of the box.
