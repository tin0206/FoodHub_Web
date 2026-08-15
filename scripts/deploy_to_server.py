#!/usr/bin/env python3
"""make deploy — local npm i + build, commit/push, then SSH Mac: pull + npm i + build + start.

Usage:
  make deploy m="your commit message"
"""

from __future__ import annotations

import argparse
import os
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Runs on Mac over SSH. Load node (Homebrew / nvm) in a non-interactive session.
REMOTE_NODE_PREP = r"""
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
""".strip()

# Detach next start from the SSH TTY. macOS has no setsid(1); Python
# start_new_session=True calls setsid() so SIGHUP on ssh exit does not kill it.
REMOTE_START = r"""
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PATH="$PWD/node_modules/.bin:$PATH"
python3 - <<'PY'
import os, shutil, subprocess, sys, time

port = os.environ.get("PORT", "3000")
pid_path = ".deploy.pid"
log_path = "deploy.log"


def kill_pid(pid: int) -> None:
    try:
        os.kill(pid, 15)
    except OSError:
        return
    for _ in range(20):
        try:
            os.kill(pid, 0)
        except OSError:
            return
        time.sleep(0.1)
    try:
        os.kill(pid, 9)
    except OSError:
        pass


if os.path.isfile(pid_path):
    raw = open(pid_path, encoding="utf-8").read().strip()
    if raw.isdigit():
        kill_pid(int(raw))
    os.remove(pid_path)

lsof = shutil.which("lsof")
if lsof:
    out = subprocess.run(
        [lsof, f"-tiTCP:{port}", "-sTCP:LISTEN"],
        capture_output=True,
        text=True,
    )
    for line in out.stdout.split():
        if line.isdigit():
            kill_pid(int(line))

npm = shutil.which("npm")
if not npm:
    sys.stderr.write("npm not found on PATH after nvm/homebrew setup\n")
    sys.exit(1)

logf = open(log_path, "ab")
proc = subprocess.Popen(
    [npm, "run", "start"],
    stdin=subprocess.DEVNULL,
    stdout=logf,
    stderr=subprocess.STDOUT,
    start_new_session=True,
    cwd=os.getcwd(),
    env=os.environ.copy(),
)
open(pid_path, "w", encoding="utf-8").write(str(proc.pid))
print(f"---> started npm run start pid {proc.pid}", flush=True)
PY

i=0
until lsof -tiTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -ge 30 ]; then
    echo "next start did not listen on ${PORT}; last log:" >&2
    tail -n 50 deploy.log >&2 || true
    exit 1
  fi
  sleep 1
done
echo "---> next is listening on ${HOSTNAME}:${PORT} (pid $(cat .deploy.pid))"
""".strip()


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip("'").strip('"')
    return values


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for name in (".env", ".env.local"):
        values.update(load_env_file(ROOT / name))
    return values


def pick(file_vals: dict[str, str], key: str, default: str = "") -> str:
    return (os.environ.get(key) or file_vals.get(key) or default).strip()


def run(cmd: list[str]) -> int:
    print("--->", " ".join(cmd))
    return subprocess.call(cmd, cwd=ROOT)


def npm_argv(*args: str) -> list[str]:
    npm = shutil.which("npm.cmd") if os.name == "nt" else None
    npm = npm or shutil.which("npm") or "npm"
    return [npm, *args]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("-m", "--message", default="")
    args = parser.parse_args()
    message = (args.message or os.environ.get("m") or "").strip()

    file_vals = load_env()
    host = pick(file_vals, "SERVER_HOST")
    user = pick(file_vals, "SERVER_USER")
    remote_dir = pick(file_vals, "SERVER_DIR", "projects/foodhub/foodhub_web")

    if not host or not user:
        print("Missing SERVER_HOST / SERVER_USER in .env or .env.local", file=sys.stderr)
        return 1
    if not shutil.which("git") or not shutil.which("ssh"):
        print("git and ssh must be on PATH", file=sys.stderr)
        return 1
    if not (shutil.which("npm.cmd") if os.name == "nt" else None) and not shutil.which("npm"):
        print("npm must be on PATH", file=sys.stderr)
        return 1

    print("---> local npm i")
    if run(npm_argv("i")) != 0:
        return 1

    print("---> local npm run build")
    if run(npm_argv("run", "build")) != 0:
        return 1

    if run(["git", "add", "-A"]) != 0:
        return 1

    if subprocess.call(["git", "diff", "--cached", "--quiet"], cwd=ROOT) == 0:
        print("---> nothing to commit")
    else:
        if not message:
            print('Usage: make deploy m="your commit message"', file=sys.stderr)
            return 1
        if run(["git", "commit", "-m", message]) != 0:
            return 1

    if run(["git", "push"]) != 0:
        return 1

    quoted_dir = shlex.quote(remote_dir)
    remote = (
        f"{REMOTE_NODE_PREP}\n"
        f"cd {quoted_dir}\n"
        "git pull\n"
        "npm i\n"
        "npm run build\n"
        f"{REMOTE_START}\n"
    )
    target = f"{user}@{host}"
    print(
        f"---> SSH {target} -> cd {remote_dir} && "
        "git pull && npm i && npm run build && npm run start"
    )
    print("---> Enter Mac password when prompted...")
    # Pass script as argv (not stdin) so OpenSSH can still prompt for password on the TTY.
    return subprocess.call(["ssh", "-t", target, "bash", "-lc", remote], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
