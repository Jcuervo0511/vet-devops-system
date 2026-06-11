#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CHAOS_TARGET_URL="${CHAOS_TARGET_URL:-$BASE_URL/pets}"
CHAOS_KEY="${CHAOS_KEY:-change-this-key}"
EVIDENCE_DIR="${EVIDENCE_DIR:-docs/evidence/local}"
mkdir -p "$EVIDENCE_DIR"
OUTPUT="$EVIDENCE_DIR/transient-error-$(date +%Y%m%d-%H%M%S).txt"
HEADER_FILE="$(mktemp)"
trap 'rm -f "$HEADER_FILE"' EXIT

{
  echo "Scenario: transient HTTP 503"
  echo "Target: $CHAOS_TARGET_URL"
  echo "Started: $(date -Iseconds)"

  curl --silent --show-error \
    --dump-header "$HEADER_FILE" \
    --header "x-chaos-key: $CHAOS_KEY" \
    --header "x-chaos-scenario: transient-error" \
    --write-out "\nhttp_status=%{http_code} total_seconds=%{time_total}\n" \
    "$CHAOS_TARGET_URL"

  attempts="$(
    awk 'tolower($1) == "x-chaos-attempts:" { gsub("\r", "", $2); print $2 }' \
      "$HEADER_FILE" | tail -1
  )"
  echo "chaos_attempts=${attempts:-0}"
} | tee "$OUTPUT"

echo "Evidence: $OUTPUT"
