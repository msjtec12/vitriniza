Add-Type -AssemblyName System.Drawing

function Create-MasterIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $color1 = [System.Drawing.ColorTranslator]::FromHtml('#082227')
    $color2 = [System.Drawing.ColorTranslator]::FromHtml('#0E3B43')
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 45.0)
    
    # Rounded rectangle background
    $radius = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    $g.FillPath($brush, $path)

    # Gold border ring
    $goldPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#E36845'), [float]($size * 0.035))
    $g.DrawPath($goldPen, $path)

    # Inner badge circle
    $innerSize = [int]($size * 0.65)
    $innerX = [int](($size - $innerSize) / 2)
    $innerY = [int](($size - $innerSize) / 2)
    $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#14454E'))
    $g.FillEllipse($innerBrush, $innerX, $innerY, $innerSize, $innerSize)

    $innerPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#4FA6A6'), [float]($size * 0.025))
    $g.DrawEllipse($innerPen, $innerX, $innerY, $innerSize, $innerSize)

    # Draw Crown / Star accent
    $crownPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#F49C6B'), [float]($size * 0.02))
    $crownBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#F49C6B'))
    
    # Text "M"
    $font = New-Object System.Drawing.Font("Segoe UI", [float]($size * 0.30), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FFFFFF'))
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textRect = New-Object System.Drawing.RectangleF(0, [float]($size * 0.16), [float]$size, [float]($size * 0.45))
    $g.DrawString("M", $font, $textBrush, $textRect, $sf)

    # Subtitle "MASTER"
    $subFont = New-Object System.Drawing.Font("Segoe UI", [float]($size * 0.095), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $coralBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#F49C6B'))
    $subTextRect = New-Object System.Drawing.RectangleF(0, [float]($size * 0.62), [float]$size, [float]($size * 0.20))
    $g.DrawString("MASTER", $subFont, $coralBrush, $subTextRect, $sf)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Successfully created $outputPath"
}

Create-MasterIcon 192 "public/icon-master-192.png"
Create-MasterIcon 512 "public/icon-master-512.png"
