;$(function(){
	
	// First, set up size of the content div based on the screen size
	
	// Next, set up the click handlers for displaying that content
	$('.innercontain').click(function() {
		var par = $(event.target).parent();
		$('.content').load('portfolio/index.html').hide().fadeIn();
		
		if (par.hasClass('skills')) {
			
		} else if (par.hasClass('about')) {
			
		} else if (par.hasClass('portfolio')) {
			
		} else	 {
			
		} 
	});
	
});