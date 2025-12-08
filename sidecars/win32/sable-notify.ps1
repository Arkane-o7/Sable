# sable-notify.ps1
# PowerShell-based notification listener for Windows
# Uses Windows Runtime APIs with proper async handling

param(
    [switch]$Debug
)

$ErrorActionPreference = "SilentlyContinue"

function Send-Json {
    param($Object)
    $json = $Object | ConvertTo-Json -Compress -Depth 10
    [Console]::WriteLine($json)
}

function Send-Ready {
    Send-Json @{ type = "ready"; payload = @{} }
}

function Send-Error {
    param([string]$Message)
    Send-Json @{ type = "error"; payload = @{ message = $Message } }
}

function Send-Notification {
    param(
        [string]$Id,
        [string]$AppId,
        [string]$AppName,
        [string]$Title,
        [string]$Message,
        [long]$Timestamp
    )
    
    Send-Json @{
        type = "notification"
        payload = @{
            id = $Id
            appId = $AppId
            appName = $AppName
            title = $Title
            message = $Message
            timestamp = $Timestamp
        }
    }
}

# Async helper using Windows Runtime async operations
function Wait-AsyncOperation {
    param($AsyncOp)
    
    # Poll for completion
    $timeout = 10000 # 10 seconds
    $elapsed = 0
    
    while ($elapsed -lt $timeout) {
        $status = $AsyncOp.Status
        if ($status -ne 0) { # 0 = Started
            break
        }
        Start-Sleep -Milliseconds 100
        $elapsed += 100
    }
    
    if ($AsyncOp.Status -eq 1) { # 1 = Completed
        return $AsyncOp.GetResults()
    }
    
    return $null
}

# Main execution
try {
    # Load Windows Runtime types
    $null = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $null = [Windows.UI.Notifications.NotificationKinds, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $null = [Windows.Foundation.AsyncStatus, Windows.Foundation, ContentType = WindowsRuntime]
    
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
    
    # Request access
    $accessOp = $listener.RequestAccessAsync()
    $access = Wait-AsyncOperation $accessOp
    
    if ($access -ne 1) { # 1 = Allowed
        Send-Error "Notification access denied. Status: $access. Enable in Windows Settings > Privacy > Notifications"
        # Still run in limited mode
        Send-Ready
    } else {
        Send-Ready
    }
    
    $seenIds = @{}
    $running = $true
    
    # Main polling loop
    while ($running) {
        try {
            # Get current notifications
            $notificationsOp = $listener.GetNotificationsAsync(1) # 1 = Toast
            $notifications = Wait-AsyncOperation $notificationsOp
            
            if ($notifications) {
                foreach ($notification in $notifications) {
                    $id = $notification.Id.ToString()
                    
                    if (-not $seenIds.ContainsKey($id)) {
                        $seenIds[$id] = $true
                        
                        try {
                            $visual = $notification.Notification.Visual
                            $binding = $visual.GetBinding("ToastGeneric")
                            
                            if ($binding) {
                                $textElements = @($binding.GetTextElements())
                                
                                $title = ""
                                $message = ""
                                
                                if ($textElements.Count -gt 0 -and $textElements[0]) {
                                    $title = $textElements[0].Text
                                }
                                if ($textElements.Count -gt 1 -and $textElements[1]) {
                                    $message = $textElements[1].Text
                                }
                                
                                $appName = "Unknown"
                                $appId = "unknown"
                                
                                if ($notification.AppInfo) {
                                    try {
                                        $appName = $notification.AppInfo.DisplayInfo.DisplayName
                                        $appId = $notification.AppInfo.PackageFamilyName
                                    } catch {}
                                }
                                
                                $timestamp = [long]([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())
                                try {
                                    $timestamp = [long]($notification.CreationTime.ToUnixTimeMilliseconds())
                                } catch {}
                                
                                Send-Notification -Id $id -AppId $appId -AppName $appName -Title $title -Message $message -Timestamp $timestamp
                            }
                        } catch {
                            if ($Debug) { Send-Error "Parse error: $_" }
                        }
                    }
                }
            }
        } catch {
            if ($Debug) { Send-Error "Poll error: $_" }
        }
        
        # Check for stdin commands (non-blocking)
        if ([Console]::KeyAvailable) {
            $line = [Console]::ReadLine()
            if ($line) {
                try {
                    $cmd = $line | ConvertFrom-Json
                    if ($cmd.type -eq "stop") {
                        $running = $false
                        Send-Json @{ type = "stopped"; payload = @{} }
                    }
                } catch {}
            }
        }
        
        Start-Sleep -Milliseconds 1000
    }
} catch {
    Send-Error "Fatal error: $_"
    exit 1
}
