# Nginx — UIEP + IA Prod OS (VPS)

Coloca estos archivos en `/etc/nginx/sites-available/` y activa con `ln -s` en `/etc/nginx/sites-enabled/`.

## uiep.manuelalvarez.dev

```nginx
server {
    listen 80;
    server_name uiep.manuelalvarez.dev;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name uiep.manuelalvarez.dev;

    ssl_certificate /etc/letsencrypt/live/manuelalvarez.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/manuelalvarez.dev/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }
}
```

## iaprod.manuelalvarez.dev

```nginx
server {
    listen 80;
    server_name iaprod.manuelalvarez.dev;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name iaprod.manuelalvarez.dev;

    ssl_certificate /etc/letsencrypt/live/manuelalvarez.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/manuelalvarez.dev/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }

    location /_iaprod {
        rewrite ^/_iaprod(/.*)$ $1 break;
        proxy_pass http://localhost:8006;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
    }
}
```

## Aplicar

```bash
sudo cp infrastructure/nginx/sites-available/uiep.conf /etc/nginx/sites-available/
sudo cp infrastructure/nginx/sites-available/iaprod-os.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/uiep.conf /etc/nginx/sites-enabled/uiep.conf
sudo ln -sf /etc/nginx/sites-available/iaprod-os.conf /etc/nginx/sites-enabled/iaprod-os.conf
sudo nginx -t && sudo systemctl reload nginx
```
