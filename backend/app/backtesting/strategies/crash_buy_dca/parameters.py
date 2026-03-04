"""
Parameter definitions and validation for crash buy DCA strategy
"""
from typing import Dict, Any


def get_default_parameters() -> Dict[str, Any]:
    """Default parameters for crash buying DCA"""
    return {
        "base_amount": 100,           # Base monthly investment amount
        "crash_multiplier": 3,        # Multiply investment by this during crashes
        "daily_crash_threshold": 0.05,  # 5% daily drop threshold
        "weekly_crash_threshold": 0.10, # 10% weekly drop threshold
        "monthly_interval_days": 30,  # Buy every N days normally
        "commission": 0.002,          # 0.2% commission per trade
        "cash": 1000000,               # Initial cash
    }


def get_parameter_schema() -> Dict[str, Any]:
    """
    Get parameter schema for UI form generation
    Returns metadata about each parameter for frontend display
    """
    defaults = get_default_parameters()

    return {
        "base_amount": {
            "type": "number",
            "label": "Base Amount",
            "description": "Base investment amount per interval",
            "default": defaults['base_amount'],
            "min": 1,
            "max": 10000,
            "step": 10
        },
        "crash_multiplier": {
            "type": "number",
            "label": "Crash Multiplier",
            "description": "Multiply investment by this during crashes",
            "default": defaults['crash_multiplier'],
            "min": 1,
            "max": 10,
            "step": 0.5
        },
        "daily_crash_threshold": {
            "type": "number",
            "label": "Daily Crash Threshold",
            "description": "Daily drop percentage to trigger crash buying (0.05 = 5%)",
            "default": defaults['daily_crash_threshold'],
            "min": 0.01,
            "max": 0.5,
            "step": 0.01
        },
        "weekly_crash_threshold": {
            "type": "number",
            "label": "Weekly Crash Threshold",
            "description": "Weekly drop percentage to trigger crash buying (0.10 = 10%)",
            "default": defaults['weekly_crash_threshold'],
            "min": 0.01,
            "max": 0.5,
            "step": 0.01
        },
        "monthly_interval_days": {
            "type": "integer",
            "label": "DCA Interval (Days)",
            "description": "Days between regular DCA purchases",
            "default": defaults['monthly_interval_days'],
            "min": 1,
            "max": 90,
            "step": 1
        },
        "commission": {
            "type": "number",
            "label": "Commission %",
            "description": "Commission per trade (0.002 = 0.2%)",
            "default": defaults['commission'],
            "min": 0,
            "max": 0.01,
            "step": 0.0001
        },
        "cash": {
            "type": "number",
            "label": "Initial Cash",
            "description": "Initial capital amount",
            "default": defaults['cash'],
            "min": 1000,
            "max": 1000000,
            "step": 1000
        }
    }


def validate_parameters(parameters: Dict[str, Any]) -> bool:
    """Validate parameters"""
    required_params = ["base_amount", "crash_multiplier", "daily_crash_threshold", 
                      "weekly_crash_threshold", "monthly_interval_days"]

    for param in required_params:
        if param not in parameters:
            print(f"❌ Missing required parameter: {param}")
            return False

    if parameters["base_amount"] <= 0:
        print(f"❌ Base amount must be greater than 0")
        return False

    if parameters["crash_multiplier"] < 1:
        print(f"❌ Crash multiplier must be >= 1")
        return False

    if parameters["daily_crash_threshold"] <= 0 or parameters["daily_crash_threshold"] >= 1:
        print(f"❌ Daily crash threshold must be between 0 and 1")
        return False

    if parameters["weekly_crash_threshold"] <= 0 or parameters["weekly_crash_threshold"] >= 1:
        print(f"❌ Weekly crash threshold must be between 0 and 1")
        return False

    return True


def format_strategy_fields(metrics: Dict[str, Any]) -> list:
    """Get formatted fields for UI display with subsections"""
    sections = []
    
    if not metrics:
        return sections
    
    crash_dca = metrics.get("crash_dca", {})
    regular_dca = metrics.get("regular_dca", {})
    
    # Crash DCA subsection
    if crash_dca:
        sections.append({
            "title": "Crash DCA",
            "fields": [
                {"label": "Total Invested", "value": f"${crash_dca.get('total_invested', 0):,.2f}"},
                {"label": "Final Value", "value": f"${crash_dca.get('final_value', 0):,.2f}", "color": "green"},
                {"label": "Total Return", "value": f"${crash_dca.get('total_return', 0):,.2f}", "color": "green" if crash_dca.get('total_return', 0) > 0 else "red"},
                {"label": "Return %", "value": f"{crash_dca.get('return_pct', 0):.2f}%", "color": "green" if crash_dca.get('return_pct', 0) > 0 else "red"},
                {"label": "Crash Buys", "value": str(crash_dca.get('crash_buys', 0))},
                {"label": "Regular Buys", "value": str(crash_dca.get('regular_buys', 0))},
                {"label": "Total Buys", "value": str(crash_dca.get('total_buys', 0))},
            ]
        })
    
    # Regular DCA subsection
    if regular_dca:
        sections.append({
            "title": "Regular DCA",
            "fields": [
                {"label": "Total Invested", "value": f"${regular_dca.get('total_invested', 0):,.2f}"},
                {"label": "Monthly Buys", "value": str(regular_dca.get('monthly_buys', 0))},
                {"label": "Final Value", "value": f"${regular_dca.get('final_value', 0):,.2f}", "color": "green"},
                {"label": "Total Return", "value": f"${regular_dca.get('total_return', 0):,.2f}", "color": "green" if regular_dca.get('total_return', 0) > 0 else "red"},
                {"label": "Return %", "value": f"{regular_dca.get('return_pct', 0):.2f}%", "color": "green" if regular_dca.get('return_pct', 0) > 0 else "red"},
            ]
        })
    
    return sections
