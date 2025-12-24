#!/bin/bash
# RAG Memory - Session Start Hook
# Injects context loading instruction at session start
#
# INSTALLATION:
# 1. Copy this file to .claude/hooks/rag-session-start.sh
# 2. Make executable: chmod +x .claude/hooks/rag-session-start.sh
# 3. Add to .claude/settings.json or settings.local.json:
#
#    {
#      "hooks": {
#        "SessionStart": [
#          {
#            "hooks": [
#              {
#                "type": "command",
#                "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/rag-session-start.sh"
#              }
#            ]
#          }
#        ]
#      }
#    }

# Check if rag-memory is configured
CONFIG_FILE="$CLAUDE_PROJECT_DIR/.claude/rag-memory.json"

if [ -f "$CONFIG_FILE" ]; then
  # RAG is configured - inject system message to load context
  PROJECT_ID=$(cat "$CONFIG_FILE" | grep -o '"projectId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

  cat << EOF
{
  "continue": true,
  "systemMessage": "RAG Memory is configured for this project (projectId: $PROJECT_ID). At the START of this session, you MUST run /rag-memory load to retrieve context from previous sessions before doing any other work. This ensures continuity and prevents re-explaining decisions."
}
EOF
else
  # No RAG configured - continue normally
  echo '{"continue": true}'
fi
