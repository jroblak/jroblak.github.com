;$(function(){
	
	// First, set up size of the content div based on the screen size
	var height = $(window).height(); 
	var width = $(window).width();
	
	var contentDiv = width - 700;
	
	$('.rightcontain').width(contentDiv);
	
	// Next, set up the click handlers for displaying that content
	var loaded = false;
	var selected = null;
	
	$('.nav').click(function() {
		$(this)
		if ($(this).is('#skills')) {
			$(this).addClass('highlight').css('font-size', 24);
			$(this).siblings().css('font-size', 10).removeClass('highlight');
			$('.content').load('pages/skills.html').hide().fadeIn();
		} else if ($(this).is('#about')) {
			$(this).addClass('highlight').css('font-size', 24);
			$(this).siblings().css('font-size', 10).removeClass('highlight');
			$('.content').load('pages/about.html').hide().fadeIn();
		} else if ($(this).is('#portfolio')) {
			$(this).addClass('highlight').css('font-size', 24);
			$(this).siblings().css('font-size', 10).removeClass('highlight');
			$('.content').load('portfolio/index.html').hide().fadeIn();
		} else	 {
			$(this).addClass('highlight').css('font-size', 24);
			$(this).siblings().css('font-size', 10).removeClass('highlight');
			$('.content').load('pages/contact.html').hide().fadeIn();
		} 
	});
	
});