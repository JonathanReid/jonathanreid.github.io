---
layout: page
title: Scaffolding
role: Developer
platform: Unity library
---

<a href="https://github.com/JonathanReid/Scaffolding">![Scaffolding]({{ site.baseurl }}/public/images/scaffolding/image1.png "Scaffolding")</a>
 
[Scaffolding](https://github.com/JonathanReid/Scaffolding) is a View framework system for Unity, based on the popular MVC approach. While Scaffolding follows a more MV style, it is open enough to allow users to create what ever structure they want, without imposing on their way of working.

Basically, Scaffolding is a way to structure screens in a game, and navigate between them. It helps rapidly set up game flow, and create great UI. Scaffolding tries its best to keep memory low for you, although it can't fix a programmers own problems, the core has a low footprint, and the way its structured helps to keep memory low across the whole application.

Scaffolding has been used in a number of games, such as Story Cards, TyrAnt, Love Connection, Rugged Rovers and several more Preloaded games. Infact, Scaffolding made it possible for several of these games to run on platforms that they previously couldnt run on due to memory constraints. 

By splitting each screen into a prefab, and only loading it into memory when needed, you can keep the memory usage of your game low and controlled.

Heres some simple syntax used in Scaffolding to request views:

{% highlight c# %}
//Basic navigation
RequestView<MyGameView>();
RequestOverlay<MyPauseOverlay>();

//And to close an overlay...
RequestOverlayClose<MyPauseOverlay>();

//as only one view at a time can be open, there is no close view
//but you can have as many overlays open as you want.

//and if you wanted to send some information to a view...
SObject data = new SObject();
data.AddBool("SomeBool", true);
SendDataToView<MyPauseOverlay>();

//when you next call a request for that view, it will recieve
//the data object in OnShowStart()
{% endhighlight %}

For more examples, check out the demo scenes in the repository.

<center>
[Download Scaffolding on GitHub](https://github.com/JonathanReid/Scaffolding) 
</center>