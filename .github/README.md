# GitHub Configuration

`workflows/validate.yml` runs back-end, front-end, and ML validation on pushes and pull requests.

Do not add repository secrets, ADC files, service-account private keys, tokens, or local `.env` files here. CI jobs should use least-privilege credentials only when a future test explicitly requires an external service.
