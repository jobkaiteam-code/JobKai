# Use Python 3.11 slim image for smaller size
FROM python:3.11-slim-bookworm

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# =================================================================
# 1. INSTALL SYSTEM DEPENDENCIES (TeX Live for PDF generation)
# =================================================================
# Install TeX Live and required packages for LaTeX/PDF generation
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-plain-generic \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install fontawesome5 via tlmgr (optional, often included in texlive-latex-extra)
RUN tlmgr init-usertree || true && \
    tlmgr option repository http://mirror.ctan.org/systems/texlive/tlnet && \
    tlmgr update --self || true && \
    tlmgr install fontawesome5 || true

# =================================================================
# 2. INSTALL PYTHON DEPENDENCIES
# =================================================================
# Copy and install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download spaCy models
RUN python -m spacy download en_core_web_sm && \
    python -m spacy download fr_core_news_sm

# =================================================================
# 3. COPY CODE AND SETUP
# =================================================================
# Copy application code
COPY . /app

# Create working directories
RUN mkdir -p temp_files generated_resumes

EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
