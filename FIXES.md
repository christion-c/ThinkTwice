# Run these commands when program wont run (remember to close ports)

cd /workspace && docker compose down

cd /workspace && docker compose --profile frontend --profile ml build

cd /workspace && docker compose --profile frontend --profile ml config

cd /workspace && docker compose --profile frontend --profile ml build --no-cache