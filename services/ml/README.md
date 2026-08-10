# ThinkTwice ML Service

The committed FastAPI service currently exposes only `GET /health`. It does not yet expose a prediction endpoint or call the back-end API.

`data/update.py` is exploratory model-training code. It imports pandas and scikit-learn and expects a `budget_data` input that are not part of the runtime service contract or declared in `requirements.txt`; it is therefore not included in runtime validation yet.

Gabriel Phipps owns this area. Coordinate prediction request/response schemas with the back-end owner before connecting the services, and keep model artifacts and training datasets out of Git unless the team explicitly agrees on storage and licensing.
