## EJECUTAR SERVIDOR 
### Requisitos previos
- Python 3.8+
- pip instalado
- Variables de entorno configuradas en `.env`

### Pasos para iniciar el servidor localmente

1. **Instalar dependencias**
    ```bash
    pip install -r requirements.txt
    ```
2. **Ejecutar el servidor**
    ```
    cd backend
    ```
    ```bash
    uvicorn app.main:app
    ```

El servidor estará disponible en `http://localhost:8000`

### Con Docker
```bash
docker build -f Dockerfile.backend -t dashboard-backend .
docker run -p 8000:8000 dashboard-backend
```