import yaml

with open('/home/ubuntu/MSBrossAI/docker-compose.yml', 'r') as f:
    data = yaml.safe_load(f)

if 'labels' not in data['services']['nikolina-api-hub']:
    data['services']['nikolina-api-hub']['labels'] = []

labels = [
    "traefik.enable=true",
    "traefik.http.routers.nikolina.rule=Host(`nikolina.manuelalvarez.dev`)",
    "traefik.http.routers.nikolina.entrypoints=websecure",
    "traefik.http.routers.nikolina.tls.certresolver=myresolver",
    "traefik.http.services.nikolina.loadbalancer.server.port=8001"
]

for l in labels:
    if l not in data['services']['nikolina-api-hub']['labels']:
        data['services']['nikolina-api-hub']['labels'].append(l)

with open('/home/ubuntu/MSBrossAI/docker-compose.yml', 'w') as f:
    yaml.dump(data, f, sort_keys=False)
