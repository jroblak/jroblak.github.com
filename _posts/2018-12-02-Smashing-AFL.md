---
layout: post
title:  "Smashing American Fuzzy Lop with Hack the Box"
date:   2018-12-02 16:16:01 -0600
categories: hackthebox essay afl american fuzzy lop fuzzing c programming tutorial smasher
---
Fuzzing is something that everyone has heard about, but isn't used as nearly as often
as it should be. I think one of the reasons is that it has a reputation for being harder
then it really is. I want to use an example reversing challenge from the machine "Smasher" on
[Hack The Box](https://hackthebox.eu) to demonstrate just how easy it is. You can find the code
I use in this example by attempting the box, or probably in one of the various writeups
across the internet.

One of the things I like to do on binary exploitation challenges like Smasher's is
to start an [American Fuzzy Lop](http://lcamtuf.coredump.cx/afl/) (AFL) process while I manually
review the source and/or assembly. This not only serves to give me helpful guidance on
which parts of the application to review on large-scale applications, but it also catches
potentially edge cases that I would have never though of. This is exactly what I did on
Smasher.

To start, AFL works by using the signals emitted from a process as it executes. For example,
if it detects a `SIGSTOP`, it assumes that fuzzing iteration completed without error, whereas
a `SIGSEV` would be reporting in the findings as a potential crash. The simplest way to do this
is to compile the target application with an AFL-based compiler, so we modify the original Makefile:
{% highlight shell %}
CC = gcc
CFLAGS = -Wall -O2

# LIB = -lpthread

all: tiny

tiny: tiny.c
	$(CC) $(CFLAGS) -g -fno-stack-protector -z execstack -o tiny tiny.c $(LIB)

clean:
	rm -f *.o tiny *~
{% endhighlight %}

To look something like this:
{% highlight shell %}
CC = afl-clang-fast
CFLAGS = -Wall -O2

# LIB = -lpthread

all: tiny-fuzzy

tiny-fuzzy: tiny.fuzzy.c
	$(CC) $(CFLAGS) -g -fno-stack-protector -z execstack -o tiny-fuzzy tiny.fuzzy.c $(LIB)

clean:
	rm -f *.o tiny-fuzzy *~
{% endhighlight %}

All we had to do was swap out the compiler in the Makefile. Super easy. Unfortunately, we're not
quite done yet. Because the binary on Smasher is a web server, it utilizes both `fork`, as well as
`bind`, `accept`, `connect`, et al. This presents us with a few challenges.

First, AFL expects the process to terminate after every fuzzing iteration; however, a web server
like the one we're dealing with runs in an infinite loop _and_ forks into child processes, both of
which can prevent AFL from doing it's job:
{% highlight c %}
int process(int fd, struct sockaddr_in *clientaddr){
    int pid = fork();  // <- forking into child processes is an issue
    if(pid==0){
    if(fd < 0)

    // === Code snipped for brevity ===

    log_access(status, clientaddr, &req);
    return 1;
    }
return 0;
}
    // === Code snipped for brevity ===

    while(1){  // <- infinite looping is an issue
        connfd = accept(listenfd, (SA *)&clientaddr, &clientlen);
        if(connfd > -1)  {
            int res = process(connfd, &clientaddr);
            if(res == 1)
			exit(0);
            close(connfd);
        }
    }

    // === Code snipped for brevity ===

{% endhighlight %}

The fix for this is extremely simple: remove the problems! Simply comment out the call to `fork` and
the surrounding `pid` checks, and remove the infinite loop (or, return the appropriate signal at the end
of each loop):
{% highlight c %}
int process(int fd, struct sockaddr_in *clientaddr){
    // int pid = fork();
    //if(pid==0){
    //if(fd < 0)
	//return 1;

    // === Code snipped for brevity ===

    log_access(status, clientaddr, &req);
    return 1;
  //}
//return 0;
}

// === Code snipped for brevity ===

    while(1) {
        connfd = accept(listenfd, (SA *)&clientaddr, &clientlen);
        if(connfd > -1)  {
            int res = process(connfd, &clientaddr);
            if(res == 1)
                exit(0);
        }
        close(connfd);
        raise(SIGSTOP);
    }

    // === Code snipped for brevity ===

{% endhighlight %}

The reason I opted for a `raise(SIGSTOP)` instead of removing the infinite loop is that it
allows AFL to continue to running the same process until a potential issue, greatly speeding up
the number of attempts per second. Otherwise, it would have to spin up a new process on every
single iteration.

That's all the changes we have to make to the code. Pretty easy right? Build the AFL-ified server (after you
install afl, of course):
{% highlight shell %}
➜  make
{% endhighlight %}

There is only one last challenge to deal with: the networking calls. AFL works by passing input into a program and then
seeing what happens, and that's it. It isn't built to support connecting to a socket and delivering
input that way. To get a around this, there is a great tool named [Preeny](https://github.com/zardus/preeny).

For our purposes, one of the modules compiled is `desock`, which moves all `socket`-based operations to the
console's `stdin`, `stdout`, `stderr`, etc! Once downloaded and compiled, all that is required is to use
`LD_PRELOAD` to make sure Preeny's libraries overwrite the standard library!

Ok, almost there! As I mentionned earlier, AFL works by passing input into our target binary, and then
mutating that as it detects (or doesn't detect) irregular behavior. In order to do this, it needs a starting
point of known "good" input that it can mutate. It also needs somewhere to put its findings:
{% highlight shell %}
➜  mkdir findings
➜  mkdir testcases
➜  cat << EOF > testcases/in.txt
➜  > GET /index.html HTTP/1.1
➜  > Range: bytes=1-999999
➜  > EOF
➜  mkdir findings
{% endhighlight %}

And with that, we're readying. Simply launch AFL, use `LD_PRELOAD` to overwrite the networking calls,
and specify the appropriate directories:
{% highlight shell %}
➜  LD_PRELOAD=preeny/x86_64-pc-linux-gnu/desock.so afl-fuzz -i testcases -o findings ./tiny-fuzzy
{% endhighlight %}

In a very short amount of time, AFL finds the binary and its very first crash, a buffer overflow on the URL:
{% highlight shell %}
➜  cat findings/crashes/id/id:000000,sig:11,src:000002,op:havoc,rep:2
GET /ihhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhndex.hthl hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhnd%x.html
Range: bytes=1-99
{% endhighlight %}

Pretty awesome, right? This may seem like a lot of work to find a simple buffer overflow, but once you
have these basics down, the required changes often only take ten minutes, and the output can be awesome.