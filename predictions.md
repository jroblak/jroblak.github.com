---
layout: post
---
{% assign me = site.predictions | where: "who", "me" %}
{% assign others = site.predictions | where: "who", "others"  %}

<div id="quote">
  <p><i>It’s frightening to think that you might not know something, but more frightening to think that, by and large, the world is run by people who have faith that they know exactly what’s going on.<i><br/>
- Amos Tversky</p>
</div>

<h5>my predictions</h5>
{% for mes in me %}
  <div class="post">
    <a href="{{ mes.url }}">{{ mes.title }}</a>
  </div>
{% endfor %}
<br/>

<h5>others' predictions</h5>
{% for other in others %}
  <div class="post">
    <a href="{{ other.url }}">{{ other.title }}</a>
  </div>
{% endfor %}
<br/>
