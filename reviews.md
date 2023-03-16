---
layout: post
---
{% assign games = site.reviews | where:'games', games.type %}
{% assign films = site.reviews | where:'films', films.type %}
{% assign other = site.reviews | where:'other', other.type %}

<h2>films</h2>
{% for review in films %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
  </div>
{% endfor %}

<h2>games</h2>
{% for review in games %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
  </div>
{% endfor %}

<h2>other</h2>
{% for review in other %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
  </div>
{% endfor %}
