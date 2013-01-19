;$(function(){
	
	console.log($(window).width());
	// Check for mobile devices
	if ($(window).width() < 480 || $(window).height() < 480) {
		$('.nav').click(function() {
			$(this)
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
		var height = $(window).height(); 
		var width = $(window).width();
	
		var contentDiv = width - 730;
	
		$('.rightcontain').width(contentDiv);
	
		// Next, set up the click handlers for displaying that content
		var loaded = false;
		var selected = null;
	
		$('.nav').click(function() {
			$(this)
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