using System.Security.Cryptography;
using System.Text;
using WorkForceManager.Application.Common.Interfaces;

namespace WorkForceManager.Infrastructure.Services;

/// <summary>
/// Triển khai dịch vụ mã hoá và giải mã mật khẩu hòm thư của người dùng bằng AES-256.
/// </summary>
public class EncryptionService : IEncryptionService
{
    private const string EncryptionKey = "SAIGON_SPICES_WF_SECRET_MAIL_KEY";

    public string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        byte[] iv = new byte[16];
        byte[] array;

        using (Aes aes = Aes.Create())
        {
            aes.Key = GetKeyBytes(EncryptionKey);
            aes.IV = iv;

            ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

            using (MemoryStream memoryStream = new MemoryStream())
            {
                using (CryptoStream cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
                {
                    using (StreamWriter streamWriter = new StreamWriter(cryptoStream))
                    {
                        streamWriter.Write(plainText);
                    }

                    array = memoryStream.ToArray();
                }
            }
        }

        return Convert.ToBase64String(array);
    }

    public string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        byte[] iv = new byte[16];
        byte[] buffer;
        try
        {
            buffer = Convert.FromBase64String(cipherText);
        }
        catch (FormatException)
        {
            return cipherText;
        }

        using (Aes aes = Aes.Create())
        {
            aes.Key = GetKeyBytes(EncryptionKey);
            aes.IV = iv;
            ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

            using (MemoryStream memoryStream = new MemoryStream(buffer))
            {
                using (CryptoStream cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read))
                {
                    using (StreamReader streamReader = new StreamReader(cryptoStream))
                    {
                        return streamReader.ReadToEnd();
                    }
                }
            }
        }
    }

    private byte[] GetKeyBytes(string key)
    {
        byte[] keyBytes = Encoding.UTF8.GetBytes(key);
        byte[] finalKey = new byte[32];
        Array.Copy(keyBytes, finalKey, Math.Min(keyBytes.Length, 32));
        return finalKey;
    }
}
