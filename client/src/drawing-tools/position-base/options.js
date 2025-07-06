export const defaultOptions = {
  fillColor: "rgba(49, 121, 245, 0.31)", // profit zone (default blue)
  lossFillColor: "rgba(255, 255, 255, 0.14)", // loss zone (default white)
  previewFillColor: "rgba(33, 150, 243, 0.08)",
  entryLineColor: "#808080", // Color for the entry line
  entryLineTappedColor: "#808080", // Color for dashed line
  entryLineTappedDash: [6, 6], // dashed pattern
  handleFillColor: "#fff",
  handleStrokeColor: "#2196f3",
  handleStrokeWidth: 2,
  handleRadius: 5,
  showHandles: true,
  labelTextColor: "#fff",
  labelColor: "rgba(0, 100, 255, 1)",
  axisFillColor: "rgba(0, 100, 255, 0.4)",
  infoBoxTextColor: "#fff",
  infoBoxBackground: "#444",
  infoBoxFont: "14px Arial",
  priceLabelFormatter: (price) => price?.toFixed(2) ?? "",
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
};
