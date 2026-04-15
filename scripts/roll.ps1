#!/usr/bin/env pwsh
# ============================================================
#  Dice Roll Engine - ClawPet Test Skill
# ============================================================
#  Usage:
#    ./roll.ps1                    # standard d6
#    ./roll.ps1 -Sides 20          # d20
#    ./roll.ps1 -Count 3           # 3d6
#    ./roll.ps1 -Mode sicbo        # sicbo mode (big/small)
# ============================================================

param(
    [int]$Sides = 6,
    [int]$Count = 1,
    [ValidateSet("standard", "sicbo")]
    [string]$Mode = "standard"
)

function Roll-Die {
    param([int]$Max)
    return Get-Random -Minimum 1 -Maximum ($Max + 1)
}

if ($Mode -eq "sicbo") {
    $result = Roll-Die -Max 6
    $judgement = if ($result -le 3) { "Small" } else { "Big" }
    Write-Host ""
    Write-Host "  Dice result: **$result** -> $judgement!"
    Write-Host ""
} elseif ($Count -gt 1) {
    $results = @(1..$Count | ForEach-Object { Roll-Die -Max $Sides })
    $sum = ($results | Measure-Object -Sum).Sum
    $display = $results -join ", "
    Write-Host ""
    Write-Host "  ${Count}d${Sides}: [$display] = **$sum**"
    Write-Host ""
} else {
    $result = Roll-Die -Max $Sides
    $dieFace = switch ($result) {
        1 { "[ . ]" }
        2 { "[ : ]" }
        3 { "[...]" }
        4 { "[:::]" }
        5 { "[:::.]" }
        6 { "[::::]" }
        default { "[dice]" }
    }
    if ($Sides -eq 6) {
        Write-Host ""
        Write-Host "  $dieFace You rolled **$result**!"
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "  d${Sides} result: **$result**"
        Write-Host ""
    }
}