const InputPartition = {};

InputPartition.init = function (inputRoots) {
	
	Array.from(inputRoots).forEach(elem => {
		
		const inputs = elem.querySelectorAll("input");
		
		const hiddenInputValue = document.createElement("input");
		hiddenInputValue.setAttribute("type", "hidden");
		
		const hiddenInputId = elem.hasAttribute("data-hidden-input-id") ? elem.getAttribute("data-hidden-input-id") : "partitionned-input".concat(elem.id ? "-".concat(elem.id) : "");
		hiddenInputValue.setAttribute("id", hiddenInputId);
		
		elem.appendChild(hiddenInputValue);
		
		inputs.forEach(input => input.setAttribute("data-partition-for-id", hiddenInputId));
		
		function updateHiddenInputValue() {
			
			hiddenInputValue.value = Array.from(inputs).map(input => input.value).join("");
			
			hiddenInputValue.dispatchEvent(new Event("input"));
			
		}
		
		inputs.forEach(input => {
			
			// Mobile fix
			input.addEventListener("input", e => {
				
				if (e.inputType == "deleteContentBackward" || (e.inputType == "insertCompositionText" && !e.data)) {
					
					input.value = "";
					
					const prevSibling = input.previousElementSibling;
					
					if (prevSibling) {
						prevSibling.focus();
					}
					
				}
				else if (e.inputType == "insertCompositionText" || e.inputType == "insertText") {
					
					let canGoToNext = true;
					
					const inputPattern = input.getAttribute("pattern");
					
					if (inputPattern) {
						
						const charInput = e.data.length == 2 ? e.data.charAt(1) : e.data;
						const prevValue = e.data.length == 2 ? e.data.charAt(0) : "";
						
						const patternRegex = new RegExp("^".concat(inputPattern, "$"));
						
						const doReplace = input.hasAttribute("data-do-replace") && input.getAttribute("data-do-replace") == "true";
						
						if (!patternRegex.test(charInput)) {
							canGoToNext = false;
							input.value = prevValue;
						}
						
						if (canGoToNext && doReplace) {
							input.value = charInput;
						}
						
					}
					
					if (canGoToNext) {
						
						const sibling = input.nextElementSibling;
						
						if (sibling && !sibling.hasAttribute("hidden")) {
							sibling.focus();
						}
						
					}
					
				}
				
				updateHiddenInputValue();
				
			});
			
			// Actual keyboard and semi mobile behavior
			input.addEventListener("keyup", () => {
				updateHiddenInputValue();
			});
			
			input.addEventListener("keypress", e => {
				
				const inputPattern = input.getAttribute("pattern");
				
				if (inputPattern) {
					
					const charInput = e.key || String.fromCharCode(e.keyCode);
					
					const patternRegex = new RegExp("^".concat(inputPattern, "$"));
					
					const doReplace = input.hasAttribute("data-do-replace") && input.getAttribute("data-do-replace") == "true";
					
					const valueToTest = doReplace ? charInput : input.value.concat(charInput);
					
					if (!patternRegex.test(valueToTest)) {
						e.preventDefault();
						e.stopPropagation();
						return;
					}
					
					if (doReplace) {
						input.value = charInput;
						e.preventDefault();
						e.stopPropagation();
					}
					
				}
				
				const sibling = input.nextElementSibling;
				
				if (sibling) {
					sibling.focus();
				}
				
			});
			
			input.addEventListener("keydown", e => {
				
				if (e.key == "Backspace" || e.keyCode == 8) {
					
					e.preventDefault();
					e.stopPropagation();
					e.returnValue = false;
					
					let currentInput = input;
					
					do {
						
						currentInput.value = "";
						
						const prevSibling = currentInput.previousElementSibling;
						
						if (prevSibling) {
							prevSibling.focus();
						}
						
						currentInput = prevSibling;
						
					} while (e.ctrlKey && currentInput);
					
				}
				else if (e.key == "Delete" || e.keyCode == 46) {
					
					e.preventDefault();
					e.stopPropagation();
					e.returnValue = false;
					
					let currentInput = input;
					
					do {
						
						const sibling = currentInput.nextElementSibling;
						
						if (sibling && sibling.value) {
							sibling.focus();
						}
						
						currentInput = sibling;
						
						currentInput.value = "";
						
					} while (e.ctrlKey && currentInput);
					
				}
				else if ((e.key == "ArrowLeft" || e.keyCode == 37) || (e.key == "Home" || e.keyCode == 36)) {
					
					e.preventDefault();
					e.stopPropagation();
					e.returnValue = false;
					
					let currentInput = input;
					
					do {
						
						const prevSibling = currentInput.previousElementSibling;
						
						if (prevSibling) {
							prevSibling.focus();
						}
						
						currentInput = prevSibling;
						
					} while ((e.ctrlKey || (e.key == "Home" || e.keyCode == 36)) && currentInput);
					
				}
				else if ((e.key == "ArrowRight" || e.keyCode == 39) || (e.key == "End" || e.keyCode == 35)) {
					
					e.preventDefault();
					e.stopPropagation();
					e.returnValue = false;
					
					let currentInput = input;
					
					do {
						
						const sibling = currentInput.nextElementSibling;
						
						if (sibling && sibling.nextElementSibling && sibling.nextElementSibling.value) {
							sibling.focus();
						}
						
						currentInput = sibling;
						
					} while ((e.ctrlKey || (e.key == "End" || e.keyCode == 35)) && currentInput);
					
				}
				
			});
			
			input.addEventListener("focus", e => {
				
				let currentInput = input;
				let prevSibling = undefined;
				
				do {
					
					if (!currentInput.value) {
						
						prevSibling = currentInput.previousElementSibling;
						
						if (prevSibling && !prevSibling.value) {
							currentInput = prevSibling;
						}
						
					}
					
				} while (prevSibling && !prevSibling.value);
				
				if (currentInput != input) {
					currentInput.focus();
				}
				
			});
			
			input.addEventListener("paste", e => {
				
				e.stopPropagation();
				e.preventDefault();
				
				const clipboardData = e.clipboardData || window.clipboardData;
				const pastedData = clipboardData.getData('Text');
				
				let didChangeValue = false;
				
				for (let i = 0, currentInput = input; currentInput && i < pastedData.length; i++) {
					
					let currentChar = pastedData[i];
					
					const inputPattern = currentInput.getAttribute("pattern");
					
					if (inputPattern) {
						
						const patternRegex = new RegExp("^".concat(inputPattern, "$"));
						
						while (!patternRegex.test(currentChar)) {
							
							++i;
							
							if (i >= pastedData.length) {
								return;
							}
							
							currentChar = pastedData[i];
							
						}
						
					}
					
					currentInput.value = currentChar;
					didChangeValue = true;
					
					currentInput = currentInput.nextElementSibling;
					
					if (currentInput) {
						currentInput.focus();
					}
					
				}
				
				if (didChangeValue) {
					updateHiddenInputValue();
				}
				
			});
			
		});
		
	});
	
}
