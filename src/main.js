import './styles/styles.css'
import './lib/fontawesome.js'
import { Game, WordNotFound } from './lib/Game.js'
import center from './lib/center.js'
import { getElementCenter, lengthAndAngle } from './lib/line_position.js'
import calculateLetterPositions from './lib/letter_positions.js'

// Obtener datos de las casillas del juego
const game = new Game();
const wordPositions = game.wordPositions;

// Establecer medida del tablero (grid)
const gridWidth = 10;
const gridHeight = 10;

// Obtener el grid
let grid = document.getElementById('grid');

// Obtener la fila y columna máximas
let maxRows = 0;
let maxCols = 0;
wordPositions.forEach(currentWordPosition => {
    let currentMaxRows = 0;
    let currentMaxCols = 0;
    if (currentWordPosition.direction === 'vertical') {
        currentMaxRows = currentWordPosition.origin[1] + currentWordPosition.length - 1;
        currentMaxCols = currentWordPosition.origin[0];
    } else {
        currentMaxRows = currentWordPosition.origin[1];
        currentMaxCols = currentWordPosition.origin[0] + currentWordPosition.length - 1;
    }
    if (currentMaxRows > maxRows) {
        maxRows = currentMaxRows;
    }
    if (currentMaxCols > maxCols) {
        maxCols = currentMaxCols;
    }
});

// Calcular desplazamiento necesario para centrar casillas
const [x, y] = new center(maxCols, maxRows, gridWidth, gridHeight);
const displacement = { x, y };

// Función para calcular posición de una casilla antes de centrar
function calculatePosition(wordPosition, index) {
    const position = {
        x: wordPosition.origin[0],
        y: wordPosition.origin[1]
    }
    if (wordPosition.direction === 'vertical') {
        position.y += index;
    } else {
        position.x += index;
    }
    return position;
}

// Función para establecer atributos de tipo data-x y data-y
function setDataAttribute(box, position) {
    box.setAttribute('data-x', position.x);
    box.setAttribute('data-y', position.y);
}

// Añadir casillas al grid
wordPositions.forEach(currentWordPosition => {
    for (let i = 0; i < currentWordPosition.length; i++) {
        const position = calculatePosition(currentWordPosition, i);
        if (!document.querySelector(`.letter[data-x="${position.x}"][data-y="${position.y}"]`)) {
            const newBox = document.createElement('div');
            newBox.className = 'letter';
            if (currentWordPosition.direction === 'vertical') {
                newBox.style.gridArea = `${position.y + 1 + displacement.y} / ${position.x + 1 + displacement.x}`;
                setDataAttribute(newBox, position);
            } else {
                newBox.style.gridArea = `${position.y + 1 + displacement.y} / ${position.x + 1 + displacement.x}`;
                setDataAttribute(newBox, position);
            }
            grid.appendChild(newBox);
        }
    }    
});

// Añadir grid resultante al HTML
document.getElementById('word-grid').appendChild(grid);

// Obtener la rueda y el body
let wheel = document.getElementById('wheel');
let body = document.querySelector('body');

// Obtener letras del juego sin letras duplicadas
const letters = [...new Set(game.letters.split(""))];

// Calcular posición de las letras de la rueda
const letterPositions = calculateLetterPositions(letters.length);

// Función para ajustar la posición de las letras de la rueda
function setLetterPosition(letter, position) {
    letter.style.left = position.left;
    letter.style.top = position.top;
}

// Añadir letras a la rueda
letters.forEach((currentLetter, index) => {
    const currentLetterPosition = letterPositions[index];
    const newLetter = document.createElement('div');
    newLetter.className = 'wheel-letter';
    newLetter.textContent = currentLetter;
    setLetterPosition(newLetter, currentLetterPosition);
    wheel.appendChild(newLetter);
});

// Añadir rueda resultante al HTML
document.getElementById('wheel-container').appendChild(wheel);

// Inicializar variables de la letra y línea activas y de la palabra formada
let activeLetter = null;
let activeLine = null;
let word = '';

// Función para seleccionar una letra
function selectLetter(letter) {
    activeLetter = letter;
    activeLetter.classList.add('selected');
    word += letter.textContent;
}

// Función para crear una línea
function createLine(letter) {
    const letterCenter = getElementCenter(letter);
    const newLine = document.createElement('div');
    newLine.className = 'line';
    newLine.style.left = `${letterCenter.x}px`;
    newLine.style.top = `${letterCenter.y}px`;
    activeLine = newLine;
    body.appendChild(activeLine);
} 

// Función para actualizar la posición de la línea
function updateLinePosition(letter, endPosition) {
    const letterCenter = getElementCenter(letter);
    const origin = [letterCenter.x, letterCenter.y];
    const end = [endPosition.x, endPosition.y];
    const { length, angle } = lengthAndAngle(origin, end);
    activeLine.style.width = `${length}px`;
    activeLine.style.transform = `rotate(${angle}deg)`;
}

// Función para comprobar la palabra seleccionada
function checkWord(word) {
    if (word) {
        try {
            const wordPosition = game.findWord(word);
            for (let i = 0; i < word.length; i++) {
                const position = calculatePosition(wordPosition, i);
                const box = document.querySelector(`.letter[data-x="${position.x}"][data-y="${position.y}"]`);
                box.textContent = word[i];
            }
        } catch (error) {
            if (error instanceof WordNotFound) {
                console.error(error.message);
            } else {
                console.error(error);
            }
        }
    }
}

// Añadir evento de click a la rueda
wheel.addEventListener('mousedown', (e) => {
    if (e.target.className === 'wheel-letter') {
        // Seleccionar letra y crear primera línea
        selectLetter(e.target);
        createLine(activeLetter);
    }
});

// Añadir evento de movimiento del ratón
body.addEventListener('mousemove', (e) => {
    if (activeLetter) {
        // Actualizar posición de la línea
        const mousePosition = {
            x: e.clientX,
            y: e.clientY
        }
        updateLinePosition(activeLetter, mousePosition);
    }
});

// Añadir evento al pasar el ratón por encima de las letras
wheel.addEventListener('mouseover', (e) => {
    if (activeLetter && e.target.classList.contains('wheel-letter')) {
        // Fijar línea en posición final
        const lineFinalPosition = getElementCenter(e.target);
        updateLinePosition(activeLetter, lineFinalPosition);
        // Seleccionar letra y crear nueva línea
        selectLetter(e.target);
        createLine(activeLetter);
    }
});

// Añadir evento al soltar el ratón
body.addEventListener('mouseup', () => {
    // Deseleccionar todas las letras
    document.querySelectorAll('.selected').forEach(element => {
        element.classList.remove('selected');
    });
    // Eliminar todas las líneas
    document.querySelectorAll('.line').forEach(element => {
        element.remove();
    });
    checkWord(word);
    activeLetter = null;
    activeLine = null;
    word = '';
});

// Obtener botones
const shuffleButton = document.querySelector('.tools.left .tool');
const revealOneLetterButton = document.querySelector('.tools.right .tool');
const revealFiveLettersButton = document.querySelector('.tools.left .tool:last-child');
const revealSelectedLetterButton = document.querySelector('.tools.right .tool:last-child');

// Función para mezclar un array con el algoritmo de Fisher-Yates
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Función para reposicionar las letras de la rueda
function shuffleLetters() {
    const wheelLetters = document.querySelectorAll('.wheel-letter');
    const indexArray = [];
    for (let i = 0; i < wheelLetters.length; i++) {
        indexArray.push(i);
    }
    shuffleArray(indexArray);
    for (let i = 0; i < wheelLetters.length; i++) {
        setLetterPosition(wheelLetters[i], letterPositions[indexArray[i]]);
    }
}

// Función para generar un número aleatorio dentro de un rango
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para generar una posición aleatoria (x, y)
function getRandomPosition() {
    const randomPosition = {
        x: getRandomInt(0, maxCols),
        y: getRandomInt(0, maxRows)
    }
    return randomPosition;
}

// Función para revelar una letra aleatoria
function revealLetter(number) {
    let emptyBoxes = 0;
    document.querySelectorAll('.letter').forEach(letter => {
        letter.textContent === '' && emptyBoxes++;
    });
    number = Math.min(emptyBoxes, number);
    for (let i = 0; i < number; i++) {
        let randomPosition = undefined;
        let letter = undefined;
        let box = null;
        do {
            randomPosition = getRandomPosition();
            letter = game.letterAt(randomPosition.x, randomPosition.y);
            box = document.querySelector(`.letter[data-x="${randomPosition.x}"][data-y="${randomPosition.y}"]`);
        } while (!letter || box.textContent !== '');
        box.textContent = letter;
    }
}

// Añadir evento para el botón de mecla
shuffleButton.addEventListener('click', () => {
    shuffleLetters();
});

// Añadir evento para el botón de bombilla
revealOneLetterButton.addEventListener('click', () => {
    revealLetter(1);
});

// Añadir evento para el botón de diana
revealFiveLettersButton.addEventListener('click', () => {
    revealLetter(5);
});

// Obtener elementos del DOM
const blackOverlay = document.getElementById('black');
const gameDiv = document.getElementById('game');

// Añadir evento para el botón de martillo
revealSelectedLetterButton.addEventListener('click', () => {
    // Habilitar el modo de selección de casilla
    blackOverlay.classList.remove('hidden');
    document.querySelectorAll('.letter').forEach (letter => {
        letter.classList.add('on-top');
    });
});

    // Añadir evento para permitir seleccionar una casilla
    gameDiv.addEventListener('mousedown', (event) => {
        if (event.target.classList.contains('letter')) {
            //correctLetter = game.letterAt(event.target.getAttribute('data-x'), event.target.getAttribute('data-y'));
            event.target.textContent = 'X';
        } else {
            blackOverlay.classList.add('hidden');
            document.querySelectorAll('.letter').forEach (letter => {
                letter.classList.remove('on-top');
            });
        }
    });
