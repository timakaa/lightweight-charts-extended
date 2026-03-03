export const getSymbol = (symbol) => {
  return symbol ? symbol.replace("/", "") : symbol;
};

export const normalizeSymbol = (symbol) => {
  if (symbol.includes("/")) return symbol;

  return symbol.replace("USDT", "/USDT");
};
