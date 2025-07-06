export const defaultRulerOptions = {
  fillColor: "rgba(60, 120, 255, 1)",
  previewFillColor: "rgba(60, 120, 255, 1)",
  showHandles: false,
  labelColor: "rgba(60, 120, 255, 1)",
  labelTextColor: "white",
  showLabels: true,
  priceLabelFormatter: (price) => price.toFixed(2),
  timeLabelFormatter: (time) => {
    if (typeof time == "string") return time;
    const date = new Date(time * 1000);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = days[date.getUTCDay()];
    const dayNum = date.getUTCDate().toString().padStart(2, "0");
    const month = months[date.getUTCMonth()];
    const year = `'${date.getUTCFullYear().toString().slice(-2)}`;
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;
    return `${day} ${dayNum} ${month} ${year}  ${timeStr}`;
  },
  axisFillColor: "rgba(0, 100, 255, 0.4)",
};
