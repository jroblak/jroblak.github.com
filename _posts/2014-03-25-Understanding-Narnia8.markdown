---
layout: post
title:  "Understanding Narnia 8"
date:   2014-03-25 18:42:60
categories: wargames hacking narnia overthewire re
---
I noticed that one of my more informative posts went down, so here it is, recreated. It's interesting to read back on how challenging this sort of thing used to be:

While progressing through [overthewire.org](overthewire.org)'s various wargames, I hit a snag on *Narnia 8*, and found close to no documentation on its solution (let alone a hint!). Therefore, I've taken it upon myself to provide some insight; hopefully this gets propagated to anyone who needs it. Feel free to send me any tips to shorten my solution!

First, for those of you who don't want to see how to solve it: don't look any further than the next couple of lines.

Here's your hint:
> Why isn't your full input getting printed via printf in _void func(char *b)_, and why are seemingly random characters there instead? Where are those characters coming from, and how can we get _bok_ to keep pulling the data from _blah_?

Now, for the explanation: First, let's take a look at the code (Since it's available for narnia. You won't always have this luxury), and try to get a feel for the type of exploit we need to use.

![step1]({{ site.url }}/img/narnia8/catcode.png)

Here, we see that we provide input via a command line argument, and a pointer to that argument gets passed to the function _func()_. In _func()_, that pointer gets copied to the local variable _char *blah_. Next, a char array of size 20, _bok_, is declared. The contents at the address of _blah_ (also the address of _b_, which is the address of argv[1]), gets copied to _bok_, which is then output using a correctly formatted printf function.

Based on this, it looks like our best option is a shellcode injection, with the shellcode stored in an environmental variable.

![step1]({{ site.url }}/img/narnia8/shellcode.png)

Here we inject a simple NOP-sled led, 26 bytes execve /bin/sh shellcode payload into a new env variable we call EGG. We then use genenvaddr.c (if you don't know what this is, or how to write it, google "getenvaddr.c") to locate the address where that shellcode will be stored for injection, which is this case \xf3\xd8\xff\xff. Now the easy part is over, it's time to open GDB and get to work.

![step1]({{ site.url }}/img/narnia8/gdb.png)

The first thing we need to do is get a proper breakpoint set up, so we can examine memory properly. We know that we are going into a function named _func_, so let's set a breakpoint there.

![step1]({{ site.url }}/img/narnia8/gdb1.png)

Lets also set our disassembly flavor to intel (Personal preference. I think it's easier to read).

![step1]({{ site.url }}/img/narnia8/gdb2.png)

And go:

![step1]({{ site.url }}/img/narnia8/gdb3.png)

Unfortunately, our breakpoint at the start of _func_ isn't going to cut it. We need to be able to see what the memory looks like after it's been copied from _blah_ to _bok_. So, we start the program with just one character (so we don't get stuck doing 20 iterations of the loop), and step through the program using nexti, until we see the printf fire.

![step1]({{ site.url }}/img/narnia8/gdb4.png)

Let's set a breakpoint here, and delete our old, unnecessary one. Now it's time to get into the actual meat of the problem.

![step1]({{ site.url }}/img/narnia8/gdb5.png)

We run the program with 19 chars (no overflowing buffers), and see what our memory looks like. First, we disass to see what the size of our stack frame is (via sub esp, 0x38. We then use that to examine the memory of our stack via x/38x $esp. This gives us a view of our current stack frame, from the bottom up (i.e. low memory address to high). Here we can see several interesting things. The most noticeable thing is our <span style="color: #ff8e51">19 A's (hex 41)</span>. Next, right above that in memory, is <span style="color:#7975FF">_blah_ (the address of _b/argv[1]_)</span>. We see that this address is displayed twice, it's pushed on the stack first as a parameter (b), then copied as a local variable (_blah_). And in between these is our <span style="color: #ff2d62">return address</span>, 0x804846d that we need to override.

![step1]({{ site.url }}/img/narnia8/gdb6.png)

Now we run the program again, and overflow the _bok_ buffer this time. This second run gives us our big break/hint. When we examine what happened here, we see two things. 1.) The output does not match the input, it looks like bok got some crazy stuff inserted into it somehow. When we examine the memory again, we can see why. Again, we see our <span style="color: #ff8e51">20 A's</span>, and <span style="color: #ff2d62">return address</span> (which we couldn't override!). Looking at our <span style="color:#7975FF">pointer variables</span>, we can quickly determine what happened. It looks like when _bok_ overflowed and wrote into _blah_, which is the address we were reading from! Once _blah_'s address changed, we were no longer reading what we wanted, and the gibberish got copied. Now our solution should be relatively clear; in order to keep reading from the right address, when we overflow _bok_ on our way to overwrite the <span style="color: #ff2d62">return address</span>, we need to overwrite _blah_ with itself / it's address!

So if we sketch out our proposed solution now, we have the following:

          bok (20 bytes)        blah (4)         junk (12)   return address (4)
     [AAAAAAAAAAAAAAAAAAAA][address of b\blah][AAAAAAAAAAAA][EGG address]

Let's use this, and see if we can overflow the return address:

![step1]({{ site.url }}/img/narnia8/gdb7.png)

As we can see from the first run, we still have a small hiccup: as the size of our input changes, so does the address of <span style="color: #ff8e51">_b / blah_</span>, so that they still don't match. However, if we use the <span style="color:#7975FF">new address of _b_</span> in our next run, it works; the overflow continues, and we overwrite our <span style="color: #ff2d62">return address</span> with 4 A's. Our last step is to simple replace those A's with the address of EGG, and we have shell as narnia9!

![step1]({{ site.url }}/img/narnia8/gdb8.png)

....which unfortunately doesn't work within gdb. So:

![step1]({{ site.url }}/img/narnia8/gdb9.png)

As you can see, the address isn't 100% accurate between gdb and outside gdb. However, if we fiddle with the least significant byte a little bit, we get shell access to narnia9 in no time!

And that's it, you're done with narnia 8. I hope this was helpful.

