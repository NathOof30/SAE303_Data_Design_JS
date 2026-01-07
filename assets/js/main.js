import { loadBenchmarks } from './data-loader.js';
import { renderSolverTime, renderSizeTrend, renderSuccessRate } from './charts.js';

let allData = [];
const charts = {};

// Démarrer l'application
init();

async function init() {
  try {
    allData = await loadBenchmarks();
    fillBenchmarkSelect(allData);
    refreshAllVisualisations();
  } catch (error) {
    console.error('Erreur chargement données:', error);
    alert('Impossible de charger les données. Vérifiez le fichier data.json.');
  }
}

// Remplir le select avec les benchmarks disponibles
function fillBenchmarkSelect(data) {
  const selectElement = document.getElementById('benchmark-select');
  
  // Extraire liste unique des benchmarks
  const benchmarkSet = new Set();
  for (let i = 0; i < data.length; i++) {
    benchmarkSet.add(data[i].benchmark);
  }
  
  const benchmarkList = Array.from(benchmarkSet).sort();
  
  // Créer les options
  let optionsHTML = '<option value="__all__">Tous les benchmarks</option>';
  for (let i = 0; i < benchmarkList.length; i++) {
    const benchmark = benchmarkList[i];
    optionsHTML += `<option value="${benchmark}">${benchmark}</option>`;
  }
  
  selectElement.innerHTML = optionsHTML;
  
  // Écouter les changements
  selectElement.addEventListener('change', function() {
    refreshAllVisualisations();
  });
}

// Obtenir les données filtrées
function getFilteredData() {
  const selectElement = document.getElementById('benchmark-select');
  const selectedValue = selectElement.value;
  
  if (selectedValue === '__all__') {
    return allData;
  }
  
  // Filtrer par benchmark
  const filtered = [];
  for (let i = 0; i < allData.length; i++) {
    const item = allData[i];
    if (item.benchmark === selectedValue) {
      filtered.push(item);
    }
  }
  
  return filtered;
}

// Calculer statistiques globales
function calculateStatistics(data) {
  if (data.length === 0) {
    return {
      bestSolver: '-',
      bestTime: '-',
      worstSolver: '-',
      worstTime: '-',
      avgTime: '-',
      totalTests: '-',
      failureRate: '-'
    };
  }

  // Grouper par solveur
  const bySolver = {};
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const solverName = item.solver;
    
    if (!bySolver[solverName]) {
      bySolver[solverName] = [];
    }
    
    bySolver[solverName].push(item.time);
  }

  // Calculer moyenne par solveur
  const solverAverages = [];
  const solverNames = Object.keys(bySolver);
  
  for (let i = 0; i < solverNames.length; i++) {
    const solverName = solverNames[i];
    const times = bySolver[solverName];
    
    let sum = 0;
    for (let j = 0; j < times.length; j++) {
      sum += times[j];
    }
    
    const average = sum / times.length;
    
    solverAverages.push({
      name: solverName,
      avg: average
    });
  }

  // Trier pour trouver meilleur/pire
  solverAverages.sort((a, b) => a.avg - b.avg);

  const bestSolver = solverAverages[0].name;
  const bestTime = solverAverages[0].avg.toFixed(2) + 's';

  const worstSolver = solverAverages[solverAverages.length - 1].name;
  const worstTime = solverAverages[solverAverages.length - 1].avg.toFixed(2) + 's';

  // Temps moyen global
  let totalTime = 0;
  for (let i = 0; i < data.length; i++) {
    totalTime += data[i].time;
  }
  const avgTime = (totalTime / data.length).toFixed(2) + 's';

  // Taux d'échec (UNKNOWN)
  let unknownCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].status === 'UNKNOWN') {
      unknownCount++;
    }
  }
  const failureRate = ((unknownCount / data.length) * 100).toFixed(1) + '%';

  return {
    bestSolver: bestSolver,
    bestTime: bestTime,
    worstSolver: worstSolver,
    worstTime: worstTime,
    avgTime: avgTime,
    totalTests: data.length + ' tests',
    failureRate: failureRate
  };
}

// Mettre à jour les cards statistiques
function updateStatisticsCards(stats) {
  document.getElementById('stat-best-solver').textContent = stats.bestSolver;
  document.getElementById('stat-best-time').textContent = stats.bestTime;
  
  document.getElementById('stat-worst-solver').textContent = stats.worstSolver;
  document.getElementById('stat-worst-time').textContent = stats.worstTime;
  
  document.getElementById('stat-avg-time').textContent = stats.avgTime;
  document.getElementById('stat-total-tests').textContent = stats.totalTests;
  
  document.getElementById('stat-failure-rate').textContent = stats.failureRate;
}

// Rafraîchir toutes les visualisations
function refreshAllVisualisations() {
  const filteredData = getFilteredData();
  
  // Mettre à jour statistiques
  const stats = calculateStatistics(filteredData);
  updateStatisticsCards(stats);
  
  // Mettre à jour graphiques
  const ctx1 = document.getElementById('chart-solver-time').getContext('2d');
  const ctx2 = document.getElementById('chart-size-trend').getContext('2d');
  const ctx3 = document.getElementById('chart-success-rate').getContext('2d');
  
  charts.solver = renderSolverTime(ctx1, filteredData);
  charts.size = renderSizeTrend(ctx2, filteredData);
  charts.success = renderSuccessRate(ctx3, filteredData);
}