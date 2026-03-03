"""
Chart generation and database updates
"""
from typing import Dict, Any, List


def generate_and_save_charts(
    strategy_instance: Any,
    backtest_id: int,
    results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate charts and update database with chart references
    
    Args:
        strategy_instance: Strategy instance
        backtest_id: Backtest ID
        results: Results dictionary
        
    Returns:
        Updated results dictionary with chart_images
    """
    print(f"\n📊 Generating charts...")
    chart_keys = strategy_instance.generate_charts(backtest_id)
    
    if chart_keys:
        results["chart_images"] = chart_keys
        print(f"✓ Generated {len(chart_keys)} chart(s)")
        
        # Update database with chart URLs
        from app.db.database import SessionLocal
        from app.models.backtest_results import BacktestResult
        
        db = SessionLocal()
        try:
            backtest = db.query(BacktestResult).filter(BacktestResult.id == backtest_id).first()
            if backtest:
                backtest.chart_images = chart_keys
                db.commit()
                print(f"✓ Saved chart references to database")
        except Exception as e:
            print(f"✗ Failed to update chart references: {e}")
        finally:
            db.close()
    else:
        print(f"ℹ No charts generated")
    
    return results
