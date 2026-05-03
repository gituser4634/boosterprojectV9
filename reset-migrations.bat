@echo off
cd /d c:\Users\Zeus\Desktop\project\BoosterprojectV8
REM Delete migrations
rmdir /s /q prisma\migrations
REM Create migrations folder
mkdir prisma\migrations
echo Migrations deleted and recreated. Now generate fresh migrations.
pause
