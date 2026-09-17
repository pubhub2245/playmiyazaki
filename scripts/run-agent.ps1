#requires -Version 5.1
<#
Shared unattended runner for C:\projects\*
Modes:
  -Mode queue    : pick the single earliest .txt from any C:\projects\*\tasks\queue\ and run it
  -Mode monthly  : run each C:\projects\*\tasks\monthly.md in sequence

Written for Windows PowerShell 5.1. Designed to be invoked from Task Scheduler
as the logged-in user.
#>

param(
  [Parameter(Mandatory=$true)]
  [ValidateSet('queue','monthly')]
  [string]$Mode
)

$ErrorActionPreference = 'Continue'

# ---------------- UTF-8 everywhere ----------------
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'

# ---------------- Paths ----------------
$AgentRoot    = 'C:\projects\_agent'
$LogsDir      = Join-Path $AgentRoot 'logs'
$LockFile     = Join-Path $AgentRoot 'running.lock'
$ProjectsRoot = 'C:\projects'
$ClaudeExe    = 'C:\Users\junra\AppData\Roaming\npm\claude.cmd'

if (-not (Test-Path $LogsDir)) {
  New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null
}

$Global:LogPath = $null

function Write-LogLine {
  param([string]$Message)
  $stamp = (Get-Date -Format 'HH:mm:ss')
  $line  = "[$stamp] $Message"
  Write-Host $line
  if ($Global:LogPath) {
    try {
      [System.IO.File]::AppendAllText(
        $Global:LogPath,
        $line + [Environment]::NewLine,
        [System.Text.Encoding]::UTF8)
    } catch { }
  }
}

function Write-RawLine {
  param([string]$Message)
  Write-Host $Message
  if ($Global:LogPath) {
    try {
      [System.IO.File]::AppendAllText(
        $Global:LogPath,
        $Message + [Environment]::NewLine,
        [System.Text.Encoding]::UTF8)
    } catch { }
  }
}

function Open-LogFor {
  param([string]$ProjectName)
  $ts   = Get-Date -Format 'yyyy-MM-dd_HHmm'
  $Global:LogPath = Join-Path $LogsDir "${ProjectName}_${ts}.log"
  Write-LogLine "==== log opened: $Global:LogPath ===="
}

function Close-Log { $Global:LogPath = $null }

# ---------------- Lock ----------------
function Acquire-Lock {
  if (Test-Path $LockFile) {
    $age = (Get-Date) - (Get-Item $LockFile).LastWriteTime
    if ($age.TotalHours -lt 3) {
      Write-Host "[$(Get-Date -Format HH:mm:ss)] Another run is active (lock age $([int]$age.TotalMinutes) min). Exiting."
      return $false
    } else {
      Write-Host "[$(Get-Date -Format HH:mm:ss)] Stale lock ($([int]$age.TotalHours)h old). Removing."
      Remove-Item -Path $LockFile -Force -ErrorAction SilentlyContinue
    }
  }
  New-Item -Path $LockFile -ItemType File -Force | Out-Null
  return $true
}

function Release-Lock {
  if (Test-Path $LockFile) {
    Remove-Item -Path $LockFile -Force -ErrorAction SilentlyContinue
  }
}

# ---------------- Unattended header ----------------
$UnattendedHeader = @'
これは無人の自動実行です。人に確認する手段は無いので、確認が必要になる操作は行わずにスキップしてログに理由を書くこと。絶対禁止：全データの削除、git push --force、rm -rf、条件なしの一括削除、課金・契約、外部への連絡（メール・フォーム・電話）、出典の無い情報の追加、CLAUDE.md の方針変更、このプロジェクト以外のフォルダの変更。ビルドが通らなければ push しない（変更は git stash ではなく、そのまま残してログに書く）。最後に必ず『RESULT: <一行の要約>／push YES|NO／コミット<hash>』の1行を出す。

'@

# ---------------- Project discovery ----------------
function Get-CandidateProjects {
  $out = @()
  Get-ChildItem -Path $ProjectsRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $dir = $_
    if ($dir.Name -like '_*') { return }
    if (-not (Test-Path (Join-Path $dir.FullName '.git')))     { return }
    if (-not (Test-Path (Join-Path $dir.FullName 'CLAUDE.md'))) { return }
    $out += $dir.FullName
  }
  return $out
}

function Test-Project {
  param([string]$Path)
  if ((Split-Path $Path -Leaf) -like '_*')                 { return $false }
  if (-not (Test-Path (Join-Path $Path '.git')))           { return $false }
  if (-not (Test-Path (Join-Path $Path 'CLAUDE.md')))       { return $false }
  return $true
}

# ---------------- Git helpers ----------------
function Get-DefaultBranch {
  param([string]$RepoPath)
  Push-Location $RepoPath
  try {
    $head = & git symbolic-ref --short refs/remotes/origin/HEAD 2>$null
    if ($LASTEXITCODE -eq 0 -and $head) {
      return ($head -replace '^origin/','')
    }
    foreach ($b in 'main','master') {
      $null = & git rev-parse --verify --quiet "refs/heads/$b" 2>$null
      if ($LASTEXITCODE -eq 0) { return $b }
    }
    return 'main'
  } finally { Pop-Location }
}

function Sync-Repo {
  param([string]$RepoPath)
  Push-Location $RepoPath
  try {
    Write-LogLine "git fetch origin"
    $r = & git fetch origin 2>&1
    foreach ($l in $r) { Write-RawLine ("  " + $l) }
    $status = & git status --porcelain 2>&1
    # Untracked files under tasks/queue/ are the runner's own inbox and do not
    # count as a dirty tree — the queue is where the designer drops .txt files.
    $dirty = @($status | Where-Object {
      $line = [string]$_
      if ([string]::IsNullOrWhiteSpace($line)) { return $false }
      if ($line -match '^\?\?\s+tasks/queue/') { return $false }
      return $true
    })
    if ($dirty.Count -gt 0) {
      Write-LogLine "SKIP: working tree is dirty"
      foreach ($l in $dirty) { Write-RawLine ("  " + $l) }
      return $null
    }
    $branch = Get-DefaultBranch -RepoPath $RepoPath
    Write-LogLine "git checkout $branch"
    $r = & git checkout $branch 2>&1
    foreach ($l in $r) { Write-RawLine ("  " + $l) }
    if ($LASTEXITCODE -ne 0) {
      Write-LogLine "SKIP: checkout failed"
      return $null
    }
    Write-LogLine "git pull --ff-only origin $branch"
    $r = & git pull --ff-only origin $branch 2>&1
    foreach ($l in $r) { Write-RawLine ("  " + $l) }
    if ($LASTEXITCODE -ne 0) {
      Write-LogLine "SKIP: pull failed"
      return $null
    }
    return $branch
  } finally { Pop-Location }
}

# ---------------- Claude invocation ----------------
function Invoke-ClaudePrint {
  param([string]$PromptBody)
  $full = $UnattendedHeader + $PromptBody
  Write-LogLine "claude -p (prompt length $($full.Length) chars)"

  # Feed prompt via stdin from a UTF-8 temp file using cmd.exe's `type` after
  # switching the console to codepage 65001. This avoids PS 5.1 Unicode
  # arg-passing issues with .cmd wrappers.
  $tmp = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($tmp, $full, (New-Object System.Text.UTF8Encoding($false)))
    $exe   = $ClaudeExe
    $cmdLine = "chcp 65001 >nul & type `"$tmp`" | `"$exe`" -p --permission-mode acceptEdits --max-turns 400"
    Write-LogLine "exec: $cmdLine"
    $r = & cmd.exe /d /c $cmdLine 2>&1
    foreach ($l in $r) { Write-RawLine ([string]$l) }
    $code = $LASTEXITCODE
    Write-LogLine "claude exit code: $code"
    return $code
  } finally {
    if (Test-Path $tmp) { Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue }
  }
}

# ---------------- Modes ----------------
function Invoke-QueueMode {
  # 1) Gather all queue .txt across projects
  $projects = Get-CandidateProjects
  $entries = @()
  foreach ($p in $projects) {
    $qdir = Join-Path $p 'tasks\queue'
    if (-not (Test-Path $qdir)) { continue }
    Get-ChildItem -Path $qdir -Filter '*.txt' -File -ErrorAction SilentlyContinue | ForEach-Object {
      $entries += [pscustomobject]@{
        Project = $p
        File    = $_.FullName
        Name    = $_.Name
      }
    }
  }
  if ($entries.Count -eq 0) { return }  # silent exit, no log

  $chosen = $entries | Sort-Object Name, Project | Select-Object -First 1
  $projName = Split-Path $chosen.Project -Leaf
  Open-LogFor -ProjectName $projName
  Write-LogLine "Mode=queue project=$projName file=$($chosen.Name)"

  Push-Location $chosen.Project
  try {
    $branch = Sync-Repo -RepoPath $chosen.Project
    if (-not $branch) { return }

    $promptBody = [System.IO.File]::ReadAllText($chosen.File, [System.Text.Encoding]::UTF8)
    $exit = Invoke-ClaudePrint -PromptBody $promptBody

    # Move the .txt to done/ regardless of outcome so we do not re-run it.
    $doneDir = Join-Path $chosen.Project 'tasks\done'
    if (-not (Test-Path $doneDir)) { New-Item -Path $doneDir -ItemType Directory -Force | Out-Null }
    $ts = Get-Date -Format 'yyyy-MM-dd_HHmm'
    $doneName = "$([System.IO.Path]::GetFileNameWithoutExtension($chosen.Name))__$ts.txt"
    $donePath = Join-Path $doneDir $doneName
    Move-Item -Path $chosen.File -Destination $donePath -Force
    Write-LogLine "Moved queue file -> tasks/done/$doneName"

    # Stage tasks/, commit, push. Any earlier work by claude is already committed
    # by claude; this commit only covers the queue/done move (plus anything left
    # unstaged if claude forgot to add it).
    $r = & git add tasks 2>&1
    foreach ($l in $r) { Write-RawLine ("  " + $l) }
    $st = & git status --porcelain 2>&1
    if ($st) {
      $msg = "Queue: $($chosen.Name) executed"
      $r = & git commit -m $msg 2>&1
      foreach ($l in $r) { Write-RawLine ("  " + $l) }
    } else {
      Write-LogLine "Nothing to commit for queue-move step."
    }
    Write-LogLine "git push origin $branch"
    $r = & git push origin $branch 2>&1
    foreach ($l in $r) { Write-RawLine ("  " + $l) }
    Write-LogLine "push exit code: $LASTEXITCODE"
  } finally {
    Pop-Location
  }
}

function Invoke-MonthlyMode {
  $projects = Get-CandidateProjects
  foreach ($p in $projects) {
    $mfile = Join-Path $p 'tasks\monthly.md'
    if (-not (Test-Path $mfile)) { continue }
    $projName = Split-Path $p -Leaf
    Open-LogFor -ProjectName ("monthly_" + $projName)
    Write-LogLine "Mode=monthly project=$projName file=tasks/monthly.md"
    Push-Location $p
    try {
      $branch = Sync-Repo -RepoPath $p
      if (-not $branch) { continue }
      $body = [System.IO.File]::ReadAllText($mfile, [System.Text.Encoding]::UTF8)
      $null = Invoke-ClaudePrint -PromptBody $body
      # Monthly prompts push on their own. No extra commit here.
    } finally {
      Pop-Location
      Close-Log
    }
  }
}

# ---------------- Entry ----------------
if (-not (Acquire-Lock)) { exit 0 }

try {
  switch ($Mode) {
    'queue'   { Invoke-QueueMode }
    'monthly' { Invoke-MonthlyMode }
  }
} finally {
  Release-Lock
  if ($Global:LogPath) {
    Write-LogLine "==== done (mode=$Mode) ===="
  }
}
