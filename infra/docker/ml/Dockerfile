# syntax=docker/dockerfile:1.7

ARG PYTHON_VERSION=3.12

FROM python:${PYTHON_VERSION}-slim AS development

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /workspace

RUN useradd \
    --create-home \
    --shell /usr/sbin/nologin \
    --uid 10001 \
    appuser

# app/main.py self-bootstraps budget_data.json under /workspace on first
# request (see build_dataset()), so appuser needs write access to it — not
# just to the files COPY --chown places there.
RUN chown appuser:appuser /workspace

COPY requirements.txt ./

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY --chown=appuser:appuser . .

RUN mkdir -p /home/appuser/.cache/thinktwice \
    && chown -R appuser:appuser /home/appuser/.cache/thinktwice

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------------------------------------------------------
# Production
# ---------------------------------------------------------
FROM python:${PYTHON_VERSION}-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /workspace

RUN useradd \
    --create-home \
    --shell /usr/sbin/nologin \
    --uid 10001 \
    appuser

# app/main.py self-bootstraps budget_data.json under /workspace on first
# request (see build_dataset()), so appuser needs write access to it — not
# just to the files COPY --chown places there.
RUN chown appuser:appuser /workspace

COPY requirements.txt ./

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip \
    && python -m pip install -r requirements.txt

COPY --chown=appuser:appuser app ./app

RUN mkdir -p /home/appuser/.cache/thinktwice \
    && chown -R appuser:appuser /home/appuser/.cache/thinktwice

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
