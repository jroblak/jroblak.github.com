;$(function(){
	
	// First, set up size of the content div based on the screen size
	
	// Next, set up the click handlers for displaying that content
	$('.nav').click(function() {

		//$('.content').load('portfolio/index.html').hide().fadeIn();
		if ($(this).is('#skills')) {
			console.log('skills');
		} else if ($(this).is('#about')) {
			
		} else if ($(this).is('#portfolio')) {
			
		} else	 {
			
		} 
	});
	
	$('.nav').hover(function() {
		$(this).addClass('highlight');
	}, function() {
		$(this).removeClass('highlight');
	});
	
});