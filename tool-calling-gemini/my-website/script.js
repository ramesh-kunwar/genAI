const display = document.getElementById('display');
let currentInput = '';
let lastInput = '';
const buttonSound = new Audio('button-press.mp3');

function playSound() {
  buttonSound.currentTime = 0;
  buttonSound.play();
}

function updateDisplay() {
  display.textContent = currentInput || '0';
}

function appendNumber(num) {
  if (num === '.' && currentInput.includes('.')) return;
  currentInput += num;
}

function chooseOperator(op) {
  if (currentInput === '') return;
  if (lastInput !== '' && /[+\-*/]/.test(lastInput.slice(-1))) {
    currentInput = currentInput.slice(0, -1) + op;
  } else {
    currentInput += op;
  }
  lastInput = currentInput;
}

function clearAll() {
  currentInput = '';
  lastInput = '';
}

function deleteLast() {
  currentInput = currentInput.slice(0, -1);
}

function calculate() {
  try {
    currentInput = eval(currentInput).toString();
  } catch {
    currentInput = 'Error';
  }
}

const buttons = document.querySelectorAll('button');
buttons.forEach(button => {
  button.addEventListener('click', () => {
    playSound();
    const action = button.getAttribute('data-action');
    const value = button.getAttribute('data-value');

    switch (action) {
      case 'number':
        appendNumber(value);
        break;
      case 'operator':
        chooseOperator(value);
        break;
      case 'clear':
        clearAll();
        break;
      case 'delete':
        deleteLast();
        break;
      case 'calculate':
        calculate();
        break;
    }
    updateDisplay();
  });
});
