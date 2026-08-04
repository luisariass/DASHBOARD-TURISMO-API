/**
 * Los tokens de inyección viven aparte del módulo a propósito. Si se declaran
 * dentro de cache.module.ts, el interceptor tiene que importar del módulo y el
 * módulo del interceptor: ese ciclo hace que el token llegue como undefined al
 * evaluarse el decorador, y Nest falla al resolver la dependencia.
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';
