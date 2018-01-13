---
layout: post
title:  "Why everyone should CTF"
date:   2017-11-17 16:16:01 -0600
categories: essay
---
I've become a big proponent of Capture the Flags, and I know that they've made me a better programmer. I would recommend anyone who hasn't given them a try to do so (p.s. I think you could probably extend these same arguments outside of the non-programming world to things like escape rooms as well). Why? Well...

1. They're really fun. They're basically giant, interconnected puzzles, and I don't think its a coincidence that a <a href="http://store.steampowered.com/tag/en/Hacking/#p=0&tab=TopSellers">mini-genre</a> has <a href="http://store.steampowered.com/agecheck/app/491950/">spun</a> <a href="http://store.steampowered.com/app/1510/Uplink/">up</a> <a href="http://store.steampowered.com/app/400110/Else_HeartBreak/">around</a> <a href="http://store.steampowered.com/app/365450/Hacknet/">"faking"</a> <a href="http://store.steampowered.com/app/469920/hackmud/">them</a>. They give you a simple goal, and a whole world to explore; there are no rules, limitiations, or hand rails (a la open world games). 

    There is also a huge variety of what you'll encounter: cryptography, binary reverse engineering, steganography, web application exploitation, Active Directory, SMB, Alternate Data Streams, and so much more.

2. You learn _a lot_. You can't hack something you don't understand, and that means you have to educate yourself everytime you come across a new technology. Did you find an RSA public key? You'll probably want to know how RSA works to see if you can break it. Is a weird error message coming back when you try to login to something? Maybe it could be vulnerable to SQL injection, so you better look at up.

3. It gets you in a builder's mindset. Building (ha) on my previous point, not only do you know have know how things work, but you also have to think about _why_ they work that way and _how_ someone would use them in the real world. To give a real world example, let's say that the root (Administrator) account is running a task that is changing the permissions all of the files in a certain folder every minute (in order to make things more 'secure'). To be able to exploit this, we need to think about _how_ one would set up that job. How would you schedule it? What commands would you have it run? (I would probably set up a `cronjob` that runs something like `chmod -R nobody:nobody /directory/*`. <a href="https://www.defensecode.com/public/DefenseCode_Unix_WildCards_Gone_Wild.txt">I sure hope that isn't vulnerable</a>).

4. Best of all, they're usually free, and not much tops the feeling of accomplishment that you get after stringing together 6 different vulnerabilities in order to `cat /root/root.txt`. If you ever wanted to feel like James Bond, Lorraine Broughto, Darlene or Elloit Alderson, this will feed that rush.

If you're interested, I recommend checking out <a href="https://hackthebox.eu">Hack The Box</a>. It's really well done, has handy difficulty rankings, tons of challenges, and a great community to help get you started.