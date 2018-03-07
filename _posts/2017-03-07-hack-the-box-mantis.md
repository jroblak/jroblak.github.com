---
layout: post
title:  "Hack the Box - Mantis"
date:   2018-03-07 16:16:01 -0600
categories: hackthebox windows ad active directory escape hacking writeup
---

<img class="header-img" src="{{ "img/mantis/home.png" | relative_url }}" />

Let's start!

{% highlight shell %}
root@hack ~# nmap mantis.htb -p-
Nmap scan report for mantis.htb
Host is up (0.022s latency).
Scanning mantis.htb (10.10.10.52) [65535 ports]
53/tcp    open  domain       Microsoft DNS 6.1.7601
88/tcp    open  kerberos-sec Microsoft Windows Kerberos (server time: 2017-10-01 02:06:25Z)
135/tcp   open  msrpc        Microsoft Windows RPC
139/tcp   open  netbios-ssn  Microsoft Windows netbios-ssn
389/tcp   open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds Microsoft Windows Server 2008 R2 - 2012 microsoft-ds (workgroup: HTB)
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
1337/tcp  open  http         Microsoft IIS httpd 7.5
1433/tcp  open  ms-sql-s     Microsoft SQL Server 2014 12.00.2000
3268/tcp  open  ldap         Microsoft Windows Active Directory LDAP (Domain: htb.local, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5722/tcp  open  msrpc        Microsoft Windows RPC
8080/tcp  open  http         Microsoft IIS httpd 7.5
9389/tcp  open  mc-nmf       .NET Message Framing
47001/tcp open  http         Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
49152/tcp open  msrpc        Microsoft Windows RPC
49153/tcp open  msrpc        Microsoft Windows RPC
49154/tcp open  msrpc        Microsoft Windows RPC
49155/tcp open  msrpc        Microsoft Windows RPC
49157/tcp open  ncacn_http   Microsoft Windows RPC over HTTP 1.0
49158/tcp open  msrpc        Microsoft Windows RPC
49163/tcp open  msrpc        Microsoft Windows RPC
49167/tcp open  msrpc        Microsoft Windows RPC
49170/tcp open  msrpc        Microsoft Windows RPC
50255/tcp open  unknown
{% endhighlight %}

That is....a lot. The theme of this box is clearly patience and enumeration. There are a ton of rabbit holes we could go down to start, but it looks like `1337` and `8080` are serving HTTP, so let's start by scanning there. I usually start with `dirb` since it's quick and dirty and we can always bust out the bigger guns / bigger lists if need be. 

{% highlight shell %}
root@hack ~# dirb http://mantis.htb:1337
root@hack ~# dirb http://mantis.htb:8080
{% endhighlight %}

Unfortunately, this is one of thoses cases. `8080` comes back with some basic CMS-y stuff, but not much else. Some lightweight manual testing seems to indicate there's no SQLi here, and OrchardCMS looks up-to-date, so that looks like a dead end. Make a note to review the Orchard source code if we can't find anything else, and bust out some bigger scans (widen the search radius) with `dirbuster`/`gobuster` and a larger list, like `directory-list-2.3-medium.txt`.

While that runs, we can looks at some of the other ports here. There is definitely some interesting stuff, especially the exposed Active Directory, Kerberos, MSSQL Server:
{% highlight shell %}
root@hack ~# searchsploit kerberos
-------------------------------------------------------------------------------------------
Exploit Title                                                |  Path
                                                             |  (/usr/share/exploitdb/)
-------------------------------------------------------------------------------------------
...
Microsoft Windows - Kerberos Security Feature Bypass (MS16-014)
Microsoft Windows Kerberos - 'Pass The Ticket' Replay Security Bypass
Microsoft Windows Kerberos - Privilege Escalation (MS14-068)
Microsoft Windows Kerberos - Security Feature Bypass (MS16-101)
...
-------------------------------------------------------------------------------------------
root@hack ~# searchsploit active directory
...
{% endhighlight %}

Nothing useful pops out from the Active Directory search, but Kerberos brought back a few interesting leads. Why don't you go read up on them. I'll wait here.

Back? Good.
It looks like our scans are done, and this time a super suspicious directory pops out at us:
`secure_notes`, which has two files:
- `dev_notes_NmQyNDI0NzE2YzVmNTM0MDVmNTA0MDczNzM1NzMwNzI2NDIx.txt.txt`
- `web.config`
`web.config` just leads to a `500` error, but `dev_notes` talks about database set up, and something is definitely strange about that file name. Yup, its' base64:
{% highlight shell %}
root@hack ~# echo NmQyNDI0NzE2YzVmNTM0MDVmNTA0MDczNzM1NzMwNzI2NDIx | base64 -d
6d2424716c5f53405f504073735730726421
{% endhighlight %}
And that looks a lot like hex:
{% highlight shell %}
root@hack ~# echo NmQyNDI0NzE2YzVmNTM0MDVmNTA0MDczNzM1NzMwNzI2NDIx | base64 -d | xxd -r -p
m$$ql_S@_P@ssW0rd!
{% endhighlight %}
Hmmm, I wonder what this is for? With this password and the username (it's in the `dev_notes` file), you can either connect to the database and poke around manually, or use something like sqlmap to pull down the contents and search. Whichever you prefer, you'll come out with another username and password, and a quick test with `rpcclient` should confirm their use (since SMB is clearly running on port `445`. (https://pen-testing.sans.org/blog/2013/07/24/plundering-windows-account-info-via-authenticated-smb-sessions)[SANS has a great article on some of the fun things you can do with `rpcclient`]:
{% highlight shell %}
root@hack ~# rpcclient -Ujames mantis.htb
rpcclient $> srvinfo
10.10.10.52    Wk Sv Sql PDC Tim NT 
platform_id     : 500
os version      : 6.1
server type     : 0x80102f
{% endhighlight %}
From here, it's time to get box access / escalate. Did you do you research on some of our possible options? If you did you'd see that both `MS16-101` and `MS16-014` seems a little farfetched, as they required running applications on the host, something we can't do yet. `MS14-068` looks super interesting, however, since it could elevate our privleges to DA and probably get us code execution on the box. 

One of my favorite tools for working with Windows and its various networking protocols is (https://github.com/CoreSecurity/impacket)[impacket], and it has a great script for exploiting `MS14-068`. This is brain-dead simple, so I'll leave the rest as an exercise to the reader, but if you have any trouble, remember that you need all of the appropriate hostnames to resolve.

_fin_
