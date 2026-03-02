"""
Symbol normalization utilities
Handles conversion between frontend display format and backend API format
"""


def normalize_symbol_for_display(symbol: str) -> str:
    """
    Convert backend symbol format to frontend display format
    BTC/USDT:USDT -> BTC/USDT
    BTC/USDT -> BTC/USDT
    
    Args:
        symbol: Backend symbol format
        
    Returns:
        Frontend display format
    """
    if ":" in symbol:
        return symbol.split(":")[0]
    return symbol


def normalize_symbol_for_api(symbol: str, market_type: str = "swap") -> str:
    """
    Convert frontend display format to backend API format
    BTC/USDT -> BTC/USDT:USDT (for swap/perpetual)
    BTCUSDT -> BTC/USDT:USDT (for swap/perpetual)
    BTC/USDT -> BTC/USDT (for spot)
    
    Only supports USDT quote currency.
    
    Args:
        symbol: Frontend display format (e.g., "BTC/USDT" or "BTCUSDT")
        market_type: Market type ("swap", "spot", etc.)
        
    Returns:
        Backend API format
    """
    symbol = symbol.upper()

    # If already has :, return as is
    if ":" in symbol:
        return symbol
    
    # Handle BTCUSDT format (no slash) - convert to BTC/USDT format first
    if "/" not in symbol:
        # Only support USDT quote currency
        if symbol.upper().endswith("USDT"):
            base = symbol[:-4]  # Remove "USDT"
            symbol = f"{base}/USDT"
    
    # For swap/perpetual markets, add :USDT suffix
    if market_type == "swap" and "/" in symbol:
        parts = symbol.split("/")
        if len(parts) == 2:
            quote = parts[1]
            return f"{symbol}:{quote}"
    
    return symbol


def is_perpetual_symbol(symbol: str) -> bool:
    """
    Check if symbol is a perpetual contract
    
    Args:
        symbol: Symbol to check
        
    Returns:
        True if perpetual, False otherwise
    """
    if ":" not in symbol:
        return False
    
    parts = symbol.split(":")
    # Perpetuals end with :USDT (no date)
    # Dated futures end with :USDT-YYMMDD
    return len(parts) == 2 and "-" not in parts[1]


def symbol_to_filename(symbol: str) -> str:
    """
    Convert symbol to safe filename format
    BTC/USDT:USDT -> BTCUSDT
    BTC/USDT -> BTCUSDT
    BTCUSDT -> BTCUSDT
    
    Args:
        symbol: Symbol in any format
        
    Returns:
        Safe filename string without special characters
    """
    # Remove everything after : (settlement currency)
    if ":" in symbol:
        symbol = symbol.split(":")[0]
    
    # Remove slashes
    symbol = symbol.replace("/", "")
    
    return symbol
