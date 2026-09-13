# Expense Management Skill

## Purpose

Manage user's expense records.

## Capabilities

This skill can:

- Add an expense
- Review expenses
- Calculate expense totals

## Add Expense

When the user wants to record an expense:

1. Identify the expense name.
2. Identify the amount.
3. Validate that the amount is a positive number.
4. Call `addExpense`.
5. Confirm the result to the user.

Example:

User:
"I spent 500 on dinner."

Interpretation:

name = "dinner"
amount = 500

Tool:

addExpense({
  name: "dinner",
  amount: 500
})

## Important Rules

- Never invent an amount.
- Ask for clarification if the amount is missing.
- Do not modify an existing expense unless the user explicitly requests it.