# Nginx de produção

O template `default.conf.template` é processado pela imagem oficial do Nginx ao iniciar. Configure `APP_HOST`, `API_HOST`, `AUTH_HOST` e `OBJECTS_HOST` em `.env.production`.

Coloque neste diretório, sem versionar:

- `certs/fullchain.pem`: certificado PEM com a cadeia completa;
- `certs/privkey.pem`: chave privada PEM.

O certificado deve cobrir os quatro hosts, por SAN ou wildcard. Mantenha a chave com permissão somente para o usuário da implantação. Para Let's Encrypt, copie ou monte os arquivos renovados nesses nomes e execute `docker compose ... exec nginx nginx -s reload` após a renovação.
