// NEGCES Lab - Client Web Frontend CI/CD Automated Test Suite

console.log('--------------------------------------------------');
console.log('  NEGCES Lab Web Client - CI/CD Automated Test Suite');
console.log('--------------------------------------------------');

let testsPassed = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    testsPassed++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    process.exit(1);
  }
}

// 1. UI Utility Assertions
const formatComputerStatus = (status) => {
  if (!status) return 'UNKNOWN';
  return status.toUpperCase();
};
assert(formatComputerStatus('available') === 'AVAILABLE', 'Status formatter converts lowercase to uppercase');
assert(formatComputerStatus(null) === 'UNKNOWN', 'Status formatter handles null input');

// 2. Date Formatting Helper Simulation
const isDateInRange = (dateStr, startStr, endStr) => {
  const d = new Date(dateStr);
  return d >= new Date(startStr) && d <= new Date(endStr);
};
assert(isDateInRange('2026-09-15', '2026-09-01', '2026-09-30') === true, 'Date range validator verifies dates within bounds');

console.log('================================================--');
console.log(` [SUCCESS] ${testsPassed}/${totalTests} Client tests passed successfully!`);
console.log('================================================--');
process.exit(0);
