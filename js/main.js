;$(function(){

	// Check for mobile devices or small screens - I don't really care about height
	if ($(window).width() < 700) {
		$('.nav').click(function() {
			if ($(this).is('#skills')) {
				$(this).addClass('highlight').css('font-size', 18);
				$(this).siblings().css('font-size', 10).removeClass('highlight');
				$('.content').load('pages/skills.html').hide().fadeIn();
			} else if ($(this).is('#about')) {
				$(this).addClass('highlight').css('font-size', 18);
				$(this).siblings().css('font-size', 10).removeClass('highlight');
				$('.content').load('pages/about.html').hide().fadeIn();
			} else if ($(this).is('#portfolio')) {
				$(this).addClass('highlight').css('font-size', 18);
				$(this).siblings().css('font-size', 10).removeClass('highlight');
				$('.content').load('portfolio/index.html').hide().fadeIn();
			} else if ($(this).is('#contact'))	 {
				$(this).addClass('highlight').css('font-size', 18);
				$(this).siblings().css('font-size', 10).removeClass('highlight');
				$('.content').load('pages/contact.html').hide().fadeIn();
			} else {
				$(this).addClass('highlight').css('font-size', 18);
				$(this).siblings().css('font-size', 10).removeClass('highlight');
				$('.content').html('<a href="http://blog.justinoblak.com">a blog!</a>').hide().fadeIn();
			}
		});
	} else {
      // First, set up size of the content div based on the screen size
      var width = $(window).width();

      var contentDiv = width - 700;

      $('.rightcontain').width(contentDiv);

      // Next, set up the click handlers for displaying that content
      var loaded = false;
      var selected = null;

      $('.nav').click(function() {
        if ($(this).is('#skills')) {
          $(this).addClass('highlight').css('font-size', 18);
          $(this).siblings().css('font-size', 10).removeClass('highlight');
          $('.content').load('pages/skills.html').hide().fadeIn();
        } else if ($(this).is('#about')) {
          $(this).addClass('highlight').css('font-size', 18);
          $(this).siblings().css('font-size', 10).removeClass('highlight');
          $('.content').load('pages/about.html').hide().fadeIn();
        } else if ($(this).is('#portfolio')) {
          $(this).addClass('highlight').css('font-size', 18);
          $(this).siblings().css('font-size', 10).removeClass('highlight');
          $('.content').load('portfolio/index.html').hide().fadeIn();
        } else if ($(this).is('#contact'))	 {
          $(this).addClass('highlight').css('font-size', 18);
          $(this).siblings().css('font-size', 10).removeClass('highlight');
          $('.content').load('pages/contact.html').hide().fadeIn();
        } else {
          $(this).addClass('highlight').css('font-size', 18);
          $(this).siblings().css('font-size', 10).removeClass('highlight');
          $('.content').html('<a href="http://blog.justinoblak.com">a blog!</a>').hide().fadeIn();
        }
		});
	}
});
