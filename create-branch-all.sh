#!/usr/bin/env bash

set -euo pipefail

SUB_DIRS=(
  "frontend"
  "backend"
  "discord-bot"
  "packages/common"
  "packages/core"
  "packages/types"
)

REMOTE_NAME=${REMOTE_NAME:-origin}

print_usage() {
  cat <<EOF
Usage: $0 <branch-name>

Creates a new branch from the remote's default branch (main/master) in the root repo,
and in any true nested Git repositories found in the configured subdirectories.

Environment variables:
  REMOTE_NAME   Remote to use (default: origin)
EOF
}

if [ "${1-}" = "-h" ] || [ "${1-}" = "--help" ]; then
  print_usage
  exit 0
fi

if [ -z "${1-}" ]; then
  echo "❌ Error: No branch name supplied."
  print_usage
  exit 1
fi

BRANCH_NAME="$1"

require_git_repo() {
  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ Error: This directory is not a Git repository: $(pwd)"
    exit 1
  fi
}

default_base_branch() {
  local remote="$1"
  if ref=$(git symbolic-ref -q --short "refs/remotes/${remote}/HEAD" 2>/dev/null); then
    echo "${ref#${remote}/}"
    return 0
  fi

  if git ls-remote --exit-code --heads "$remote" main >/dev/null 2>&1; then
    echo "main"
  elif git ls-remote --exit-code --heads "$remote" master >/dev/null 2>&1; then
    echo "master"
  else
    echo "master"
  fi
}

create_or_switch_branch_from_remote() {
  local branch="$1"
  local remote="$2"
  local base_branch
  base_branch=$(default_base_branch "$remote")

  echo "🔄 Fetching from '$remote'..."
  git fetch --prune "$remote" >/dev/null

  echo "ℹ️  Using base: $remote/$base_branch"

  if ! git check-ref-format --branch "$branch" >/dev/null 2>&1; then
    echo "❌ Invalid branch name: '$branch'"
    exit 1
  fi

  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "➡️  Branch '$branch' already exists locally. Switching to it..."
    git switch "$branch" >/dev/null
  else
    echo "🌿 Creating and switching to '$branch' from $remote/$base_branch..."
    git switch -c "$branch" --no-track "$remote/$base_branch" >/dev/null
  fi
}

is_nested_repo_root() {
  local dir="$1"
  if ! git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    return 1
  fi
  local top abs
  top=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || true)
  abs=$(cd "$dir" && pwd)
  [[ -n "$top" && -n "$abs" && "$top" == "$abs" ]]
}

echo "🔎 Verifying root Git repository..."
require_git_repo

echo "----------------------------------------"
echo "📌 Target branch: $BRANCH_NAME"
echo "📡 Remote: $REMOTE_NAME"
echo "----------------------------------------"

echo "🏁 Creating/switching branch in root repository..."
create_or_switch_branch_from_remote "$BRANCH_NAME" "$REMOTE_NAME"
echo "✅ Root repository ready."
echo "----------------------------------------"

echo "🔍 Scanning for nested repositories in configured subdirectories..."
for dir in "${SUB_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "⚠️  Skipping missing directory: $dir"
    continue
  fi

  if is_nested_repo_root "$dir"; then
    echo "- 📁 Entering nested repo: $dir"
    nested_remote="$REMOTE_NAME"
    if ! git -C "$dir" remote get-url "$nested_remote" >/dev/null 2>&1; then
      nested_remote=$(git -C "$dir" remote | head -n1 || echo "origin")
    fi
    (
      cd "$dir"
      require_git_repo
      create_or_switch_branch_from_remote "$BRANCH_NAME" "$nested_remote"
    )
    echo "  ✅ Done in '$dir'"
  else
    echo "ℹ️  '$dir' is not a separate Git repo root. Skipping."
  fi
  echo "----------------------------------------"
done

echo "🎉 Successfully prepared branch '$BRANCH_NAME' in the root repo and any nested repos found."
