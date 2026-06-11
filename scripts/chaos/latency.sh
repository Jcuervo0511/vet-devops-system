#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CHAOS_KEY="${CHAOS_KEY:-change-this-key}"
EVIDENCE_DIR="${EVIDENCE_DIR:-docs/evidence/local}"
mkdir -p "$EVIDENCE_DIR"
OUTPUT="$EVIDENCE_DIR/latency-$(date +%Y%m%d-%H%M%S).txt"
LATENCY_BODY="$(mktemp)"

{
  echo "Scenario: latency"
  echo "Target: $BASE_URL"
  echo "Started: $(date -Iseconds)"

  curl --silent --show-error \
    --header "x-chaos-key: $CHAOS_KEY" \
    --output "$LATENCY_BODY" \
    --write-out "chaos_status=%{http_code} chaos_seconds=%{time_total}\n" \
    "$BASE_URL/chaos/latency" &
  latency_pid=$!

  sleep 0.2

  curl --silent --show-error \
    --output /dev/null \
    --write-out "health_status=%{http_code} health_seconds=%{time_total}\n" \
    "$BASE_URL/api/v2/health"

  wait "$latency_pid"
  echo "chaos_body=$(tr -d '\n' < "$LATENCY_BODY")"
} | tee "$OUTPUT"

rm -f "$LATENCY_BODY"
echo "Evidence: $OUTPUT"
