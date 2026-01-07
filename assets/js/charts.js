const chartRefs = {};

// Fonction pour calculer la moyenne
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((total, num) => total + num, 0);
  const average = sum / numbers.length;
  return average;
}

// Fonction pour grouper par clé
function groupByKey(array, keyFunction) {
  const grouped = {};
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const key = keyFunction(item);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  }
  return grouped;
}

// Fonction pour compter par clé
function countByKey(array, keyFunction) {
  const counts = {};
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    const key = keyFunction(item);
    if (!counts[key]) {
      counts[key] = 0;
    }
    counts[key] = counts[key] + 1;
  }
  return counts;
}

// Générer couleur cohérente par nom
function generateColorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 65;
  const lightness = 50;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Détruire et recréer un graphique
function destroyAndCreate(chartKey, canvasContext, config) {
  if (chartRefs[chartKey]) {
    chartRefs[chartKey].destroy();
  }
  chartRefs[chartKey] = new Chart(canvasContext, config);
  return chartRefs[chartKey];
}

// Options communes pour stabilité
function getBaseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 400
    }
  };
}

// 1. Bar chart : Temps par solveur
export function renderSolverTime(ctx, data) {
  if (data.length === 0) {
    return destroyAndCreate('solverTime', ctx, {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: getBaseOptions()
    });
  }

  // Grouper par solveur
  const bySolver = groupByKey(data, item => item.solver);
  const solverNames = Object.keys(bySolver).sort();

  // Calculer temps moyen par solveur
  const averageTimes = [];
  for (let i = 0; i < solverNames.length; i++) {
    const solverName = solverNames[i];
    const solverData = bySolver[solverName];
    const times = solverData.map(item => item.time);
    const avgTime = calculateAverage(times);
    averageTimes.push(avgTime);
  }

  // Couleurs : vert pour meilleur, rouge pour pire
  const colors = averageTimes.map(time => {
    const minTime = Math.min(...averageTimes);
    const maxTime = Math.max(...averageTimes);
    if (time === minTime) return '#43A047'; // Vert
    if (time === maxTime) return '#e53935'; // Rouge
    return '#42A5F5'; // Bleu par défaut
  });

  const config = {
    type: 'bar',
    data: {
      labels: solverNames,
      datasets: [{
        label: 'Temps moyen (s)',
        data: averageTimes,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 6
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y;
              if (value >= 10000) {
                return 'Temps: ' + value.toFixed(0) + 's (timeout probable)';
              }
              return 'Temps: ' + value.toFixed(2) + 's';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Temps (secondes)' },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  };

  return destroyAndCreate('solverTime', ctx, config);
}

// 2. Line chart : Évolution temps vs variables
export function renderSizeTrend(ctx, data) {
  if (data.length === 0) {
    return destroyAndCreate('sizeTrend', ctx, {
      type: 'line',
      data: { datasets: [] },
      options: getBaseOptions()
    });
  }

  // Grouper par solveur
  const bySolver = groupByKey(data, item => item.solver);
  const solverNames = Object.keys(bySolver).sort();

  // Créer dataset par solveur
  const datasets = [];
  for (let i = 0; i < solverNames.length; i++) {
    const solverName = solverNames[i];
    const solverData = bySolver[solverName];

    // Trier par nombre de variables
    const sortedData = solverData.sort((a, b) => a.variables - b.variables);

    // Créer points {x: variables, y: time}
    const points = sortedData.map(item => ({
      x: item.variables,
      y: item.time
    }));

    const color = generateColorFromName(solverName);

    datasets.push({
      label: solverName,
      data: points,
      fill: false,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5
    });
  }

  const config = {
    type: 'line',
    data: { datasets: datasets },
    options: {
      ...getBaseOptions(),
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, padding: 10, font: { size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const solverName = context.dataset.label;
              const vars = context.parsed.x;
              const time = context.parsed.y;
              return solverName + ': ' + time.toFixed(2) + 's (' + vars + ' vars)';
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Nombre de variables' },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        y: {
          title: { display: true, text: 'Temps (s)' },
          grid: { color: 'rgba(0,0,0,0.05)' }
        }
      }
    }
  };

  return destroyAndCreate('sizeTrend', ctx, config);
}

// 3. Pie chart : Répartition SAT/UNSAT/UNKNOWN (graphique uniquement)
export function renderSuccessRate(ctx, data) {
  if (data.length === 0) {
    return destroyAndCreate('successRate', ctx, {
      type: 'pie',
      data: { labels: [], datasets: [] },
      options: getBaseOptions()
    });
  }

  // Compter les statuts originaux (SAT/UNSAT/UNKNOWN)
  const statusCounts = countByKey(data, item => item.status);

  const labelsOriginal = ['SAT', 'UNSAT', 'UNKNOWN'];
  const labelsTraduits = ['Satisfaisant', 'Insatisfaisant', 'Inconnu'];
  const values = [];
  const total = data.length;

  // Calculer les valeurs pour chaque statut
  for (let i = 0; i < labelsOriginal.length; i++) {
    const label = labelsOriginal[i];
    const count = statusCounts[label] || 0;
    values.push(count);
  }

  const colors = ['#43A047', '#e53935', '#fb8c00'];

  const config = {
    type: 'pie',
    data: {
      labels: labelsTraduits,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      ...getBaseOptions(),
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const percent = ((value / total) * 100).toFixed(1);
              return context.label + ': ' + value + ' (' + percent + '%)';
            }
          }
        }
      }
    }
  };

  return destroyAndCreate('successRate', ctx, config);
}

// 4. Légende personnalisée pour le pie chart (séparée du graphique)
export function renderSuccessLegend(data) {
  const legendContainer = document.getElementById('success-legend');

  if (data.length === 0) {
    legendContainer.innerHTML = '<p class="text-muted text-sm">Aucune donnée</p>';
    return;
  }

  // Compter les statuts originaux (SAT/UNSAT/UNKNOWN)
  const statusCounts = countByKey(data, item => item.status);

  const labelsOriginal = ['SAT', 'UNSAT', 'UNKNOWN'];
  const labelsTraduits = ['Satisfaisant', 'Insatisfaisant', 'Inconnu'];
  const colors = ['#43A047', '#e53935', '#fb8c00'];
  const total = data.length;

  let legendHTML = '';

  // Générer les bulles de légende
  for (let i = 0; i < labelsOriginal.length; i++) {
    const labelOriginal = labelsOriginal[i];
    const labelTraduit = labelsTraduits[i];
    const value = statusCounts[labelOriginal] || 0;
    const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    const color = colors[i];

    legendHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${color};"></div>
        <span class="legend-label">${labelTraduit}</span>
        <span class="legend-percent">${value} (${percent}%)</span>
      </div>
    `;
  }

  legendContainer.innerHTML = legendHTML;
}