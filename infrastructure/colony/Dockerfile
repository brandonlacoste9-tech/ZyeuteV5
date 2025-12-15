# Colony OS - Python Neurosphere Container
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create log directory
RUN mkdir -p /var/log/colony

# Expose ports for all services
EXPOSE 8000 8001 8002

# Default command (can be overridden in docker-compose)
CMD ["python3", "core/neurosphere.py"]
