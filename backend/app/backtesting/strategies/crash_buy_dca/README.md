# Crash Buy DCA Strategy

A Dollar Cost Averaging (DCA) strategy that increases buying power during market crashes.

## Strategy Logic

This strategy combines regular DCA investing with opportunistic crash buying:

1. **Regular DCA**: Buys a base amount every month (configurable interval)
2. **Crash Detection**: Monitors both daily and weekly price drops
3. **Aggressive Buying**: When both thresholds are met, multiplies the investment amount

## Parameters

- `base_amount` (default: 100): Base investment amount for regular DCA purchases
- `crash_multiplier` (default: 3): Multiply investment by this factor during crashes
- `daily_crash_threshold` (default: 0.05): Daily drop percentage to trigger crash buying (5%)
- `weekly_crash_threshold` (default: 0.10): Weekly drop percentage to trigger crash buying (10%)
- `monthly_interval_days` (default: 30): Days between regular DCA purchases
- `commission` (default: 0.002): Trading commission (0.2%)
- `cash` (default: 100000): Initial cash amount

## How It Works

### Regular DCA Mode

- Buys `base_amount` worth of the asset every `monthly_interval_days`
- Simple buy-and-hold accumulation strategy

### Crash Buy Mode

When BOTH conditions are met:

- Daily drop >= `daily_crash_threshold` (e.g., 5%)
- Weekly drop >= `weekly_crash_threshold` (e.g., 10%)

The strategy buys `base_amount * crash_multiplier` worth of the asset.

## Example Scenarios

### Scenario 1: Normal Market

- Market is stable or slowly declining
- Strategy buys $100 every 30 days
- Total monthly investment: $100

### Scenario 2: Market Crash

- Market drops 6% today and 12% over the past week
- Strategy detects crash and buys $300 (3x multiplier)
- Resets the monthly timer, so next regular buy is in 30 days

### Scenario 3: Gradual Decline

- Market drops 3% today but only 8% over the week
- Thresholds not met (needs both)
- Strategy continues with regular $100 monthly buys

## Advantages

- Automatically increases exposure during significant market downturns
- Maintains discipline with regular DCA during normal conditions
- Requires both daily and weekly drops to avoid false signals
- Configurable thresholds and multipliers for different risk profiles

## Recommended Settings

**Conservative**:

- `crash_multiplier`: 2
- `daily_crash_threshold`: 0.07 (7%)
- `weekly_crash_threshold`: 0.15 (15%)

**Moderate** (default):

- `crash_multiplier`: 3
- `daily_crash_threshold`: 0.05 (5%)
- `weekly_crash_threshold`: 0.10 (10%)

**Aggressive**:

- `crash_multiplier`: 5
- `daily_crash_threshold`: 0.03 (3%)
- `weekly_crash_threshold`: 0.08 (8%)

## Notes

- Works best with daily timeframe data
- Requires sufficient cash reserves for crash buying opportunities
- The strategy never sells, only accumulates
- Consider your risk tolerance when setting the crash multiplier
