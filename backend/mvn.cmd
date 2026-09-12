@echo off
setlocal

if exist "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin\java.exe" (
  set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
  set "PATH=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot\bin;%PATH%"
)

set "MAVEN_CMD="
if defined MAVEN_HOME if exist "%MAVEN_HOME%\bin\mvn.cmd" set "MAVEN_CMD=%MAVEN_HOME%\bin\mvn.cmd"
if not defined MAVEN_CMD if exist "%USERPROFILE%\Tools\apache-maven-3.9.16\bin\mvn.cmd" set "MAVEN_CMD=%USERPROFILE%\Tools\apache-maven-3.9.16\bin\mvn.cmd"

if not defined MAVEN_CMD (
  for %%D in ("%PATH:;=" "%") do (
    if /I not "%%~fD\"=="%~dp0" if exist "%%~D\mvn.cmd" set "MAVEN_CMD=%%~D\mvn.cmd"
  )
)

if not defined MAVEN_CMD (
  echo Maven was not found on PATH.
  echo Install Maven, or add Maven's bin directory to PATH, then run this command again.
  exit /b 1
)

call "%MAVEN_CMD%" %*
exit /b %ERRORLEVEL%
