---
layout: post
---
{% assign games = site.reviews | where: "type", "game" %}
{% assign films = site.reviews | where: "type", "film"  %}
{% assign other = site.reviews | where: "type", "other" %}

<h5>films</h5>
{% for film in films %}
  <div class="post">
    <a href="{{ film.url }}">{{ film.title }}</a>
  </div>
{% endfor %}
<br/>

<h5>games</h5>
{% for review in games %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
  </div>
{% endfor %}
<br/>

<h5>other</h5>
{% for thing in other %}
  <div class="post">
    <a href="{{ thing.url }}">{{ thing.title }}</a>
  </div>
{% endfor %}
