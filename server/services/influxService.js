const { InfluxDB, Point } = require('@influxdata/influxdb-client');

// Configuration constants for InfluxDB v3 core connection
const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8181';
const INFLUX_TOKEN = process.env.INFLUX_TOKEN || 'apiv3_token';
const INFLUX_ORG = process.env.INFLUX_ORG || 'negceslab';
const INFLUX_BUCKET = process.env.INFLUX_BUCKET || 'system_metrics';

let writeApi = null;
let influxDB = null;

try {
  influxDB = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
  // Default write options: flush every 5s or when batch size hits 50 points
  writeApi = influxDB.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, 'ns', {
    batchSize: 50,
    flushInterval: 5000,
    maxRetries: 3,
  });
  console.log(`[InfluxDB Service] Initialized connection pipeline to ${INFLUX_URL}`);
} catch (err) {
  console.error("[InfluxDB Service] Initialization warning:", err.message);
}

/**
 * Write a telemetry data point to InfluxDB
 */
const writeMetricPoint = (computerId, computerName, data, timestamp = new Date(), sessionInfo = {}) => {
  if (!writeApi) return;

  try {
    const point = new Point('system_metrics')
      .tag('computer_id', String(computerId))
      .tag('computer_name', String(computerName || 'System'))
      .tag('session_type', String(sessionInfo.sessionType || 'Idle'))
      .tag('is_checked_in', String(sessionInfo.checkedIn || false))
      .floatField('cpu_util', Number(data.cpu_util || data.cpuUtil || 0))
      .floatField('ram_util', Number(data.ram_util || data.ramUtil || 0))
      .floatField('gpu_util', Number(data.gpu_util || data.gpuUtil || 0))
      .floatField('gpu_mem_used', Number(data.gpu_mem_used || data.gpuMemUsed || 0))
      .floatField('gpu_mem_total', Number(data.gpu_mem_total || data.gpuMemTotal || 0))
      .floatField('net_sent_speed', Number(data.net_sent_speed || data.netSentSpeed || 0))
      .floatField('net_recv_speed', Number(data.net_recv_speed || data.netRecvSpeed || 0))
      .floatField('disk_util', Number(data.disk_util || data.diskUtil || 0))
      .floatField('cpu_temp', Number(data.cpu_temp || data.cpuTemp || 0))
      .floatField('gpu_temp', Number(data.gpu_temp || data.gpuTemp || 0))
      .timestamp(timestamp instanceof Date ? timestamp : new Date(timestamp));

    writeApi.writePoint(point);
  } catch (err) {
    console.error("[InfluxDB Service] Error writing point:", err.message);
  }
};

/**
 * Write batch of historical/queued metric points
 */
const writeMetricPointsBatch = (computerId, computerName, metricRecords) => {
  if (!writeApi || !Array.isArray(metricRecords)) return;
  metricRecords.forEach((record) => {
    writeMetricPoint(computerId, computerName, record.data || record, record.timestamp || new Date());
  });
};

/**
 * Query telemetry metrics from InfluxDB using Flux / HTTP engine
 */
const queryMetrics = async (computerId, startDate, endDate) => {
  if (!influxDB) return null;

  try {
    const queryApi = influxDB.getQueryApi(INFLUX_ORG);
    
    // Construct flux query range
    let startFilter = '-7d';
    if (startDate) {
      startFilter = new Date(startDate).toISOString();
    }
    
    let stopFilter = 'now()';
    if (endDate) {
      stopFilter = new Date(endDate).toISOString();
    }

    const fluxQuery = `
      from(bucket: "${INFLUX_BUCKET}")
        |> range(start: ${startFilter}, stop: ${stopFilter})
        |> filter(fn: (r) => r["_measurement"] == "system_metrics")
        |> filter(fn: (r) => r["computer_id"] == "${computerId}")
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
    `;

    const results = [];
    return new Promise((resolve) => {
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          results.push({
            timestamp: o._time,
            cpuUtil: o.cpu_util || 0,
            ramUtil: o.ram_util || 0,
            gpuUtil: o.gpu_util || 0,
            gpuMemUsed: o.gpu_mem_used || 0,
            gpuMemTotal: o.gpu_mem_total || 0,
            netSentSpeed: o.net_sent_speed || 0,
            netRecvSpeed: o.net_recv_speed || 0,
            diskUtil: o.disk_util || 0,
            cpuTemp: o.cpu_temp || 0,
            gpuTemp: o.gpu_temp || 0,
          });
        },
        error(err) {
          console.warn("[InfluxDB Service] Query error, falling back to MongoDB:", err.message);
          resolve(null);
        },
        complete() {
          resolve(results);
        },
      });
    });
  } catch (err) {
    console.warn("[InfluxDB Service] Query execution failed:", err.message);
    return null;
  }
};

module.exports = {
  writeMetricPoint,
  writeMetricPointsBatch,
  queryMetrics,
};
