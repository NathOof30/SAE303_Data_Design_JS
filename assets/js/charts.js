const chartRefs = {};

export function renderSolverTime(ctx, data) {
  if (data.length === 0) return;
  const labels = [...new Set(data.map(d => d.solver))];
  const times = labels.map(s => average(data.filter(d => d.solver === s).map(d => d.time)));
  return createOrUpdate('solverTime', ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Temps (s)', data: times, backgroundColor: '#43A047' }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Temps (s)' } } }
    }
  });
}

export function renderSizeTrend(ctx, data) {
  if (data.length === 0) return;
  const bySolver = groupBy(data, d => d.solver);
  const datasets = Object.entries(bySolver).map(([solver, items]) => ({
    label: solver,
    data: items.sort((a, b) => a.variables - b.variables).map(d => ({ x: d.variables, y: d.time })),
    fill: false,
    borderColor: randomColor(solver),
    tension: 0.3
  }));
  return createOrUpdate('sizeTrend', ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Variables' } },
        y: { title: { display: true, text: 'Temps (s)' } }
      }
    }
  });
}

export function renderSuccessRate(ctx, data) {
  if (data.length === 0) return;
  const counts = countBy(data, d => d.status);
  const labels = ['Satisfaisant', 'Non satisfaisant', 'Inconnu'];
  const values = labels.map(l => counts[l] || 0);
  return createOrUpdate('successRate', ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values, backgroundColor: ['#43A047', '#e53935', '#fb8c00'] }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function createOrUpdate(key, ctx, config) {
  if (chartRefs[key]) chartRefs[key].destroy();
  chartRefs[key] = new Chart(ctx, config);
  return chartRefs[key];
}

function average(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function groupBy(arr, fn) { return arr.reduce((acc, item) => { const k = fn(item); (acc[k] ||= []).push(item); return acc; }, {}); }
function countBy(arr, fn) { return arr.reduce((acc, item) => { const k = fn(item); acc[k] = (acc[k] || 0) + 1; return acc; }, {}); }
function randomColor(key) {
  const hash = [...key].reduce((h, c) => h + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}