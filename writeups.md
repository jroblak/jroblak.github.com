---
layout: post
---
{% for post in site.posts %}
  {% if post.categories contains "writeup" %}
  <div class="post">
    <a href="{{ post.url }}">{{ post.title }}</a>
  </div>
  {% endif %}
{% endfor %}
