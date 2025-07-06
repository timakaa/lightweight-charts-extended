## Drawing Tools Options

Each drawing tool has its own set of options and properties. Below are the specifications for each type:

### Rectangle

```typescript
{
  type: "rectangle";
  id?: string; // Optional unique identifier
  ticker: string;
  startTime: string | "relative"; // ISO timestamp or "relative"
  endTime: string | "relative"; // ISO timestamp or "relative"
  startPrice: number;
  endPrice: number;
}
```

### Line

```typescript
{
  type: "line";
  id?: string; // Optional unique identifier
  ticker: string;
  startTime: string | "relative"; // ISO timestamp or "relative"
  endTime: string | "relative"; // ISO timestamp or "relative"
  startPrice: number;
  endPrice: number;
}
```

### Long Position

```typescript
{
  type: "long_position";
  id?: string; // Optional unique identifier
  ticker: string;
  entry: {
    time: string | "relative"; // ISO timestamp or "relative"
    price: number;
  }
  target: {
    time: string | "relative"; // ISO timestamp or "relative"
    price: number;
  }
  stop: {
    time: string | "relative"; // ISO timestamp or "relative"
    price: number;
  }
}
```

### Short Position

```typescript
{
  type: "short_position";
  id?: string; // Optional unique identifier
  ticker: string;
  entry: {
    time: string | "relative"; // ISO timestamp or "relative"
    price: number;
  }
  target: {
    time: string | "relative"; // ISO timestamp or "relative"
    price: number;
  }
  stop: {
    time: string | "relative"; // ISO timestamp or "relative"
    price: number;
  }
}
```

### Fibonacci Retracement

```typescript
{
  type: "fib_retracement";
  id?: string; // Optional unique identifier
  ticker: string;
  startTime: string | "relative"; // ISO timestamp or "relative"
  endTime: string | "relative"; // ISO timestamp or "relative"
  startPrice: number;
  endPrice: number;
}
```

Notes:

- All timestamps should be in ISO 8601 format (e.g., "2025-05-21T16:00:00Z")
- "relative" endTime means the drawing will extend to the latest candle + 10 candles forward
- Prices should be provided as decimal numbers
- Colors can be specified in hex format (#RRGGBB) or rgba format for transparency
- If `id` is not provided, a unique identifier will be generated automatically
- Providing an `id` is useful for managing drawings programmatically (e.g., updating or deleting specific drawings)
