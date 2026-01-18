
$currentDir = Get-Location;

Set-Location $PSScriptRoot;

$filename = "build-index-content-for-obisidian-note-vault-gallery-tsscript20260118021000";

tsc "./$filename.ts" `
  --lib "esnext, dom, dom.iterable" `
  --target "esnext" `
  --module "nodenext";

$filecontent = Get-Content -Path "./$filename.js" -Raw;
$stringtoremove = "Object.defineProperty(exports, `"__esModule`", { value: true });"
Set-Content -Path "./$filename.js" `
  -Value $filecontent.replace($stringtoremove, "")

Set-Location $currentDir;