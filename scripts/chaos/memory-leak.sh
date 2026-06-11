#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CHAOS_TARGET_URL="${CHAOS_TARGET_URL:-$BASE_URL/appointments}"
CHAOS_KEY="${CHAOS_KEY:-change-this-key}"
EVIDENCE_DIR="${EVIDENCE_DIR:-docs/evidence/local}"
REQUESTS="${REQUESTS:-20}"
mkdir -p "$EVIDENCE_DIR"
OUTPUT="$EVIDENCE_DIR/memory-leak-$(date +%Y%m%d-%H%M%S).txt"

{
  echo "Scenario: retained memory"
  echo "Target: $CHAOS_TARGET_URL"
  echo "Requests: $REQUESTS"
  echo "Started: $(date -Iseconds)"

  curl --silent --show-error \
    --request DELETE \
    --header "x-chaos-key: $CHAOS_KEY" \
    "$BASE_URL/chaos/reset"
  echo

  for ((request_number = 1; request_number <= REQUESTS; request_number++)); do
    curl --silent --show-error \
      --output /dev/null \
      --header "x-chaos-key: $CHAOS_KEY" \
      --header "x-chaos-scenario: memory" \
      "$CHAOS_TARGET_URL"
  done

  curl --silent --show-error \
    --header "x-chaos-key: $CHAOS_KEY" \
    "$BASE_URL/chaos/status"
  echo
} | tee "$OUTPUT"

echo "Evidence: $OUTPUT"
