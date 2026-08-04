# Etapa 1: Usar una imagen oficial de Python
FROM python:3.11-slim

# Etapa 2: Configurar el directorio de trabajo dentro del contenedor
WORKDIR /app

# Etapa 3: Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Etapa 4: Copiar el código de la aplicación
# CORRECCIÓN: Copiamos solo la carpeta 'app' que contiene nuestro código
COPY ./app ./app

# Etapa 5: Comando para ejecutar la API en producción
# Uvicorn se ejecutará en el host 0.0.0.0 para ser accesible desde fuera del contenedor
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]