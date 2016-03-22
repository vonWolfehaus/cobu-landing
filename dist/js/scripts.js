(function() {
	var obfus = document.getElementById('js-feedback-form');
	var closeBtn = document.getElementById('js-feedback-form__close');
	var openBtn = document.getElementById('feedback-form__open');
	var sendBtn = document.getElementById('js-feedback-form__send');

	closeBtn.addEventListener('click', function(evt) {
		obfus.classList.remove('is-visible');
	});

	openBtn.addEventListener('click', function(evt) {
		obfus.classList.add('is-visible');
	});

	sendBtn.addEventListener('click', function(evt) {
		var form = document.forms.feedback.elements;
		var email = form['feedback-email'].value;
		var comment = form['feedback-textarea'].value;

		/*if (email === '' || comment === '' || form['feedback-email'].parentNode.classList.contains('is-invalid')) {
			evt.preventDefault();
			return false;
		}*/

		closeBtn.disabled = true;
		sendBtn.disabled = true;
		sendBtn.innerText = '...';

		// TODO: fire ajax request

		// on ajax success response:
		/*sendBtn.innerText = 'Thank you!';
		setTimeout(function() {
			obfus.classList.remove('is-visible');
		}, 1000);*/
	});
}());
//# sourceMappingURL=scripts.js.map
