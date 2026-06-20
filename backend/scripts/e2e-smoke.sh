#!/usr/bin/env bash
# End-to-end smoke test against a running backend on :3001
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3001}"
API="$BASE/api/v1"

echo "== Health =="
curl -sf "$BASE/health" | python3 -m json.tool >/dev/null
echo "OK"

echo "== List patients =="
PATIENTS=$(curl -sf "$API/patients")
COUNT=$(echo "$PATIENTS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
test "$COUNT" -ge 4
echo "OK ($COUNT patients)"

echo "== Search Margaret Chen =="
curl -sf "$API/patients?q=Chen" | python3 -c "
import json,sys
d=json.load(sys.stdin)
assert len(d)==1 and d[0]['name']=='Margaret Chen'
print('OK')
"

echo "== Chart entries =="
curl -sf "$API/patients/pat_001/chart-entries?windowDays=730" | python3 -c "
import json,sys
d=json.load(sys.stdin)
assert len(d['entries'])>=5
print(f\"OK ({len(d['entries'])} entries)\")
"

echo "== AI referral from chart (pat_001) =="
REF=$(curl -sf -X POST "$API/referrals/from-chart" \
  -H 'Content-Type: application/json' \
  -d '{"patientId":"pat_001","chartWindowDays":730}')
REF_ID=$(echo "$REF" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])")
SPECIALTY=$(echo "$REF" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['latestPrediction']['specialty'])")
echo "OK (referral $REF_ID → $SPECIALTY)"

echo "== Specialist matches =="
MATCHES=$(curl -sf "$API/referrals/$REF_ID/specialist-matches")
MATCH_COUNT=$(echo "$MATCHES" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['matches']))")
test "$MATCH_COUNT" -ge 1
echo "OK ($MATCH_COUNT matches)"

SPEC_ID=$(echo "$MATCHES" | python3 -c "import json,sys; print(json.load(sys.stdin)['matches'][0]['specialist']['id'])")

echo "== Preview referral =="
curl -sf -X POST "$API/referrals/$REF_ID/preview" >/dev/null
echo "OK"

echo "== Select specialist + send =="
curl -sf -X POST "$API/referrals/$REF_ID/select-specialist" \
  -H 'Content-Type: application/json' \
  -d "{\"specialistId\":\"$SPEC_ID\"}" >/dev/null
SENT=$(curl -sf -X POST "$API/referrals/$REF_ID/send")
STATUS=$(echo "$SENT" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])")
test "$STATUS" = "sent"
echo "OK (status=$STATUS)"

echo ""
echo "All E2E checks passed."
