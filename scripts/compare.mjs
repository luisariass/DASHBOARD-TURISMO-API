#!/usr/bin/env node
/**
 * Compara las respuestas de FastAPI y de Nest endpoint por endpoint.
 *
 * Es el oráculo de la migración: mientras los dos den el mismo JSON para las
 * mismas peticiones, el contrato con el frontend está intacto. Sin esto la
 * migración se valida "a ojo", que es como se cuelan los cambios silenciosos.
 *
 * Uso:
 *   node scripts/compare.mjs
 *   node scripts/compare.mjs --old http://127.0.0.1:8000 --new http://127.0.0.1:8001
 *   node scripts/compare.mjs --dep Bolívar
 *
 * IMPORTANTE: levanta las dos APIs con el caché desactivado. En FastAPI el
 * caché tiene un bug de clave que devuelve datos de otro departamento, así que
 * con Redis de por medio el diff no significa nada.
 *   FastAPI: apaga Redis, o vacíalo entre corridas
 *   Nest:    CACHE_ENABLED=false
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback;
};

const OLD = flag('old', 'http://127.0.0.1:8000');
const NEW = flag('new', 'http://127.0.0.1:8001');
const ONLY = flag('only', null);

// Los mismos departamentos que ofrece el selector del dashboard
// (frontend/src/hooks/useApi.ts).
const DEPARTAMENTOS = flag('dep', null)
  ? [flag('dep', null)]
  : ['Atlántico', 'Bolívar', 'Córdoba', 'Sucre', 'Magdalena', 'La Guajira', 'Cesar'];

/**
 * Los 6 primeros son los que consume el dashboard, en el orden en que decidimos
 * migrarlos. Los 4 de después completan la paridad.
 */
function buildCases() {
  const cases = [];

  for (const dep of DEPARTAMENTOS) {
    const q = encodeURIComponent(dep);
    cases.push(
      { group: 'foursquare/municipios', path: `/foursquare/municipios?departamento=${q}` },
      { group: 'foursquare/sities', path: `/foursquare/sities?departamento=${q}&limit=100` },
      { group: 'foursquare/reviewers', path: `/foursquare/reviewers?departamento=${q}&limit=100` },
      { group: 'foursquare/tips', path: `/foursquare/tips?departamento=${q}&limit=100` },
      { group: 'foursquare/heatmap', path: `/foursquare/heatmap?departamento=${q}` },
      { group: 'google/sities_clean', path: `/google/sities_clean?departamento=${q}&limit=100` },
      { group: 'google/sities_full', path: `/google/sities_full?departamento=${q}&limit=100` },
    );
  }

  // Sin parámetros: se piden una sola vez.
  cases.push(
    { group: 'foursquare/categorias', path: '/foursquare/categorias' },
    { group: 'foursquare/municipios', path: '/foursquare/municipios' },
    { group: 'google/categorias', path: '/google/categorias' },
    { group: 'google/municipios', path: '/google/municipios' },
    { group: 'root', path: '/' },
  );

  // El filtro por municipio del heatmap se prueba con un caso conocido.
  cases.push({
    group: 'foursquare/heatmap',
    path: '/foursquare/heatmap?departamento=Bol%C3%ADvar&municipio=Cartagena',
  });

  return ONLY ? cases.filter((c) => c.group.includes(ONLY)) : cases;
}

/** Ordena las claves de los objetos recursivamente: el equivalente de jq -S. */
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeys(value[key]);
        return acc;
      }, {});
  }
  return value;
}

/** Ordena también los arrays, para distinguir "distinto" de "mismo desorden". */
function sortDeep(value) {
  if (Array.isArray(value)) {
    const items = value.map(sortDeep);
    return items
      .map((item) => ({ item, key: JSON.stringify(item) }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
      .map(({ item }) => item);
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortDeep(value[key]);
        return acc;
      }, {});
  }
  return value;
}

async function get(base, path) {
  try {
    const response = await fetch(`${base}${path}`);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: response.status, body };
  } catch (error) {
    return { status: 0, body: `ERROR DE RED: ${error.message}` };
  }
}

/** Devuelve las primeras rutas de un objeto donde los dos JSON difieren. */
function firstDifferences(a, b, path = '', found = []) {
  if (found.length >= 3) return found;

  if (JSON.stringify(a) === JSON.stringify(b)) return found;

  const bothObjects =
    a !== null && b !== null && typeof a === 'object' && typeof b === 'object';

  if (!bothObjects) {
    found.push(`${path || '(raíz)'}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
    return found;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    found.push(`${path}: uno es array y el otro no`);
    return found;
  }

  if (Array.isArray(a)) {
    if (a.length !== b.length) {
      found.push(`${path}.length: ${a.length} != ${b.length}`);
      return found;
    }
    for (let i = 0; i < a.length && found.length < 3; i++) {
      firstDifferences(a[i], b[i], `${path}[${i}]`, found);
    }
    return found;
  }

  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (found.length >= 3) break;
    if (!(key in a)) {
      found.push(`${path}.${key}: solo existe en la respuesta de Nest`);
      continue;
    }
    if (!(key in b)) {
      found.push(`${path}.${key}: solo existe en la respuesta de FastAPI`);
      continue;
    }
    firstDifferences(a[key], b[key], `${path}.${key}`, found);
  }

  return found;
}

const results = { identical: 0, orderOnly: 0, different: 0, failed: 0 };
const problems = [];

const cases = buildCases();
console.log(`Comparando ${cases.length} peticiones`);
console.log(`  FastAPI: ${OLD}`);
console.log(`  Nest:    ${NEW}\n`);

for (const testCase of cases) {
  const [oldResponse, newResponse] = await Promise.all([
    get(OLD, testCase.path),
    get(NEW, testCase.path),
  ]);

  const label = decodeURIComponent(testCase.path);

  if (oldResponse.status !== newResponse.status) {
    results.failed++;
    problems.push({
      label,
      kind: 'ESTADO',
      detail: `FastAPI ${oldResponse.status} vs Nest ${newResponse.status}`,
    });
    console.log(`✗ ESTADO   ${label}`);
    continue;
  }

  const strictEqual =
    JSON.stringify(sortKeys(oldResponse.body)) ===
    JSON.stringify(sortKeys(newResponse.body));

  if (strictEqual) {
    results.identical++;
    console.log(`✓ IGUAL    ${label}`);
    continue;
  }

  const sortedEqual =
    JSON.stringify(sortDeep(oldResponse.body)) ===
    JSON.stringify(sortDeep(newResponse.body));

  if (sortedEqual) {
    results.orderOnly++;
    console.log(`~ ORDEN    ${label}  (mismos datos, orden distinto)`);
    continue;
  }

  results.different++;
  const diffs = firstDifferences(newResponse.body, oldResponse.body);
  problems.push({ label, kind: 'DATOS', detail: diffs.join(' | ') });
  console.log(`✗ DISTINTO ${label}`);
  for (const diff of diffs) console.log(`             ${diff}`);
}

console.log('\n--- Resumen ---');
console.log(`  Idénticas:        ${results.identical}`);
console.log(`  Solo el orden:    ${results.orderOnly}`);
console.log(`  Datos distintos:  ${results.different}`);
console.log(`  Estado distinto:  ${results.failed}`);

if (problems.length > 0) {
  console.log('\nRevisar:');
  for (const problem of problems) {
    console.log(`  [${problem.kind}] ${problem.label}`);
    console.log(`      ${problem.detail}`);
  }
}

process.exit(results.different + results.failed > 0 ? 1 : 0);
