$(document).ready(function() {
	
	$('#content').children().hide();
	$('.selected').show();
	
	$('a').click(function() {
		$elem = $(this).attr('href');
		
		$('div').removeClass('selected');
		
		$($elem).addClass('selected');
		$('#content').children().hide();
		$('.selected').show();
		
	})
});