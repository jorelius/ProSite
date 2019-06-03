---
title: "Listen and it shall Speak"
date: "2017-10-25T22:12:03.284Z"
template: "post"
draft: false
slug: "/posts/listen-and-it-shall-speak/"
category: "Tools"
tags:
  - "Open source"
  - "Text to speech"
  - "Tool"
description: "Speak is a command line utility for reading text aloud or writing the audio data to file."
---

![headphones-yellow.jpg](/media/headphones-yellow.jpg)

Speak is a command line utility for reading text aloud or writing the audio data to file. Speak was created with the intention that it should do one thing well and work well with others. In that vein, you can couple Speak with other applications. In PowerShell, there is a PowerShell applet that can retrieve the contents of the clipboard. Speak is designed to allow piping input.

## Usage

### Basic

```console
$ speak -t "speak now listen"
```

### Pipe text

```console
$ Get-Clipboard | speak
```


[github](https://github.com/jorelius/Speak)