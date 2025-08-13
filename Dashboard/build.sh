```sh
#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Iniciando build do frontend..."
cd React
npm install
npm run build
cd ..

echo "Instalando dependências do backend..."
cd backend
pip install -r requirements.txt
cd ..

echo "Build finalizado com sucesso!"
```