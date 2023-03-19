---
layout: post
---
{% assign me = site.predictions | where: "who", "me" %}
{% assign others = site.predictions | where: "who", "others"  %}

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
