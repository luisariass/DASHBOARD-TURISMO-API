import { buildCacheKey } from './cache-key';

describe('buildCacheKey', () => {
  it('genera claves distintas para departamentos distintos', () => {
    // Este es exactamente el bug de la versión FastAPI: con la clave derivada
    // solo de **kwargs, estas dos peticiones colisionaban y la segunda devolvía
    // los datos de la primera durante todo el TTL.
    const bolivar = buildCacheKey('/foursquare/sities', {
      departamento: 'Bolívar',
      limit: 100,
    });
    const atlantico = buildCacheKey('/foursquare/sities', {
      departamento: 'Atlántico',
      limit: 100,
    });

    expect(bolivar).not.toEqual(atlantico);
  });

  it('distingue el municipio en heatmap', () => {
    const sinMunicipio = buildCacheKey('/foursquare/heatmap', {
      departamento: 'Bolívar',
    });
    const conMunicipio = buildCacheKey('/foursquare/heatmap', {
      departamento: 'Bolívar',
      municipio: 'Cartagena',
    });

    expect(sinMunicipio).not.toEqual(conMunicipio);
  });

  it('no depende del orden de los parámetros en la URL', () => {
    const a = buildCacheKey('/foursquare/sities', {
      departamento: 'Sucre',
      limit: 50,
    });
    const b = buildCacheKey('/foursquare/sities', {
      limit: 50,
      departamento: 'Sucre',
    });

    expect(a).toEqual(b);
  });

  it('separa rutas distintas con los mismos parámetros', () => {
    const foursquare = buildCacheKey('/foursquare/sities', {
      departamento: 'Cesar',
    });
    const google = buildCacheKey('/google/sities_clean', {
      departamento: 'Cesar',
    });

    expect(foursquare).not.toEqual(google);
  });

  it('trata el parámetro vacío como ausente', () => {
    const vacio = buildCacheKey('/foursquare/heatmap', {
      departamento: 'Córdoba',
      municipio: '',
    });
    const ausente = buildCacheKey('/foursquare/heatmap', {
      departamento: 'Córdoba',
    });

    expect(vacio).toEqual(ausente);
  });
});
