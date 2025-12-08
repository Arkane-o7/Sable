using System.Text.Json;
using System.Text.Json.Serialization;
using Windows.UI.Notifications;
using Windows.UI.Notifications.Management;
using Windows.Foundation;

namespace SableNotify;

public class Program
{
    private static UserNotificationListener? _listener;
    private static bool _running = true;
    private static readonly HashSet<uint> _seenNotifications = new();
    
    public static async Task Main(string[] args)
    {
        try
        {
            // Request access to notifications
            var accessStatus = await UserNotificationListener.Current.RequestAccessAsync();
            
            if (accessStatus != UserNotificationListenerAccessStatus.Allowed)
            {
                SendError($"Notification access denied: {accessStatus}");
                return;
            }
            
            _listener = UserNotificationListener.Current;
            
            // Subscribe to notification changes
            _listener.NotificationChanged += OnNotificationChanged;
            
            SendReady();
            
            // Read commands from stdin
            await ProcessCommandsAsync();
        }
        catch (Exception ex)
        {
            SendError($"Fatal error: {ex.Message}");
        }
    }
    
    private static async Task ProcessCommandsAsync()
    {
        using var reader = new StreamReader(Console.OpenStandardInput());
        
        while (_running)
        {
            var line = await reader.ReadLineAsync();
            if (line == null) break;
            
            try
            {
                var command = JsonSerializer.Deserialize<SidecarCommand>(line);
                if (command == null) continue;
                
                switch (command.Type)
                {
                    case "start":
                        await SendCurrentNotifications();
                        break;
                    case "stop":
                        _running = false;
                        SendStopped();
                        break;
                    case "dismiss":
                        if (command.Payload?.TryGetProperty("id", out var idProp) == true)
                        {
                            var id = idProp.GetUInt32();
                            _listener?.RemoveNotification(id);
                        }
                        break;
                }
            }
            catch (JsonException)
            {
                // Ignore malformed JSON
            }
        }
    }
    
    private static void OnNotificationChanged(UserNotificationListener sender, UserNotificationChangedEventArgs args)
    {
        if (args.ChangeKind == UserNotificationChangedKind.Added)
        {
            Task.Run(async () =>
            {
                try
                {
                    var notifications = await sender.GetNotificationsAsync(NotificationKinds.Toast);
                    var notification = notifications.FirstOrDefault(n => n.Id == args.UserNotificationId);
                    
                    if (notification != null && !_seenNotifications.Contains(notification.Id))
                    {
                        _seenNotifications.Add(notification.Id);
                        SendNotification(notification);
                    }
                }
                catch (Exception ex)
                {
                    SendError($"Error processing notification: {ex.Message}");
                }
            });
        }
    }
    
    private static async Task SendCurrentNotifications()
    {
        if (_listener == null) return;
        
        try
        {
            var notifications = await _listener.GetNotificationsAsync(NotificationKinds.Toast);
            
            foreach (var notification in notifications.Take(20)) // Limit to 20
            {
                if (!_seenNotifications.Contains(notification.Id))
                {
                    _seenNotifications.Add(notification.Id);
                    SendNotification(notification);
                }
            }
        }
        catch (Exception ex)
        {
            SendError($"Error fetching notifications: {ex.Message}");
        }
    }
    
    private static void SendNotification(UserNotification notification)
    {
        try
        {
            var binding = notification.Notification.Visual.GetBinding(KnownNotificationBindings.ToastGeneric);
            if (binding == null) return;
            
            var textElements = binding.GetTextElements().ToList();
            var title = textElements.Count > 0 ? textElements[0].Text : "";
            var message = textElements.Count > 1 ? textElements[1].Text : "";
            
            var payload = new NotificationPayload
            {
                Id = notification.Id.ToString(),
                AppId = notification.AppInfo?.PackageFamilyName ?? "Unknown",
                AppName = notification.AppInfo?.DisplayInfo?.DisplayName ?? "Unknown App",
                Title = title,
                Message = message,
                Timestamp = notification.CreationTime.ToUnixTimeMilliseconds()
            };
            
            var response = new SidecarResponse
            {
                Type = "notification",
                Payload = payload
            };
            
            SendJson(response);
        }
        catch (Exception ex)
        {
            SendError($"Error formatting notification: {ex.Message}");
        }
    }
    
    private static void SendReady()
    {
        SendJson(new SidecarResponse { Type = "ready", Payload = new { } });
    }
    
    private static void SendStopped()
    {
        SendJson(new SidecarResponse { Type = "stopped", Payload = new { } });
    }
    
    private static void SendError(string message)
    {
        SendJson(new SidecarResponse { Type = "error", Payload = new { message } });
    }
    
    private static void SendJson(object obj)
    {
        var json = JsonSerializer.Serialize(obj, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        Console.WriteLine(json);
    }
}

public class SidecarCommand
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";
    
    [JsonPropertyName("payload")]
    public JsonElement? Payload { get; set; }
}

public class SidecarResponse
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "";
    
    [JsonPropertyName("payload")]
    public object Payload { get; set; } = new { };
}

public class NotificationPayload
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";
    
    [JsonPropertyName("appId")]
    public string AppId { get; set; } = "";
    
    [JsonPropertyName("appName")]
    public string AppName { get; set; } = "";
    
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";
    
    [JsonPropertyName("message")]
    public string Message { get; set; } = "";
    
    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }
}
