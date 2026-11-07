@echo off
title CondoCerta - Il Revisore Digitale ANACI-Oriented (Porta 3020)
echo ===================================================================
echo   CONDOCERTA - Revisione e Certificazione Rendiconto Condominiale
echo   Porta dedicata: 3020
echo ===================================================================
echo.
cd /d "c:\Progetti\A-019 CONDOCERTA"
set NODE_TLS_REJECT_UNAUTHORIZED=0

:: Verifica se la porta 3020 e' gia' attiva
netstat -ano | findstr ":3020 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo Il server CondoCerta e' gia' attivo su http://localhost:3020
    echo Apertura del browser in corso...
    start http://localhost:3020
    exit /b 0
)

echo Avvio del server CondoCerta e apertura automatica nel browser (http://localhost:3020)...
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3020"
npm run dev
pause
