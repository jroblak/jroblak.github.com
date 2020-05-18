---
layout: post
title:  "NorthSec 2020 - Severity High Protector"
date:   2019-10-01 16:16:01 0600
categories: northsec csharp reversing crypto sha hacking writeup
---

<img class="header-img" src="{{ "img/sevhighprot.png" | relative_url }}" />

"Severity High Protector" was a challenge in Northsec's 2020 online CTF. Teams were given a zip file which contained two files:
1. `ExamSolution.txt.protected` - an encrypted file
2. `SeverityHighProtector.exe` - a binary with options to "Protect" or "Unprotect" a given file with a password.

The binary was .NET-based and it was not obfuscated, so I loaded it into `dnSpy` to get the full source code.

After skimming the code, it was obvious the most important pieces were in the `Protector` class, and specifically three places:

First, `CreateAes`:
{% highlight csharp %}
private void CreateAes()
{
  Rfc2898DeriveBytes rfc2898DeriveBytes = new Rfc2898DeriveBytes(this.password, new byte[]
  {
    42,
    42,
    42,
    42,
    7,
    7,
    7,
    7
  });
  this._aes = Aes.Create();
  this._aes.Mode = CipherMode.ECB;
  this._aes.Key = rfc2898DeriveBytes.GetBytes(16);
  this._aes.IV = rfc2898DeriveBytes.GetBytes(16);
}
{% endhighlight %}
The interesting part of this function is it's use of the `Rfc2898DeriveBytes` class. This class uses PBKDF2 to derive keys, using `HMACSHA1`.

Next, `Protect`. This function encrypted a file using the derived keys from `CreateAes`. Interestingly, it also appened the `SHA` hash at the start of the encrypted file in plaintext. 
{% highlight csharp %}
private void CreateAes()
internal void Protect(string filename)
{
  using (Stream stream = this.GetStream(filename))
  {
    using (Stream outStream = this.GetOutStream(filename + ".protected"))
    {
      outStream.Write(this.GetPasswordHash(this.password), 0, 20);
      using (ICryptoTransform cryptoTransform = this._aes.CreateEncryptor())
      {
        using (CryptoStream cryptoStream = new CryptoStream(outStream, cryptoTransform, CryptoStreamMode.Write))
        {
          int count = 1;
          while (count != 0)
          {
            byte[] buffer = new byte[1024];
            count = stream.Read(buffer, 0, 1024);
            cryptoStream.Write(buffer, 0, count);
          }
        }
      }
    }
  }
}
{% endhighlight %}

Finally, `Unprotect`. First, this checked if the password passed via `STDIN` matched the hash of the password stored in the encrypted file. Next, it performed a simple decryption.
{% highlight csharp %}
private void CreateAes()
internal void Unprotect(string filename)
{
  using (Stream stream = this.GetStream(filename))
  {
    byte[] array = new byte[20];
    stream.Read(array, 0, 20);
    if (!array.SequenceEqual(this.GetPasswordHash(this.password)))
    {
      Console.WriteLine("Bad password !");
    }
    else
    {
      using (Stream outStream = this.GetOutStream(filename + ".raw"))
      {
        using (ICryptoTransform cryptoTransform = this._aes.CreateDecryptor())
        {
          using (CryptoStream cryptoStream = new CryptoStream(outStream, cryptoTransform, CryptoStreamMode.Write))
          {
            int count = 1;
            while (count != 0)
            {
              byte[] buffer = new byte[1024];
              count = stream.Read(buffer, 0, 1024);
              cryptoStream.Write(buffer, 0, count);
            }
          }
        }
      }
    }
  }
}
{% endhighlight %}

The first, obvious approach was cracking the `SHA` hash. I started doing that while I did more research. I thought the fact that we had a `SHA1` hash, and the key derivation formula being based on `SHA` could be a potential avenue, and quickly able to find [this post](https://mathiasbynens.be/notes/pbkdf2-hmac) describing the following `PBKDF2_HMAC_SHA1(chosen_password) == PBKDF2_HMAC_SHA1(HEX_TO_STRING(SHA1(chosen_password)))` _if_ the chosen_password is larger than 64 bytes. 

From there, I took the decompilation from dnSpy, and created my own solution in Visual Studio, which copied the `Unprotect` and `CreateAes` functions. Luckily, `Rfc2898DeriveBytes` had a defintion which accepted two byte arrays, plus an interation count, so I simple updated `CreateAes` to be:
{% highlight csharp %}
private void CreateAes()
		{
			Rfc2898DeriveBytes rfc2898DeriveBytes = new Rfc2898DeriveBytes(sha1_bytes,  // sha1 hash expressed in raw byte form
      new byte[]    // original salt
			{
				42,
				42,
				42,
				42,
				7,
				7,
				7,
				7
			}, 1000);  // Default interation count is 1000, and required in this overload
			this._aes = Aes.Create();
			this._aes.Mode = CipherMode.ECB;
			this._aes.Key = rfc2898DeriveBytes.GetBytes(16);
			this._aes.IV = rfc2898DeriveBytes.GetBytes(16);
		}
{% endhighlight %}
I deleted the password hash check from `Unprotect`, compiled, ran, and got the flag!