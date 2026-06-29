using MailKit;
using MailKit.Net.Imap;
using MailKit.Net.Smtp;
using MailKit.Search;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using WorkForceManager.Application.Common.Interfaces;
using WorkForceManager.Domain.Entities;

namespace WorkForceManager.Infrastructure.Services;

public class MailClientService : IMailClientService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<MailClientService> _logger;
    private readonly IEncryptionService _encryptionService;

    public MailClientService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<MailClientService> logger,
        IEncryptionService encryptionService)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _encryptionService = encryptionService;
    }

    public async Task<List<EmailMessageDto>> SearchEmailsAsync(UserEmailConfig config, string? query, int maxResults = 10, CancellationToken ct = default)
    {
        if (config.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            return await SearchGmailAsync(config, query, maxResults, ct);
        }
        else
        {
            return await SearchImapAsync(config, query, maxResults, ct);
        }
    }

    public async Task<EmailMessageDto?> GetEmailDetailsAsync(UserEmailConfig config, string messageId, CancellationToken ct = default)
    {
        if (config.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            return await GetGmailDetailsAsync(config, messageId, ct);
        }
        else
        {
            return await GetImapDetailsAsync(config, messageId, ct);
        }
    }

    public async Task SendEmailAsync(UserEmailConfig config, string toEmail, string subject, string body, CancellationToken ct = default)
    {
        if (config.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            await SendGmailAsync(config, toEmail, subject, body, ct);
        }
        else
        {
            await SendSmtpAsync(config, toEmail, subject, body, ct);
        }
    }

    public async Task<bool> TestConnectionAsync(UserEmailConfig config, CancellationToken ct = default)
    {
        if (config.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            // Đối với Gmail, kiểm tra xem có access token hoặc refresh token không
            if (string.IsNullOrEmpty(config.GmailRefreshToken) && string.IsNullOrEmpty(config.GmailAccessToken))
                return false;

            try
            {
                var token = await GetGmailAccessTokenAsync(config, ct);
                return !string.IsNullOrEmpty(token);
            }
            catch
            {
                return false;
            }
        }
        else
        {
            using var client = new ImapClient();
            try
            {
                await client.ConnectAsync(config.ImapHost, config.ImapPort ?? 993, config.UseSsl, ct);
                var password = _encryptionService.Decrypt(config.ImapPassword ?? string.Empty);
                await client.AuthenticateAsync(config.ImapUsername, password, ct);
                return client.IsAuthenticated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kiểm tra kết nối IMAP thất bại.");
                return false;
            }
            finally
            {
                if (client.IsConnected)
                {
                    await client.DisconnectAsync(true, ct);
                }
            }
        }
    }

    #region IMAP & SMTP Implementation

    private async Task<List<EmailMessageDto>> SearchImapAsync(UserEmailConfig config, string? query, int maxResults, CancellationToken ct)
    {
        var emails = new List<EmailMessageDto>();
        using var client = new ImapClient();
        try
        {
            await client.ConnectAsync(config.ImapHost, config.ImapPort ?? 993, config.UseSsl, ct);
            var password = _encryptionService.Decrypt(config.ImapPassword ?? string.Empty);
            await client.AuthenticateAsync(config.ImapUsername, password, ct);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly, ct);

            SearchQuery searchQuery = SearchQuery.All;
            if (!string.IsNullOrEmpty(query))
            {
                searchQuery = SearchQuery.SubjectContains(query)
                    .Or(SearchQuery.BodyContains(query))
                    .Or(SearchQuery.FromContains(query));
            }

            var uids = await inbox.SearchAsync(searchQuery, ct);
            var recentUids = uids.TakeLast(maxResults).Reverse().ToList(); // Mới nhất lên đầu

            foreach (var uid in recentUids)
            {
                var message = await inbox.GetMessageAsync(uid, ct);
                emails.Add(new EmailMessageDto
                {
                    MessageId = uid.ToString(),
                    Subject = message.Subject ?? "(Không có tiêu đề)",
                    From = message.From.ToString(),
                    To = message.To.ToString(),
                    Date = message.Date.DateTime,
                    Snippet = GetMailSnippet(message.TextBody ?? message.HtmlBody),
                    Body = message.TextBody ?? message.HtmlBody ?? string.Empty,
                    IsRead = true
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tìm kiếm email qua IMAP.");
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, ct);
            }
        }
        return emails;
    }

    private async Task<EmailMessageDto?> GetImapDetailsAsync(UserEmailConfig config, string messageId, CancellationToken ct)
    {
        using var client = new ImapClient();
        try
        {
            await client.ConnectAsync(config.ImapHost, config.ImapPort ?? 993, config.UseSsl, ct);
            var password = _encryptionService.Decrypt(config.ImapPassword ?? string.Empty);
            await client.AuthenticateAsync(config.ImapUsername, password, ct);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly, ct);

            if (UniqueId.TryParse(messageId, out var uid))
            {
                var message = await inbox.GetMessageAsync(uid, ct);
                return new EmailMessageDto
                {
                    MessageId = messageId,
                    Subject = message.Subject ?? "(Không có tiêu đề)",
                    From = message.From.ToString(),
                    To = message.To.ToString(),
                    Date = message.Date.DateTime,
                    Snippet = GetMailSnippet(message.TextBody ?? message.HtmlBody),
                    Body = message.HtmlBody ?? message.TextBody ?? string.Empty,
                    IsRead = true
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy chi tiết email IMAP.");
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, ct);
            }
        }
        return null;
    }

    private async Task SendSmtpAsync(UserEmailConfig config, string toEmail, string subject, string body, CancellationToken ct)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(config.EmailAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = body };
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(config.SmtpHost, config.SmtpPort ?? 465, config.UseSsl, ct);
            var password = _encryptionService.Decrypt(config.SmtpPassword ?? string.Empty);
            await client.AuthenticateAsync(config.SmtpUsername, password, ct);
            await client.SendAsync(message, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi email qua SMTP.");
            throw;
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, ct);
            }
        }
    }

    #endregion

    #region Gmail Implementation

    private async Task<string> GetGmailAccessTokenAsync(UserEmailConfig config, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(config.GmailRefreshToken))
        {
            return config.GmailAccessToken ?? string.Empty;
        }

        var clientId = _configuration["Authentication:Google:ClientId"];
        var clientSecret = _configuration["Authentication:Google:ClientSecret"];

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            // Trả về access token hiện tại nếu chưa cấu hình phía máy chủ
            return config.GmailAccessToken ?? string.Empty;
        }

        using var client = _httpClientFactory.CreateClient();
        var requestContent = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "refresh_token", config.GmailRefreshToken },
            { "grant_type", "refresh_token" }
        };

        try
        {
            var response = await client.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(requestContent), ct);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
                if (json.TryGetProperty("access_token", out var accessTokenProp))
                {
                    return accessTokenProp.GetString() ?? string.Empty;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi làm mới Gmail Access Token.");
        }

        return config.GmailAccessToken ?? string.Empty;
    }

    private async Task<List<EmailMessageDto>> SearchGmailAsync(UserEmailConfig config, string? query, int maxResults, CancellationToken ct)
    {
        var emails = new List<EmailMessageDto>();
        try
        {
            var accessToken = await GetGmailAccessTokenAsync(config, ct);
            if (string.IsNullOrEmpty(accessToken))
            {
                _logger.LogWarning("Không tìm thấy Access Token Gmail hợp lệ.");
                return emails;
            }

            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={maxResults}";
            if (!string.IsNullOrEmpty(query))
            {
                url += $"&q={Uri.EscapeDataString(query)}";
            }

            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gmail API Search failed: {Status}", response.StatusCode);
                return emails;
            }

            var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            if (root.TryGetProperty("messages", out var messagesProp) && messagesProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var msgObj in messagesProp.EnumerateArray())
                {
                    var id = msgObj.GetProperty("id").GetString() ?? string.Empty;
                    if (!string.IsNullOrEmpty(id))
                    {
                        var detail = await GetGmailDetailsInternalAsync(client, id, ct);
                        if (detail != null)
                        {
                            emails.Add(detail);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tìm kiếm Gmail.");
        }
        return emails;
    }

    private async Task<EmailMessageDto?> GetGmailDetailsAsync(UserEmailConfig config, string messageId, CancellationToken ct)
    {
        try
        {
            var accessToken = await GetGmailAccessTokenAsync(config, ct);
            if (string.IsNullOrEmpty(accessToken)) return null;

            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            return await GetGmailDetailsInternalAsync(client, messageId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy chi tiết Gmail.");
            return null;
        }
    }

    private async Task<EmailMessageDto?> GetGmailDetailsInternalAsync(HttpClient client, string messageId, CancellationToken ct)
    {
        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}?format=full";
        var response = await client.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode) return null;

        var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        var snippet = root.TryGetProperty("snippet", out var s) ? s.GetString() ?? string.Empty : string.Empty;

        string subject = "(Không có tiêu đề)";
        string from = string.Empty;
        string to = string.Empty;
        DateTime? date = null;

        var payload = root.GetProperty("payload");
        if (payload.TryGetProperty("headers", out var headersProp) && headersProp.ValueKind == JsonValueKind.Array)
        {
            foreach (var header in headersProp.EnumerateArray())
            {
                var name = header.GetProperty("name").GetString();
                var value = header.GetProperty("value").GetString() ?? string.Empty;

                if (string.Equals(name, "Subject", StringComparison.OrdinalIgnoreCase)) subject = value;
                else if (string.Equals(name, "From", StringComparison.OrdinalIgnoreCase)) from = value;
                else if (string.Equals(name, "To", StringComparison.OrdinalIgnoreCase)) to = value;
                else if (string.Equals(name, "Date", StringComparison.OrdinalIgnoreCase))
                {
                    if (DateTime.TryParse(value, out var d)) date = d;
                }
            }
        }

        string body = string.Empty;
        var attachments = new List<EmailAttachmentDto>();
        
        if (payload.TryGetProperty("body", out var bodyProp) && bodyProp.TryGetProperty("data", out var dataProp))
        {
            var base64Data = dataProp.GetString();
            if (!string.IsNullOrEmpty(base64Data))
            {
                body = DecodeGmailBody(base64Data);
            }
        }
        
        if (string.IsNullOrEmpty(body) && payload.TryGetProperty("parts", out var partsProp) && partsProp.ValueKind == JsonValueKind.Array)
        {
            var sb = new StringBuilder();
            ParseGmailParts(partsProp, attachments, sb);
            body = sb.ToString();
        }

        return new EmailMessageDto
        {
            MessageId = messageId,
            Subject = subject,
            From = from,
            To = to,
            Date = date,
            Snippet = snippet,
            Body = string.IsNullOrEmpty(body) ? snippet : body,
            IsRead = true,
            Attachments = attachments
        };
    }

    private string DecodeGmailBody(string base64UrlStr)
    {
        try
        {
            var base64 = base64UrlStr.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }
            var bytes = Convert.FromBase64String(base64);
            return Encoding.UTF8.GetString(bytes);
        }
        catch
        {
            return string.Empty;
        }
    }

    private void ParseGmailParts(JsonElement parts, List<EmailAttachmentDto> attachments, StringBuilder sb)
    {
        foreach (var part in parts.EnumerateArray())
        {
            var mimeType = part.GetProperty("mimeType").GetString() ?? string.Empty;
            var filename = part.TryGetProperty("filename", out var f) ? f.GetString() ?? string.Empty : string.Empty;
            
            if (part.TryGetProperty("body", out var bodyProp))
            {
                if (bodyProp.TryGetProperty("attachmentId", out var attIdProp))
                {
                    var attId = attIdProp.GetString() ?? string.Empty;
                    var size = bodyProp.TryGetProperty("size", out var sProp) ? sProp.GetInt64() : 0;
                    attachments.Add(new EmailAttachmentDto
                    {
                        FileName = filename,
                        ContentType = mimeType,
                        Size = size,
                        AttachmentId = attId
                    });
                }
                else if (bodyProp.TryGetProperty("data", out var dataProp))
                {
                    var data = dataProp.GetString();
                    if (!string.IsNullOrEmpty(data))
                    {
                        var decoded = DecodeGmailBody(data);
                        if (mimeType == "text/plain" || mimeType == "text/html")
                        {
                            sb.AppendLine(decoded);
                        }
                    }
                }
            }
            
            if (part.TryGetProperty("parts", out var nestedParts) && nestedParts.ValueKind == JsonValueKind.Array)
            {
                ParseGmailParts(nestedParts, attachments, sb);
            }
        }
    }

    private async Task SendGmailAsync(UserEmailConfig config, string toEmail, string subject, string body, CancellationToken ct)
    {
        var accessToken = await GetGmailAccessTokenAsync(config, ct);
        if (string.IsNullOrEmpty(accessToken))
        {
            throw new InvalidOperationException("Không thể lấy Gmail Access Token để gửi thư.");
        }

        // Tạo MIME message thô và mã hoá sang Base64Url
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(MailboxAddress.Parse(config.EmailAddress));
        mimeMessage.To.Add(MailboxAddress.Parse(toEmail));
        mimeMessage.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = body };
        mimeMessage.Body = bodyBuilder.ToMessageBody();

        string rawMessage;
        using (var stream = new MemoryStream())
        {
            await mimeMessage.WriteToAsync(stream, ct);
            var bytes = stream.ToArray();
            rawMessage = Convert.ToBase64String(bytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }

        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.PostAsJsonAsync("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", new { raw = rawMessage }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errText = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Lỗi khi gửi Gmail qua API: {Error}", errText);
            throw new Exception($"Không thể gửi email qua Gmail API: {response.StatusCode}");
        }
    }

    #endregion

    #region Helper Methods

    private string GetMailSnippet(string? body)
    {
        if (string.IsNullOrEmpty(body)) return string.Empty;
        var text = body;
        if (body.Contains("<") && body.Contains(">"))
        {
            text = Regex.Replace(body, "<.*?>", string.Empty);
        }
        text = text.Replace("\r", " ").Replace("\n", " ").Replace("\t", " ");
        text = Regex.Replace(text, @"\s+", " ");
        text = text.Trim();
        return text.Length > 200 ? text.Substring(0, 200) + "..." : text;
    }

    public async Task SyncEmailsAsync(UserEmailConfig config, int userId, IApplicationDbContext context, CancellationToken ct = default)
    {
        if (config.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            await SyncGmailAsync(config, userId, context, ct);
        }
        else
        {
            await SyncImapAsync(config, userId, context, ct);
        }
    }

    private async Task SyncImapAsync(UserEmailConfig config, int userId, IApplicationDbContext context, CancellationToken ct)
    {
        using var client = new ImapClient();
        try
        {
            await client.ConnectAsync(config.ImapHost, config.ImapPort ?? 993, config.UseSsl, ct);
            var password = _encryptionService.Decrypt(config.ImapPassword ?? string.Empty);
            await client.AuthenticateAsync(config.ImapUsername, password, ct);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadOnly, ct);

            var maxUid = await context.UserEmailMessages
                .IgnoreQueryFilters()
                .Where(m => m.UserId == userId)
                .MaxAsync(m => (uint?)m.Uid, cancellationToken: ct) ?? 0;

            IList<UniqueId> uidsToFetch;
            var allUids = await inbox.SearchAsync(SearchQuery.All, ct);
            if (maxUid == 0)
            {
                uidsToFetch = allUids.TakeLast(100).ToList();
            }
            else
            {
                uidsToFetch = allUids.Where(uid => uid.Id > maxUid).ToList();
            }

            bool hasNew = false;
            foreach (var uid in uidsToFetch)
            {
                var exists = await context.UserEmailMessages
                    .IgnoreQueryFilters()
                    .AnyAsync(m => m.UserId == userId && m.Uid == uid.Id, cancellationToken: ct);

                if (exists) continue;

                var message = await inbox.GetMessageAsync(uid, ct);
                var atts = new List<EmailAttachmentDto>();
                if (message.Body != null)
                {
                    ExtractAttachments(message.Body, "", atts);
                }

                var emailMessage = new UserEmailMessage
                {
                    UserId = userId,
                    MessageId = uid.ToString(),
                    Uid = uid.Id,
                    Subject = message.Subject ?? "(Không có tiêu đề)",
                    From = message.From.ToString(),
                    To = message.To.ToString(),
                    Date = message.Date.DateTime,
                    Snippet = GetMailSnippet(message.TextBody ?? message.HtmlBody),
                    Body = message.TextBody ?? message.HtmlBody ?? string.Empty,
                    AttachmentsJson = JsonSerializer.Serialize(atts)
                };

                context.UserEmailMessages.Add(emailMessage);
                hasNew = true;
            }

            if (hasNew)
            {
                await context.SaveChangesAsync(ct);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đồng bộ IMAP về DB cho UserId {UserId}", userId);
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, ct);
            }
        }
    }

    private async Task SyncGmailAsync(UserEmailConfig config, int userId, IApplicationDbContext context, CancellationToken ct)
    {
        try
        {
            var accessToken = await GetGmailAccessTokenAsync(config, ct);
            if (string.IsNullOrEmpty(accessToken)) return;

            using var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var hasCached = await context.UserEmailMessages
                .IgnoreQueryFilters()
                .AnyAsync(m => m.UserId == userId, cancellationToken: ct);

            int maxResults = hasCached ? 30 : 100;
            var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={maxResults}";
            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return;

            var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
            if (root.TryGetProperty("messages", out var messagesProp) && messagesProp.ValueKind == JsonValueKind.Array)
            {
                bool hasNew = false;
                foreach (var msgObj in messagesProp.EnumerateArray())
                {
                    var id = msgObj.GetProperty("id").GetString() ?? string.Empty;
                    if (string.IsNullOrEmpty(id)) continue;

                    var exists = await context.UserEmailMessages
                        .IgnoreQueryFilters()
                        .AnyAsync(m => m.UserId == userId && m.MessageId == id, cancellationToken: ct);

                    if (exists) continue;

                    var detail = await GetGmailDetailsInternalAsync(client, id, ct);
                    if (detail != null)
                    {
                        var emailMessage = new UserEmailMessage
                        {
                            UserId = userId,
                            MessageId = id,
                            Uid = 0,
                            Subject = detail.Subject,
                            From = detail.From,
                            To = detail.To,
                            Date = detail.Date,
                            Snippet = detail.Snippet,
                            Body = detail.Body,
                            AttachmentsJson = JsonSerializer.Serialize(detail.Attachments)
                        };
                        context.UserEmailMessages.Add(emailMessage);
                        hasNew = true;
                    }
                }

                if (hasNew)
                {
                    await context.SaveChangesAsync(ct);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi đồng bộ Gmail về DB cho UserId {UserId}", userId);
        }
    }

    private void ExtractAttachments(MimeEntity entity, string prefix, List<EmailAttachmentDto> list)
    {
        if (entity is Multipart multipart)
        {
            for (int i = 0; i < multipart.Count; i++)
            {
                var subPrefix = string.IsNullOrEmpty(prefix) ? (i + 1).ToString() : $"{prefix}.{i + 1}";
                ExtractAttachments(multipart[i], subPrefix, list);
            }
        }
        else if (entity is MessagePart messagePart)
        {
            var subPrefix = string.IsNullOrEmpty(prefix) ? "1" : $"{prefix}.1";
            ExtractAttachments(messagePart.Message.Body, subPrefix, list);
        }
        else if (entity is MimePart mimePart && mimePart.IsAttachment)
        {
            list.Add(new EmailAttachmentDto
            {
                FileName = mimePart.FileName ?? "attachment",
                ContentType = mimePart.ContentType?.MimeType ?? "application/octet-stream",
                Size = mimePart.Content?.Stream?.Length ?? 0,
                PartSpecifier = prefix
            });
        }
    }

    private static MailKit.BodyPart? FindBodyPart(MailKit.BodyPart part, string specifier)
    {
        if (part.PartSpecifier == specifier)
            return part;
        if (part is MailKit.BodyPartMultipart multipart)
        {
            foreach (var child in multipart.BodyParts)
            {
                var found = FindBodyPart(child, specifier);
                if (found != null) return found;
            }
        }
        return null;
    }

    public async Task<(Stream Content, string ContentType, string FileName)> DownloadAttachmentAsync(
        UserEmailConfig config, 
        string messageId, 
        string? partSpecifier, 
        string? attachmentId, 
        CancellationToken ct = default)
    {
        if (config.Provider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            return await DownloadGmailAttachmentAsync(config, messageId, attachmentId ?? string.Empty, ct);
        }
        else
        {
            return await DownloadImapAttachmentAsync(config, messageId, partSpecifier ?? string.Empty, ct);
        }
    }

    private async Task<(Stream Content, string ContentType, string FileName)> DownloadImapAttachmentAsync(
        UserEmailConfig config, 
        string messageId, 
        string partSpecifier, 
        CancellationToken ct)
    {
        using var client = new ImapClient();
        await client.ConnectAsync(config.ImapHost, config.ImapPort ?? 993, config.UseSsl, ct);
        var password = _encryptionService.Decrypt(config.ImapPassword ?? string.Empty);
        await client.AuthenticateAsync(config.ImapUsername, password, ct);

        var inbox = client.Inbox;
        await inbox.OpenAsync(FolderAccess.ReadOnly, ct);

        if (UniqueId.TryParse(messageId, out var uid))
        {
            var summaries = await inbox.FetchAsync(new[] { uid }, MessageSummaryItems.BodyStructure, ct);
            var summary = summaries.FirstOrDefault();
            var bodyPart = summary?.Body != null ? FindBodyPart(summary.Body, partSpecifier) : null;
            if (bodyPart != null)
            {
                var entity = await inbox.GetBodyPartAsync(uid, bodyPart, ct);
                if (entity is MimePart mimePart)
                {
                    var contentStream = new MemoryStream();
                    await mimePart.Content.DecodeToAsync(contentStream, ct);
                    contentStream.Position = 0;
                    return (contentStream, mimePart.ContentType.MimeType, mimePart.FileName ?? "attachment");
                }
            }
        }
        throw new FileNotFoundException("Không tìm thấy tệp đính kèm yêu cầu.");
    }

    private async Task<(Stream Content, string ContentType, string FileName)> DownloadGmailAttachmentAsync(
        UserEmailConfig config, 
        string messageId, 
        string attachmentId, 
        CancellationToken ct)
    {
        var accessToken = await GetGmailAccessTokenAsync(config, ct);
        if (string.IsNullOrEmpty(accessToken))
        {
            throw new InvalidOperationException("Không thể lấy Gmail Access Token.");
        }

        using var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var url = $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}/attachments/{attachmentId}";
        var response = await client.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new FileNotFoundException("Tải tệp đính kèm từ Gmail API thất bại.");
        }

        var root = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        if (root.TryGetProperty("data", out var dataProp))
        {
            var base64UrlData = dataProp.GetString();
            if (!string.IsNullOrEmpty(base64UrlData))
            {
                var bytes = Convert.FromBase64String(base64UrlData.Replace('-', '+').Replace('_', '/'));
                var contentStream = new MemoryStream(bytes);
                return (contentStream, "application/octet-stream", "attachment");
            }
        }
        throw new FileNotFoundException("Tệp đính kèm trống hoặc không hợp lệ.");
    }

    #endregion
}
