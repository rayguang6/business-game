import test from 'node:test';
import assert from 'node:assert/strict';

import { endOfWeek, getWeeklyBaseExpenses } from './economy';

test('endOfWeek reflects higher expenses after upgrades increase weekly costs', () => {
  const baseWeeklyExpenses = getWeeklyBaseExpenses();
  const baseResult = endOfWeek(5000, 2000, baseWeeklyExpenses, 0);

  const upgradeDelta = 200;
  const upgradedWeeklyExpenses = baseWeeklyExpenses + upgradeDelta;
  const upgradedResult = endOfWeek(5000, 2000, upgradedWeeklyExpenses, 0);

  assert.equal(
    upgradedResult.totalExpenses,
    baseResult.totalExpenses + upgradeDelta,
    'total expenses should include the upgrade delta'
  );
  assert.equal(
    upgradedResult.profit,
    baseResult.profit - upgradeDelta,
    'profit should drop by the upgrade delta'
  );
  assert.equal(
    upgradedResult.additionalExpenses,
    upgradedWeeklyExpenses - baseWeeklyExpenses,
    'additional expenses should match the difference between upgraded and base expenses'
  );
});
