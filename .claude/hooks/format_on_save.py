import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = (data.get("tool_response") or {}).get("filePath") or data.get("tool_input", {}).get("file_path", "")
if not file_path:
    sys.exit(0)

ext = os.path.splitext(file_path)[1].lower()

try:
    if ext in (".ts", ".tsx", ".js", ".jsx", ".json", ".css"):
        subprocess.run(["npx", "--no-install", "prettier", "--write", file_path], check=False)
    elif ext == ".cs":
        subprocess.run(["dotnet", "format", os.path.dirname(file_path), "--include", file_path], check=False)
except FileNotFoundError:
    pass
