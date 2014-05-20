---
layout: post
title:  "Backing Up Evernote"
date:   2014-04-25 18:42:60
categories: evernote backup
---
I'm a big believer in frequent backups, and I realized I had one big weak spot: Evernote. I keep all of my day-to-day notes and thoughts in various notes and notebooks, and losing even a small chunk of those could be catastrophic (melodramtic, I know).

While searching around the internet, I only came across a few manual solutions, so I quickly threw something together using Windows Task Scheduler which I'll walk through. The exact same thing could be done using OSX/UNIX via cron jobs and the like. Maybe I'll tackle that in another post.

First, you're going to want to open Evernote to find where your Database is stored. The default is C:\Users\[UserName]\AppData\Local\Evernote\Evernote\Databases. However, you can find yours via Tools -> Options -> General

Now you're going to want to set up a folder where you want your backups to go. An external drive would be best, but something like Dropbox or Google Drive would also work. Create a folder named "EvernoteBackup" where ever you choose.

Next, open a text editor of your choice, so we can create a .BAT file to backup your Database as frequently as you want. Type or copy the following into the editor:

{% highlight bat %}
@ECHO OFF

:: Edit this to be wherever your Dropbox database is
SET BackupFolder=%HOME%\AppData\Local\Evernote\Evernote\Databases
:: Edit this to be wherever your want your backups to go
:: e.g. for Dropbox: SET RemoteLoc=%HOME%\Dropbox\EvernoteBackup
SET RemoteLoc=D:\Backups\Evernote

:: This sets up variable for time for timestamps on our backups
@For /F "tokens=1-4 delims=/.- " %%A in ('date /T') do (
   set DATE_DOW=%%A
   set DATE_MM=%%B
   set DATE_DD=%%C
   set DATE_YYYY=%%D
)
set DATE_YY=%DATE:~12,2%
set SAVE_DATE=%DATE_YYYY%%DATE_MM%%DATE_DD%

XCOPY %BackupFolder% %RemoteLoc%\%SAVE_DATE%_EvernoteDatabase
/E /C /R /I /K /Y
{% endhighlight %}

Then save this file as a .BAT file, and place it anywhere (I put it in the same folder as my Evernote back ups), but be sure to note where you save it.

Finally, open up the Windows Task Scheduler, and in the right pane, click on "Create Basic Task...". Now all one has to do it walk through the basic wizard by picking a name, how frequently the backup should run, and when it should run. When you get to the "Action" step, pick "Start a program," and then choose the .BAT file that you just saved. Save it and you're good to go!

An optional step is zipping the backed up folder to save space. To do this, you have to add a zipping programing to your PATH (Control Panel -> System -> Advanced system settings -> Environment Variables.. -> Path (under System Variables) -> Edit...; type in the path to the zipping program - be sure to start with a semi-colon [e.g. ;C:\Program Files\7-Zip]). Then you can just add the following to the bottom of the .BAT file:

{% highlight bat %}
7z a -t7z %RemoteLoc%\%SAVE_DATE%_EvernoteDatabase.7z %RemoteLoc%\%SAVE_DATE%_EvernoteDatabase

rmdir /s /q %RemoteLoc%\%SAVE_DATE%_EvernoteDatabase
{% endhighlight %}

And that's it! Your Evernote database is backed up as frequently as you want.
