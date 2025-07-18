import { useMemo } from "react";

export const useDataProcessing = (accumulatedCandles) => {
  const combinedData = useMemo(() => {
    const allRealCandles = accumulatedCandles;
    let combined = allRealCandles;

    // TODO: Implement solution that doesn't require a lot of resourses
    // if (allRealCandles.length > 1) {
    //   const lastTimestamp = allRealCandles[allRealCandles.length - 1].time;
    //   let interval = allRealCandles[1].time - allRealCandles[0].time;

    //   if (interval > 0 && interval < 60 * 60 * 24 * 7) {
    //     const futureDataPoints = 3500;
    //     const whitespaceData = [];
    //     for (let i = 1; i <= futureDataPoints; i++) {
    //       whitespaceData.push({ time: lastTimestamp + i * interval });
    //     }
    //     combined = [...allRealCandles, ...whitespaceData];
    //   }
    // }

    return combined;
  }, [accumulatedCandles]);

  return combinedData;
};
