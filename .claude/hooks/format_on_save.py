import sys
import json
import subprocess
import os

PROJECT_ROOT = r"d:\OneDrive\08- QL NhanSu"
FRONTEND_ROOT = os.path.join(PROJECT_ROOT, "frontend")

TS_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx", ".json", ".css"}
CS_EXTENSIONS = {".cs"}

try:
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input", {})
    path = tool_input.get("file_path", "")

    if not path or not os.path.isfile(path):
        sys.exit(0)

    ext = os.path.splitext(path)[1].lower()

    if ext in TS_EXTENSIONS:
        subprocess.run(
            ["npx", "--yes", "prettier", "--write", path],
            cwd=FRONTEND_ROOT,
            capture_output=True,
            timeout=15,
        )
    elif ext in CS_EXTENSIONS:
        rel = os.path.relpath(path, PROJECT_ROOT)
        subprocess.run(
            ["dotnet", "format", "--include", rel, "--no-restore"],
            cwd=os.path.join(PROJECT_ROOT, "backend"),
            capture_output=True,
            timeout=30,
        )

except Exception:
    pass

sys.exit(0)
