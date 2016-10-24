---
layout: page
title: Mesh Tools
role: Developer
platform: Unity Library
---

<a href="https://github.com/JonathanReid/MeshTools">![Mesh Tools]({{ site.baseurl }}/public/images/meshtools/image1.jpg "Mesh Tools")</a>
 
[Mesh Tools](https://github.com/JonathanReid/MeshTools) is a Unity library to help easily create 2D meshes from a set of points. This library came out of Rugged Rovers as I needed a way to build various 2D mesh types easily, and has since gone on to be used in SNOMAN, bubble trubble and other projects.

It facilitates the creation of:

* 2D Polygons
* Lines
* Splines
* Circles - with percentage fill
* Donuts - with percentage fill

Some basic syntax for creating a 2D Polygon with Mesh Tools:
{% highlight c# %}
private void BuildPolygon(List<Vector2> points)
{
	Mesh2D.Instance.Build(points, HandleShapeBuilt, Color.white);
}

private void HandleShapeBuilt(Shape shape)
{
	//shape has been constructed
	//polygon details contained within shape.
}
{% endhighlight %}

For lines, its very similar, but it doesnt have a callback.
{% highlight c# %}
private void BuildLine(List<Vector2> points)
{
	Shape shape = Line2D.Instance.Build(points, LineWidth, Color.white, null);
}
{% endhighlight %}

And for circles, its just the same.
{% highlight c# %}
private void BuildCircle(float radius)
{
	Shape shape = Circle2D.Instance.Build(radius, 20);
}
{% endhighlight %}

All shapes return the Shape class, which help you track, and rebuild your geometry if you need to.

<center>
<a href="https://github.com/JonathanReid/MeshTools">Download Mesh Tools on GitHub</a>
</center>