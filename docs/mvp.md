# ThinkTwice MVP Scope

_Status: approved. Last updated: 2026-10-22._

## MVP goal
A user can sign up, log a purchase in seconds, see how much of their spending is essential versus discretionary, and get a supportive "at this pace…" forecast of where each spending habit is heading by the end of the month.

## v1: must have

### 1. Accounts
- Sign up, sign in and sign out with email and password (Firebase Auth).
- Password reset by email.
- Delete account, which permanently deletes all of the user's data.

### 2. Expense entry
- Log an expense with an amount, a category, a date (defaults to today) and an optional note.
- Logging a typical expense takes 3 taps or fewer after opening the app.
- Edit and delete expenses.
- Manual entry only. No bank connection.

### 3. Categories
- A default set of categories, each marked **essential** or **discretionary**:
  - Essential: Rent/Housing, Utilities, Groceries, Fuel, Transportation, Health
  - Discretionary: Coffee, Snacks & Drinks, Dining Out, Entertainment, Shopping
  - Other (the user chooses which type)
- Users can add, rename or hide categories and change their type.

### 4. Dashboard
- Total spent so far this month.
- Essential vs. discretionary split.
- Top discretionary categories this month.
- Recent expenses.

### 5. Forecasts
- For each category, a month-end projection based on the current pace, e.g. "You've spent $35 on coffee this week. At this pace, that's about $140 this month."
- Calculated by the Python ML service using simple statistical methods (spending pace and recent averages) at first.
- Shown only when there is enough data to be meaningful (e.g. at least 3 expenses in a category).

### 6. Insights
- At most one insight on the dashboard at a time, so the user is never overwhelmed.
- Always supportive and never shaming, along the lines of "maybe don't do that."

### 7. Monthly budget
- An optional overall monthly budget.
- Shows the projected month-end total compared with the budget.

### 8. Platforms
- Works on iOS, Android and the web (thinktwice.site).

## v1.1: next
- **Recurring habit detection:** ML spots repeated purchases (e.g. coffee every weekday) and shows what the habit costs per month.
- **Category spending limits:** set limits per category, with gentle warnings before a limit is exceeded.
- **Budget recommendations:** practical suggestions for adjusting the monthly budget.
- **Nutrition awareness:** highlight patterns in snack, energy drink and dining-out spending.
- **Trends:** charts of spending over weeks and months.

## Later
- Bank connection through Plaid.
- Vehicle profile and fuel-stop/fuel-cost predictions.
- Reminders and notifications (opt-in, few and gentle).
- Export data to CSV.

## Out of scope
- Investing, credit scores and loans.
- Shared or household budgets.
- Multiple currencies (USD only).
- Languages other than English.

## Done when
- Every v1 feature works on iOS, Android and the web.
- All project rules in `CLAUDE.md` are met, including the security tests required by rule 13.
- The app replaces the previous version at thinktwice.site and can be installed on a phone.
