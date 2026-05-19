@echo off
setlocal

for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
  set "%%A=%%B"
)

call "%~dp0mvn.cmd" spring-boot:run "-Dspring-boot.run.profiles=local"
