import { loadBenchmarks } from './data-loader.js';
import { renderSolverTime, renderSizeTrend, renderSuccessRate } from './charts.js';

let allData = [];
const charts = {};

init();

async function init() {
  allData = await loadBenchmarks();
  populateBenchmarks(allData);
  updateCharts();
}

function populateBenchmarks(data) {
  const select = document.getElementById('benchmark-select');
  const benchmarks = [...new Set(data.map(d => d.benchmark))].sort();
  select.innerHTML = `<option value="__all__">Tous</option>` + benchmarks.map(b => `<option value="${b}">${b}</option>`).join('');
  select.addEventListener('change', updateCharts);
}

function filteredData() {
  const val = document.getElementById('benchmark-select').value;
  if (!val || val === '__all__') return allData;
  return allData.filter(d => d.benchmark === val);
}

function updateCharts() {
  const data = filteredData();
  charts.solver = renderSolverTime(document.getElementById('chart-solver-time').getContext('2d'), data);
  charts.size = renderSizeTrend(document.getElementById('chart-size-trend').getContext('2d'), data);
  charts.success = renderSuccessRate(document.getElementById('chart-success-rate').getContext('2d'), data);
}