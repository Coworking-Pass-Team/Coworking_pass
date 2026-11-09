$ErrorActionPreference = 'Stop'
$reportPath = 'D:\Desktop\Coworking_pass\report_work\Security_Remediation_Report.docx'
$pdfPath = 'D:\Desktop\Coworking_pass\report_work\render\consolidated.pdf'
$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.AutomationSecurity = 3
    $document = $word.Documents.Open($reportPath, $false, $true, $false)
    $document.Repaginate()
    $document.ExportAsFixedFormat($pdfPath, 17)
    Write-Output "Rendered pages: $($document.ComputeStatistics(2))"
} finally {
    if ($null -ne $document) { $document.Close(0) }
    if ($null -ne $word) { $word.Quit([ref]0) }
}

