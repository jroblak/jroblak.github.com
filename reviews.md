---
layout: post
---
{% for review in site.reviews %}
  <div class="post">
    <a href="{{ review.url }}">{{ review.title }}</a>
  </div>
{% endfor %}
