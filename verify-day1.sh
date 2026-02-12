#!/bin/bash

echo "=================================="
echo "Day 1 Final Verification"
echo "=================================="
echo ""

# Check HIBP
if grep -q "HIBP_API_KEY=8eebf2d43593456caf09d27542a0ac38" .env; then
  echo "✅ HIBP API key: CONFIGURED"
else
  echo "❌ HIBP API key: MISSING"
fi

# Check packages
if npm list hibp 2>/dev/null | grep -q "hibp@"; then
  echo "✅ hibp package: INSTALLED"
else
  echo "❌ hibp package: NOT INSTALLED"
fi

# Check test
if [ -f "test-hibp-api.js" ]; then
  echo "✅ Test script: CREATED"
else
  echo "❌ Test script: MISSING"
fi

# Check directories
if [ -d "src/lib/services" ]; then
  echo "✅ Services directory: CREATED"
else
  echo "❌ Services directory: MISSING"
fi

if [ -d "tests" ]; then
  echo "✅ Tests directory: CREATED"
else
  echo "❌ Tests directory: MISSING"
fi

echo ""
echo "=================================="
echo "Status: Ready for Day 2? ✅"
echo "=================================="
echo ""
echo "PhishTank: Registration disabled (not critical)"
echo "OTX: Optional (can add anytime)"
echo ""
echo "Next: Run 'node test-hibp-api.js' to verify API"
