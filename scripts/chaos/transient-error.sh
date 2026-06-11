#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CHAOS_KEY="${CHAOS_KEY:-change-this-key}"
EVIDENCE_DIR="${EVIDENCE_DIR:-docs/evidence/local}"
mkdir -p "$EVIDENCE_DIR"
OUTPUT="$EVIDENCE_DIR/transient-error-$(date +%Y%m%d-%H%M%S).txt"

{
  echo "Scenario: transient HTTP 503"
  echo "Target: $BASE_URL"
  echo "Started: $(date -Iseconds)"

  curl --silent --show-error \
    --header "x-chaos-key: $CHAOS_KEY" \
    --write-out "\nhttp_status=%{http_code} total_seconds=%{time_total}\n" \
    "$BASE_URL/chaos/transient-error"
} | tee "$OUTPUT"

echo "Evidence: $OUTPUT"
