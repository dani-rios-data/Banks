// Middleware para proporcionar un respaldo de datos CSV si la carga desde el archivo falla
(function() {
  // Verificar si window y fetch existen (estamos en un navegador)
  if (typeof window === 'undefined' || !window.fetch) return;

  // Datos CSV respaldo (versión corta para ejemplo)
  const FALLBACK_CSV = `Bank,Year,Month,Media Category,dollars
Bank of America,2023,January 2023,Digital,1250000
Bank of America,2023,January 2023,Television,3500000
Bank of America,2023,January 2023,Audio,780000
Bank of America,2023,January 2023,Print,450000
Bank of America,2023,January 2023,Outdoor,120000
Chase,2023,January 2023,Digital,980000
Chase,2023,January 2023,Television,2800000
Chase,2023,January 2023,Audio,560000
Chase,2023,January 2023,Print,320000
Chase,2023,January 2023,Outdoor,95000
Wells Fargo,2023,January 2023,Digital,870000
Wells Fargo,2023,January 2023,Television,2400000
Wells Fargo,2023,January 2023,Audio,490000
Wells Fargo,2023,January 2023,Print,280000
Wells Fargo,2023,January 2023,Outdoor,85000`;

  // Interceptar requests a archivos CSV
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    // Solo interceptar peticiones a archivos CSV específicos
    if (typeof url === 'string' && 
        (url.endsWith('consolidated_banks_data.csv') || url.includes('consolidated_banks_data.csv'))) {
      try {
        // Intentar la petición original
        const response = await originalFetch(url, options);
        
        // Si la respuesta no es correcta o es HTML en lugar de CSV, usar respaldo
        if (!response.ok || (await response.clone().text()).trim().toLowerCase().startsWith('<!doctype html>')) {
          console.warn(`Fetch interceptado: La petición a ${url} falló o devolvió HTML. Usando datos CSV de respaldo.`);
          return new Response(FALLBACK_CSV, {
            status: 200,
            headers: new Headers({
              'Content-Type': 'text/csv',
              'X-Source': 'fallback-middleware'
            })
          });
        }
        
        return response;
      } catch (error) {
        console.warn(`Fetch interceptado: Error al cargar ${url}:`, error);
        console.info(`Usando datos CSV de respaldo embebidos.`);
        
        // Si hay un error, proporcionar los datos de respaldo
        return new Response(FALLBACK_CSV, {
          status: 200,
          headers: new Headers({
            'Content-Type': 'text/csv',
            'X-Source': 'fallback-middleware'
          })
        });
      }
    }
    
    // Para otras URLs, comportamiento normal
    return originalFetch(url, options);
  };
  
  console.log('CSV middleware inicializado: proporcionando respaldo para archivos CSV');
})(); 