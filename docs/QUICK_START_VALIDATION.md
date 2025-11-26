# Quick Start: How to Check if Calculations are Wrong

## 🎯 TL;DR - Super Simple

**Just press `V` while playing the game!**

That's it! A panel will appear showing if there are any errors.

---

## 📋 What I Created For You

### 1. **Visual Validator** (Press `V` key)
- Shows errors/warnings in a panel
- Only visible in development mode
- No installation needed

### 2. **Console Validator** (Type in browser console)
- Open console (F12)
- Type: `validateExpenses()`
- See detailed results

### 3. **Quick Details** (Type in console)
- Type: `getExpenseDetails()`
- See all expense numbers

---

## 🚀 How to Use Right Now

1. **Start your game**: `npm run dev`
2. **Play the game** (or just load it)
3. **Press `V` key** (or click the button in bottom-left)
4. **Check the panel**:
   - ✅ Green = Everything is correct!
   - ❌ Red = Errors found (check console for details)
   - ⚠️ Orange = Warnings (usually OK, but check)

---

## 💡 What "Unit Tests" Means (Simple Explanation)

**Unit Tests** = Automated checks that run automatically
- Like a robot that tests your code
- You write tests once, they run forever
- Catches bugs before players see them

**But you don't need them!** The validator I created does the same thing, just simpler.

---

## 🔍 What Gets Checked?

The validator automatically checks:

1. ✅ Are one-time costs tracked correctly?
2. ✅ Do history entries match lifetime totals?
3. ✅ Are expenses calculated correctly?
4. ✅ Is there any data corruption?

---

## 📖 Full Guide

See `docs/EXPENSE_VALIDATION_GUIDE.md` for complete details.

---

## ✅ Summary

- **No installation needed** ✅
- **Just press `V`** ✅  
- **Works automatically** ✅
- **Shows errors clearly** ✅

You're all set! The validator will tell you if calculations are wrong.



