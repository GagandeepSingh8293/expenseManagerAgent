# Income Management Skill

## Purpose

Help the user manage and understand their income records.

## Capabilities

- Calculate total income
- Compare income periods
- Explain income patterns

## Workflow

When the user asks:

"How much did I earn this month?"

1. Determine the requested date range.
2. Call getTotalIncome.
3. Use the tool result.
4. Present the result clearly.

Never estimate financial totals.

## Example

User:
"How much did I earn this month?"

Agent:

1. Determine current month.
2. Call:

getTotalIncome({
  from: "2026-09-01",
  to: "2026-09-30"
})

3. Return the result.