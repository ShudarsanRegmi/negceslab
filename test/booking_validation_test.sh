#!/bin/bash

# Booking System Validation Test Suite
# Lab hours: 8:30 - 17:30
# Test various edge cases and validation scenarios

API_URL="http://localhost:5000/api/bookings"
AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjZkZTQwZjA0ODgxYzZhMDE2MTFlYjI4NGE0Yzk1YTI1MWU5MTEyNTAiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbmVnY2VzLWxhYi10cmFja2luZyIsImF1ZCI6Im5lZ2Nlcy1sYWItdHJhY2tpbmciLCJhdXRoX3RpbWUiOjE3NTM0Mzg3NTYsInVzZXJfaWQiOiJCMzBKOVVpM3U3VDZoWlV1MHpkUW5yREQ0VGcyIiwic3ViIjoiQjMwSjlVaTN1N1Q2aFpVdTB6ZFFuckRENFRnMiIsImlhdCI6MTc1MzQ2MTUxMywiZXhwIjoxNzUzNDY1MTEzLCJlbWFpbCI6InVzZXIxQHVzZXIxLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ1c2VyMUB1c2VyMS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.hmPZwVXPLVuwCVQd-cZ3EMMUPbB2yNFILM4lvBw8RnkkHlj5IDyTRyk13BNUppoU6dCn749LVO_heKIniR4rBUUd8lN3C66t20nUYCM0s7IoWxj15JkvDaRzsQpIJax9M_fFSuih0PYUX0JjPV7W63h-7GkiCKa_i8lKpDasVOOeVKpuHDeaxrh6iLbUAa9ctBs0X57dg_gVrnYCJMFKY1L1Ar4IKmkZLJLPHSXxxxSNPK8fxEYZqsLCOBwHPAZrZADf8hhn9BtVYdqSTnM1dRUvp5KXkpG3x9Z_jZssD4paHKg502xgg99SSabKZYOc3eUze7unRZKr-Cp4-yEOpQ"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to make API call and check response
test_booking() {
    local test_name="$1"
    local payload="$2"
    local expected_status="$3"
    local description="$4"
    
    echo -e "\n${BLUE}Test: $test_name${NC}"
    echo -e "${YELLOW}Description: $description${NC}"
    echo "Payload: $payload"
    
    response=$(curl -s -w "\n%{http_code}" "$API_URL" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Referer: http://localhost:5173/" \
        -H "Accept: application/json, text/plain, */*" \
        -H "Content-Type: application/json" \
        --data-raw "$payload")
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    echo "HTTP Status: $http_code"
    echo "Response: $response_body"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "$http_code" == "$expected_status"* ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL - Expected status $expected_status, got $http_code${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "----------------------------------------"
}

echo "==================================================================="
echo "          BOOKING SYSTEM VALIDATION TEST SUITE"
echo "==================================================================="
echo "Lab Operating Hours: 08:30 - 17:30"
echo "Current Date: $(date '+%Y-%m-%d')"
echo "==================================================================="

# 1. DATE VALIDATION TESTS
echo -e "\n${BLUE}=== DATE VALIDATION TESTS ===${NC}"

# Test 1: Booking on previous date
test_booking "PAST_DATE" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-01-20","endDate":"2025-01-21","startTime":"08:30","endTime":"17:30","reason":"past date test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing past date","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Booking on a past date should be rejected"

# Test 2: Booking far in the future (if there's a limit)
test_booking "FUTURE_DATE_LIMIT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2026-12-31","endDate":"2027-01-01","startTime":"08:30","endTime":"17:30","reason":"far future test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing far future","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Booking too far in the future should be rejected (if limit exists)"

# Test 3: End date before start date
test_booking "INVALID_DATE_RANGE" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-07-30","endDate":"2025-07-29","startTime":"08:30","endTime":"17:30","reason":"invalid date range","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing invalid range","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"End date before start date should be rejected"

# 2. TIME VALIDATION TESTS
echo -e "\n${BLUE}=== TIME VALIDATION TESTS ===${NC}"

# Test 4: Booking before lab opening time
test_booking "BEFORE_LAB_HOURS" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-07-29","endDate":"2025-07-29","startTime":"07:00","endTime":"09:00","reason":"before lab hours","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing before hours","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Booking before lab opening hours (08:30) should be rejected"

# Test 5: Booking after lab closing time
test_booking "AFTER_LAB_HOURS" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-07-30","endDate":"2025-07-30","startTime":"16:00","endTime":"19:00","reason":"after lab hours","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing after hours","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Booking after lab closing hours (17:30) should be rejected"

# Test 6: End time before start time
test_booking "INVALID_TIME_RANGE" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-07-31","endDate":"2025-07-31","startTime":"15:00","endTime":"10:00","reason":"invalid time range","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing invalid time","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"End time before start time should be rejected"

# Test 7: Booking exactly at boundary times (should pass)
test_booking "BOUNDARY_TIMES_VALID" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-01","endDate":"2025-08-01","startTime":"08:30","endTime":"17:30","reason":"boundary times test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"testing boundary","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"Booking exactly at lab hours should be accepted"

# 3. FIELD VALIDATION TESTS
echo -e "\n${BLUE}=== FIELD VALIDATION TESTS ===${NC}"

# Test 8: Missing required fields
test_booking "MISSING_COMPUTER_ID" \
'{"startDate":"2025-08-02","endDate":"2025-08-02","startTime":"10:00","endTime":"15:00","reason":"missing computer id","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Missing computerId should be rejected"

# Test 9: Invalid computer ID
test_booking "INVALID_COMPUTER_ID" \
'{"computerId":"invalid-computer-id-123","startDate":"2025-08-03","endDate":"2025-08-03","startTime":"10:00","endTime":"15:00","reason":"invalid computer id","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Invalid computerId should be rejected"

# Test 10: Empty reason field
test_booking "EMPTY_REASON" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-04","endDate":"2025-08-04","startTime":"10:00","endTime":"15:00","reason":"","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Empty reason should be rejected"

# Test 11: Negative dataset size
test_booking "NEGATIVE_DATASET_SIZE" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-05","endDate":"2025-08-05","startTime":"10:00","endTime":"15:00","reason":"negative dataset test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":-5,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Negative dataset size should be rejected"

# Test 12: Invalid dataset type
test_booking "INVALID_DATASET_TYPE" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-06","endDate":"2025-08-06","startTime":"10:00","endTime":"15:00","reason":"invalid dataset type","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"InvalidType","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Invalid dataset type should be rejected"

# 4. GPU VALIDATION TESTS
echo -e "\n${BLUE}=== GPU VALIDATION TESTS ===${NC}"

# Test 13: GPU required but no memory specified
test_booking "GPU_NO_MEMORY" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-07","endDate":"2025-08-07","startTime":"10:00","endTime":"15:00","reason":"gpu no memory","requiresGPU":true,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"GPU required but no memory specified should be rejected"

# Test 14: Excessive GPU memory request
test_booking "EXCESSIVE_GPU_MEMORY" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-08","endDate":"2025-08-08","startTime":"10:00","endTime":"15:00","reason":"excessive gpu memory","requiresGPU":true,"gpuMemoryRequired":999999,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Excessive GPU memory request should be rejected"

# 5. EDGE CASE TESTS  
echo -e "\n${BLUE}=== EDGE CASE TESTS ===${NC}"

# Test 15: Very long reason field
test_booking "LONG_REASON_FIELD" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-09","endDate":"2025-08-09","startTime":"10:00","endTime":"15:00","reason":"'$(printf 'A%.0s' {1..1000})'","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Extremely long reason field should be handled properly"

# Test 16: Invalid JSON structure
test_booking "MALFORMED_JSON" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-10","endDate":"2025-08-10","startTime":"10:00","endTime":"15:00","reason":"malformed json test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"' \
"400" \
"Malformed JSON should be rejected"

# Test 17: SQL Injection attempt in reason field
test_booking "SQL_INJECTION_ATTEMPT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-11","endDate":"2025-08-11","startTime":"10:00","endTime":"15:00","reason":"test; DROP TABLE bookings; --","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"SQL injection attempt should be sanitized but booking might succeed"

# Test 18: XSS attempt in problem statement
test_booking "XSS_ATTEMPT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-12","endDate":"2025-08-12","startTime":"10:00","endTime":"15:00","reason":"xss test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"<script>alert(\"xss\")</script>","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"XSS attempt should be sanitized but booking might succeed"

# 6. CONFLICTING BOOKINGS TEST
echo -e "\n${BLUE}=== CONFLICT DETECTION TESTS ===${NC}"

# Test 19: Create a valid booking first (Monday - avoiding Sunday)
test_booking "VALID_BOOKING_FOR_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"10:00","endTime":"12:00","reason":"valid booking for conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"Valid booking to test conflicts"

# Test 20: Exact same time slot conflict
test_booking "EXACT_TIME_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"10:00","endTime":"12:00","reason":"exact time conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Exact same time slot should be rejected"

# Test 21: Overlapping start time conflict
test_booking "OVERLAPPING_START_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"09:30","endTime":"11:00","reason":"overlapping start conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Overlapping start time should be rejected"

# Test 22: Overlapping end time conflict
test_booking "OVERLAPPING_END_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"11:00","endTime":"13:00","reason":"overlapping end conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Overlapping end time should be rejected"

# Test 23: Completely contained within existing booking
test_booking "CONTAINED_WITHIN_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"10:30","endTime":"11:30","reason":"contained within conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Booking contained within existing slot should be rejected"

# Test 24: Completely contains existing booking
test_booking "CONTAINS_EXISTING_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"09:00","endTime":"13:00","reason":"contains existing conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Booking that contains existing slot should be rejected"

# Test 25: Adjacent booking (end time = start time) - should be allowed
test_booking "ADJACENT_BOOKING_BEFORE" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"08:30","endTime":"10:00","reason":"adjacent booking before test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"Adjacent booking (before) should be allowed"

# Test 26: Adjacent booking (start time = end time) - should be allowed
test_booking "ADJACENT_BOOKING_AFTER" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-25","startTime":"12:00","endTime":"14:00","reason":"adjacent booking after test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"Adjacent booking (after) should be allowed"

# Test 27: Valid booking on different date (no conflict)
test_booking "VALID_NON_CONFLICTING" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-26","endDate":"2025-08-26","startTime":"14:00","endTime":"16:00","reason":"valid non-conflicting booking","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"201" \
"Non-conflicting booking on different date should succeed"

# Test 28: Multi-day booking with conflict
test_booking "MULTI_DAY_CONFLICT" \
'{"computerId":"68835a7f2a9758dd26f1ac97","startDate":"2025-08-25","endDate":"2025-08-26","startTime":"11:00","endTime":"13:00","reason":"multi-day conflict test","requiresGPU":false,"gpuMemoryRequired":0,"problemStatement":"test","datasetType":"Video","datasetSize":{"value":23,"unit":"GB"},"datasetLink":"test","bottleneckExplanation":"test"}' \
"400" \
"Multi-day booking with conflict should be rejected"

# SUMMARY REPORT
echo -e "\n\n${BLUE}=================================================================${NC}"
echo -e "${BLUE}                    TEST EXECUTION SUMMARY${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo -e "Total Tests Run: ${YELLOW}$TOTAL_TESTS${NC}"
echo -e "Tests Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Your backend validation is robust.${NC}"
else
    echo -e "\n${RED}⚠️  Some tests failed. Review the validation logic for failed test cases.${NC}"
fi

SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
echo -e "Success Rate: ${YELLOW}$SUCCESS_RATE%${NC}"

echo -e "\n${BLUE}=================================================================${NC}"
echo -e "${BLUE}                    VALIDATION RECOMMENDATIONS${NC}"
echo -e "${BLUE}=================================================================${NC}"
echo "1. ✅ Ensure all date validations reject past dates"
echo "2. ✅ Verify time validations enforce lab hours (08:30-17:30)"
echo "3. ✅ Check that conflicting bookings are properly detected"
echo "4. ✅ Validate all required fields are present and non-empty"
echo "5. ✅ Sanitize user inputs to prevent XSS/SQL injection"
echo "6. ✅ Implement proper error messages for each validation case"
echo "7. ✅ Consider rate limiting to prevent booking spam"
echo "8. ✅ Validate computer availability and existence"
echo "9. ✅ Implement proper GPU resource validation"
echo "10. ✅ Add logging for security-related validation failures"

echo -e "\n${GREEN}Test completed at: $(date)${NC}"
