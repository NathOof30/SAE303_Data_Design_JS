export async function loadBenchmarks(path = './assets/data/data.json') {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Fetch error ${res.status}`);
  const json = await res.json();
  
  // Gérer la structure PHPMyAdmin export : chercher l'objet 'table' avec 'data'
  let rows = [];
  if (Array.isArray(json)) {
    // Si c'est un array, chercher l'objet avec type: 'table' et data
    const tableObj = json.find(item => item.type === 'table' && item.data);
    rows = tableObj ? tableObj.data : json;
  } else if (json.data && Array.isArray(json.data)) {
    rows = json.data;
  } else if (json.rows && Array.isArray(json.rows)) {
    rows = json.rows;
  }
  
  return rows.map(normalizeRecord);
}

function normalizeRecord(rec) {
  const lower = Object.fromEntries(Object.entries(rec).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    benchmark: lower.family || 'unknown',
    solver: lower.name || 'unknown',
    time: Number(lower.time ?? 0),
    status: traduceStatus(lower.status) || 'Inconnu',
    variables: Number(lower.nb_variables ?? 0),
    clauses: Number(lower.nb_clauses ?? 0),
  };
}

function traduceStatus(status) {
  if (!status || typeof status !== 'string') return 'Inconnu';
  const map = {
    SAT: 'Satisfaisant',
    UNSAT: 'Non satisfaisant',
    UNKNOWN: 'Inconnu',
  };
  const key = status.toUpperCase().trim();
  return map[key] || 'Inconnu';
}
