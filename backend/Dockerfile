FROM python:3.12-slim

# Keep Python output unbuffered for cleaner container logs.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first to leverage Docker layer caching.
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend application code.
COPY . /app

# Flask app factory entrypoint used by `flask run`.
ENV FLASK_APP=app:create_app

EXPOSE 5001

# Bind to all interfaces so docker-compose can route traffic.
CMD ["flask", "run", "--host=0.0.0.0", "--port=5001"]
