@echo off
title CondoCerta - Pubblica Aggiornamento su VPS
echo ===================================================================
echo   CONDOCERTA - Sincronizzazione e Deploy su VPS (Coolify)
echo ===================================================================
echo.
cd /d "c:\Progetti\A-019 CONDOCERTA"

echo [1/2] Invio modifiche su GitHub...
git add .
git commit -m "Aggiornamento CondoCerta" 2>nul
git push origin main

echo.
echo [2/2] Avvio ricostruzione automatica sulla VPS (187.126.30.207)...
ssh root@187.126.30.207 "docker exec coolify php artisan tinker --execute=\"\$app = \App\Models\Application::where('uuid', 'btcrukxpfzsxalumaxz0pga6')->first(); queue_application_deployment(application: \$app, deployment_uuid: (string) new \Visus\Cuid2\Cuid2(), force_rebuild: true); echo 'Deploy avviato con successo!';\""

echo.
echo ===================================================================
echo   Operazione completata! Tra ~30 secondi l'aggiornamento sara' live:
echo   http://condocerta.187.126.30.207.sslip.io
echo ===================================================================
pause
