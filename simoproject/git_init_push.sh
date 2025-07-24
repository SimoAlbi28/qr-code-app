#!/bin/bash

# Usa: ./git_init_push.sh https://github.com/TUO-USERNAME/NOME-REPO.git

if [ -z "$1" ]; then
  echo "Errore: devi passare l'URL della repo GitHub come parametro!"
  echo "Esempio: ./git_init_push.sh https://github.com/SimoAlbi28/ricette-app.git"
  exit 1
fi

REMOTE_URL=$1

echo "Inizializzo git nella cartella $(pwd)..."

git init
git add .
git commit -m "feat"
git branch -M main
git remote add origin $REMOTE_URL

echo "Faccio push su $REMOTE_URL ..."

git push -u origin main

echo "Fatto! Repo inizializzata e pushata."
