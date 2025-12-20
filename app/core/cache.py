import redis
import json
import hashlib
from functools import wraps
from typing import Optional, Callable, Any

# Conexión a Redis (se inicializa en main.py)
redis_client: Optional[redis.Redis] = None

def init_redis(url: str):
    """Inicializa la conexión a Redis."""
    global redis_client
    try:
        redis_client = redis.from_url(url, decode_responses=True)
        redis_client.ping()
        print("✅ Conectado a Redis")
    except redis.exceptions.ConnectionError:
        print("⚠️ Redis no disponible, el caché estará desactivado.")
        redis_client = None

def close_redis():
    """Cierra la conexión a Redis."""
    global redis_client
    if redis_client:
        redis_client.close()
        print("🛑 Desconectado de Redis")

def _generate_cache_key(prefix: str, params: dict) -> str:
    """Genera una clave de caché única basada en los parámetros."""
    params_str = json.dumps(params, sort_keys=True)
    hash_digest = hashlib.md5(params_str.encode()).hexdigest()
    return f"{prefix}:{hash_digest}"

def cached(prefix: str, ttl_seconds: int = 300):
    """
    Decorador para cachear el resultado de una función asíncrona.
    
    Args:
        prefix: Un nombre para identificar este tipo de caché (ej: 'sites_clean')
        ttl_seconds: Tiempo de vida del caché en segundos (default: 5 min)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Si Redis no está disponible, ejecutar la función directamente
            if not redis_client:
                return await func(*args, **kwargs)

            # Generar clave de caché
            cache_key = _generate_cache_key(prefix, kwargs)

            # Intentar obtener del caché
            try:
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    print(f"🚀 Cache HIT: {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                print(f"⚠️ Error leyendo caché: {e}")

            # Si no está en caché, ejecutar la función
            print(f"💾 Cache MISS: {cache_key}")
            result = await func(*args, **kwargs)

            # Guardar en caché
            try:
                redis_client.setex(cache_key, ttl_seconds, json.dumps(result))
            except Exception as e:
                print(f"⚠️ Error guardando en caché: {e}")

            return result
        return wrapper
    return decorator