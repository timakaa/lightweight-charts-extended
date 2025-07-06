import { ensureDefined } from "./assertions.js";

class PluginBase {
  constructor() {
    this._chart = undefined;
    this._series = undefined;
    this._requestUpdate = undefined;
  }

  // eslint-disable-next-line no-unused-vars
  dataUpdated(scope) {}

  requestUpdate() {
    if (this._requestUpdate) {
      this._requestUpdate();
    }
  }

  attached({ chart, series, requestUpdate }) {
    this._chart = chart;
    this._series = series;
    this._requestUpdate = requestUpdate;
    this._series.subscribeDataChanged(this._fireDataUpdated);
    this.requestUpdate();
  }

  detached() {
    this._series?.unsubscribeDataChanged(this._fireDataUpdated);
    this._chart = undefined;
    this._series = undefined;
    this._requestUpdate = undefined;
  }

  get chart() {
    return ensureDefined(this._chart);
  }

  get series() {
    return ensureDefined(this._series);
  }

  _fireDataUpdated = (scope) => {
    if (this.dataUpdated) {
      this.dataUpdated(scope);
    }
  };
}

export default PluginBase;
