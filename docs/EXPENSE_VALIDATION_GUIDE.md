# Expense Validation Guide

## What is "Unit Tests" and "Prevent Regressions"?

**Unit Tests** = Automated code that checks if your calculations are correct
- Like a robot that tests your code automatically
- You write tests once, run them anytime to check for bugs
- Example: "Test that 2+2 = 4" ✅

**Prevent Regressions** = Stop bugs from coming back
- If you fix a bug today, tests will catch it if it breaks again tomorrow
- Like a safety net that catches mistakes

**But you don't need to install anything!** We've created a simpler solution for you.

---

## ✅ Simple Solution: Built-in Validator (No Installation Needed!)

We've added a **developer-only validation tool** that checks your calculations automatically.

### How to Use:

#### Method 1: Visual Debug Panel (Easiest)
1. Start your game in **development mode** (`npm run dev`)
2. While playing, press **`V`** key (or click the "🔍 Validate Expenses" button)
3. A panel will appear showing:
   - ✅ Green = All checks passed
   - ❌ Red = Errors found
   - ⚠️ Orange = Warnings

#### Method 2: Browser Console (More Details)
1. Open browser console (Press `F12` or `Cmd+Option+I`)
2. Type: `validateExpenses()`
3. Press Enter
4. Check the output - it will show:
   - Detailed errors (if any)
   - Warnings
   - All expense calculations

#### Method 3: Get Quick Details
In console, type: `getExpenseDetails()`
- Shows current month expenses
- Shows lifetime totals
- Shows history summary

---

## What Does It Check?

The validator automatically checks:

1. ✅ **One-time costs consistency**
   - Do the details match the totals?
   - Are paid costs tracked correctly?

2. ✅ **Lifetime vs History matching**
   - Does `metrics.totalExpenses` match what's in history?
   - Are immediate deductions included correctly?

3. ✅ **History entry correctness**
   - Does each month's expenses match what was deducted?
   - Are profit calculations correct?

4. ✅ **Data corruption detection**
   - Are there impossible values? (e.g., paid > total)

---

## Example Output

### ✅ Good (No Errors):
```
🔍 Expense Calculation Validation
✅ All checks passed!

📊 Details:
Current Month: {
  recurringExpenses: 500,
  oneTimeCostsTotal: 200,
  oneTimeCostsPaid: 100,
  oneTimeCostsUnpaid: 100
}
Lifetime: {
  totalRevenue: 5000,
  totalExpenses: 3000,
  profit: 2000
}
```

### ❌ Bad (Errors Found):
```
🔍 Expense Calculation Validation
❌ Errors found!

❌ Errors:
- Lifetime expenses mismatch: Expected 3000, but got 2800. Difference: 200
- One-time costs mismatch: Details sum (200) != Total (250)

⚠️ Warnings:
- Cash is negative (-100) but game is not over
```

---

## When to Use This?

- **After making changes** to expense calculation code
- **Before deploying** to production
- **When you suspect** calculations might be wrong
- **Regularly** during development (just press `V`)

---

## Optional: Adding Real Unit Tests (Advanced)

If you want formal unit tests later, you can:

1. **Install a test framework** (optional):
   ```bash
   npm install --save-dev vitest @testing-library/react
   ```

2. **Create test files** like `lib/utils/expenseValidator.test.ts`

3. **Run tests** with: `npm test`

**But you don't need this!** The built-in validator is enough for now.

---

## Quick Reference

| Action | How |
|--------|-----|
| Open validator panel | Press `V` key |
| Validate in console | Type `validateExpenses()` |
| Get quick details | Type `getExpenseDetails()` |
| Check for errors | Look for ❌ in output |
| Check for warnings | Look for ⚠️ in output |

---

## Troubleshooting

**Q: The validator shows errors, what do I do?**
- Check the error message - it tells you exactly what's wrong
- Look at the "Details" section to see the numbers
- Compare expected vs actual values

**Q: I don't see the validator button?**
- Make sure you're in **development mode** (`npm run dev`)
- The button only appears in dev, not production

**Q: Console says "validateExpenses is not defined"?**
- Make sure the game page is loaded
- Try refreshing the page
- The function is added when the ExpenseValidatorDebug component loads

---

## Summary

✅ **No installation needed** - it's built-in!  
✅ **Press `V`** to validate anytime  
✅ **Check console** for detailed output  
✅ **Automatic checks** - catches bugs before players see them  

This is simpler than unit tests but just as effective for catching calculation errors!



