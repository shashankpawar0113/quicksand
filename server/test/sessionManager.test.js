import assert from 'assert';
import { sessionManager } from '../sessionManager.js';

console.log('🧪 Running SessionManager logic tests...');

// Test 1: Unique Code Generation
const code1 = sessionManager.generateUniqueCode();
assert.equal(code1.length, 6, 'Code must be 6 digits');
assert.ok(/^\d{6}$/.test(code1), 'Code must contain only digits');

// Test 2: Create Desktop Session
const session1 = sessionManager.createSession('socket_desktop_1');
assert.ok(session1.code, 'Session must have a code');
assert.equal(session1.state, 'waiting', 'New session state must be waiting');

// Test 3: Progressive Rate Limiting & Incorrect Code
const invalidAttempt = sessionManager.attemptJoinSession('999999', 'socket_mobile_1');
assert.equal(invalidAttempt.success, false, 'Invalid code must fail');

sessionManager.recordFailedAttempt(session1.code);
const failedAttemptResult = sessionManager.attemptJoinSession(session1.code, 'socket_mobile_1');
// Should enforce progressive delay if attempted immediately
assert.equal(failedAttemptResult.success, false, 'Progressive rate limiting must delay immediate retry');

// Wait 1.6s for cooldown to elapse
await new Promise((resolve) => setTimeout(resolve, 1600));

// Test 4: Successful Pairing & Code Destruction
const pairResult = sessionManager.attemptJoinSession(session1.code, 'socket_mobile_1');
assert.equal(pairResult.success, true, 'Valid code after cooldown must succeed');
assert.equal(pairResult.session.state, 'connected', 'Session state must transition to connected');

// Test 5: Strict Code Exclusivity (Consumed Code cannot be re-used)
const reuseAttempt = sessionManager.attemptJoinSession(session1.code, 'socket_mobile_2');
assert.equal(reuseAttempt.success, false, 'Consumed code cannot be reused by another device');

// Clean up
sessionManager.destroySession(session1.code);

console.log('✅ All SessionManager logic tests passed successfully!');
