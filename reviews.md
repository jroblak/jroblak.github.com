---
layout: post
---
{% assign games = site.reviews | where:'games', games.type %}
{% assign films = site.reviews | where:'films', films.type %}
{% assign other = site.reviews | where:'other', other.type %}

<h5>films</h5>
{% for review in films %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
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
{% for review in other %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
  </div>
{% endfor %}
